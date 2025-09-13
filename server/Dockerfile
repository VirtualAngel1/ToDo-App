FROM node:20

WORKDIR /app

COPY server/package*.json ./
RUN npm ci

COPY server ./

RUN npm install dd-trace

ENV DD_SERVICE=todo-backend
ENV DD_ENV=production
ENV DD_VERSION=1.0.0

CMD ["node", "index.js"]
