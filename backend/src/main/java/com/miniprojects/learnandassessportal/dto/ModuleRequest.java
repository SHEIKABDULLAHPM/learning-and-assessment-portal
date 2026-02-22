package com.miniprojects.learnandassessportal.dto;

import lombok.Data;

@Data
public class ModuleRequest {
    private String title;
    private Integer moduleOrder; // Optional - auto-generated if not provided
}
