FROM node:20-alpine AS builder
WORKDIR /app

COPY server/package*.json ./server/
COPY server ./server
RUN cd server && npm ci

COPY client/package*.json ./client/
COPY client ./client
RUN cd client && npm ci && npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/server ./server
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/build ./server/public

ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget --quiet --spider http://localhost:3000/health || exit 1

CMD ["node", "server/index.js"]
