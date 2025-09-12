FROM node:20

WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server ./

ENV NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
CMD ["node", "index.js"]
