package com.miniprojects.learnandassessportal.service;

import com.miniprojects.learnandassessportal.model.Question;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for parsing quiz questions from uploaded PDF or DOCX files.
 *
 * Expected file format (one of these patterns per question):
 *
 * Pattern 1 (numbered):
 *   1. What is Java?
 *   A) A programming language
 *   B) A coffee brand
 *   C) An operating system
 *   D) A database
 *   Answer: A
 *
 * Pattern 2 (Q prefix):
 *   Q1: What is Java?
 *   A. A programming language
 *   B. A coffee brand
 *   C. An operating system
 *   D. A database
 *   Answer: A
 *
 * Pattern 3 (Q prefix with parentheses options):
 *   Q: What is Java?
 *   (A) A programming language
 *   (B) A coffee brand
 *   (C) An operating system
 *   (D) A database
 *   Correct Answer: A
 */
@Service
public class QuizUploadService {

    @Value("${quiz.upload.max-size-mb:50}")
    private int maxUploadSizeMb;

    private static final List<String> SUPPORTED_EXTENSIONS = List.of("pdf", "docx");

    /**
     * Validates the uploaded file: checks extension, emptiness, and size.
     */
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null) {
            throw new IllegalArgumentException("File name is missing.");
        }

        String ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException(
                    "Unsupported file type: ." + ext + ". Only PDF and DOCX files are supported.");
        }

        long maxBytes = (long) maxUploadSizeMb * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException(
                    String.format("File size (%.1f MB) exceeds the maximum allowed limit of %d MB.",
                            file.getSize() / (1024.0 * 1024.0), maxUploadSizeMb));
        }
    }

    /**
     * Extracts text content from the uploaded file (PDF or DOCX).
     */
    public String extractText(MultipartFile file) throws Exception {
        String originalName = file.getOriginalFilename();
        if (originalName == null) throw new IllegalArgumentException("File name is missing.");

        String lowerName = originalName.toLowerCase();

        if (lowerName.endsWith(".pdf")) {
            return extractFromPdf(file.getInputStream());
        } else if (lowerName.endsWith(".docx")) {
            return extractFromDocx(file.getInputStream());
        } else {
            throw new IllegalArgumentException("Unsupported file type. Only PDF and DOCX are supported.");
        }
    }

    private String extractFromPdf(InputStream inputStream) throws Exception {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractFromDocx(InputStream inputStream) throws Exception {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder text = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                text.append(paragraph.getText()).append("\n");
            }
            return text.toString();
        }
    }

    /**
     * Parses the extracted text into a list of Question objects.
     * Supports multiple common quiz file formats.
     */
    public List<Question> parseQuestions(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("The uploaded file contains no readable text content.");
        }

        List<Question> questions = new ArrayList<>();

        // Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n");

        // Split text into question blocks.
        // A question block starts with a question pattern.
        // Question patterns:
        //   - 1. question text  OR  1) question text
        //   - Q1: question text  OR  Q1. question text
        //   - Q: question text
        //   - Question 1: question text
        Pattern questionStartPattern = Pattern.compile(
                "(?m)^\\s*(?:(?:Q(?:uestion)?\\s*\\d*\\s*[:.)])|(?:\\d+\\s*[.)]))\\s*",
                Pattern.CASE_INSENSITIVE
        );

        // Split into blocks by finding question starts
        Matcher startMatcher = questionStartPattern.matcher(text);
        List<Integer> questionStarts = new ArrayList<>();
        while (startMatcher.find()) {
            questionStarts.add(startMatcher.start());
        }

        if (questionStarts.isEmpty()) {
            // Try alternate parsing: look for answer patterns to detect question blocks
            return parseQuestionsFallback(text);
        }

        for (int i = 0; i < questionStarts.size(); i++) {
            int blockStart = questionStarts.get(i);
            int blockEnd = (i + 1 < questionStarts.size()) ? questionStarts.get(i + 1) : text.length();
            String block = text.substring(blockStart, blockEnd).trim();

            Question q = parseQuestionBlock(block);
            if (q != null) {
                questions.add(q);
            }
        }

        if (questions.isEmpty()) {
            throw new IllegalArgumentException(
                    "Could not parse any valid questions from the file. " +
                    "Please ensure questions follow the expected format: " +
                    "numbered question, options A-D, and an answer line (e.g., 'Answer: A').");
        }

        return questions;
    }

    /**
     * Parses a single question block into a Question object.
     */
    private Question parseQuestionBlock(String block) {
        // Extract question text (everything before the first option)
        Pattern optionPattern = Pattern.compile(
                "(?m)^\\s*(?:\\(?([A-Da-d])\\)?[.):\\s]|([A-Da-d])\\s*[.):]\\s*)(.+)",
                Pattern.CASE_INSENSITIVE
        );

        // Find first option to split question text from options
        Matcher firstOptionMatcher = optionPattern.matcher(block);
        if (!firstOptionMatcher.find()) {
            return null; // No options found
        }

        // Question text is everything before the first option
        String questionText = block.substring(0, firstOptionMatcher.start()).trim();
        // Remove the question number prefix
        questionText = questionText.replaceFirst(
                "^\\s*(?:Q(?:uestion)?\\s*\\d*\\s*[:.)]|\\d+\\s*[.)])\\s*", "").trim();

        if (questionText.isEmpty()) {
            return null;
        }

        // Extract all options
        String optionA = null, optionB = null, optionC = null, optionD = null;
        Matcher optMatcher = optionPattern.matcher(block);
        while (optMatcher.find()) {
            String optionLetter = (optMatcher.group(1) != null ? optMatcher.group(1) : optMatcher.group(2))
                    .toUpperCase();
            String optionText = optMatcher.group(3).trim();

            switch (optionLetter) {
                case "A" -> optionA = optionText;
                case "B" -> optionB = optionText;
                case "C" -> optionC = optionText;
                case "D" -> optionD = optionText;
            }
        }

        // Must have at least options A and B
        if (optionA == null || optionB == null) {
            return null;
        }

        // Extract the correct answer
        Pattern answerPattern = Pattern.compile(
                "(?mi)^\\s*(?:correct\\s+)?answer\\s*[:\\-=]\\s*(?:\\(?([A-Da-d])\\)?|option\\s+([A-Da-d]))",
                Pattern.CASE_INSENSITIVE
        );
        Matcher answerMatcher = answerPattern.matcher(block);
        String correctOption = null;
        if (answerMatcher.find()) {
            correctOption = (answerMatcher.group(1) != null ? answerMatcher.group(1) : answerMatcher.group(2))
                    .toUpperCase();
        }

        if (correctOption == null) {
            // Try to find answer marked with asterisk (*) or bold
            Pattern asteriskPattern = Pattern.compile(
                    "(?m)^\\s*(?:\\(?([A-Da-d])\\)?[.):\\s])\\s*\\*(.+?)\\*?$",
                    Pattern.CASE_INSENSITIVE
            );
            Matcher asteriskMatcher = asteriskPattern.matcher(block);
            if (asteriskMatcher.find()) {
                correctOption = asteriskMatcher.group(1).toUpperCase();
            }
        }

        if (correctOption == null) {
            return null; // Can't determine correct answer
        }

        // Clean up option text — remove trailing "Answer: X" lines from D option
        if (optionD != null) {
            optionD = optionD.replaceAll("(?i)\\s*(?:correct\\s+)?answer\\s*[:\\-=].*$", "").trim();
        }

        Question question = new Question();
        question.setQuestionText(questionText);
        question.setOptionA(optionA);
        question.setOptionB(optionB);
        question.setOptionC(optionC != null ? optionC : "");
        question.setOptionD(optionD != null ? optionD : "");
        question.setCorrectOption(correctOption);

        return question;
    }

    /**
     * Fallback parser for files that don't follow the standard numbering.
     * Looks for blocks separated by blank lines that contain options and answers.
     */
    private List<Question> parseQuestionsFallback(String text) {
        List<Question> questions = new ArrayList<>();

        // Split on double newlines (blank lines between question blocks)
        String[] blocks = text.split("\\n\\s*\\n");

        for (String block : blocks) {
            block = block.trim();
            if (block.isEmpty()) continue;

            // Check if this block has option patterns
            Pattern optionCheck = Pattern.compile(
                    "(?m)^\\s*(?:\\(?[A-Da-d]\\)?[.):\\s]|[A-Da-d]\\s*[.):])\\s*",
                    Pattern.CASE_INSENSITIVE
            );
            if (optionCheck.matcher(block).find()) {
                Question q = parseQuestionBlock(block);
                if (q != null) {
                    questions.add(q);
                }
            }
        }

        if (questions.isEmpty()) {
            throw new IllegalArgumentException(
                    "Could not parse any valid questions from the file. " +
                    "Expected format: question text, followed by options A-D, " +
                    "and a line like 'Answer: A'. Questions should be separated by blank lines.");
        }

        return questions;
    }

    /**
     * Full pipeline: validate file, extract text, and parse into questions.
     */
    public List<Question> processUploadedFile(MultipartFile file) {
        validateFile(file);
        try {
            String text = extractText(file);
            return parseQuestions(text);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process uploaded file: " + e.getMessage(), e);
        }
    }
}
