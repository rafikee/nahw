FROM node:22-alpine AS builder

# Build deps for native modules (better-sqlite3 fallback compile)
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Persistent SQLite volume — Coolify mounts this.
RUN mkdir -p /data
VOLUME /data
ENV DATABASE_PATH=/data/nahw.db

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
