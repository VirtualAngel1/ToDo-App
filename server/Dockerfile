FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app
COPY server/pom.xml server/
COPY server/src server/src
RUN mvn -f server/pom.xml clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/server/target/*.jar app.jar

ENV DD_SERVICE=todo-backend
ENV DD_ENV=production
ENV DD_VERSION=1.0.0

CMD ["java", "-jar", "app.jar"]
