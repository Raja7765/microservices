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
  try {
    logger.debug('Registration body keys:', { keys: Object.keys(req.body || {}) });
  } catch {}

  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn('Validation error', { msg: error.details[0].message });
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, password, username } = req.body;

    // normalize minimal fields
    const normalizedEmail = (email || '').toLowerCase().trim();
    const normalizedUsername = (username || '').trim();

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email: normalizedEmail }, { username: normalizedUsername }] },
    });

    if (existingUser) {
      logger.warn('User already exists', { email: normalizedEmail, username: normalizedUsername });
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ username: normalizedUsername, email: normalizedEmail, password });
    logger.info('User created successfully', { userId: user.id });

    // generate tokens (generateToken should persist refresh token)
    const tokens = await generateToken(user);
    if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
      logger.error('Token generation failed after user creation', { userId: user.id });
      return res.status(500).json({ success: false, message: 'Unable to generate tokens' });
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (e) {
    logger.error('Registration error occurred', {
      message: e.message,
      stack: e.stack,
      name: e.name,
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
      logger.warn('Validation error', { msg: error.details[0].message });
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      logger.warn('Invalid user email', { email: normalizedEmail });
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (typeof user.comparePassword !== 'function') {
      logger.error('User model missing comparePassword method');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn('Invalid password for user', { userId: user.id });
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Delete old refresh tokens (logout everywhere) before creating a fresh pair
    await RefreshToken.destroy({ where: { userId: user.id } });
    logger.info('Old refresh tokens deleted for user', { userId: user.id });

    const tokens = await generateToken(user);
    if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
      logger.error('Token generation failed during login', { userId: user.id });
      return res.status(500).json({ success: false, message: 'Unable to generate tokens' });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
    });
  } catch (e) {
    logger.error('Login error occurred', { message: e.message, stack: e.stack });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// =======================
// REFRESH ACCESS TOKEN
// =======================
const refreshTokenUser = async (req, res) => {
  logger.info('Refresh token endpoint hit...');
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!tokenRecord) {
      logger.warn('Refresh token not found or revoked', { token: !!refreshToken });
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findByPk(tokenRecord.userId);
    if (!user) {
      // token orphaned — delete it and treat as invalid
      await RefreshToken.destroy({ where: { token: refreshToken } }).catch(() => {});
      logger.error('User not found for refresh token', { tokenId: tokenRecord.id, userId: tokenRecord.userId });
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // rotate: remove old token then create a new one
    await RefreshToken.destroy({ where: { token: refreshToken } });
    logger.info('Old refresh token removed (rotation)', { userId: user.id });

    const tokens = await generateToken(user);
    if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
      logger.error('Token generation failed during refresh', { userId: user.id });
      return res.status(500).json({ success: false, message: 'Unable to generate tokens' });
    }

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (e) {
    logger.error('Refresh token error occurred', { message: e.message, stack: e.stack });
    return res.status(500).json({ success: false, message: 'Internal server error' });
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
      return res.status(400).json({ success: false, message: 'Refresh token is required for logout' });
    }

    const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!tokenRecord) {
      logger.warn('Invalid or already logged-out token', { token: !!refreshToken });
      return res.status(400).json({ success: false, message: 'Invalid refresh token or already logged out' });
    }

    await RefreshToken.destroy({ where: { token: refreshToken } });
    logger.info('User logged out successfully', { userId: tokenRecord.userId });

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (e) {
    logger.error('Logout error occurred', { message: e.message, stack: e.stack });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser,
};
