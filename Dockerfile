# 1st Stage: Build Next.js App
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy the entire project
COPY . .

# Set up environment variables correctly
ARG APP_ENV
ENV NODE_ENV=production
RUN cp .env.$APP_ENV .env.local || true

# Build the Next.js app
RUN npm run build

# 2nd Stage: Production Image
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy the built app from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env.local ./.env.local

# Set environment for runtime
ENV NODE_ENV=production

# Expose Next.js default port
EXPOSE 3000

# Start the Next.js app
CMD ["node", "node_modules/next/dist/bin/next", "start"]
