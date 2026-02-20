package com.miniprojects.learnandassessportal.repository;

import com.miniprojects.learnandassessportal.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Integer> {
    // For Instructor Dashboard: "Show only MY courses"
    List<Course> findByInstructor_Email(String email);

    // For Student Dashboard: "Show all courses" (already built-in as findAll)
}
