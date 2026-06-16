package com.okane.transfer.repository;

import com.okane.transfer.entity.Transfer;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransferRepository extends JpaRepository<Transfer, Long>, JpaSpecificationExecutor<Transfer> {
    Optional<Transfer> findByReferenceCode(String referenceCode);

    Optional<Transfer> findByWithdrawalCode(String withdrawalCode);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatus(String status);

    Page<Transfer> findBySourceAgency_IdIn(List<Long> agencyIds, Pageable pageable);

    long countByCreatedAtBetweenAndSourceAgency_IdIn(LocalDateTime start, LocalDateTime end, List<Long> agencyIds);

    long countBySourceAgency_IdInAndStatus(List<Long> agencyIds, String status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transfer t WHERE t.createdAt BETWEEN :start AND :end AND t.sourceAgency.id IN :agencyIds")
    BigDecimal sumAmountByCreatedAtBetweenAndSourceAgency_IdIn(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("agencyIds") List<Long> agencyIds);

    @Query("SELECT COALESCE(SUM(t.agencyCommissionAmount), 0) FROM Transfer t WHERE t.createdAt BETWEEN :start AND :end AND t.sourceAgency.id IN :agencyIds")
    BigDecimal sumAgencyCommissionByCreatedAtBetweenAndSourceAgency_IdIn(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("agencyIds") List<Long> agencyIds);

    // Simplified daily counts: query for each of the last 7 days individually
    @Query("SELECT COUNT(t) FROM Transfer t WHERE t.sourceAgency.id IN :agencyIds AND t.createdAt >= :dayStart AND t.createdAt < :dayEnd")
    long countBySourceAgency_IdInAndCreatedAtBetween(@Param("agencyIds") List<Long> agencyIds, @Param("dayStart") LocalDateTime dayStart, @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT COALESCE(SUM(t.agencyCommissionAmount), 0) FROM Transfer t WHERE t.sourceAgency.id IN :agencyIds AND t.createdAt >= :dayStart AND t.createdAt < :dayEnd")
    BigDecimal sumCommissionBySourceAgency_IdInAndCreatedAtBetween(@Param("agencyIds") List<Long> agencyIds, @Param("dayStart") LocalDateTime dayStart, @Param("dayEnd") LocalDateTime dayEnd);
    // ── Client portal methods ───────────────────────────────────────────────────
    long countBySender_User_Id(Long userId);

    long countBySender_User_IdAndStatus(Long userId, String status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transfer t WHERE t.sender.user.id = :userId")
    BigDecimal sumAmountBySender_User_Id(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(t.netAmount), 0) FROM Transfer t WHERE t.sender.user.id = :userId")
    BigDecimal sumNetAmountBySender_User_Id(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(t.feeAmount), 0) FROM Transfer t WHERE t.sender.user.id = :userId")
    BigDecimal sumFeeAmountBySender_User_Id(@Param("userId") Long userId);

    Optional<Transfer> findByReferenceCodeAndSender_User_Id(String referenceCode, Long userId);
}
