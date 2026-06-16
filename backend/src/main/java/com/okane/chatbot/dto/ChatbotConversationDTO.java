package com.okane.chatbot.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ChatbotConversationDTO(
        Long sessionId,
        String status,
        String language,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        List<ChatbotMessageDTO> messages,
        List<String> suggestedQuestions
) {
}
