package com.okane.chatbot.dto;

import java.time.LocalDateTime;

public record ChatbotMessageDTO(
        Long id,
        String senderType,
        String message,
        String detectedIntent,
        LocalDateTime createdAt
) {
}
