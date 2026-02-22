package com.miniprojects.learnandassessportal.controller;

import com.miniprojects.learnandassessportal.model.Course;
import com.miniprojects.learnandassessportal.service.BulkUploadService;
import com.miniprojects.learnandassessportal.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired private CourseService courseService;
    @Autowired private BulkUploadService bulkUploadService;

    @PostMapping("/{courseId}/bulk-upload")
    public ResponseEntity<?> bulkUploadContent(
            @PathVariable Integer courseId,
            @RequestParam("file") MultipartFile file) {

        bulkUploadService.processCsvBulkUpload(courseId, file);
        return ResponseEntity.ok("Bulk upload successful");
    }
    // 1. Create a New Course (Instructor Only)
    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        Course savedCourse = courseService.createCourse(course, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCourse);
    }

    // 2. Get All Courses (For Students)
    @GetMapping
    public List<Course> getAllCourses() {
        return courseService.getAllCourses();
    }

    // 3. Get My Courses (For Instructor Dashboard)
    @GetMapping("/mine")
    public List<Course> getMyCourses(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        return courseService.getCoursesByInstructor(userDetails.getUsername());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Integer id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Integer id,
                                               @RequestBody Course course,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(courseService.updateCourse(id, course, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Integer id,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        courseService.deleteCourse(id, userDetails.getUsername());
        return ResponseEntity.ok("Course deleted successfully");
    }
}
