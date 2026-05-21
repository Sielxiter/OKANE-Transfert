package com.okane.agency.repository;

import com.okane.agency.entity.AgencyUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgencyUserRepository extends JpaRepository<AgencyUser, Long> {
    Optional<AgencyUser> findFirstByUser_IdAndActiveTrue(Long userId);

    List<AgencyUser> findByAgency_IdAndActiveTrue(Long agencyId);
}
