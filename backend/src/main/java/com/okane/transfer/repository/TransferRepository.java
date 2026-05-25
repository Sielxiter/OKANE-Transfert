package com.okane.transfer.repository;

import com.okane.transfer.entity.Transfer;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferRepository extends JpaRepository<Transfer, Long> {
    boolean existsByReferenceCode(String referenceCode);

    boolean existsByWithdrawalCode(String withdrawalCode);

    List<Transfer> findBySourceAgency_IdOrderByCreatedAtDesc(Long agencyId);

    List<Transfer> findTop4BySourceAgency_IdOrderByCreatedAtDesc(Long agencyId);

    Optional<Transfer> findFirstBySourceAgency_IdAndReferenceCodeIgnoreCase(Long agencyId, String referenceCode);

    Optional<Transfer> findFirstBySourceAgency_IdAndWithdrawalCodeIgnoreCase(Long agencyId, String withdrawalCode);

    Optional<Transfer> findFirstBySourceAgency_IdAndBeneficiary_User_Phone(Long agencyId, String phone);

    Optional<Transfer> findFirstBySourceAgency_IdAndBeneficiaryPhone(Long agencyId, String beneficiaryPhone);

    long countBySourceAgency_IdAndStatus(Long agencyId, String status);

    long countBySourceAgency_IdAndStatusIn(Long agencyId, Collection<String> statuses);

    long countBySourceAgency_IdAndCreatedAtBetween(Long agencyId, LocalDateTime start, LocalDateTime end);
}
