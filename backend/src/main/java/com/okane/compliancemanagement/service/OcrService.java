package com.okane.compliancemanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Calls OCR.Space free API to extract text from identity document images.
 * Parses the raw OCR text to extract structured fields (CIN number, name, nationality).
 */
@Service
public class OcrService {

    private static final Pattern CIN_PATTERN = Pattern.compile("\\b([A-Z]{1,2}\\d{4,8})\\b");
    private static final Pattern PASSPORT_PATTERN = Pattern.compile("\\b([A-Z]{1,3}\\d{5,9})\\b");
    private static final String[] NATIONALITY_KEYWORDS = {
            "MAROCAINE", "MOROCCAN", "MAROC", "MOROCCO",
            "SENEGALAISE", "SENEGALAIS", "SENEGAL",
            "FRANCAISE", "FRANCAIS", "FRANCE",
            "IVOIRIENNE", "IVOIRIEN", "COTE D'IVOIRE",
    };

    @Value("${app.ocr.api-key}")
    private String apiKey;

    @Value("${app.ocr.api-url}")
    private String apiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Send an image (as base64) to OCR.Space and return parsed results.
     *
     * @param imageBase64 the image encoded as base64 (without data URI prefix)
     * @param documentType CIN or PASSEPORT
     * @return map with keys: rawText, nom, prenom, numeroPiece, nationalite, confidence
     */
    public Map<String, Object> extractFromImage(String imageBase64, String documentType) {
        Map<String, Object> result = new HashMap<>();
        result.put("rawText", "");
        result.put("nom", "");
        result.put("prenom", "");
        result.put("numeroPiece", "");
        result.put("nationalite", "");
        result.put("confidence", 0.0);

        try {
            String rawText = callOcrSpace(imageBase64);
            result.put("rawText", rawText);

            if (rawText != null && !rawText.isBlank()) {
                parseOcrText(rawText, documentType, result);
            }
        } catch (Exception e) {
            result.put("error", "Service OCR indisponible : " + e.getMessage());
        }

        return result;
    }

    private String callOcrSpace(String imageBase64) throws IOException, InterruptedException {
        // OCR.Space accepts base64 with data URI prefix
        String base64WithPrefix = "data:image/png;base64," + imageBase64;

        String boundary = "----OkaneOcrBoundary" + System.currentTimeMillis();
        String body = "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"apikey\"\r\n\r\n"
                + apiKey + "\r\n"
                + "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"base64Image\"\r\n\r\n"
                + base64WithPrefix + "\r\n"
                + "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"language\"\r\n\r\n"
                + "fre\r\n"
                + "--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"isOverlayRequired\"\r\n\r\n"
                + "false\r\n"
                + "--" + boundary + "--\r\n";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IOException("OCR.Space returned HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode results = root.path("ParsedResults");
        if (results.isArray() && !results.isEmpty()) {
            return results.get(0).path("ParsedText").asText("");
        }
        return "";
    }

    private void parseOcrText(String rawText, String documentType, Map<String, Object> result) {
        // Normalize text
        String normalized = rawText.toUpperCase()
                .replaceAll("\\s+", " ")
                .trim();

        // Extract document number
        String numeroPiece = "";
        if ("CIN".equalsIgnoreCase(documentType)) {
            Matcher m = CIN_PATTERN.matcher(normalized);
            if (m.find()) numeroPiece = m.group(1);
        } else {
            Matcher m = PASSPORT_PATTERN.matcher(normalized);
            if (m.find()) numeroPiece = m.group(1);
        }
        result.put("numeroPiece", numeroPiece);

        // Extract nationality
        String nationalite = "";
        for (String keyword : NATIONALITY_KEYWORDS) {
            if (normalized.contains(keyword)) {
                nationalite = mapNationality(keyword);
                break;
            }
        }
        result.put("nationalite", nationalite);

        // Try to extract name from lines (heuristic: look for NOM/PRENOM labels)
        String[] lines = rawText.split("\\n");
        for (String line : lines) {
            String upper = line.toUpperCase().trim();
            if (upper.startsWith("NOM") && upper.contains(":")) {
                String val = line.substring(line.indexOf(':') + 1).trim();
                if (!val.isBlank()) result.put("nom", val);
            } else if (upper.startsWith("PRENOM") && upper.contains(":")) {
                String val = line.substring(line.indexOf(':') + 1).trim();
                if (!val.isBlank()) result.put("prenom", val);
            } else if ((upper.startsWith("PRÉNOM") || upper.startsWith("PRENOM")) && upper.contains(":")) {
                String val = line.substring(line.indexOf(':') + 1).trim();
                if (!val.isBlank()) result.put("prenom", val);
            }
        }

        // Confidence: based on how many fields were extracted
        int found = 0;
        if (!numeroPiece.isBlank()) found++;
        if (!nationalite.isBlank()) found++;
        if (!((String) result.get("nom")).isBlank()) found++;
        if (!((String) result.get("prenom")).isBlank()) found++;
        result.put("confidence", found / 4.0);
    }

    private String mapNationality(String keyword) {
        if (keyword.contains("MAROC")) return "Marocaine";
        if (keyword.contains("SENEGAL")) return "Sénégalaise";
        if (keyword.contains("FRANC")) return "Française";
        if (keyword.contains("IVOIR")) return "Ivoirienne";
        return keyword;
    }
}
