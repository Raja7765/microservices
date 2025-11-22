// search-service/src/utils/logger.js

const getTimestamp = () => new Date().toISOString();
const SERVICE_NAME = 'search-service';

const log = (level, message, data = {}) => {
    const logObject = {
        level,
        service: SERVICE_NAME,
        timestamp: getTimestamp(),
        message,
        ...data,
    };
    
    // Use the appropriate console method based on the log level
    switch (level) {
        case 'error':
            console.error(JSON.stringify(logObject));
            break;
        case 'warn':
            console.warn(JSON.stringify(logObject));
            break;
        case 'info':
            console.info(JSON.stringify(logObject));
            break;
        case 'debug':
            // Only log debug if we are not in production (optional check)
            if (process.env.NODE_ENV !== 'production') {
                console.log(JSON.stringify(logObject));
            }
            break;
        default:
            console.log(JSON.stringify(logObject));
    }
};

module.exports = {
    error: (msg, data) => log('error', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    info: (msg, data) => log('info', msg, data),
    debug: (msg, data) => log('debug', msg, data),
};