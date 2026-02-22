package com.miniprojects.learnandassessportal.dto;

import java.util.Map;

public class QuizSubmissionRequest {

    // Map of questionId -> selected option (e.g., "A", "B", "C", "D")
    private Map<Long, String> answers;

    public QuizSubmissionRequest() {}

    public QuizSubmissionRequest(Map<Long, String> answers) {
        this.answers = answers;
    }

    public Map<Long, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<Long, String> answers) {
        this.answers = answers;
    }
}
