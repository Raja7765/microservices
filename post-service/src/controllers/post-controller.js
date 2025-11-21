const Post = require('../models/Post');
// const logger = require('../utils/logger'); // Assuming a logger utility

/**
 * @description Creates a new post.
 * @route POST /api/posts
 * @access Private (Requires Authentication)
 */
exports.createPost = async (req, res, next) => {
    try {
        // Safely check for req.user.id. This prevents the Sequelize "notNull Violation"
        // error by explicitly returning a 401/403 if the authMiddleware fails 
        // to attach the user ID.
        const userId = req.user && req.user.id; 

        if (!userId) {
            // If the user ID is missing, authentication must have failed.
            return res.status(401).json({ 
                message: 'Authentication Required: User ID is missing from the request.' 
            });
        }
        
        const { content, mediaUrl } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Post content is required.' });
        }

        const newPost = await Post.create({
            userId,
            content,
            mediaUrl: mediaUrl || null, // Allow mediaUrl to be optional
        });

        // Respond with the newly created post
        res.status(201).json({
            message: 'Post created successfully',
            post: newPost,
        });
    } catch (error) {
        // Pass the error to the Express error handler middleware
        next(error); 
    }
};

/**
 * @description Retrieves a single post by ID.
 * @route GET /api/posts/:id
 * @access Public
 */
exports.getPostById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const post = await Post.findByPk(id); // findByPk is Sequelize's shorthand for finding by Primary Key

        if (!post) {
            return res.status(404).json({ message: `Post with ID ${id} not found.` });
        }

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

/**
 * @description Retrieves a list of all posts (or a paginated list).
 * @route GET /api/posts
 * @access Public
 */
exports.getAllPosts = async (req, res, next) => {
    try {
        // Implement basic pagination
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const posts = await Post.findAll({
            // Order by creation date descending (newest first)
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset,
        });

        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};

/**
 * @description Updates an existing post.
 * @route PATCH /api/posts/:id
 * @access Private (Requires Authentication & Ownership)
 */
exports.updatePost = async (req, res, next) => {
    try {
        const userId = req.user.id; 
        const { id } = req.params;
        const { content, mediaUrl } = req.body;

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ message: `Post with ID ${id} not found.` });
        }

        // --- Authorization Check ---
        if (post.userId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this post.' });
        }
        
        // Update the fields
        await Post.update(
            { content, mediaUrl },
            {
                where: { id: id, userId: userId }
            }
        );

        // Fetch the updated post to return to the client
        const updatedPost = await Post.findByPk(id);
        
        res.status(200).json({
            message: 'Post updated successfully',
            post: updatedPost,
        });

    } catch (error) {
        next(error);
    }
};


/**
 * @description Deletes a post.
 * @route DELETE /api/posts/:id
 * @access Private (Requires Authentication & Ownership)
 */
exports.deletePost = async (req, res, next) => {
    try {
        const userId = req.user.id; 
        const { id } = req.params;

        const post = await Post.findByPk(id);

        if (!post) {
            // Return 404 if the post doesn't exist
            return res.status(404).json({ message: `Post with ID ${id} not found.` });
        }

        // --- Authorization Check ---
        if (post.userId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this post.' });
        }

        await Post.destroy({
            where: { id: id }
        });

        // 204 No Content is standard for a successful DELETE
        res.status(204).send(); 
    } catch (error) {
        next(error);
    }
};