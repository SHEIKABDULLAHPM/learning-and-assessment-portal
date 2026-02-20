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

    private String videoPath; // Stores file path (e.g., uploads/videos/abc.mp4)
    private String pdfPath;

    @Lob
    private String textContent; // For text-based lessons

    private Integer lessonOrder;

    @ManyToOne
    @JoinColumn(name = "module_id", nullable = false)
    @JsonIgnore
    private Module module;

    public enum ContentType {
        VIDEO, PDF, TEXT
    }
}