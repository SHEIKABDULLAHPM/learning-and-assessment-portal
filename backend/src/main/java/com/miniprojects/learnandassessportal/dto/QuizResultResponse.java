package com.miniprojects.learnandassessportal.dto;

import java.util.List;

public class QuizResultResponse {

    private int score;
    private int totalQuestions;
    private double percentage;
    private boolean passed;
    private List<QuestionResult> questionResults;

    public QuizResultResponse() {}

    public QuizResultResponse(int score, int totalQuestions, double percentage, boolean passed, List<QuestionResult> questionResults) {
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.percentage = percentage;
        this.passed = passed;
        this.questionResults = questionResults;
    }

    // --- Getters and Setters ---
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public List<QuestionResult> getQuestionResults() { return questionResults; }
    public void setQuestionResults(List<QuestionResult> questionResults) { this.questionResults = questionResults; }

    // --- Inner class for per-question results ---
    public static class QuestionResult {
        private Long questionId;
        private String questionText;
        private String selectedOption;
        private String correctOption;
        private boolean correct;

        public QuestionResult() {}

        public QuestionResult(Long questionId, String questionText, String selectedOption, String correctOption, boolean correct) {
            this.questionId = questionId;
            this.questionText = questionText;
            this.selectedOption = selectedOption;
            this.correctOption = correctOption;
            this.correct = correct;
        }

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }

        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }

        public String getSelectedOption() { return selectedOption; }
        public void setSelectedOption(String selectedOption) { this.selectedOption = selectedOption; }

        public String getCorrectOption() { return correctOption; }
        public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }

        public boolean isCorrect() { return correct; }
        public void setCorrect(boolean correct) { this.correct = correct; }
    }
}
