package com.miniprojects.learnandassessportal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Enable CORS using the bean defined below
                .cors(Customizer.withDefaults())

                // 2. Disable CSRF (Required for stateless APIs)
                .csrf(csrf -> csrf.disable())

                // 3. Set Session Policy to STATELESS (Requirement 5.6)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 4. Define Route Permissions
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**", "/error").permitAll()
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Allow PUBLIC viewing of courses (Students browsing)
                        .requestMatchers(HttpMethod.GET, "/api/courses/**", "/api/modules/**").permitAll()

                        // Secure everything else (Requires JWT)
                        .anyRequest().authenticated()
                )

                // 5. Add JWT Filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 5. Explicit CORS Configuration for React
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // FIX: Use allowedOriginPatterns instead of allowedOrigins
        // This allows localhost on ANY port (3000, 5173, etc.)
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));

        // Allow standard methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow all headers (Authorization, Content-Type)
        configuration.setAllowedHeaders(List.of("*"));

        // Essential for sending Cookies/Auth Headers
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}