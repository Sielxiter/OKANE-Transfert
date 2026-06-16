package com.okane.centralagency.repository;

import com.okane.agencymanagement.domain.AgencyStatus;
import com.okane.centralagency.entity.CentralAgency;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CentralAgencyRepository extends JpaRepository<CentralAgency, Long> {
    Optional<CentralAgency> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByEmailIgnoreCase(String email);

    Optional<CentralAgency> findByEmailIgnoreCase(String email);

    Optional<CentralAgency> findByManager_Id(Long managerId);

    List<CentralAgency> findAllByOrderByCreatedAtDesc();

    Optional<CentralAgency> findFirstByOrderByCreatedAtAsc();

    List<CentralAgency> findByStatusOrderByCreatedAtDesc(AgencyStatus status);

    long countByStatus(AgencyStatus status);

    long countByManager_Id(Long managerId);
}
