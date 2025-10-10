require('dotenv').config();
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// Rate-limiter libs
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');

const routes = require('./routes/identity-service');
const errorHandler = require('./middleware/errorHandler');

// Sequelize instance you created
const sequelize = require('./config/db'); // <-- uses src/config/db.js that you created

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Sequelize connection & sync models
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Sequelize authenticated with Postgres');

    // In development you may want to auto-sync models. Use with caution in production.
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('Sequelize models synced (alter:true)');
    }
  } catch (e) {
    logger.error('Sequelize connection or sync error', e);
  }
})();

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

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// simple request logger middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  try {
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
  } catch {
    logger.info('Request body: <unserializable>');
  }
  next();
});

// ---- DDoS protection and global rate limiting using rate-limiter-flexible ----
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,   // number of requests
  duration: 1,  // per second
});

app.use((req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: 'Too many requests' });
    });
});

// ---- IP-based rate limiting for a sensitive endpoint using express-rate-limit + Redis store ----
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
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

// Apply sensitive limiter to register route
app.use('/api/auth/register', sensitiveEndpointsLimiter);

// Routes
app.use('/api/auth', routes);

// Health endpoint: checks Sequelize connection + Redis
app.get('/health', async (req, res) => {
  const status = { app: 'ok' };

  try {
    // simple DB check
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

// Error handler (must have (err, req, res, next))
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Identity service running on port ${PORT}`);
});

// Unhandled promise rejection logging
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', { promise, reason });
});

// Export sequelize and redis client for other modules that might need them
module.exports = { app, sequelize, redisClient };
