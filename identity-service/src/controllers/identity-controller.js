// src/controllers/identity-controller.js
const { Op } = require('sequelize');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const generateToken = require('../utils/generateToken');
const logger = require('../utils/logger');
const { validateRegistration, validatelogin } = require('../utils/validation');

// =======================
// USER REGISTRATION
// =======================
const registerUser = async (req, res) => {
  logger.info('Registration endpoint hit...');
  // small debug: log body presence (avoids big dumps in prod)
  try {
    logger.debug('Registration body present:', { hasBody: !!req.body, keys: Object.keys(req.body || {}) });
  } catch {}

  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });

    if (existingUser) {
      logger.warn('User already exists', { email, username });
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const user = await User.create({ username, email, password });
    logger.info('User created successfully', { userId: user.id });

    // generate tokens (no SKIP_TOKEN required)
    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });

  } catch (e) {
    logger.error('Registration error occurred', {
      message: e.message,
      stack: e.stack,
      name: e.name,
      extra: e.errors ? e.errors : null,
    });

    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      success: false,
      message: isDev ? e.message : 'Internal server error',
      ...(isDev ? { stack: e.stack } : {}),
    });
  }
};



// =======================
// USER LOGIN + REFRESH TOKEN CLEANUP
// =======================
const loginUser = async (req, res) => {
  logger.info('Login endpoint hit...');

  try {
    const { error } = validatelogin(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      logger.warn('Invalid user email', { email });
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn('Invalid password for user', { userId: user.id });
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // ✅ Delete old refresh tokens before creating a new one
    await RefreshToken.destroy({ where: { userId: user.id } });
    logger.info('Old refresh tokens deleted for user', { userId: user.id });

    // ✅ Generate new tokens
    const { accessToken, refreshToken } = await generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      userId: user.id,
    });

  } catch (e) {
    logger.error('Login error occurred', {
      message: e.message,
      stack: e.stack,
      name: e.name,
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


// =======================
// USER LOGOUT
// =======================
const logoutUser = async (req, res) => {
  logger.info('Logout endpoint hit...');

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required for logout',
      });
    }

    // ✅ Check if token exists
    const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken } });

    if (!tokenRecord) {
      logger.warn('Invalid or already logged-out token');
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token or already logged out',
      });
    }

    // ✅ Delete that refresh token (logout for that device/session)
    await RefreshToken.destroy({ where: { token: refreshToken } });

    logger.info('User logged out successfully', { userId: tokenRecord.userId });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (e) {
    logger.error('Logout error occurred', {
      message: e.message,
      stack: e.stack,
      name: e.name,
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


module.exports = { registerUser, loginUser, logoutUser };
