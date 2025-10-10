const { DataTypes } = require('sequelize');

const RefreshToken = sequelize.define('RefreshToken', {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'refresh_tokens',
  timestamps: true  // auto adds createdAt, updatedAt
});

// Association: RefreshToken belongs to a User
RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

module.exports = RefreshToken;
