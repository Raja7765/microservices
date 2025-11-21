// src/routes/post-routes.js

const express = require('express');
const router = express.Router();
// Import the controller functions (which we will define next)
const postController = require('../controllers/post-controller');
// Import the authentication middleware (to ensure only logged-in users can post)
const authMiddleware = require('../middleware/authMiddleware'); 

// 1. Create a new Post
// Requires authentication (authMiddleware) to ensure a valid userId is present
router.post('/', authMiddleware, postController.createPost);

// 2. Get a single Post by ID
router.get('/:id', postController.getPostById);

// 3. Get all Posts (e.g., for a feed, often paginated)
// We might add a specific route like /feed later, but for now, this gets all.
router.get('/', postController.getAllPosts);

// 4. Update a Post (requires authentication and ownership verification)
// The controller will check if the user is the owner before updating.
router.patch('/:id', authMiddleware, postController.updatePost);

// 5. Delete a Post (requires authentication and ownership verification)
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;