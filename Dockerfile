# Base image
FROM node:24-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# --- Production Stage ---
FROM node:24-slim

# Set working directory
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Create a non-root user
RUN groupadd -r node && useradd -r -g node node

# Change ownership of /app to the non-root user
RUN chown -R node:node /app

# Switch to the non-root user
USER node

# Expose port
EXPOSE 3013

# Health check
HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:3013/health || exit 1

# Environment variables
ENV NODE_ENV production

# Start the app
CMD ["node", "dist/server.js"]