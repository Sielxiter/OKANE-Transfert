package com.okane.cash.repository;

import com.okane.cash.entity.AgentCashSession;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentCashSessionRepository extends JpaRepository<AgentCashSession, Long> {
    Optional<AgentCashSession> findFirstByAgent_IdAndSessionDateAndClosedAtIsNullOrderByOpenedAtDesc(
            Long agentId,
            LocalDate sessionDate
    );
}
