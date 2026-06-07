package com.okane.compliancemanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Calls OpenSanctions API to screen individuals against sanctions/watchlists.
 * Returns risk level (LOW/MEDIUM/HIGH) based on match score.
 */
@Service
public class AmlScreeningService {

    @Value("${app.aml.api-url}")
    private String apiUrl;

    @Value("${app.aml.api-key:}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Screen a person against OpenSanctions.
     *
     * @param firstName first name
     * @param lastName last name
     * @param nationality nationality (optional)
     * @return map with: riskLevel, matchScore, matchedEntityName, source, matched (boolean)
     */
    public Map<String, Object> screenPerson(String firstName, String lastName, String nationality) {
        Map<String, Object> result = new HashMap<>();
        result.put("riskLevel", "LOW");
        result.put("matchScore", 0.0);
        result.put("matchedEntityName", "");
        result.put("source", "");
        result.put("matched", false);

        try {
            callOpenSanctions(firstName, lastName, nationality, result);
        } catch (Exception e) {
            // If API fails, default to LOW risk but flag the error
            result.put("error", "Service AML indisponible : " + e.getMessage());
            result.put("riskLevel", "LOW");
        }

        return result;
    }

    private void callOpenSanctions(String firstName, String lastName, String nationality,
                                    Map<String, Object> result) throws IOException, InterruptedException {
        // Build the request body for OpenSanctions match API
        ObjectNode body = objectMapper.createObjectNode();
        ObjectNode schema = body.putObject("schema");
        schema.put("type", "Person");

        ObjectNode properties = body.putObject("properties");
        properties.putArray("name").add(firstName + " " + lastName);
        if (nationality != null && !nationality.isBlank()) {
            properties.putArray("nationality").add(nationality);
        }

        String jsonBody = objectMapper.writeValueAsString(body);

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

        // Add API key if configured
        if (apiKey != null && !apiKey.isBlank()) {
            requestBuilder.header("Authorization", "ApiKey " + apiKey);
        }

        HttpResponse<String> response = httpClient.send(
                requestBuilder.build(),
                HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new IOException("OpenSanctions returned HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode responses = root.path("responses");
        // OpenSanctions returns a "responses" object or "results" array depending on endpoint
        JsonNode results = root.path("results");
        if (!results.isArray()) {
            results = root.path("responses");
        }

        if (results.isArray() && !results.isEmpty()) {
            JsonNode topMatch = results.get(0);
            double score = topMatch.path("score").asDouble(0.0);
            String matchedName = topMatch.path("caption").asText(
                    topMatch.path("name").asText(""));
            String dataset = topMatch.path("datasets").isArray() && !topMatch.path("datasets").isEmpty()
                    ? topMatch.path("datasets").get(0).asText("OpenSanctions")
                    : "OpenSanctions";

            result.put("matchScore", score);
            result.put("matchedEntityName", matchedName);
            result.put("source", dataset);

            // Risk level based on score
            if (score >= 0.8) {
                result.put("riskLevel", "HIGH");
                result.put("matched", true);
            } else if (score >= 0.5) {
                result.put("riskLevel", "MEDIUM");
                result.put("matched", true);
            } else {
                result.put("riskLevel", "LOW");
                result.put("matched", false);
            }
        }
    }
}
