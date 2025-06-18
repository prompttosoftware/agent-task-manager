# ===== Build stage =====
FROM node:22-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps \
    sqlite python3 make g++ \
    && ln -sf python3 /usr/bin/python

COPY package*.json ./
# Install ALL dependencies (including devDependencies) for build
RUN npm ci && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build

# Now install only production dependencies for the final copy
RUN rm -rf node_modules && npm ci --only=production && npm cache clean --force

# Remove build dependencies
RUN apk del .build-deps

# ===== Production stage =====
FROM node:22-alpine

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache sqlite

# Copy only production files
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Only copy uploads if they contain essential files
# Consider using external storage instead
COPY --from=build /app/uploads ./uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Simplified healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
