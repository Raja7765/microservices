const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use Render's DATABASE_URL directly
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,          // disable SQL logs
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Render requires this
    },
  },
});

module.exports = sequelize;
