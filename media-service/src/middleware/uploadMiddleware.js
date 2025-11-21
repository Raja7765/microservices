// media-service/src/middleware/uploadMiddleware.js

const multer = require('multer');

// Configure multer to use memory storage. 
// This is critical when using Cloudinary because it allows the file buffer 
// to be streamed directly to the cloud service without saving to disk first.
const storage = multer.memoryStorage();

// Create the Multer instance. Limits file size to 5MB.
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

// Export the middleware configured to handle a single file named 'file'
module.exports = upload.single('file');