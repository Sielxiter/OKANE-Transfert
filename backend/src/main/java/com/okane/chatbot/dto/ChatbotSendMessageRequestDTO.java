package com.okane.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatbotSendMessageRequestDTO(
        @NotBlank @Size(max = 1000) String message,
        String language
) {
}
