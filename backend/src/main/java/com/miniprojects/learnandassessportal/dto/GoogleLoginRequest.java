package com.miniprojects.learnandassessportal.dto;

import lombok.Data;

@Data
public class GoogleLoginRequest {
    private String token; // The ID token from the frontend
}