package com.okane.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.okane.chatbot.entity.ChatbotMessage;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiChatbotClient {
    private static final Logger logger = LoggerFactory.getLogger(GeminiChatbotClient.class);

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-2.5-flash-lite}")
    private String model;

    @Value("${app.gemini.api-base:https://generativelanguage.googleapis.com/v1beta}")
    private String apiBase;

    @Value("${app.gemini.timeout-seconds:20}")
    private long timeoutSeconds;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiChatbotClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String generateReply(String language, List<ChatbotMessage> recentMessages, String userMessage, String faqContext) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallback();
        }

        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.set("systemInstruction", buildSystemInstruction(language, faqContext));
            root.set("generationConfig", buildGenerationConfig());
            root.set("contents", buildContents(recentMessages, userMessage));

            String endpoint = String.format("%s/models/%s:generateContent?key=%s", apiBase, model, encode(apiKey));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(root)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                logger.warn("Gemini returned HTTP {}: {}", response.statusCode(), response.body());
                return fallback();
            }

            return extractText(response.body());
        } catch (Exception ex) {
            logger.warn("Gemini chatbot call failed", ex);
            return fallback();
        }
    }

    private JsonNode buildSystemInstruction(String language, String faqContext) {
        String normalizedLanguage = normalizeLanguage(language);
        String prompt = switch (normalizedLanguage) {
            case "en" -> "You are the official Okane Transfer assistant. Reply only about the Okane Transfer platform. Refuse any out-of-scope question politely. Use concise, helpful English. Supported topics: transfers, fees, tracking, KYC/AML, client profile, notifications, account support. Use the FAQ context as priority when relevant.\n\nFAQ context:\n" + faqContext;
            case "ar" -> "أنت المساعد الرسمي لمنصة Okane Transfer. أجب فقط عن أسئلة منصة Okane Transfer. ارفض بلطف أي سؤال خارج النطاق. استخدم لغة واضحة ومختصرة ومفيدة. المواضيع المسموح بها: التحويلات، الرسوم، التتبع، KYC/AML، الملف الشخصي، الإشعارات، ودعم الحساب. استخدم سياق الأسئلة الشائعة كمرجع أولاً عند اللزوم.\n\nسياق الأسئلة الشائعة:\n" + faqContext;
            default -> "Tu es l'assistant officiel d'Okane Transfer. Réponds uniquement sur la plateforme Okane Transfer. Refuse poliment toute question hors périmètre. Réponds en français, de manière concise et utile. Sujets autorisés: transferts, frais, suivi, KYC/AML, profil client, notifications, support du compte. Utilise d'abord le contexte FAQ si pertinent.\n\nContexte FAQ:\n" + faqContext;
        };

        ObjectNode node = objectMapper.createObjectNode();
        node.putArray("parts").addObject().put("text", prompt);
        return node;
    }

    private JsonNode buildGenerationConfig() {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("temperature", 0.2);
        node.put("maxOutputTokens", 512);
        node.put("topP", 0.95);
        return node;
    }

    private JsonNode buildContents(List<ChatbotMessage> recentMessages, String userMessage) {
        var contents = objectMapper.createArrayNode();
        int start = Math.max(0, recentMessages.size() - 10);
        for (ChatbotMessage message : recentMessages.subList(start, recentMessages.size())) {
            String sender = message.getSenderType() == null ? "USER" : message.getSenderType().toUpperCase();
            if (!"USER".equals(sender) && !"ASSISTANT".equals(sender) && !"BOT".equals(sender)) {
                continue;
            }

            var content = objectMapper.createObjectNode();
            content.put("role", "USER".equals(sender) ? "user" : "model");
            var parts = content.putArray("parts");
            parts.addObject().put("text", message.getMessage() == null ? "" : message.getMessage());
            contents.add(content);
        }

        var current = objectMapper.createObjectNode();
        current.put("role", "user");
        current.putArray("parts").addObject().put("text", userMessage);
        contents.add(current);
        return contents;
    }

    private String extractText(String body) throws IOException {
        JsonNode root = objectMapper.readTree(body);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray()) {
                StringBuilder builder = new StringBuilder();
                for (JsonNode part : parts) {
                    String text = part.path("text").asText("");
                    if (!text.isBlank()) {
                        if (!builder.isEmpty()) {
                            builder.append('\n');
                        }
                        builder.append(text.trim());
                    }
                }
                if (!builder.isEmpty()) {
                    return builder.toString().trim();
                }
            }
        }

        String fallback = root.path("text").asText("");
        if (!fallback.isBlank()) {
            return fallback.trim();
        }

        return fallback();
    }

    private String fallback() {
        return "Je rencontre un incident technique avec l'assistant automatique. Réessaie dans quelques instants ou consulte l'aide Okane Transfer.";
    }

    private String normalizeLanguage(String language) {
        if (language == null) {
            return "fr";
        }
        String normalized = language.trim().toLowerCase();
        return switch (normalized) {
            case "en", "ar" -> normalized;
            default -> "fr";
        };
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
