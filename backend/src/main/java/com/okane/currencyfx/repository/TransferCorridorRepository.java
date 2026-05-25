package com.okane.currencyfx.repository;

import com.okane.currencyfx.entity.TransferCorridor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferCorridorRepository extends JpaRepository<TransferCorridor, Long> {
    Optional<TransferCorridor> findBySourceCountry_IdAndDestinationCountry_Id(Long sourceCountryId, Long destinationCountryId);

    List<TransferCorridor> findBySourceCountry_IdAndActiveTrue(Long sourceCountryId);
}
