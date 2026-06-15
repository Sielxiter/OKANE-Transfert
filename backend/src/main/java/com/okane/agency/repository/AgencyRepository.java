package com.okane.agency.repository;

import com.okane.agency.entity.Agency;
import com.okane.agencymanagement.domain.AgencyStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgencyRepository extends JpaRepository<Agency, Long> {
    Optional<Agency> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByEmailIgnoreCase(String email);

    Optional<Agency> findByEmailIgnoreCase(String email);

    List<Agency> findByStatusOrderByCreatedAtDesc(AgencyStatus status);

    List<Agency> findByCityIgnoreCaseOrderByCreatedAtDesc(String city);

    List<Agency> findByCountryIgnoreCaseOrderByCreatedAtDesc(String country);

    List<Agency> findAllByOrderByCreatedAtDesc();

    long countByStatus(AgencyStatus status);

    long countByCentralAgency_Id(Long centralAgencyId);

    List<Agency> findByCentralAgency_IdOrderByCreatedAtDesc(Long centralAgencyId);
}
