package com.miniprojects.learnandassessportal.repository;

import com.miniprojects.learnandassessportal.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByModule_ModuleId(Integer moduleId);
}
