package com.miniprojects.learnandassessportal.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "Courses")
@Data
public class Course {
    @Id
    @GeneratedValue
    private Integer courseId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category; // e.g., "Web Development", "Data Science"
    private String thumbnail; // URL or Path to image

    // Relationship: One Instructor creates Many Courses
    @ManyToOne
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    private LocalDateTime createdAt = LocalDateTime.now();
}
