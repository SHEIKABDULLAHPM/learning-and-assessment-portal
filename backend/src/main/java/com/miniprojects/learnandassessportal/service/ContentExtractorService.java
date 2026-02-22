package com.miniprojects.learnandassessportal.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ContentExtractorService {

    @Value("${quiz.upload.max-size-mb:50}")
    private int maxUploadSizeMb;

    /**
     * Returns the configured max upload size in bytes.
     */
    public long getMaxUploadSizeBytes() {
        return (long) maxUploadSizeMb * 1024 * 1024;
    }

    public int getMaxUploadSizeMb() {
        return maxUploadSizeMb;
    }

    /**
     * Validates total size of uploaded files against the configured limit.
     * Throws IllegalArgumentException if exceeded.
     */
    public void validateFileSize(MultipartFile[] files) {
        long totalSize = 0;
        for (MultipartFile file : files) {
            totalSize += file.getSize();
        }
        if (totalSize > getMaxUploadSizeBytes()) {
            throw new IllegalArgumentException(
                    String.format("Total upload size (%.1f MB) exceeds the maximum allowed limit of %d MB.",
                            totalSize / (1024.0 * 1024.0), maxUploadSizeMb));
        }
    }

    /**
     * Extracts text content from multiple uploaded files.
     * Supports PDF, DOCX, PPTX, TXT, and other plain text formats.
     * Files are processed in-memory and never stored to disk.
     */
    public String extractTextFromFiles(MultipartFile[] files) {
        StringBuilder allText = new StringBuilder();
        List<String> errors = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String originalName = file.getOriginalFilename();
            if (originalName == null) originalName = "unknown";
            String lowerName = originalName.toLowerCase();

            try {
                String extracted;
                if (lowerName.endsWith(".pdf")) {
                    extracted = extractFromPdf(file.getInputStream());
                } else if (lowerName.endsWith(".docx")) {
                    extracted = extractFromDocx(file.getInputStream());
                } else if (lowerName.endsWith(".pptx")) {
                    extracted = extractFromPptx(file.getInputStream());
                } else if (lowerName.endsWith(".txt") || lowerName.endsWith(".md") ||
                           lowerName.endsWith(".csv") || lowerName.endsWith(".java") ||
                           lowerName.endsWith(".py") || lowerName.endsWith(".js") ||
                           lowerName.endsWith(".html") || lowerName.endsWith(".xml") ||
                           lowerName.endsWith(".json") || lowerName.endsWith(".log")) {
                    // Treat as plain text
                    extracted = new String(file.getBytes(), StandardCharsets.UTF_8);
                } else {
                    errors.add("Unsupported file type: " + originalName);
                    continue;
                }

                if (extracted != null && !extracted.isBlank()) {
                    allText.append("--- Content from: ").append(originalName).append(" ---\n");
                    allText.append(extracted).append("\n\n");
                }
            } catch (Exception e) {
                errors.add("Failed to process " + originalName + ": " + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            System.err.println("Content extraction warnings: " + String.join("; ", errors));
        }

        return allText.toString();
    }

    /**
     * Extracts text from a PDF input stream using PDFBox.
     */
    private String extractFromPdf(InputStream inputStream) throws Exception {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    /**
     * Extracts text from a DOCX input stream using Apache POI.
     */
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
     * Extracts text from a PPTX input stream using Apache POI.
     */
    private String extractFromPptx(InputStream inputStream) throws Exception {
        try (XMLSlideShow pptx = new XMLSlideShow(inputStream)) {
            StringBuilder text = new StringBuilder();
            for (XSLFSlide slide : pptx.getSlides()) {
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape textShape) {
                        text.append(textShape.getText()).append("\n");
                    }
                }
            }
            return text.toString();
        }
    }

    /**
     * Extracts the video ID from various YouTube URL formats.
     */
    private String extractYouTubeVideoId(String youtubeUrl) {
        // Patterns: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
        Pattern[] patterns = {
                Pattern.compile("(?:v=|/v/|youtu\\.be/|/embed/)([a-zA-Z0-9_-]{11})"),
        };
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(youtubeUrl);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    /**
     * Fetches the transcript/captions of a YouTube video.
     * Uses the YouTube transcript XML endpoint (auto-generated captions).
     * Returns null if no transcript is available.
     */
    public String extractYouTubeTranscript(String youtubeUrl) {
        String videoId = extractYouTubeVideoId(youtubeUrl);
        if (videoId == null) {
            throw new IllegalArgumentException(
                    "Invalid YouTube URL. Please provide a valid link (e.g., https://www.youtube.com/watch?v=xxxxx).");
        }

        try {
            String transcript = tryExtractTranscriptFromTrackList(videoId);
            if (transcript != null && !transcript.isBlank()) {
                return transcript;
            }

            transcript = tryExtractTranscriptFromPage(videoId);
            if (transcript != null && !transcript.isBlank()) {
                return transcript;
            }

            transcript = parseTranscriptXml(fetchUrlContent("https://video.google.com/timedtext?v=" + videoId + "&lang=en&kind=asr"));
            if (transcript != null && !transcript.isBlank()) {
                return transcript;
            }

            transcript = parseTranscriptXml(fetchUrlContent("https://video.google.com/timedtext?v=" + videoId + "&lang=en"));
            if (transcript != null && !transcript.isBlank()) {
                return transcript;
            }

            return null;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to extract YouTube transcript: " + e.getMessage() +
                    ". Make sure the video has captions/subtitles enabled. " +
                    "Alternatively, upload the learning material as a file instead.");
        }
    }

    private String tryExtractTranscriptFromTrackList(String videoId) {
        try {
            String trackListXml = fetchUrlContent("https://video.google.com/timedtext?type=list&v=" + videoId);
            Pattern trackPattern = Pattern.compile("<track\\s+([^>]+)/?>");
            Matcher trackMatcher = trackPattern.matcher(trackListXml);

            List<String> trackAttrs = new ArrayList<>();
            while (trackMatcher.find()) {
                trackAttrs.add(trackMatcher.group(1));
            }
            if (trackAttrs.isEmpty()) {
                return null;
            }

            String preferredTrack = pickPreferredTrack(trackAttrs);
            String captionUrl = buildTimedTextTrackUrl(videoId, preferredTrack);
            return parseTranscriptXml(fetchUrlContent(captionUrl));
        } catch (Exception e) {
            return null;
        }
    }

    private String pickPreferredTrack(List<String> trackAttrs) {
        for (String attrs : trackAttrs) {
            if ("en".equalsIgnoreCase(getXmlAttr(attrs, "lang_code"))) {
                return attrs;
            }
        }
        return trackAttrs.get(0);
    }

    private String buildTimedTextTrackUrl(String videoId, String trackAttrs) throws Exception {
        String langCode = getXmlAttr(trackAttrs, "lang_code");
        String name = getXmlAttr(trackAttrs, "name");
        String kind = getXmlAttr(trackAttrs, "kind");

        StringBuilder url = new StringBuilder("https://video.google.com/timedtext?v=" + videoId);
        if (langCode != null && !langCode.isBlank()) {
            url.append("&lang=").append(URLEncoder.encode(langCode, StandardCharsets.UTF_8));
        }
        if (name != null && !name.isBlank()) {
            url.append("&name=").append(URLEncoder.encode(name, StandardCharsets.UTF_8));
        }
        if (kind != null && !kind.isBlank()) {
            url.append("&kind=").append(URLEncoder.encode(kind, StandardCharsets.UTF_8));
        }
        return url.toString();
    }

    private String tryExtractTranscriptFromPage(String videoId) {
        try {
            String pageUrl = "https://www.youtube.com/watch?v=" + videoId;
            String pageHtml = fetchUrlContent(pageUrl);

            Pattern captionPattern = Pattern.compile("\"captionTracks\":\\[(.*?)\\]");
            Matcher matcher = captionPattern.matcher(pageHtml);
            if (!matcher.find()) {
                return null;
            }

            Pattern baseUrlPattern = Pattern.compile("\"baseUrl\":\"(.*?)\"");
            Matcher baseUrlMatcher = baseUrlPattern.matcher(matcher.group(1));
            if (!baseUrlMatcher.find()) {
                return null;
            }

            String captionUrl = baseUrlMatcher.group(1)
                    .replace("\\u0026", "&")
                    .replace("\\/", "/");
            return parseTranscriptXml(fetchUrlContent(captionUrl));
        } catch (Exception e) {
            return null;
        }
    }

    private String getXmlAttr(String attrs, String attrName) {
        Pattern p = Pattern.compile(attrName + "=\"([^\"]*)\"");
        Matcher m = p.matcher(attrs);
        return m.find() ? decodeHtmlEntities(m.group(1)) : null;
    }

    private String parseTranscriptXml(String captionsXml) {
        if (captionsXml == null || captionsXml.isBlank()) {
            return null;
        }

        StringBuilder transcript = new StringBuilder();
        Pattern textPattern = Pattern.compile("<text[^>]*>(.*?)</text>");
        Matcher textMatcher = textPattern.matcher(captionsXml);
        while (textMatcher.find()) {
            String line = decodeHtmlEntities(textMatcher.group(1))
                    .replaceAll("<[^>]+>", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (!line.isEmpty()) {
                transcript.append(line).append(" ");
            }
        }

        String result = transcript.toString().trim();
        return result.isEmpty() ? null : result;
    }

    private String decodeHtmlEntities(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        String decoded = text
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&apos;", "'")
                .replace("&nbsp;", " ");

        Pattern decimalEntityPattern = Pattern.compile("&#(\\d+);");
        Matcher decimalMatcher = decimalEntityPattern.matcher(decoded);
        StringBuffer sb = new StringBuffer();
        while (decimalMatcher.find()) {
            int codePoint = Integer.parseInt(decimalMatcher.group(1));
            decimalMatcher.appendReplacement(sb, Matcher.quoteReplacement(new String(Character.toChars(codePoint))));
        }
        decimalMatcher.appendTail(sb);
        decoded = sb.toString();

        Pattern hexEntityPattern = Pattern.compile("&#x([0-9a-fA-F]+);");
        Matcher hexMatcher = hexEntityPattern.matcher(decoded);
        sb = new StringBuffer();
        while (hexMatcher.find()) {
            int codePoint = Integer.parseInt(hexMatcher.group(1), 16);
            hexMatcher.appendReplacement(sb, Matcher.quoteReplacement(new String(Character.toChars(codePoint))));
        }
        hexMatcher.appendTail(sb);

        return sb.toString();
    }

    /**
     * Fetches content from a URL as a String.
     */
    private String fetchUrlContent(String urlString) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setInstanceFollowRedirects(true);
        conn.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        conn.setRequestProperty("Accept-Language", "en-US,en;q=0.9");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(15000);
        conn.connect();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder content = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
            return content.toString();
        } finally {
            conn.disconnect();
        }
    }
}
