const { Op } = require('sequelize');
const User = require('../models/User');
const generateToken = require('../utils/generateToken'); // fixed typo from gernerateToken
const logger = require('../utils/logger');
const { validateRegistration } = require('../utils/validation');

// User registration
const registerUser = async (req, res) => {
    logger.info('Registration endpoint hit...');

    try {
        // Validate the schema
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn('Validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { email, password, username } = req.body;

        // Check if user exists (Postgres way)
        let user = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // Create new user (Postgres way)
        user = await User.create({ username, email, password });
        logger.info("User saved successfully", { userId: user.id });

        // Generate tokens
        const { accessToken, refreshToken } = await generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            accessToken,
            refreshToken
        });

    } catch (e) {
        logger.error('Registration error occurred', e);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = { registerUser };




