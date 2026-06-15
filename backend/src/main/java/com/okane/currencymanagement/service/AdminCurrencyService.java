package com.okane.currencymanagement.service;

import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.currencyfx.entity.Country;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.entity.ExchangeRate;
import com.okane.currencyfx.entity.TransferCorridor;
import com.okane.currencyfx.repository.CountryRepository;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.ExchangeRateRepository;
import com.okane.currencyfx.repository.TransferCorridorRepository;
import com.okane.currencymanagement.domain.CorridorStatus;
import com.okane.currencymanagement.domain.CurrencyStatus;
import com.okane.currencymanagement.dto.ChangeCorridorStatusRequestDTO;
import com.okane.currencymanagement.dto.CorridorResponseDTO;
import com.okane.currencymanagement.dto.CreateCorridorRequestDTO;
import com.okane.currencymanagement.dto.CreateCurrencyRequestDTO;
import com.okane.currencymanagement.dto.CurrencyResponseDTO;
import com.okane.currencymanagement.dto.CurrencySummaryDTO;
import com.okane.currencymanagement.dto.ExchangeRateHistoryDTO;
import com.okane.currencymanagement.dto.UpdateCorridorRequestDTO;
import com.okane.currencymanagement.exception.CorridorAlreadyExistsException;
import com.okane.currencymanagement.exception.CorridorNotFoundException;
import com.okane.currencymanagement.exception.CurrencyAlreadyExistsException;
import com.okane.currencymanagement.exception.CurrencyNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCurrencyService {

    private static final String MAD_IDENTIFIER = "MAD";
    private static final BigDecimal SCALE_RATE = BigDecimal.ONE.setScale(6);
    private static final int FX_HISTORY_LIMIT = 25;

    private final CurrencyRepository currencyRepository;
    private final CountryRepository countryRepository;
    private final TransferCorridorRepository transferCorridorRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final UserRepository userRepository;
    private final CurrencyAuditService auditService;

    public AdminCurrencyService(
            CurrencyRepository currencyRepository,
            CountryRepository countryRepository,
            TransferCorridorRepository transferCorridorRepository,
            ExchangeRateRepository exchangeRateRepository,
            UserRepository userRepository,
            CurrencyAuditService auditService
    ) {
        this.currencyRepository = currencyRepository;
        this.countryRepository = countryRepository;
        this.transferCorridorRepository = transferCorridorRepository;
        this.exchangeRateRepository = exchangeRateRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public CurrencySummaryDTO getSummary() {
        long active = currencyRepository.countByActive(true);
        long suspended = currencyRepository.countByActive(false);
        long activeCorridors = transferCorridorRepository.countByActive(true);

        long ratesUpdatedToday = 0L;
        try {
            LocalDate today = LocalDate.now();
            ratesUpdatedToday = exchangeRateRepository.countByEffectiveAtBetween(
                    today.atStartOfDay(),
                    today.atTime(LocalTime.MAX)
            );
        } catch (RuntimeException ignored) {
            // safe fallback
        }

        LocalDateTime lastSync = exchangeRateRepository
                .findFirstByOrderByEffectiveAtDescIdDesc()
                .map(ExchangeRate::getEffectiveAt)
                .orElse(null);

        return new CurrencySummaryDTO(active, activeCorridors, ratesUpdatedToday, suspended, lastSync);
    }

    @Transactional
    public CurrencyResponseDTO createCurrency(CreateCurrencyRequestDTO request, Authentication authentication) {
        String identifier = normalizeIdentifier(request.symbol());
        if (identifier == null || identifier.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Currency symbol is required.");
        }
        if (currencyRepository.existsBySymbolIgnoreCase(identifier)) {
            throw new CurrencyAlreadyExistsException(identifier);
        }

        LocalDateTime now = LocalDateTime.now();
        Currency currency = new Currency();
        currency.setName(request.name().trim());
        currency.setSymbol(identifier);
        currency.setActive(request.status() == null || request.status() == CurrencyStatus.ACTIVE);
        currency.setCreatedAt(now);
        currency.setUpdatedAt(now);
        Currency saved = currencyRepository.save(currency);

        if (request.mainCountry() != null && !request.mainCountry().isBlank()) {
            ensureCountryFor(saved, request.mainCountry().trim(), now);
        }

        Currency mad = findMadCurrency();
        if (mad != null && !mad.getId().equals(saved.getId()) && request.rateToMad() != null) {
            ExchangeRate initialRate = new ExchangeRate();
            initialRate.setFromCurrency(saved);
            initialRate.setToCurrency(mad);
            initialRate.setRate(scaleSafe(request.rateToMad()));
            initialRate.setSource("ADMIN");
            initialRate.setEffectiveAt(now);
            initialRate.setCreatedBy(currentUserOrNull(authentication));
            exchangeRateRepository.save(initialRate);
        }

        auditService.logCurrencyCreated(currentUserOrNull(authentication), saved);
        return toResponse(saved, mad, buildPrimaryCountryMap().get(saved.getId()));
    }

    @Transactional(readOnly = true)
    public List<CurrencyResponseDTO> findAllCurrencies() {
        List<Currency> currencies = currencyRepository.findAllByOrderByNameAsc();
        Currency mad = findMadCurrency();
        Map<Long, Country> primaryCountryByCurrency = buildPrimaryCountryMap();

        List<CurrencyResponseDTO> responses = new ArrayList<>(currencies.size());
        for (Currency currency : currencies) {
            responses.add(toResponse(currency, mad, primaryCountryByCurrency.get(currency.getId())));
        }
        return responses;
    }

    @Transactional
    public CurrencyResponseDTO findCurrencyById(Long id, Authentication authentication) {
        Currency currency = currencyRepository.findById(id)
                .orElseThrow(() -> new CurrencyNotFoundException(id));
        auditService.logFxRateViewed(currentUserOrNull(authentication));

        return toResponse(currency, findMadCurrency(), buildPrimaryCountryMap().get(currency.getId()));
    }

    @Transactional
    public CurrencyResponseDTO changeStatus(Long id, CurrencyStatus status, Authentication authentication) {
        Currency currency = currencyRepository.findById(id)
                .orElseThrow(() -> new CurrencyNotFoundException(id));

        boolean shouldBeActive = status == CurrencyStatus.ACTIVE;
        if (Boolean.valueOf(shouldBeActive).equals(currency.getActive())) {
            return toResponse(currency, findMadCurrency(), buildPrimaryCountryMap().get(currency.getId()));
        }

        currency.setActive(shouldBeActive);
        currency.setUpdatedAt(LocalDateTime.now());
        Currency saved = currencyRepository.save(currency);

        auditService.logCurrencyStatusChanged(currentUserOrNull(authentication), saved, status.name());
        return toResponse(saved, findMadCurrency(), buildPrimaryCountryMap().get(saved.getId()));
    }

    @Transactional
    public List<ExchangeRateHistoryDTO> findHistoryForCurrency(Long id, Authentication authentication) {
        Currency currency = currencyRepository.findById(id)
                .orElseThrow(() -> new CurrencyNotFoundException(id));
        auditService.logCurrencyHistoryViewed(currentUserOrNull(authentication), currency);

        Currency mad = findMadCurrency();
        if (mad == null || mad.getId().equals(currency.getId())) {
            return List.of();
        }
        List<ExchangeRate> rates = exchangeRateRepository
                .findByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDescIdDesc(
                        currency.getId(),
                        mad.getId()
                );
        return projectHistory(rates);
    }

    @Transactional
    public List<CorridorResponseDTO> findAllCorridors(Authentication authentication) {
        List<TransferCorridor> corridors = transferCorridorRepository.findAllByOrderByIdAsc();
        auditService.logCorridorViewed(currentUserOrNull(authentication), null);

        List<CorridorResponseDTO> responses = new ArrayList<>(corridors.size());
        for (TransferCorridor corridor : corridors) {
            responses.add(toResponse(corridor));
        }
        return responses;
    }

    @Transactional
    public List<ExchangeRateHistoryDTO> findRateHistory(Authentication authentication) {
        auditService.logFxHistoryViewed(currentUserOrNull(authentication));
        List<ExchangeRate> rates = exchangeRateRepository
                .findAllByOrderByEffectiveAtDescIdDesc(PageRequest.of(0, FX_HISTORY_LIMIT));
        return projectHistory(rates);
    }

    @Transactional(readOnly = true)
    public CorridorResponseDTO findCorridorById(Long id, Authentication authentication) {
        TransferCorridor corridor = transferCorridorRepository.findById(id)
                .orElseThrow(() -> new CorridorNotFoundException(id));
        auditService.logCorridorViewed(currentUserOrNull(authentication), corridor.getId());
        return toResponse(corridor);
    }

    @Transactional
    public CorridorResponseDTO createCorridor(CreateCorridorRequestDTO request, Authentication authentication) {
        String srcCode = request.sourceCountryCode().trim().toUpperCase(Locale.ROOT);
        String dstCode = request.destinationCountryCode().trim().toUpperCase(Locale.ROOT);

        if (srcCode.equals(dstCode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Le pays source et le pays destination doivent être différents.");
        }

        Country source = countryRepository.findByCode(srcCode)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Pays source introuvable : " + srcCode
                ));
        Country destination = countryRepository.findByCode(dstCode)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Pays destination introuvable : " + dstCode
                ));

        transferCorridorRepository
                .findBySourceCountry_IdAndDestinationCountry_Id(source.getId(), destination.getId())
                .ifPresent(existing -> {
                    if (Boolean.TRUE.equals(existing.getActive())) {
                        throw new CorridorAlreadyExistsException(srcCode, dstCode);
                    }
                });

        LocalDateTime now = LocalDateTime.now();
        TransferCorridor corridor = new TransferCorridor();
        corridor.setSourceCountry(source);
        corridor.setDestinationCountry(destination);
        corridor.setActive(Boolean.TRUE.equals(request.active()));
        corridor.setEstimatedFees(scaleSafe(request.estimatedFees()));
        corridor.setCreatedAt(now);
        corridor.setUpdatedAt(now);
        TransferCorridor saved = transferCorridorRepository.save(corridor);

        auditService.logCorridorViewed(currentUserOrNull(authentication), saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public CorridorResponseDTO updateCorridor(Long id, UpdateCorridorRequestDTO request, Authentication authentication) {
        TransferCorridor corridor = transferCorridorRepository.findById(id)
                .orElseThrow(() -> new CorridorNotFoundException(id));
        corridor.setEstimatedFees(scaleSafe(request.estimatedFees()));
        corridor.setActive(Boolean.TRUE.equals(request.active()));
        corridor.setUpdatedAt(LocalDateTime.now());
        TransferCorridor saved = transferCorridorRepository.save(corridor);
        auditService.logCorridorViewed(currentUserOrNull(authentication), saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public CorridorResponseDTO changeCorridorStatus(
            Long id,
            ChangeCorridorStatusRequestDTO request,
            Authentication authentication
    ) {
        TransferCorridor corridor = transferCorridorRepository.findById(id)
                .orElseThrow(() -> new CorridorNotFoundException(id));
        corridor.setActive(request.status() == CorridorStatus.ACTIVE);
        corridor.setUpdatedAt(LocalDateTime.now());
        TransferCorridor saved = transferCorridorRepository.save(corridor);
        auditService.logCorridorViewed(currentUserOrNull(authentication), saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public CorridorResponseDTO disableCorridor(Long id, Authentication authentication) {
        TransferCorridor corridor = transferCorridorRepository.findById(id)
                .orElseThrow(() -> new CorridorNotFoundException(id));
        corridor.setActive(false);
        corridor.setUpdatedAt(LocalDateTime.now());
        TransferCorridor saved = transferCorridorRepository.save(corridor);
        auditService.logCorridorViewed(currentUserOrNull(authentication), saved.getId());
        return toResponse(saved);
    }

    private void ensureCountryFor(Currency currency, String countryName, LocalDateTime now) {
        for (Country country : countryRepository.findAll()) {
            if (countryName.equalsIgnoreCase(country.getName())) {
                return;
            }
        }

        String code = countryName.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT);
        if (code.length() < 2) {
            code = (code + "XX").substring(0, 2);
        } else if (code.length() > 5) {
            code = code.substring(0, 5);
        }

        String baseCode = code;
        int suffix = 1;
        while (countryRepository.findByCode(code).isPresent()) {
            code = baseCode + suffix++;
            if (code.length() > 10) {
                code = code.substring(0, 10);
            }
        }

        Country country = new Country();
        country.setCode(code);
        country.setName(countryName);
        country.setCurrency(currency);
        country.setActive(true);
        country.setCreatedAt(now);
        country.setUpdatedAt(now);
        countryRepository.save(country);
    }

    private List<ExchangeRateHistoryDTO> projectHistory(List<ExchangeRate> rates) {
        Map<String, ExchangeRate> latestPerPair = new HashMap<>();
        List<ExchangeRateHistoryDTO> result = new ArrayList<>();
        for (ExchangeRate rate : rates) {
            String pairKey = pairKey(rate);
            ExchangeRate newer = latestPerPair.get(pairKey);
            BigDecimal oldRate = rate.getRate();
            BigDecimal newRate = newer != null ? newer.getRate() : rate.getRate();
            String currencyIdentifier = currencyIdentifier(rate.getFromCurrency());
            String pair = currencyIdentifier(rate.getFromCurrency())
                    + " → "
                    + currencyIdentifier(rate.getToCurrency());
            result.add(new ExchangeRateHistoryDTO(
                    rate.getId(),
                    currencyIdentifier,
                    pair,
                    oldRate,
                    newRate,
                    rate.getEffectiveAt(),
                    actorLabel(rate.getCreatedBy())
            ));
            latestPerPair.put(pairKey, rate);
        }
        return result;
    }

    private CurrencyResponseDTO toResponse(Currency currency, Currency mad, Country mainCountry) {
        BigDecimal rate = computeRateToMad(currency, mad);
        LocalDateTime lastUpdate = resolveLastUpdate(currency, mad);

        return new CurrencyResponseDTO(
                currency.getId(),
                currency.getName(),
                currency.getSymbol(),
                mainCountry != null ? mainCountry.getName() : null,
                mainCountry != null ? mainCountry.getCode() : null,
                rate,
                Boolean.TRUE.equals(currency.getActive()) ? CurrencyStatus.ACTIVE : CurrencyStatus.SUSPENDED,
                lastUpdate
        );
    }

    private BigDecimal computeRateToMad(Currency currency, Currency mad) {
        if (currency == null || mad == null) {
            return null;
        }
        if (mad.getId().equals(currency.getId())) {
            return SCALE_RATE;
        }
        return exchangeRateRepository
                .findByFromCurrency_IdAndToCurrency_Id(currency.getId(), mad.getId())
                .map(ExchangeRate::getRate)
                .orElse(null);
    }

    private LocalDateTime resolveLastUpdate(Currency currency, Currency mad) {
        if (currency == null) {
            return null;
        }
        if (mad != null && !mad.getId().equals(currency.getId())) {
            LocalDateTime fxUpdate = exchangeRateRepository
                    .findByFromCurrency_IdAndToCurrency_Id(currency.getId(), mad.getId())
                    .map(ExchangeRate::getEffectiveAt)
                    .orElse(null);
            if (fxUpdate != null) {
                return fxUpdate;
            }
        }
        return currency.getUpdatedAt();
    }

    private CorridorResponseDTO toResponse(TransferCorridor corridor) {
        Country source = corridor.getSourceCountry();
        Country dest = corridor.getDestinationCountry();
        Currency sourceCurrency = source != null ? source.getCurrency() : null;
        Currency destCurrency = dest != null ? dest.getCurrency() : null;

        CorridorStatus status = Boolean.TRUE.equals(corridor.getActive())
                ? CorridorStatus.ACTIVE
                : CorridorStatus.DISABLED;

        return new CorridorResponseDTO(
                corridor.getId(),
                source != null ? source.getCode() : null,
                source != null ? source.getName() : null,
                dest != null ? dest.getCode() : null,
                dest != null ? dest.getName() : null,
                sourceCurrency != null ? sourceCurrency.getSymbol() : null,
                destCurrency != null ? destCurrency.getSymbol() : null,
                corridor.getEstimatedFees(),
                status
        );
    }

    private Map<Long, Country> buildPrimaryCountryMap() {
        Map<Long, Country> map = new HashMap<>();
        for (Country country : countryRepository.findAll()) {
            Currency currency = country.getCurrency();
            if (currency != null) {
                map.putIfAbsent(currency.getId(), country);
            }
        }
        return map;
    }

    private Currency findMadCurrency() {
        return currencyRepository.findBySymbolIgnoreCase(MAD_IDENTIFIER).orElse(null);
    }

    private String pairKey(ExchangeRate rate) {
        Long from = rate.getFromCurrency() != null ? rate.getFromCurrency().getId() : null;
        Long to = rate.getToCurrency() != null ? rate.getToCurrency().getId() : null;
        return from + "->" + to;
    }

    private String actorLabel(User user) {
        if (user == null) {
            return "Système";
        }
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String full = (first + " " + last).trim();
        if (!full.isEmpty()) {
            return full;
        }
        return user.getEmail() != null ? user.getEmail() : "Système";
    }

    private User currentUserOrNull(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof OkaneUserPrincipal principal) {
            User user = principal.getUser();
            if (user == null || user.getId() == null) {
                return null;
            }
            return userRepository.findById(user.getId()).orElse(null);
        }
        return null;
    }

    private BigDecimal scaleSafe(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.setScale(6, RoundingMode.HALF_UP);
    }

    private String normalizeIdentifier(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private String currencyIdentifier(Currency currency) {
        if (currency == null) {
            return "?";
        }
        if (currency.getSymbol() != null && !currency.getSymbol().isBlank()) {
            return currency.getSymbol();
        }
        return currency.getName() != null ? currency.getName() : "?";
    }
}
