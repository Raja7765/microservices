// search-service/src/controllers/search-controller.js
const logger = require('../utils/logger'); // Assuming you use a logger utility

const performSearch = async (req, res) => {
    const { q } = req.query; // Get the query string from the URL (?q=...)

    logger.info('Received search query', { query: q });

    if (!q || q.trim().length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Search query (q) is required.' 
        });
    }

    // In a real application, the search logic would go here:
    // 1. Sanitize the query
    // 2. Query Elasticsearch/database index
    // 3. Return a list of post/user IDs

    // Mock response for now
    const mockResults = [
        { id: 'p123', type: 'post', title: `Result for: ${q}` },
        { id: 'u456', type: 'user', username: 'BasilExample' }
    ];

    return res.status(200).json({
        success: true,
        query: q,
        results: mockResults
    });
};

module.exports = {
    performSearch
};