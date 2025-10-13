// src/controllers/identity-controller.js
const { Op } = require('sequelize');
const User = require('../models/User');
const generateToken = require('../utils/generateToken'); // Ensure this file exists
const logger = require('../utils/logger');
const { validateRegistration, validatelogin } = require('../utils/validation');


// =======================
// USER REGISTRATION
// =======================
const registerUser = async (req, res) => {
  logger.info('Registration endpoint hit...');

  try {
    // 1️⃣ Validate input
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password, username } = req.body;

    // 2️⃣ Check if user already exists
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

    // 3️⃣ Create new user
    const user = await User.create({ username, email, password });
    logger.info('User created successfully', { userId: user.id });

    // 4️⃣ (Optional) Skip token generation while debugging
    if (process.env.SKIP_TOKEN === 'true') {
      return res.status(201).json({
        success: true,
        message: 'User registered (tokens skipped)',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    }

    // 5️⃣ Generate tokens
    try {
      const { accessToken, refreshToken } = await generateToken(user);
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        accessToken,
        refreshToken,
      });
    } catch (tokenErr) {
      logger.error('Token generation failed after user creation', {
        message: tokenErr.message,
        stack: tokenErr.stack,
        userId: user.id,
      });

      const isDev = process.env.NODE_ENV !== 'production';
      return res.status(201).json({
        success: true,
        message: 'User created but token generation failed',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        tokenError: isDev ? tokenErr.message : 'Token generation error',
      });
    }
  } catch (e) {
    // Log the structured error
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
// USER LOGIN
// =======================
const loginUser = async (req, res) => {
  logger.info('Login endpoint hit...');

  try {
    // 1️⃣ Validate login input
    const { error } = validatelogin(req.body);
    if (error) {
      logger.warn('Validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    // 2️⃣ Find user by email (Sequelize way)
    const user = await User.findOne({ where: { email } });

    if (!user) {
      logger.warn('Invalid user email', { email });
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // 3️⃣ Validate password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn('Invalid password for user', { userId: user.id });
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // 4️⃣ Generate tokens
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


module.exports = { registerUser, loginUser };
