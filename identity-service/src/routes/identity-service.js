const express = require('express');
const {resgisterUser} = require('../controllers/identity-controller')

const router = express.Router();




router.post('/register',resgisterUser)

module.exports = router;