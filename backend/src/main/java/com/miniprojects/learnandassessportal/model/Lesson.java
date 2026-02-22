package com.miniprojects.learnandassessportal.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "Lessons")
@Data
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lessonId;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    private ContentType contentType; // VIDEO, PDF, TEXT

    private String videoPath; // Will now store the YouTube URL
    private String pdfPath;   // Will store the uploaded PDF file name

    @Column(columnDefinition = "TEXT")
    private String textContent;

    private Integer lessonOrder;

    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    @JsonIgnore
    private Module module;

    public enum ContentType {
        VIDEO, PDF, TEXT
    }
}