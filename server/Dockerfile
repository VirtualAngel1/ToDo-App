FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app
COPY server/pom.xml server/
COPY server/src server/src
RUN mvn -f server/pom.xml clean package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=builder /app/server/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --spider http://localhost:8080/health || exit 1

CMD ["java", "-jar", "app.jar"]
