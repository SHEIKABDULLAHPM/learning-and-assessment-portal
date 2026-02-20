package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.model.Lesson;
import com.miniprojects.learnandassessportal.model.Module;
import com.miniprojects.learnandassessportal.repository.LessonRepository;
import com.miniprojects.learnandassessportal.repository.ModuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LessonService {

    @Autowired private LessonRepository lessonRepository;
    @Autowired private ModuleRepository moduleRepository;
    @Autowired private FileStorageService fileStorageService;

    public Lesson addLesson(Integer moduleId, String title, String type, MultipartFile file, String textContent) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

        Lesson lesson = new Lesson();
        lesson.setTitle(title);
        lesson.setModule(module);

        // Set content type based on input string (VIDEO, PDF, TEXT)
        Lesson.ContentType contentType = Lesson.ContentType.valueOf(type.toUpperCase());
        lesson.setContentType(contentType);

        // Handle File Uploads
        if (contentType == Lesson.ContentType.VIDEO || contentType == Lesson.ContentType.PDF) {
            if (file == null || file.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required for VIDEO/PDF lessons");
            }
            String fileName = fileStorageService.storeFile(file);

            if (contentType == Lesson.ContentType.VIDEO) {
                lesson.setVideoPath(fileName);
            } else {
                lesson.setPdfPath(fileName);
            }
        } else {
            // Handle Text Content
            lesson.setTextContent(textContent);
        }

        // Set order (append to end)
        List<Lesson> existing = lessonRepository.findByModule_ModuleIdOrderByLessonOrderAsc(moduleId);
        lesson.setLessonOrder(existing.size() + 1);

        return lessonRepository.save(lesson);
    }

    public List<Lesson> getLessonsByModule(Integer moduleId) {
        return lessonRepository.findByModule_ModuleIdOrderByLessonOrderAsc(moduleId);
    }

    public Lesson getLessonById(Long lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    }
}
