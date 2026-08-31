FROM node:22-alpine AS builder

# Build deps for native modules (better-sqlite3 fallback compile)
RUN apk add --no-cache python3 make g++

WORKDIR /app
# Playwright is a dev-only QA tool; its postinstall would pull browsers we never
# run in the image, on an already-emulated arm64 build.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Stamped by CI so the running app can say which build it is. Both are provided
# by GitHub Actions; a local build leaves them unset and the app shows "dev".
ARG APP_BUILD
ARG APP_COMMIT
ENV NEXT_PUBLIC_APP_BUILD=$APP_BUILD
ENV NEXT_PUBLIC_APP_COMMIT=$APP_COMMIT

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
