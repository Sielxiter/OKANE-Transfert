package com.okane.chatbot.controller;

import com.okane.chatbot.dto.ChatbotConversationDTO;
import com.okane.chatbot.dto.ChatbotSendMessageRequestDTO;
import com.okane.chatbot.service.ClientChatbotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/client/chatbot")
@PreAuthorize("hasRole('CLIENT')")
public class ClientChatbotController {

    private final ClientChatbotService chatbotService;

    public ClientChatbotController(ClientChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @GetMapping("/session")
    public ResponseEntity<ChatbotConversationDTO> session(
            Authentication authentication,
            @RequestParam(required = false) String language
    ) {
        return ResponseEntity.ok(chatbotService.getConversation(authentication, language));
    }

    @PostMapping("/messages")
    public ResponseEntity<ChatbotConversationDTO> sendMessage(
            Authentication authentication,
            @Valid @RequestBody ChatbotSendMessageRequestDTO request
    ) {
        return ResponseEntity.ok(chatbotService.sendMessage(authentication, request));
    }
}
