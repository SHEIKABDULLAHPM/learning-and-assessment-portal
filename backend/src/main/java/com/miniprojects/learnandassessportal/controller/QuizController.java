package com.miniprojects.learnandassessportal.controller;

import com.miniprojects.learnandassessportal.dto.QuizResultResponse;
import com.miniprojects.learnandassessportal.dto.QuizSubmissionRequest;
import com.miniprojects.learnandassessportal.model.Question;
import com.miniprojects.learnandassessportal.model.Quiz;
import com.miniprojects.learnandassessportal.service.QuizService;
import com.miniprojects.learnandassessportal.service.QuizUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/modules/{moduleId}/quizzes")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizUploadService quizUploadService;

    /**
     * Bulk upload quiz questions from a PDF or DOCX file.
     * Parses questions, options, and correct answers from the file
     * and saves them as a quiz mapped to the given module.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadQuizFile(
            @PathVariable Integer moduleId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", defaultValue = "Module Quiz") String title,
            @RequestParam(value = "description", defaultValue = "Uploaded Quiz") String description) {
        try {
            List<Question> questions = quizUploadService.processUploadedFile(file);

            Quiz quiz = new Quiz();
            quiz.setTitle(title);
            quiz.setDescription(description);
            quiz.setQuestions(questions);

            Quiz savedQuiz = quizService.saveQuiz(moduleId, quiz);

            return ResponseEntity.ok(Map.of(
                    "quiz", savedQuiz,
                    "questionsCount", questions.size(),
                    "message", "Successfully uploaded " + questions.size() + " questions."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to process the uploaded file: " + e.getMessage()));
        }
    }

    /**
     * Preview parsed questions from a file without saving.
     * Allows the instructor to review before confirming.
     */
    @PostMapping("/upload/preview")
    public ResponseEntity<?> previewUploadedQuiz(
            @PathVariable Integer moduleId,
            @RequestParam("file") MultipartFile file) {
        try {
            List<Question> questions = quizUploadService.processUploadedFile(file);
            return ResponseEntity.ok(Map.of(
                    "questions", questions,
                    "questionsCount", questions.size()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to process the uploaded file: " + e.getMessage()));
        }
    }

    /**
     * Save a quiz to the database (instructor confirms after preview).
     */
    @PostMapping
    public ResponseEntity<Quiz> saveQuiz(@PathVariable Integer moduleId, @RequestBody Quiz quiz) {
        Quiz savedQuiz = quizService.saveQuiz(moduleId, quiz);
        return ResponseEntity.ok(savedQuiz);
    }

    /**
     * Get all saved quizzes for a module (for instructor management).
     */
    @GetMapping
    public ResponseEntity<List<Quiz>> getQuizzesByModule(@PathVariable Integer moduleId) {
        List<Quiz> quizzes = quizService.getQuizzesByModule(moduleId);
        return ResponseEntity.ok(quizzes);
    }

    /**
     * Get a single quiz by ID.
     */
    @GetMapping("/{quizId}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable Integer moduleId, @PathVariable Long quizId) {
        Quiz quiz = quizService.getQuizById(quizId);
        return ResponseEntity.ok(quiz);
    }

    /**
     * Get a randomized quiz for a student attempt.
     * Randomly selects questions from the question pool and randomizes
     * both question order and option order for each attempt.
     */
    @GetMapping("/random")
    public ResponseEntity<?> getRandomizedQuiz(
            @PathVariable Integer moduleId,
            @RequestParam(value = "numQuestions", defaultValue = "10") int numQuestions) {
        try {
            Quiz randomizedQuiz = quizService.getRandomizedQuizForModule(moduleId, numQuestions);
            if (randomizedQuiz == null) {
                return ResponseEntity.ok(Map.of(
                        "error", "No quiz questions available for this module."
                ));
            }
            return ResponseEntity.ok(randomizedQuiz);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to generate randomized quiz: " + e.getMessage()));
        }
    }

    /**
     * Student submits answers — server evaluates and returns score.
     */
    @PostMapping("/{quizId}/submit")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            @PathVariable Integer moduleId,
            @PathVariable Long quizId,
            @RequestBody QuizSubmissionRequest submission) {
        QuizResultResponse result = quizService.evaluateQuiz(quizId, submission);
        return ResponseEntity.ok(result);
    }

    /**
     * Delete a quiz.
     */
    @DeleteMapping("/{quizId}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Integer moduleId, @PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.noContent().build();
    }
}
