package com.example;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class App {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    public static void main(String[] args) {
        System.out.println("ToDo Server starting...");
        SpringApplication.run(App.class, args);
    }

    @PostConstruct
    public void logMongoUri() {
        System.out.println(">>> Mongo URI in use: " + mongoUri);
    }
}
