package com.miniprojects.learnandassessportal.controller;

import com.miniprojects.learnandassessportal.dto.*;
import com.miniprojects.learnandassessportal.model.User;
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
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        User user = authService.register(request);
        String token = authService.generateTokenForUser(user);
        return ResponseEntity.ok(new AuthResponse("User registered successfully", user.getRole().name(), token));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        User user = authService.login(request);
        String token = authService.generateTokenForUser(user);
        return ResponseEntity.ok(new AuthResponse("Login Successful", user.getRole().name(), token));
    }
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.googleLogin(request));
    }
}
