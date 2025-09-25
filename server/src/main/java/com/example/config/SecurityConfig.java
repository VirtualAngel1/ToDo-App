package com.example.config;

import java.util.List;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  public SecurityConfig() {
    System.out.println("[SecurityConfig]");
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    System.out.println("[SecurityFilterChain] Building…");

    http
      .csrf(csrf -> csrf.disable())

      .cors(cors -> cors.configurationSource(corsConfigurationSource()))

      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.GET,  "/api/ping").permitAll()
        .requestMatchers(HttpMethod.POST, "/api/login").permitAll()
        .anyRequest().authenticated()
      )
      .exceptionHandling(ex -> ex
        .authenticationEntryPoint((req, res, authEx) ->
          res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
      )

      .sessionManagement(sm ->
        sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
      );

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("*"));
    config.setAllowedMethods(List.of("*"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
