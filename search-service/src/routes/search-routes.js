// search-service/src/routes/search-routes.js
const express = require('express');
const searchController = require('../controllers/search-controller');

const router = express.Router();

/**
 * @route GET /search
 * @desc Performs a search for posts or users based on a query string.
 * @access Public (or protected by Gateway middleware)
 * @query q: The search term (e.g., /search?q=rocket+science)
 */
router.get('/', searchController.performSearch); 

module.exports = router;