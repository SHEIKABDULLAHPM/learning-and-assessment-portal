package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.dto.LoginRequest;
import com.miniprojects.learnandassessportal.dto.RegisterRequest;
import com.miniprojects.learnandassessportal.dto.GoogleLoginRequest;
import com.miniprojects.learnandassessportal.model.User;
import com.miniprojects.learnandassessportal.repository.UserRepository;

import com.miniprojects.learnandassessportal.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.STUDENT); // Default role

        userRepository.save(user);
    }

    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        return user;
    }

    public String googleLogin(GoogleLoginRequest request) {
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

                if (user == null) {
                    // Register new user automatically
                    user = new User();
                    user.setEmail(email);
                    user.setFullName(name);
                    user.setRole(User.Role.STUDENT); // Default role
                    user.setPasswordHash(
                            passwordEncoder.encode(UUID.randomUUID().toString())
                    );
                    userRepository.save(user);
                }

                // Generate JWT Token for your application
                return jwtUtils.generateToken(user);

            } else {
                throw new RuntimeException("Invalid Google Token");
            }

        } catch (Exception e) {
            throw new RuntimeException("Google Login Failed: " + e.getMessage());
        }
    }
}
