package com.miniprojects.learnandassessportal.controller;

import com.miniprojects.learnandassessportal.dto.ModuleRequest;
import com.miniprojects.learnandassessportal.model.Module;
import com.miniprojects.learnandassessportal.service.ModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ModuleController {

    @Autowired
    private ModuleService moduleService;

    // Create a new module for a course
    @PostMapping("/courses/{courseId}/modules")
    public ResponseEntity<Module> createModule(
            @PathVariable Integer courseId,
            @RequestBody ModuleRequest request) {
        Module module = moduleService.createModule(courseId, request);
        return ResponseEntity.ok(module);
    }

    // Get all modules for a course
    @GetMapping("/courses/{courseId}/modules")
    public ResponseEntity<List<Module>> getModulesByCourse(@PathVariable Integer courseId) {
        List<Module> modules = moduleService.getModulesByCourseId(courseId);
        return ResponseEntity.ok(modules);
    }

    // Get a single module by ID
    @GetMapping("/modules/{moduleId}")
    public ResponseEntity<Module> getModuleById(@PathVariable Integer moduleId) {
        Module module = moduleService.getModuleById(moduleId);
        return ResponseEntity.ok(module);
    }

    // Update a module
    @PutMapping("/modules/{moduleId}")
    public ResponseEntity<Module> updateModule(
            @PathVariable Integer moduleId,
            @RequestBody ModuleRequest request) {
        Module updated = moduleService.updateModule(moduleId, request);
        return ResponseEntity.ok(updated);
    }

    // Delete a module
    @DeleteMapping("/modules/{moduleId}")
    public ResponseEntity<String> deleteModule(@PathVariable Integer moduleId) {
        moduleService.deleteModule(moduleId);
        return ResponseEntity.ok("Module deleted successfully");
    }
}
