package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.dto.ModuleRequest;
import com.miniprojects.learnandassessportal.model.Course;
import com.miniprojects.learnandassessportal.model.Module;
import com.miniprojects.learnandassessportal.repository.CourseRepository;
import com.miniprojects.learnandassessportal.repository.ModuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ModuleService {
    @Autowired private CourseRepository courseRepository;
    @Autowired private ModuleRepository moduleRepository;

    public Module createModule(Integer courseId, ModuleRequest request) {
        // 1. Find the parent Course
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found with ID: " + courseId));

        // 2. Create the Module and Map it
        Module module = new Module();
        module.setTitle(request.getTitle());
        module.setSubtitle(request.getSubtitle());
        module.setCourse(course);

        // Auto-generate order (put it at the end)
        List<Module> existing = moduleRepository.findByCourse_CourseIdOrderByModuleOrderAsc(courseId);
        module.setModuleOrder(existing.size() + 1);

        // 3. Save to Database
        return moduleRepository.save(module);
    }

    public List<Module> getModulesByCourseId(Integer courseId) {
        return moduleRepository.findByCourse_CourseIdOrderByModuleOrderAsc(courseId);
    }

    public Module getModuleById(Integer moduleId) {
        return moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found with ID: " + moduleId));
    }

    public Module updateModule(Integer moduleId, ModuleRequest request) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found with ID: " + moduleId));

        // Update fields
        if (request.getTitle() != null) {
            module.setTitle(request.getTitle());
        }
        if (request.getSubtitle() != null) {
            module.setSubtitle(request.getSubtitle());
        }
        if (request.getModuleOrder() != null) {
            module.setModuleOrder(request.getModuleOrder());
        }

        return moduleRepository.save(module);
    }

    public void deleteModule(Integer moduleId) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found with ID: " + moduleId));
        moduleRepository.delete(module);
    }
}
