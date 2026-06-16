package com.okane.chatbot.repository;

import com.okane.chatbot.entity.ChatbotSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatbotSessionRepository extends JpaRepository<ChatbotSession, Long> {
    Optional<ChatbotSession> findFirstByUser_IdAndStatusOrderByStartedAtDesc(Long userId, String status);
}
