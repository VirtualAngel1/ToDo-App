package com.example;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AppTest {

    @Test
    void getStartupMessage_shouldContainExpectedText() {
        String message = App.getStartupMessage();

        assertTrue(message.contains("ToDo Server started successfully."),
                   "Startup message should contain the expected text.");
    }
}
