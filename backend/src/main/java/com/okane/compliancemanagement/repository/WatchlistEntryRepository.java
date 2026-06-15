package com.okane.compliancemanagement.repository;

import com.okane.compliance.entity.WatchlistEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistEntryRepository extends JpaRepository<WatchlistEntry, Long> {

    List<WatchlistEntry> findAllByOrderByCreatedAtDesc();

    long countByWatchlistStatus(String status);
}
