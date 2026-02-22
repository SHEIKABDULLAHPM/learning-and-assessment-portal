package com.miniprojects.learnandassessportal.controller;

import com.miniprojects.learnandassessportal.model.Lesson;
import com.miniprojects.learnandassessportal.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modules/{moduleId}/lessons")
public class LessonController {

    @Autowired private LessonService lessonService;

    @PostMapping
    public ResponseEntity<Lesson> addLesson(
            @PathVariable Long moduleId,
            @RequestParam("title") String title,
            @RequestParam("type") String type,
            @RequestParam(value = "videoUrl", required = false) String videoUrl,
            @RequestParam(value = "pdfUrl", required = false) String pdfUrl,
            @RequestParam(value = "textContent", required = false) String textContent
    ) {
        Lesson newLesson = lessonService.addLesson(moduleId, title, type, videoUrl, pdfUrl, textContent);
        return ResponseEntity.ok(newLesson);
    }
    @GetMapping
    public ResponseEntity<List<Lesson>> getLessons(@PathVariable Integer moduleId) {
        return ResponseEntity.ok(lessonService.getLessonsByModule(moduleId));
    }

    @PutMapping("/{lessonId}")
    public ResponseEntity<Lesson> updateLesson(
            @PathVariable Long moduleId,
            @PathVariable Long lessonId,
            @RequestParam("title") String title,
            @RequestParam("type") String type,
            @RequestParam(value = "videoUrl", required = false) String videoUrl,
            @RequestParam(value = "pdfUrl", required = false) String pdfUrl,
            @RequestParam(value = "textContent", required = false) String textContent
    ) {
        Lesson updated = lessonService.updateLesson(lessonId, title, type, videoUrl, pdfUrl, textContent);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{lessonId}")
    public ResponseEntity<String> deleteLesson(
            @PathVariable Long moduleId,
            @PathVariable Long lessonId
    ) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.ok("Lesson deleted successfully");
    }


}



