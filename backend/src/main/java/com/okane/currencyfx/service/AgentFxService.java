package com.okane.currencyfx.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.currencyfx.dto.AgentFxContextResponse;
import com.okane.currencyfx.dto.CorridorDestinationResponse;
import com.okane.currencyfx.dto.ExchangeRateResponse;
import com.okane.currencyfx.entity.Country;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.entity.ExchangeRate;
import com.okane.currencyfx.entity.TransferCorridor;
import com.okane.currencyfx.repository.CountryRepository;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.ExchangeRateRepository;
import com.okane.currencyfx.repository.TransferCorridorRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgentFxService {

    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final CountryRepository countryRepository;
    private final CurrencyRepository currencyRepository;
    private final TransferCorridorRepository corridorRepository;
    private final ExchangeRateRepository exchangeRateRepository;

    public AgentFxService(
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository,
            CountryRepository countryRepository,
            CurrencyRepository currencyRepository,
            TransferCorridorRepository corridorRepository,
            ExchangeRateRepository exchangeRateRepository
    ) {
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.countryRepository = countryRepository;
        this.currencyRepository = currencyRepository;
        this.corridorRepository = corridorRepository;
        this.exchangeRateRepository = exchangeRateRepository;
    }

    @Transactional(readOnly = true)
    public AgentFxContextResponse getContext(Authentication authentication) {
        Agency agency = resolveAgency(authentication);
        String agencyCountryName = normalizeValue(agency.getCountry());
        if (agencyCountryName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Pays source introuvable pour l'agence.");
        }
        Country country = countryRepository.findByNameIgnoreCase(agencyCountryName)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pays source introuvable pour l'agence."));
        Currency currency = country.getCurrency();
        if (currency == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Devise source introuvable pour l'agence.");
        }
        return new AgentFxContextResponse(
                country.getCode(),
                country.getName(),
                currency.getCode()
        );
    }

    @Transactional(readOnly = true)
    public List<CorridorDestinationResponse> getDestinations(Authentication authentication) {
        Country sourceCountry = resolveSourceCountry(authentication);
        List<TransferCorridor> corridors = corridorRepository.findBySourceCountry_IdAndActiveTrue(sourceCountry.getId());
        return corridors.stream()
            .map(TransferCorridor::getDestinationCountry)
            .filter(destination -> destination != null && Boolean.TRUE.equals(destination.getActive()))
            .collect(Collectors.toMap(
                Country::getId,
                destination -> destination,
                (left, right) -> left
            ))
            .values()
            .stream()
            .sorted(Comparator.comparing(Country::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(destination -> new CorridorDestinationResponse(
                destination.getCode(),
                destination.getName(),
                destination.getCurrency() != null ? destination.getCurrency().getCode() : null
            ))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExchangeRateResponse getExchangeRate(String fromCurrencyCode, String toCurrencyCode) {
        Currency from = resolveCurrency(fromCurrencyCode, "Devise source inconnue.");
        Currency to = resolveCurrency(toCurrencyCode, "Devise destination inconnue.");

        if (from.getId().equals(to.getId())) {
            return new ExchangeRateResponse(from.getCode(), to.getCode(), BigDecimal.ONE.setScale(6, RoundingMode.HALF_UP));
        }

        Optional<ExchangeRate> direct = exchangeRateRepository
                .findTopByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDesc(from.getId(), to.getId())
                .filter(rate -> rate.getRate() != null && rate.getRate().compareTo(BigDecimal.ZERO) > 0);
        if (direct.isPresent()) {
            return new ExchangeRateResponse(from.getCode(), to.getCode(), normalizeRate(direct.get().getRate()));
        }

        Optional<ExchangeRate> inverse = exchangeRateRepository
                .findTopByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDesc(to.getId(), from.getId())
                .filter(rate -> rate.getRate() != null && rate.getRate().compareTo(BigDecimal.ZERO) > 0);
        if (inverse.isPresent()) {
            BigDecimal inverted = BigDecimal.ONE.divide(inverse.get().getRate(), 8, RoundingMode.HALF_UP);
            return new ExchangeRateResponse(from.getCode(), to.getCode(), normalizeRate(inverted));
        }

        throw new ApiException(HttpStatus.NOT_FOUND, "Aucun taux de change actif pour ce corridor.");
    }

    private Country resolveSourceCountry(Authentication authentication) {
        Agency agency = resolveAgency(authentication);
        String agencyCountryName = normalizeValue(agency.getCountry());
        if (agencyCountryName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Pays source introuvable pour l'agence.");
        }
        return countryRepository.findByNameIgnoreCase(agencyCountryName)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pays source introuvable pour l'agence."));
    }

    private Agency resolveAgency(Authentication authentication) {
        User user = resolveUser(authentication);
        AgencyUser agencyUser = agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Agent non affecte a une agence."));
        if (agencyUser.getAgency() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Agence introuvable.");
        }
        return agencyUser.getAgency();
    }

    private Currency resolveCurrency(String code, String message) {
        String normalized = normalizeValue(code).toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return currencyRepository.findByCode(normalized)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, message));
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof OkaneUserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = principal.getUser();
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }

    private BigDecimal normalizeRate(BigDecimal rate) {
        return rate.setScale(6, RoundingMode.HALF_UP);
    }

    private String normalizeValue(String value) {
        return value == null ? "" : value.trim();
    }
}
