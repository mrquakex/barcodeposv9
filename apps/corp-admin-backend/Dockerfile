FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY apps/corp-admin-backend/package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema from main backend (we share the same DB)
COPY backend/prisma ./prisma-temp/

# Copy source code first (needed for build)
COPY apps/corp-admin-backend/ ./

# Generate Prisma Client (after copying package.json with dependencies)
RUN npx prisma generate --schema=./prisma-temp/schema.prisma --generator client

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4001

# Start command - generate Prisma client and start server
CMD ["sh", "-c", "npx prisma generate --schema=./prisma-temp/schema.prisma && npm start"]

