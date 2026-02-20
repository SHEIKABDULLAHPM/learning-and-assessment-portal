package com.miniprojects.learnandassessportal.repository;

import com.miniprojects.learnandassessportal.model.Module;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, Integer> {
    List<Module> findByCourse_CourseIdOrderByModuleOrderAsc(Integer courseId);
}
