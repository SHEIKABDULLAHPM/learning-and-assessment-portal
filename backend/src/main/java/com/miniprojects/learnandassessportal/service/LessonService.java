package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.model.Lesson;
import com.miniprojects.learnandassessportal.model.Module;
import com.miniprojects.learnandassessportal.repository.LessonRepository;
import com.miniprojects.learnandassessportal.repository.ModuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LessonService {

    @Autowired
    private LessonRepository lessonRepository;
    @Autowired
    private ModuleRepository moduleRepository;

    // ... existing imports ...
    public Lesson addLesson(Long moduleId, String title, String type, String videoUrl, String pdfUrl, String textContent) {
        Module module = moduleRepository.findById(Math.toIntExact(moduleId))
                .orElseThrow(() -> new RuntimeException("Module not found"));

        Lesson lesson = new Lesson();
        lesson.setTitle(title);
        lesson.setModule(module);

        Lesson.ContentType contentType = Lesson.ContentType.valueOf(type.toUpperCase());
        lesson.setContentType(contentType);

        // Handle Content based on Type
        if (contentType == Lesson.ContentType.VIDEO) {
            lesson.setVideoPath(videoUrl); // Save YouTube Link
        } else if (contentType == Lesson.ContentType.PDF) {
            if (pdfUrl == null || pdfUrl.isBlank()) throw new RuntimeException("Google Drive link is required");
            lesson.setPdfPath(pdfUrl); // Store Google Drive shareable link
        } else if (contentType == Lesson.ContentType.TEXT) {
            lesson.setTextContent(textContent);
        }

        // Auto-increment order
        List<Lesson> existing = lessonRepository.findByModule_ModuleIdOrderByLessonOrderAsc(Math.toIntExact(moduleId));
        lesson.setLessonOrder(existing.size() + 1);

        return lessonRepository.save(lesson);
    }

    public Lesson getLessonById(Long lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found with ID: " + lessonId));
    }

    public List<Lesson> getLessonsByModule(Integer moduleId) {
        return lessonRepository.findByModule_ModuleIdOrderByLessonOrderAsc(moduleId);
    }

    public Lesson updateLesson(Long lessonId, String title, String type, String videoUrl, String pdfUrl, String textContent) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found with ID: " + lessonId));

        if (title != null && !title.isBlank()) {
            lesson.setTitle(title);
        }

        if (type != null) {
            Lesson.ContentType contentType = Lesson.ContentType.valueOf(type.toUpperCase());
            lesson.setContentType(contentType);

            if (contentType == Lesson.ContentType.VIDEO && videoUrl != null) {
                lesson.setVideoPath(videoUrl);
            } else if (contentType == Lesson.ContentType.PDF && pdfUrl != null && !pdfUrl.isBlank()) {
                lesson.setPdfPath(pdfUrl); // Store Google Drive shareable link
            } else if (contentType == Lesson.ContentType.TEXT && textContent != null) {
                lesson.setTextContent(textContent);
            }
        }

        return lessonRepository.save(lesson);
    }

    public void deleteLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found with ID: " + lessonId));
        lessonRepository.delete(lesson);
    }
}