package com.example.controller;

import com.example.model.User;
import com.example.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

  private final UserRepository repo;
  private final PasswordEncoder encoder;
  private final AuthenticationManager authManager;

  public AuthController(UserRepository repo,
                        PasswordEncoder encoder,
                        AuthenticationManager authManager) {
    this.repo = repo;
    this.encoder = encoder;
    this.authManager = authManager;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> credentials,
                                 HttpServletRequest request) {
    String username = credentials.get("username");
    String rawPw = credentials.get("password");

    System.out.println("[AuthController] login() called for " + username);

    User user = repo.findByUsername(username)
      .orElseGet(() -> {
        String hashed = encoder.encode(rawPw);
        User u = new User(username, hashed);
        System.out.println("[AuthController] registering new user: " + username);
        return repo.save(u);
      });

    UsernamePasswordAuthenticationToken token =
      new UsernamePasswordAuthenticationToken(username, rawPw);

    try {
      Authentication auth = authManager.authenticate(token);
      SecurityContextHolder.getContext().setAuthentication(auth);
      request.getSession(true);
      return ResponseEntity.ok(Map.of("username", username));
    } catch (AuthenticationException ex) {
      System.out.println("[AuthController] auth failed for " + username + ": " + ex.getMessage());
      return ResponseEntity
        .status(HttpStatus.UNAUTHORIZED)
        .body(Map.of("error", "Invalid credentials"));
    }
  }
}
