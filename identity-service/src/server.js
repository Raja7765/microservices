require('dotenv').config();
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// Rate-limiter libs
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const routes = require('./routes/identity-service'); // ensure this path/name is correct
const errorHandler = require('./middleware/errorHandler');

// Sequelize instance
const sequelize = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;

// middleware (keep json parsing early)
app.use(helmet());
app.use(cors());
app.use(express.json());

// simple request logger middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  try {
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  } catch {
    logger.debug('Request body: <unserializable>');
  }
  next();
});

// Redis client (used by rate limiters etc.)
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });

redisClient.on('error', (err) => {
  logger.error('Redis client error', err);
});
redisClient.on('connect', () => logger.info('Redis client connecting...'));
redisClient.on('ready', () => logger.info('Redis client ready'));

// ---- DDoS protection and global rate limiting using rate-limiter-flexible ----
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,   // number of requests
  duration: 1,  // per second
});

// safer consume wrapper
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    return next();
  } catch (rejRes) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    return res.status(429).json({ success: false, message: 'Too many requests' });
  }
});

// ---- IP-based rate limiting for a sensitive endpoint using express-rate-limit + Redis store ----
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: 'Too many requests' });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:',
  }),
});

// Apply sensitive limiter to register route (only)
app.use('/api/auth/register', sensitiveEndpointsLimiter);

// Mount routes - make sure your routes file exports an Express router
app.use('/api/auth', routes);

// debug ping
app.get('/__ping', (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// Health endpoint (DB + Redis)
app.get('/health', async (req, res) => {
  const status = { app: 'ok' };

  try {
    await sequelize.authenticate();
    status.postgres = 'ok';
  } catch (e) {
    status.postgres = `error: ${e.message}`;
  }

  try {
    const pong = await redisClient.ping();
    status.redis = pong === 'PONG' ? 'ok' : `unexpected:${pong}`;
  } catch (e) {
    status.redis = `error: ${e.message}`;
  }

  const ok = status.postgres === 'ok' && status.redis === 'ok';
  res.status(ok ? 200 : 500).json(status);
});

// Error handler
app.use(errorHandler);

// Start server after DB connect & sync
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Sequelize authenticated with Postgres');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Sequelize models synced (alter:true)');
    }

    const server = app.listen(PORT, () => {
      logger.info(`Identity service running on port ${PORT}`);
    });

    // debug: print registered routes (useful for catching mount path issues)
    if (app._router && app._router.stack) {
      logger.info('Registered routes:');
      app._router.stack.forEach((layer) => {
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
          logger.info(`  ${methods} ${layer.route.path}`);
        } else if (layer.name === 'router' && layer.regexp) {
          logger.debug(`  router regexp: ${layer.regexp}`);
        }
      });
    }

    // handle graceful shutdown signals if desired
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (e) {
    logger.error('Sequelize connection or sync error', e);
    process.exit(1);
  }
})();

// unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', { promise, reason });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1); // optionally restart via process manager
});

// Export for tests / other modules
module.exports = { app, sequelize, redisClient };
