# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run using node directly
CMD ["npm", "start"]
