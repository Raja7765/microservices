// routes/identity-service.js
const express = require('express');
const {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser
} = require('../controllers/identity-controller');

const router = express.Router();

// Auth routes
router.post('/register', registerUser);        // POST /api/auth/register
router.post('/login', loginUser);              // POST /api/auth/login
router.post('/refresh', refreshTokenUser);     // POST /api/auth/refresh
router.post('/logout', logoutUser);            // POST /api/auth/logout

// Optional test route (for sanity check)
router.get('/', (req, res) => {
  res.json({ message: '✅ Identity service is running properly!' });
});

module.exports = router;
