// src/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'post_service_db', 
  process.env.PG_USER || 'postgres',          
  process.env.PG_PASSWORD || '',              
  {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: (process.env.PG_SSL === 'true')
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  }
);

module.exports = sequelize;