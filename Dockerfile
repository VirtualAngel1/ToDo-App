FROM maven:3.9.6-eclipse-temurin-17 AS backend-builder
WORKDIR /app/server
COPY server/pom.xml ./
COPY server/src ./src
RUN mvn clean package -DskipTests

FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
COPY client ./
RUN npm ci && npm run build

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=backend-builder /app/server/target/*.jar app.jar
COPY --from=frontend-builder /app/client/build ./public
EXPOSE 8085
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget --quiet --spider http://localhost:8085/health || exit 1
CMD ["java", "-jar", "app.jar"]
