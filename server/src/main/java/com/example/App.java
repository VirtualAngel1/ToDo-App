package com.example;

import java.time.LocalDateTime;

public class App {

    public static void main(String[] args) {
        System.out.println(getStartupMessage());
    }

    public static String getStartupMessage() {
        return "ToDo Server started successfully at " + LocalDateTime.now();
    }
}
