# Use an official node image as the base image
FROM oven/bun:1 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install dependencies
RUN bun i

# Copy the rest of the application files
COPY . .

# Build the application
RUN bun run build

# Use a smaller image for the production environment
# We can't use an alpine image of node
# that will cause an error when any method from bcrypt is executed
# "exited with code 139"
FROM node:lts-buster-slim

# Set the working directory
WORKDIR /app

# Copy only the necessary files for running the application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.runtime.json ./tsconfig.runtime.json
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Ensure entrypoint is executable
RUN chmod +x ./docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3000

# Command to run migrations, seed, then start the application
ENTRYPOINT ["./docker-entrypoint.sh"]