package com.miniprojects.learnandassessportal.controller;

import com.miniprojects.learnandassessportal.dto.*;
import com.miniprojects.learnandassessportal.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "http://localhost:*") // Allow React Frontend
public class AuthController {

    @Autowired private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // In a real app, you would return a JWT Token here
        authService.login(request);
        return ResponseEntity.ok("Login Successful");


    }
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        String token = authService.googleLogin(request);
        // Return JSON object with token
        return ResponseEntity.ok(java.util.Map.of("token", token));
    }
}
