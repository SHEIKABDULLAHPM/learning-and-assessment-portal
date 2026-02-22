package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.dto.QuizResultResponse;
import com.miniprojects.learnandassessportal.dto.QuizSubmissionRequest;
import com.miniprojects.learnandassessportal.model.Module;
import com.miniprojects.learnandassessportal.model.Question;
import com.miniprojects.learnandassessportal.model.Quiz;
import com.miniprojects.learnandassessportal.repository.ModuleRepository;
import com.miniprojects.learnandassessportal.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private ModuleRepository moduleRepository;

    /**
     * Save a quiz (instructor uploads questions and persists them).
     */
    public Quiz saveQuiz(Integer moduleId, Quiz quiz) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found with id: " + moduleId));

        quiz.setModule(module);

        // Link each question back to the quiz (bidirectional relationship)
        if (quiz.getQuestions() != null) {
            for (Question q : quiz.getQuestions()) {
                q.setQuiz(quiz);
            }
        }

        return quizRepository.save(quiz);
    }

    /**
     * Get all saved quizzes for a module.
     */
    public List<Quiz> getQuizzesByModule(Integer moduleId) {
        return quizRepository.findByModule_ModuleId(moduleId);
    }

    /**
     * Get a single quiz by its ID.
     */
    public Quiz getQuizById(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));
    }

    /**
     * Get a randomized quiz for a student attempt.
     * Pools all questions from all quizzes in the module,
     * randomly selects up to numQuestions, randomizes question order,
     * and randomizes option order for each question.
     */
    public Quiz getRandomizedQuizForModule(Integer moduleId, int numQuestions) {
        List<Quiz> quizzes = quizRepository.findByModule_ModuleId(moduleId);
        if (quizzes.isEmpty()) {
            return null;
        }

        // Pool all questions from all quizzes in this module
        List<Question> allQuestions = new ArrayList<>();
        for (Quiz q : quizzes) {
            if (q.getQuestions() != null) {
                allQuestions.addAll(q.getQuestions());
            }
        }

        if (allQuestions.isEmpty()) {
            return null;
        }

        // Shuffle and pick random questions
        Collections.shuffle(allQuestions);
        int count = Math.min(numQuestions, allQuestions.size());
        List<Question> selectedQuestions = new ArrayList<>(allQuestions.subList(0, count));

        // Randomize option order for each selected question
        Random random = new Random();
        for (Question q : selectedQuestions) {
            randomizeOptions(q, random);
        }

        // Build a virtual quiz (not persisted) for the student
        Quiz randomQuiz = new Quiz();
        randomQuiz.setQuizId(quizzes.get(0).getQuizId()); // Use the first quiz ID for submission
        randomQuiz.setTitle("Module Quiz");
        randomQuiz.setDescription("Randomized quiz from uploaded question pool");
        randomQuiz.setQuestions(selectedQuestions);

        return randomQuiz;
    }

    /**
     * Randomizes the order of options (A, B, C, D) for a question.
     * Updates the correctOption field to match the new position.
     */
    private void randomizeOptions(Question question, Random random) {
        // Collect current options with their original keys
        List<String[]> options = new ArrayList<>();
        if (question.getOptionA() != null && !question.getOptionA().isEmpty()) {
            options.add(new String[]{"A", question.getOptionA()});
        }
        if (question.getOptionB() != null && !question.getOptionB().isEmpty()) {
            options.add(new String[]{"B", question.getOptionB()});
        }
        if (question.getOptionC() != null && !question.getOptionC().isEmpty()) {
            options.add(new String[]{"C", question.getOptionC()});
        }
        if (question.getOptionD() != null && !question.getOptionD().isEmpty()) {
            options.add(new String[]{"D", question.getOptionD()});
        }

        if (options.size() < 2) return; // Need at least 2 options to shuffle

        String correctKey = question.getCorrectOption().toUpperCase();

        // Shuffle options
        Collections.shuffle(options, random);

        // Assign shuffled options back to A, B, C, D
        String[] keys = {"A", "B", "C", "D"};
        String newCorrectOption = null;

        for (int i = 0; i < options.size(); i++) {
            String originalKey = options.get(i)[0];
            String optionText = options.get(i)[1];

            switch (keys[i]) {
                case "A" -> question.setOptionA(optionText);
                case "B" -> question.setOptionB(optionText);
                case "C" -> question.setOptionC(optionText);
                case "D" -> question.setOptionD(optionText);
            }

            if (originalKey.equals(correctKey)) {
                newCorrectOption = keys[i];
            }
        }

        // Clear unused option slots
        for (int i = options.size(); i < 4; i++) {
            switch (keys[i]) {
                case "A" -> question.setOptionA("");
                case "B" -> question.setOptionB("");
                case "C" -> question.setOptionC("");
                case "D" -> question.setOptionD("");
            }
        }

        if (newCorrectOption != null) {
            question.setCorrectOption(newCorrectOption);
        }
    }

    /**
     * Evaluate a student's quiz submission and return the result.
     */
    public QuizResultResponse evaluateQuiz(Long quizId, QuizSubmissionRequest submission) {
        Quiz quiz = getQuizById(quizId);
        List<Question> questions = quiz.getQuestions();
        Map<Long, String> answers = submission.getAnswers();

        int correctCount = 0;
        List<QuizResultResponse.QuestionResult> questionResults = new ArrayList<>();

        for (Question question : questions) {
            String selectedOption = answers.getOrDefault(question.getQuestionId(), "");
            boolean isCorrect = question.getCorrectOption().equalsIgnoreCase(selectedOption);

            if (isCorrect) {
                correctCount++;
            }

            questionResults.add(new QuizResultResponse.QuestionResult(
                    question.getQuestionId(),
                    question.getQuestionText(),
                    selectedOption,
                    question.getCorrectOption(),
                    isCorrect
            ));
        }

        int total = questions.size();
        double percentage = total > 0 ? Math.round((double) correctCount / total * 100.0) : 0;
        boolean passed = percentage >= 50;

        return new QuizResultResponse(correctCount, total, percentage, passed, questionResults);
    }

    /**
     * Delete a quiz by its ID.
     */
    public void deleteQuiz(Long quizId) {
        if (!quizRepository.existsById(quizId)) {
            throw new RuntimeException("Quiz not found with id: " + quizId);
        }
        quizRepository.deleteById(quizId);
    }
}
