require('dotenv').config();
const express = require('express');
const Redis = require('ioredis');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');           // correct import
const { RedisStore } = require('rate-limit-redis');        // correct import
const logger = require('./utils/logger');
const proxy = require('express-http-proxy');
const cors = require('cors');
const errorHandler = require('./middleware/errorhandler');

const app = express();
const PORT = process.env.PORT || 3000;
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client
const redisClient = new Redis(REDIS_URL);
redisClient.on('error', (err) => logger.error('Redis error', err));
redisClient.on('ready', () => logger.info('Redis client ready'));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting (global example)
const ratelimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: 'Too many requests' });
  },
  store: new RedisStore({
    // ioredis uses .call to execute commands with rate-limit-redis
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:',
  }),
});
app.use(ratelimit);

// request logging
app.use((req, res, next) => {
  logger.info(`Received ${req.method} ${req.originalUrl}`);
  // avoid logging large bodies by default; log presence only
  try {
    logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  } catch {
    logger.debug('Request body: <unserializable>');
  }
  next();
});

// Proxy /v1/auth/*  -->  IDENTITY_SERVICE_URL + /api/auth/*
app.use(
  '/v1/auth',
  proxy(IDENTITY_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      // Forward path: replace /v1/auth with /api/auth
      // e.g. /v1/auth/register  -> /api/auth/register
      const newPath = req.originalUrl.replace(/^\/v1\/auth/, '/api/auth');
      return newPath;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      // ensure upstream sees JSON
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      // optionally forward request id or other headers
      if (srcReq.headers['x-request-id']) {
        proxyReqOpts.headers['x-request-id'] = srcReq.headers['x-request-id'];
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Identity service responded ${proxyRes.statusCode} for ${userReq.method} ${userReq.originalUrl}`);
      // proxyResData is a Buffer — return it unchanged (string or buffer)
      return proxyResData;
    },
    proxyErrorHandler: (err, res, next) => {
      logger.error(`Proxy error: ${err && err.message}`);
      res.status(502).json({ success: false, message: 'Bad Gateway', error: err && err.message });
    }
  })
);

// Optional: other proxy routes go here (protected routes)...
// e.g. app.use('/v1/orders', verifyJwtRequired, proxy(OTHER_URL, { ... }))

// health
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    env: process.env.NODE_ENV || 'development',
    redis: redisClient.status || 'unknown',
    identity: IDENTITY_SERVICE_URL,
  });
});

// error handler
app.use(errorHandler);

// start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Proxying /v1/auth -> ${IDENTITY_SERVICE_URL}/api/auth`);
});
