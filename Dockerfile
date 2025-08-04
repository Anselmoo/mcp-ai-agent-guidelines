# Simplified Docker build for MCP AI Agent Guidelines Server
# Based on modelcontextprotocol/servers filesystem example

FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and source code
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install dependencies and build
RUN npm ci
RUN npm run build

FROM node:22-alpine AS release

WORKDIR /app

# Copy built application and package files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Set production environment and install only production dependencies
ENV NODE_ENV=production
RUN npm ci --ignore-scripts --omit-dev

# Set environment variables for HTTP mode
ENV MCP_SERVER_TRANSPORT=http
ENV PORT=3000

# Expose port
EXPOSE 3000

# Run the server
ENTRYPOINT ["node", "dist/index.js"]
