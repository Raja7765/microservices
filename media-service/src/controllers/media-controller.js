// media-service/src/controllers/media-controller.js

const cloudinary = require('../utils/cloudinary');
const DataUriParser = require('datauri/parser');
const path = require('path');

// Initialize the DataUriParser
const parser = new DataUriParser();

/**
 * @description Uploads a file to Cloudinary.
 * @route POST /api/media/upload
 * @access Private (Requires Authentication)
 */
exports.uploadFile = async (req, res, next) => {
    try {
        // 1. Check if a file buffer was processed by multer.memoryStorage()
        if (!req.file) {
            return res.status(400).json({ 
                message: 'No file uploaded. Please ensure the field name is "file".' 
            });
        }
        
        // The user ID is guaranteed to be present from authMiddleware.js
        const userId = req.user.id; 

        // 2. Convert the file buffer to a Data URI string
        // This is necessary for the Cloudinary uploader, as it expects a path or a data URI.
        const fileExtension = path.extname(req.file.originalname).toString();
        
        // Use the buffer to create the Data URI
        // req.file.buffer comes from the multer.memoryStorage() middleware
        const dataUri = parser.format(fileExtension, req.file.buffer);

        // 3. Upload the file to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataUri.content, {
            // Optional: Tag the upload with the user's ID for easy searching/management
            tags: [
                'user-upload', 
                `user-${userId}`,
                req.file.mimetype.split('/')[0] // e.g., 'image', 'video'
            ],
            // Optional: Create a folder structure in Cloudinary
            folder: `microservices/${process.env.NODE_ENV || 'dev'}/users`, 
            resource_type: "auto" // Automatically determine if it's an image, video, etc.
        });

        // 4. Respond with the secure public URL
        res.status(200).json({
            message: 'File uploaded successfully',
            media: {
                // The URL is what the Post Service will store
                url: uploadResult.secure_url, 
                public_id: uploadResult.public_id,
                format: uploadResult.format,
                // You can include size/width/height if needed
            }
        });

    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        // Clean error handling for potential upload issues
        res.status(500).json({ 
            message: 'Failed to upload file to external storage.',
            error: error.message 
        });
        next(error);
    }
};