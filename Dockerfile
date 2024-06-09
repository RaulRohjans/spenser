# Use an official node image as the base image
FROM node:20-alpine3.20 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Use a smaller image for the production environment
FROM node:20-alpine3.20

# Set the working directory
WORKDIR /app

# Copy only the necessary files for running the application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", ".output/server/index.mjs"]