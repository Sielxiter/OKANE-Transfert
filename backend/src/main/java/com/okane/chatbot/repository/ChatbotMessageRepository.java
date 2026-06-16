package com.okane.chatbot.repository;

import com.okane.chatbot.entity.ChatbotMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatbotMessageRepository extends JpaRepository<ChatbotMessage, Long> {
    List<ChatbotMessage> findBySession_IdOrderByCreatedAtAsc(Long sessionId);
}
