package com.okane.cash.repository;

import com.okane.cash.entity.AgentCashSession;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentCashSessionRepository extends JpaRepository<AgentCashSession, Long> {
    List<AgentCashSession> findByAgency_IdInAndStatusAndSessionDate(List<Long> agencyIds, String status, LocalDate sessionDate);

    List<AgentCashSession> findByAgency_IdInAndStatus(List<Long> agencyIds, String status);

    long countByAgency_IdInAndStatusAndSessionDateBefore(List<Long> agencyIds, String status, LocalDate sessionDate);

    Optional<AgentCashSession> findFirstByAgent_IdAndSessionDateAndClosedAtIsNullOrderByOpenedAtDesc(
            Long agentId,
            LocalDate sessionDate
    );
}
