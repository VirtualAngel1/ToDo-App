FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache ca-certificates wget

RUN npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set registry https://registry.npmjs.org/

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

COPY server ./server

WORKDIR /app
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci && npm run build

COPY client ./client

FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache ca-certificates wget

COPY --from=builder /app/server ./server
COPY --from=builder /app/server/node_modules ./server/node_modules

COPY --from=builder /app/client/build ./server/public

ENV NODE_ENV=staging \
    DD_SERVICE=todo-backend \
    DD_ENV=staging \
    DD_VERSION=1.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/health || exit 1

CMD ["node", "server/index.js"]
