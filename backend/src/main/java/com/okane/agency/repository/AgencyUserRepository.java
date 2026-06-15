package com.okane.agency.repository;

import com.okane.agency.entity.AgencyUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgencyUserRepository extends JpaRepository<AgencyUser, Long> {
    Optional<AgencyUser> findFirstByUser_IdAndActiveTrue(Long userId);

    List<AgencyUser> findByAgency_IdAndActiveTrue(Long agencyId);

    Optional<AgencyUser> findFirstByAgency_IdAndUser_IdAndActiveTrue(Long agencyId, Long userId);

    Optional<AgencyUser> findFirstByAgency_IdAndUser_Role_NameAndActiveTrue(Long agencyId, String roleName);

    List<AgencyUser> findByAgency_IdAndUser_Role_NameAndActiveTrue(Long agencyId, String roleName);

    long countByAgency_IdAndUser_Role_NameAndActiveTrue(Long agencyId, String roleName);
}
