const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

const generateToken = async (user) => {
  // Generate access token
  const accessToken = jwt.sign(
    {
      userId: user.id,       // Sequelize uses "id"
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: '60m' } // Access token valid for 60 minutes
  );

  // Generate refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // refresh token expires in 7 days

  // Save refresh token in Postgres
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,   //  foreign key for Sequelize
    expiresAt
  });

  return { accessToken, refreshToken };
};

module.exports = generateToken;
