// src/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;
sequelize = new Sequelize(
  process.env.PG_DATABASE || 'api_service_db', // Default to a specific name if not set
  process.env.PG_USER || 'postgres',          // Default user
  process.env.PG_PASSWORD || '',              // Default password
  {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
    dialect: 'postgres',
    logging: false,
    // Configuration for local SSL, based on your .env file PG_SSL=false
    dialectOptions: (process.env.PG_SSL === 'true')
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {}, // Empty object for no SSL/local setup
  }
);

module.exports = sequelize;