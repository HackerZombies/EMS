# syntax=docker.io/docker/dockerfile:1

#################################
# Base & Dependencies
#################################
FROM node:18-alpine AS base

# Install OS-level dependencies
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; fi

#################################
# Build Stage
#################################
FROM base AS builder
WORKDIR /app
# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY . .
# Build the Next.js application
RUN if [ -f yarn.lock ]; then yarn build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; fi

#################################
# Production Runner Stage
#################################
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy the entire build output
COPY --from=builder /app ./

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

USER nextjs

# Expose the Next.js default port
EXPOSE 3000
ENV PORT=3000

# Start the Next.js server (make sure your package.json has "start": "next start")
CMD ["yarn", "start"]
