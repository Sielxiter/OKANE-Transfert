package com.okane.currencyfx.repository;

import com.okane.currencyfx.entity.Country;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CountryRepository extends JpaRepository<Country, Long> {
    Optional<Country> findByCode(String code);

    Optional<Country> findByNameIgnoreCase(String name);
}
