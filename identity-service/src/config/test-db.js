require('dotenv').config();
const sequelize = require('./db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Postgres successfully!');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
  } finally {
    await sequelize.close();
  }
})();
