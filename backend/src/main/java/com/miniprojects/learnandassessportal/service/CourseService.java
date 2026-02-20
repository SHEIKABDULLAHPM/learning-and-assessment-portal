package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.model.Course;
import com.miniprojects.learnandassessportal.model.User;
import com.miniprojects.learnandassessportal.repository.CourseRepository;
import com.miniprojects.learnandassessportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CourseService {
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private UserRepository userRepository;

    public Course createCourse(Course course, String instructorEmail) {
        User instructor = userRepository.findByEmail(instructorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Instructor not found"));

        if (instructor.getRole() != User.Role.INSTRUCTOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only instructors can create courses");
        }

        course.setInstructor(instructor);
        return courseRepository.save(course);
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<Course> getCoursesByInstructor(String instructorEmail) {
        return courseRepository.findByInstructor_Email(instructorEmail);
    }

    // Update an existing course
    public Course updateCourse(Integer courseId, Course updatedData, String email) {
        Course existingCourse = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        // Security Check: Ensure the user trying to update is the owner
        if (!existingCourse.getInstructor().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized: You do not own this course");
        }

        // Update fields
        existingCourse.setTitle(updatedData.getTitle());
        existingCourse.setDescription(updatedData.getDescription());
        existingCourse.setCategory(updatedData.getCategory());
        // thumbnail logic would go here if updated

        return courseRepository.save(existingCourse);
    }

    // Delete a course
    public void deleteCourse(Integer courseId, String email) {
        Course existingCourse = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (!existingCourse.getInstructor().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized: You do not own this course");
        }

        courseRepository.delete(existingCourse);
    }

    // Helper to get single course (needed for Edit form)
    public Course getCourseById(Integer courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }
}
