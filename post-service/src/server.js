// src/server.js

require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger"); // Assuming you have a logger utility
const errorHandler = require("./middleware/errorHandler"); 

// Import Database and Models
const sequelize = require("./config/db"); // The Sequelize instance
const Post = require("./models/Post");   // Import the Post Model

// Import Routes
const postRoutes = require("./routes/post-routes");

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;


// --- Middleware Setup ---
app.use(helmet()); // Basic security
app.use(cors());   // Enable CORS for frontend/API Gateway access
app.use(express.json()); // Body parser for JSON requests


// --- Routes ---
// Health check route
app.get('/health', (req, res) => {
    res.status(200).send({ status: 'OK', service: 'Post Service' });
});

app.use("/api/posts", postRoutes);


// --- Error Handler Middleware ---
app.use(errorHandler);


// --- Server Startup Function ---
async function startServer() {
    try {
        // 1. Test the PostgreSQL connection
        await sequelize.authenticate();
        logger.info("✅ PostgreSQL database connection established successfully.");
        
        // 2. Synchronize all defined Sequelize models with the database
        // This will create the 'Posts' table if it doesn't exist.
        // { alter: true } is safe for development: it checks the current state 
        // and makes necessary changes without dropping the table.
        await sequelize.sync({ alter: true });
        logger.info("🔄 Database synchronized: 'Posts' table ready.");
        
        // 3. Start the Express server
        app.listen(PORT, () => {
            logger.info(`🚀 Post Service running on http://localhost:${PORT}`);
        });

    } catch (error) {
        logger.error(`❌ Fatal Error during startup: ${error.message}`);
        // Exit process if DB connection or sync fails
        process.exit(1); 
    }
}

startServer();