// search-service/src/controllers/search-controller.js
const logger = require('../utils/logger'); // Assuming you created the logger utility

/**
 * @desc Handles incoming GET requests for searching across the system.
 * @route GET /
 * @access Public (or protected by Gateway authMiddleware)
 */
const performSearch = async (req, res) => {
    // 1. Extract the query parameter 'q' from the URL
    const { q } = req.query; 

    logger.info('Received search query', { query: q });

    // 2. Validate the query parameter
    if (!q || q.trim().length === 0) {
        logger.warn('Search query failed: Missing or empty query parameter.');
        return res.status(400).json({ 
            success: false, 
            message: 'Search query (q) is required.' 
        });
    }

    try {
        // ------------------------------------------------------------------
        // In a real application, the production search logic would be here:
        // 1. Sanitize the query string 'q'.
        // 2. Execute the query against your specialized search engine (e.g., Elasticsearch).
        // 3. The search engine returns optimized results (usually a list of IDs).
        // 4. (Optional) Make requests to Post/Identity Service to fetch full data objects.
        // ------------------------------------------------------------------

        // Mock Response: Confirms controller logic is running correctly
        const mockResults = [
            { id: 'p123', type: 'post', title: `Post result for: ${q}` },
            { id: 'u456', type: 'user', username: 'The Searcher' },
            { id: 'p789', type: 'post', title: `Another relevant post about ${q}` }
        ];

        return res.status(200).json({
            success: true,
            query: q,
            message: 'Mock search results retrieved successfully.',
            results: mockResults
        });

    } catch (e) {
        logger.error('Search execution error occurred', { message: e.message, stack: e.stack });
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error during search.' 
        });
    }
};

module.exports = {
    performSearch
};