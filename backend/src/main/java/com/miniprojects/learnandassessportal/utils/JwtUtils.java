package com.miniprojects.learnandassessportal.utils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.util.Date;
import javax.crypto.SecretKey;
import com.miniprojects.learnandassessportal.model.User;

@Component
public class JwtUtils {
    // Generate a secure key for HS512 (automatically 512+ bits)
    private final SecretKey jwtSecretKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
    private int jwtExpirationMs = 86400000; // 24 hours

    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("role", user.getRole().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(jwtSecretKey, SignatureAlgorithm.HS512)
                .compact();
    }
}