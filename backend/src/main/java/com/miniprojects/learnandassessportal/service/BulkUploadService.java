package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.model.Course;
import com.miniprojects.learnandassessportal.model.Lesson;
import com.miniprojects.learnandassessportal.model.Module;
import com.miniprojects.learnandassessportal.repository.CourseRepository;
import com.miniprojects.learnandassessportal.repository.LessonRepository;
import com.miniprojects.learnandassessportal.repository.ModuleRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BulkUploadService {

    @Autowired private CourseRepository courseRepository;
    @Autowired private ModuleRepository moduleRepository;
    @Autowired private LessonRepository lessonRepository;

    @Transactional
    public void processCsvBulkUpload(Integer courseId, MultipartFile file) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + courseId));

        // Get existing modules for this course to calculate next order
        List<Module> existingModules = moduleRepository.findByCourse_CourseIdOrderByModuleOrderAsc(courseId);
        int moduleOrderCounter = existingModules.size() + 1;

        // Keep track of modules created in this session to group lessons
        Map<String, Module> moduleCache = new HashMap<>();

        // Also check if a module with the same title already exists in this course
        for (Module existing : existingModules) {
            moduleCache.put(existing.getTitle(), existing);
        }

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"))) {

            Iterable<CSVRecord> records = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreEmptyLines(true)
                    .setTrim(true)
                    .build()
                    .parse(fileReader);

            for (CSVRecord record : records) {
                String moduleTitle = record.get("ModuleTitle").trim();

                // 1. Get or Create Module
                Module module = moduleCache.get(moduleTitle);
                if (module == null) {
                    module = new Module();
                    module.setCourse(course);
                    module.setTitle(moduleTitle);
                    module.setModuleOrder(moduleOrderCounter++);

                    module = moduleRepository.save(module);
                    moduleCache.put(moduleTitle, module);
                }

                // 2. Create Lesson (if lesson data exists in this row)
                String lessonTitle = record.get("LessonTitle");
                if (lessonTitle != null && !lessonTitle.trim().isEmpty()) {
                    Lesson lesson = new Lesson();
                    lesson.setModule(module);
                    lesson.setTitle(lessonTitle.trim());

                    String typeStr = record.get("LessonType").trim().toUpperCase();
                    Lesson.ContentType type = Lesson.ContentType.valueOf(typeStr);
                    lesson.setContentType(type);

                    String content = record.get("LessonContent").trim();
                    if (type == Lesson.ContentType.VIDEO) lesson.setVideoPath(content);
                    else if (type == Lesson.ContentType.PDF) lesson.setPdfPath(content);
                    else if (type == Lesson.ContentType.TEXT) lesson.setTextContent(content);

                    // Calculate per-module lesson order
                    List<Lesson> existingLessons = lessonRepository.findByModule_ModuleIdOrderByLessonOrderAsc(module.getModuleId());
                    lesson.setLessonOrder(existingLessons.size() + 1);
                    lessonRepository.save(lesson);
                }
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid data in CSV: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Failed to process CSV file: " + e.getMessage());
        }
    }
}