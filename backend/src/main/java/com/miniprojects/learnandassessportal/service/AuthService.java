package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.dto.AuthResponse;
import com.miniprojects.learnandassessportal.dto.LoginRequest;
import com.miniprojects.learnandassessportal.dto.RegisterRequest;
import com.miniprojects.learnandassessportal.dto.GoogleLoginRequest;
import com.miniprojects.learnandassessportal.model.User;
import com.miniprojects.learnandassessportal.repository.UserRepository;

import com.miniprojects.learnandassessportal.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    // REPLACE WITH YOUR CLIENT ID
    private static final String GOOGLE_CLIENT_ID = "179579451755-pi8s5oc9057drsoophil46p5vdpp22cc.apps.googleusercontent.com";

    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(determineRole(request.getEmail()));

        return userRepository.save(user);
    }

    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        User.Role expectedRole = determineRole(user.getEmail());
        if (user.getRole() != expectedRole) {
            user.setRole(expectedRole);
            userRepository.save(user);
        }

        return user;
    }

    public String generateTokenForUser(User user) {
        return jwtUtils.generateToken(user);
    }

    public AuthResponse googleLogin(GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier =
                    new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                            .setAudience(Collections.singletonList(GOOGLE_CLIENT_ID))
                            .build();

            GoogleIdToken idToken = verifier.verify(request.getToken());

            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                // Check if user exists
                User user = userRepository.findByEmail(email).orElse(null);

                User.Role determinedRole = determineRole(email);

                if (user == null) {
                    // Register new user automatically
                    user = new User();
                    user.setEmail(email);
                    user.setFullName(name);
                    user.setRole(determinedRole);
                    user.setPasswordHash(
                            passwordEncoder.encode(UUID.randomUUID().toString())
                    );
                    userRepository.save(user);
                } else if (user.getRole() != determinedRole) {
                    user.setRole(determinedRole);
                    userRepository.save(user);
                }

                // Generate JWT Token for your application
                String token = jwtUtils.generateToken(user);
                return new AuthResponse("Login Successful", user.getRole().name(), token);

            } else {
                throw new RuntimeException("Invalid Google Token");
            }

        } catch (Exception e) {
            throw new RuntimeException("Google Login Failed: " + e.getMessage());
        }
    }

    private User.Role determineRole(String email) {
        if (email == null) {
            return User.Role.STUDENT;
        }

        String normalized = email.trim().toLowerCase();

        if ("instructor@example.com".equals(normalized)) {
            return User.Role.INSTRUCTOR;
        }

        if (normalized.endsWith("@bitsathy.ac.in")) {
            return User.Role.STUDENT;
        }

        return User.Role.STUDENT;
    }
}
