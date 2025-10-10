const express = require('express');
const { registerUser } = require('../controllers/identity-controller'); // adjust if needed

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerUser);

// (optional test route)
router.get('/', (req, res) => {
  res.json({ message: 'Identity service running 🚀' });
});

module.exports = router;
