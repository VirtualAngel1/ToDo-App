FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY server/pom.xml server/
COPY server/src server/src
RUN mvn -f server/pom.xml clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/server/target/server-1.0.0.jar app.jar

EXPOSE 8085

CMD ["java", "-jar", "app.jar"]
