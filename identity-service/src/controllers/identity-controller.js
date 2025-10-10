// src/controllers/identity-controller.js
const { Op } = require('sequelize');
const User = require('../models/User');
const generateToken = require('../utils/generateToken'); // ensure this file exists at src/utils/generateToken.js
const logger = require('../utils/logger');
const { validateRegistration } = require('../utils/validation');

const registerUser = async (req, res) => {
  logger.info('Registration endpoint hit...');

  try {
    // 1) Validate input
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, password, username } = req.body;

    // 2) Check if user exists
    const existing = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] }
    });

    if (existing) {
      logger.warn('User already exists', { email, username });
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 3) Create user
    const user = await User.create({ username, email, password });
    logger.info('User created', { userId: user.id });

    // 4) Optional: allow skipping token generation while debugging
    if (process.env.SKIP_TOKEN === 'true') {
      return res.status(201).json({
        success: true,
        message: 'User registered (tokens skipped)',
        user: { id: user.id, username: user.username, email: user.email }
      });
    }

    // 5) Generate tokens — protect this step so token errors don't delete the user or mask the root error
    try {
      const { accessToken, refreshToken } = await generateToken(user);
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        accessToken,
        refreshToken
      });
    } catch (tokenErr) {
      // If token creation fails, log it and still return success for user creation,
      // so you can debug generateToken separately without losing created users.
      logger.error('Token generation failed after user creation', {
        message: tokenErr.message,
        stack: tokenErr.stack,
        userId: user.id
      });

      // Return created user info and token error note (without leaking sensitive stack in production)
      const isDev = process.env.NODE_ENV !== 'production';
      return res.status(201).json({
        success: true,
        message: 'User created but token generation failed',
        user: { id: user.id, username: user.username, email: user.email },
        tokenError: isDev ? tokenErr.message : 'Token generation error'
      });
    }
  } catch (e) {
    // Full structured server-side logging
    logger.error('Registration error occurred', {
      message: e && e.message,
      name: e && e.name,
      stack: e && e.stack,
      extra: e && e.errors ? e.errors : null
    });

    // Return helpful error in development only
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      success: false,
      message: isDev ? (e.message || 'Internal server error') : 'Internal server error',
      ...(isDev ? { stack: e.stack } : {})
    });
  }
};

module.exports = { registerUser };
