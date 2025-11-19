// src/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const useDatabaseUrl = !!process.env.DATABASE_URL;

let sequelize;

if (useDatabaseUrl) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.PG_SSL === 'true' || true, // safety: Render DB usually requires SSL
      rejectUnauthorized: false,
    },
  });
} else {
  // build from PG_ envs (for local dev)
  sequelize = new Sequelize(
    process.env.PG_DATABASE || 'postgres',
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
}

module.exports = sequelize;
