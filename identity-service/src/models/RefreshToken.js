const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // ✅ import the Sequelize instance
const User = require('./User'); // assuming you have a User model

const RefreshToken = sequelize.define('RefreshToken', {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'refresh_tokens',
  timestamps: true, // adds createdAt, updatedAt
});

// Associate with User
RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

module.exports = RefreshToken;
