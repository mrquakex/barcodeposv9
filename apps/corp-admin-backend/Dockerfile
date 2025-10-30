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

# Generate Prisma Client (Prisma CLI already in devDependencies)
RUN npx prisma generate --schema=./prisma-temp/schema.prisma --generator client

# Copy source code
COPY apps/corp-admin-backend/ ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4001

# Start command
CMD ["npm", "start"]

