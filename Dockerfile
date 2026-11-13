# ##############################################################################
# SingSlot — Unified Production Dockerfile (Multi-Stage Build)
# CPE 334: Cloud Deployment and CI/CD Pipeline on GCP (Lab 5)
# ##############################################################################
# WHAT THIS FILE DOES:
#   1. Builds the Vite React SPA frontend into static production assets.
#   2. Compiles TypeScript Express server and generates Prisma ORM client.
#   3. Produces a minimal, secure production image serving both Web UI and API
#      on a single origin (default port 8080) for Cloud Run and local execution.
# ##############################################################################

# ============================================================================
# Stage 1: Build Frontend (React + TypeScript + Tailwind + Vite)
# ============================================================================
FROM node:24-alpine AS client-builder
WORKDIR /app

# Install dependencies deterministically using root package-lock.json
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

# Build static production bundle with relative same-origin API configuration
COPY client/ client/
WORKDIR /app/client
ENV VITE_API_URL=""
RUN npm run build

# ============================================================================
# Stage 2: Build Backend (Node.js + Express + TypeScript + Prisma)
# ============================================================================
FROM node:24-alpine AS server-builder
WORKDIR /app

# Prisma engine requires OpenSSL on Alpine Linux
RUN apk add --no-cache openssl

# Install dependencies deterministically using root package-lock.json
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

# Copy server source and generate Prisma Client from schema
COPY server/ server/
WORKDIR /app/server
RUN cp -r /app/node_modules /app/server/node_modules && \
    npx prisma generate --schema=prisma/schema.prisma && \
    npm run build

# ============================================================================
# Stage 3: Unified Production Runtime (Cloud Run & Local Container)
# ============================================================================
FROM node:24-alpine AS production
WORKDIR /app/server

# Runtime OpenSSL dependency for Prisma Query Engine
RUN apk add --no-cache openssl

# Copy server dependencies, compiled distribution, schema, and migrations
COPY --from=server-builder --chown=node:node /app/server/package*.json ./
COPY --from=server-builder --chown=node:node /app/server/node_modules ./node_modules
COPY --from=server-builder --chown=node:node /app/server/dist ./dist
COPY --from=server-builder --chown=node:node /app/server/src ./src
COPY --from=server-builder --chown=node:node /app/server/prisma ./prisma
COPY --from=server-builder --chown=node:node /app/server/tsconfig.json ./tsconfig.json
COPY --from=server-builder --chown=node:node /app/server/docker-entrypoint.sh ./docker-entrypoint.sh

# Copy built frontend SPA assets to /app/client/dist (resolved by Express)
COPY --from=client-builder --chown=node:node /app/client/dist /app/client/dist

RUN chmod +x ./docker-entrypoint.sh

# Runtime environment settings
ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
ENV PORT=8080
EXPOSE 8080

# Execute as unprivileged non-root user
USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
