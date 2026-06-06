package com.okane.feescommission.repository;

import com.okane.feescommission.entity.FeeGrid;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeGridRepository extends JpaRepository<FeeGrid, Long> {
    Optional<FeeGrid> findByName(String name);

    Optional<FeeGrid> findFirstByCorridor_IdAndActiveTrue(Long corridorId);

    Optional<FeeGrid> findFirstByActiveTrueOrderByCreatedAtDesc();
}
