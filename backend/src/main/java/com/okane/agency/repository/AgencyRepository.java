package com.okane.agency.repository;

import com.okane.agency.entity.Agency;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgencyRepository extends JpaRepository<Agency, Long> {
    Optional<Agency> findByCode(String code);

    boolean existsByCode(String code);
}
