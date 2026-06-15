package com.okane.auth.repository;

import com.okane.audit.entity.AuditLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    // ── Existing methods ────────────────────────────────────────────────────────
    List<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByActionAndCreatedAtBetween(String action, LocalDateTime start, LocalDateTime end);

    List<AuditLog> findByEntityNameAndEntityIdOrderByCreatedAtDesc(String entityName, Long entityId);

    // ── Added for AdminAuditService ─────────────────────────────────────────────

    /** All logs ordered newest-first (no pagination). */
    List<AuditLog> findAllByOrderByCreatedAtDesc();

    /** Count logs by actor role. */
    long countByUserRole(String role);

    /** Count logs whose action contains a keyword (case-insensitive). */
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE LOWER(a.action) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    long countByActionContainingIgnoreCase(@Param("keyword") String keyword);

    /** Count logs whose entityName is in a given list. */
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.entityName IN :names")
    long countByEntityNameIn(@Param("names") List<String> names);

    List<AuditLog> findByUserRoleAndCreatedAtAfterOrderByCreatedAtDesc(String userRole, LocalDateTime after, Pageable pageable);

    List<AuditLog> findByUserRoleOrderByCreatedAtDesc(String userRole, Pageable pageable);
}
