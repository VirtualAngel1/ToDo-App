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
ENV DD_SERVICE=todo-backend
ENV DD_ENV=production
ENV DD_VERSION=1.0.0

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/health || exit 1

RUN apk add --no-cache ca-certificates

ENV DD_AGENT_HOST=trace.agent.datadoghq.com
ENV DD_TRACE_AGENT_PORT=443
ENV DD_TRACE_AGENT_URL=https://trace.agent.datadoghq.com

CMD ["node", "server/index.js"]
