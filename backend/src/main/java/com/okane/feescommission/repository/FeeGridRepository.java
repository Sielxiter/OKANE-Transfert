package com.okane.feescommission.repository;

import com.okane.feescommission.entity.FeeGrid;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FeeGridRepository extends JpaRepository<FeeGrid, Long>, JpaSpecificationExecutor<FeeGrid> {
    Optional<FeeGrid> findByName(String name);

    List<FeeGrid> findAllByOrderByCreatedAtDesc();

    long countByActive(boolean active);
}
