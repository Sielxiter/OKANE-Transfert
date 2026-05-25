package com.okane.cash.repository;

import com.okane.cash.entity.AgentCashSession;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentCashSessionRepository extends JpaRepository<AgentCashSession, Long> {
    Optional<AgentCashSession> findByAgent_IdAndSessionDate(Long agentId, LocalDate sessionDate);

    Optional<AgentCashSession> findFirstByAgent_IdAndSessionDateOrderByOpenedAtDesc(Long agentId, LocalDate sessionDate);

    Optional<AgentCashSession> findFirstByAgent_IdAndSessionDateAndStatusIgnoreCaseOrderByOpenedAtDesc(
            Long agentId,
            LocalDate sessionDate,
            String status
    );
}
