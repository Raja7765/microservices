# identity-service/Dockerfile
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# 1. Copy dependency files first to utilize build caching
COPY package*.json ./

# 2. Install dependencies (Crucial step for finding Joi)
RUN npm install

# 3. Copy the rest of the application source code (including src/)
COPY . .

# Expose the application port (likely 3001)
EXPOSE 3001

# Define the command to start the application
CMD [ "npm", "start" ]