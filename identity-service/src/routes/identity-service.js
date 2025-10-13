const express = require('express');
const { registerUser,loginUser } = require('../controllers/identity-controller'); // adjust if needed

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerUser);
router.post("/login",loginUser);

// (optional test route)
router.get('/', (req, res) => {
  res.json({ message: 'Identity service running' });
});

module.exports = router;
