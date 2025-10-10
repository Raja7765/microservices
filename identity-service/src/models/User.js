const { DataTypes } = require('sequelize');
const argon2 = require('argon2');
const sequelize = require('../config/db'); // ✅ import Sequelize instance

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  tableName: 'users',
});

// Hash password before creating user
User.beforeCreate(async (user) => {
  user.password = await argon2.hash(user.password);
});

// Method to compare passwords
User.prototype.comparePassword = async function (candidatePassword) {
  return await argon2.verify(this.password, candidatePassword);
};

module.exports = User;
