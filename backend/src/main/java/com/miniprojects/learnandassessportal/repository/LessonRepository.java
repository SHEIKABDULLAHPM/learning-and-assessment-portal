package com.miniprojects.learnandassessportal.repository;

import com.miniprojects.learnandassessportal.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByModule_ModuleIdOrderByLessonOrderAsc(Integer moduleId);
}
