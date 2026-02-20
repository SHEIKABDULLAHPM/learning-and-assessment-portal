package com.miniprojects.learnandassessportal.controller;

import com.miniprojects.learnandassessportal.model.Lesson;
import com.miniprojects.learnandassessportal.service.FileStorageService;
import com.miniprojects.learnandassessportal.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/modules/{moduleId}/lessons")
@CrossOrigin(origins = "http://localhost:5173")
public class LessonController {

    @Autowired private LessonService lessonService;
    @Autowired private FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Lesson> addLesson(
            @PathVariable Integer moduleId,
            @RequestParam("title") String title,
            @RequestParam("type") String type, // VIDEO, PDF, TEXT
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "textContent", required = false) String textContent
    ) {
        Lesson newLesson = lessonService.addLesson(moduleId, title, type, file, textContent);
        return ResponseEntity.ok(newLesson);
    }

    @GetMapping
    public ResponseEntity<List<Lesson>> getLessons(@PathVariable Integer moduleId) {
        return ResponseEntity.ok(lessonService.getLessonsByModule(moduleId));
    }
    // Endpoint to stream video or serve PDF
    @GetMapping("/{lessonId}/content")
    public ResponseEntity<Resource> getLessonContent(@PathVariable Long lessonId) {
        try {
            Lesson lesson = lessonService.getLessonById(lessonId);

            String fileName = (lesson.getContentType() == Lesson.ContentType.VIDEO)
                    ? lesson.getVideoPath()
                    : lesson.getPdfPath();

            Path filePath = fileStorageService.loadFile(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = (lesson.getContentType() == Lesson.ContentType.VIDEO)
                        ? "video/mp4"
                        : "application/pdf";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read file: " + fileName);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }

}



