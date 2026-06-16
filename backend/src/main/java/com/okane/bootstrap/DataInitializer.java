package com.okane.bootstrap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.centralagency.entity.CentralAgency;
import com.okane.centralagency.repository.CentralAgencyRepository;
import com.okane.auth.entity.Role;
import com.okane.auth.entity.User;
import com.okane.auth.repository.RoleRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.customer.entity.Customer;
import com.okane.customer.repository.CustomerRepository;
import com.okane.currencyfx.entity.Country;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.entity.ExchangeRate;
import com.okane.currencyfx.entity.TransferCorridor;
import com.okane.currencyfx.repository.CountryRepository;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.ExchangeRateRepository;
import com.okane.currencyfx.repository.TransferCorridorRepository;
import com.okane.feescommission.entity.CommissionRule;
import com.okane.feescommission.entity.FeeBracket;
import com.okane.feescommission.entity.FeeGrid;
import com.okane.feescommission.entity.TariffLine;
import com.okane.feescommission.repository.CommissionRuleRepository;
import com.okane.feescommission.repository.FeeBracketRepository;
import com.okane.feescommission.repository.FeeGridRepository;
import com.okane.feescommission.repository.TariffLineRepository;
import com.okane.feemanagement.domain.TariffValueType;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements ApplicationListener<ContextRefreshedEvent> {

    private static final AtomicBoolean INITIALIZED = new AtomicBoolean(false);
    private static final String COUNTRIES_JSON = "countries with currencies.json";
    private static final String COUNTRY_CODES_JSON = "CountryCodes.json";
    private static final Map<String, String> REQUIRED_CURRENCIES = Map.of(
            "MAD", "Morocco Dirham",
            "EUR", "Euro",
            "USD", "Dollar",
            "XOF", "C.F.A. Franc"
    );

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final CentralAgencyRepository centralAgencyRepository;
    private final CustomerRepository customerRepository;
    private final CurrencyRepository currencyRepository;
    private final CountryRepository countryRepository;
    private final TransferCorridorRepository transferCorridorRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final FeeGridRepository feeGridRepository;
    private final FeeBracketRepository feeBracketRepository;
    private final CommissionRuleRepository commissionRuleRepository;
    private final TariffLineRepository tariffLineRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public DataInitializer(
            RoleRepository roleRepository,
            UserRepository userRepository,
            AgencyRepository agencyRepository,
            AgencyUserRepository agencyUserRepository,
            CentralAgencyRepository centralAgencyRepository,
            CustomerRepository customerRepository,
            CurrencyRepository currencyRepository,
            CountryRepository countryRepository,
            TransferCorridorRepository transferCorridorRepository,
            ExchangeRateRepository exchangeRateRepository,
            FeeGridRepository feeGridRepository,
            FeeBracketRepository feeBracketRepository,
            CommissionRuleRepository commissionRuleRepository,
            TariffLineRepository tariffLineRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.centralAgencyRepository = centralAgencyRepository;
        this.customerRepository = customerRepository;
        this.currencyRepository = currencyRepository;
        this.countryRepository = countryRepository;
        this.transferCorridorRepository = transferCorridorRepository;
        this.exchangeRateRepository = exchangeRateRepository;
        this.feeGridRepository = feeGridRepository;
        this.feeBracketRepository = feeBracketRepository;
        this.commissionRuleRepository = commissionRuleRepository;
        this.tariffLineRepository = tariffLineRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void onApplicationEvent(ContextRefreshedEvent event) {
        if (event.getApplicationContext().getParent() != null) {
            return;
        }
        if (!INITIALIZED.compareAndSet(false, true)) {
            return;
        }

        Role adminRole = ensureRole("ROLE_ADMIN");
        Role managerRole = ensureRole("ROLE_MANAGER");
        Role agentRole = ensureRole("ROLE_AGENT");
        Role clientRole = ensureRole("ROLE_CLIENT");

        CentralAgency centralAgency = ensureCentralAgency();
        Agency agency = ensureAgency(centralAgency);
        ensureUser("Admin", "Okane", "admin@okane.local", "+212600000001", adminRole, "Password@123");
        User manager = ensureUser("Mina", "Manager", "manager@okane.local", "+212600000002", managerRole, "Password@123");
        User agent = ensureUser("Amin", "Agent", "agent@okane.local", "+212600000003", agentRole, "Password@123");
        User client = ensureUser("Clara", "Client", "client@okane.local", "+212600000004", clientRole, "Password@123");

        ensureCentralAgencyManager(centralAgency, manager);
        ensureAgencyMembership(agency, agent);
        ensureCustomer(client);

        ImportedCatalog catalog = seedCurrencyCatalog();
        alignOperationalCountries(catalog);

        Currency mad = findRequiredCurrency(catalog, "MAD");
        Currency eur = findRequiredCurrency(catalog, "EUR");
        Currency usd = findRequiredCurrency(catalog, "USD");
        Currency xof = findRequiredCurrency(catalog, "XOF");

        Country maroc = findRequiredCountry(catalog, "MAR");
        Country france = findRequiredCountry(catalog, "FRA");
        Country senegal = findRequiredCountry(catalog, "SEN");

        TransferCorridor corridorMarocSenegal = ensureCorridor(maroc, senegal, new BigDecimal("75000.00"), new BigDecimal("1.50"));
        ensureCorridor(maroc, france, new BigDecimal("50000.00"), new BigDecimal("1.50"));

        ensureExchangeRate(mad, xof, new BigDecimal("65.000000"), "MANUEL", manager);
        ensureExchangeRate(eur, mad, new BigDecimal("10.900000"), "MANUEL", manager);
        ensureExchangeRate(usd, mad, new BigDecimal("10.100000"), "MANUEL", manager);

        FeeGrid feeGrid = ensureFeeGrid("Grille standard Maroc -> Senegal", corridorMarocSenegal, mad, manager);
        ensureFeeBracket(feeGrid, new BigDecimal("0.00"), new BigDecimal("1000.00"), "POURCENTAGE", new BigDecimal("2.50"));
        ensureFeeBracket(feeGrid, new BigDecimal("1000.01"), new BigDecimal("5000.00"), "POURCENTAGE", new BigDecimal("2.00"));
        ensureCommissionRule(feeGrid, new BigDecimal("40.00"), new BigDecimal("60.00"));

        ensureTariffLine(
                new BigDecimal("0.00"),
                new BigDecimal("500.00"),
                TariffValueType.FIXED,
                new BigDecimal("10.00"),
                TariffValueType.FIXED,
                new BigDecimal("4.00"),
                TariffValueType.FIXED,
                new BigDecimal("6.00")
        );
        ensureTariffLine(
                new BigDecimal("501.00"),
                new BigDecimal("2000.00"),
                TariffValueType.FIXED,
                new BigDecimal("25.00"),
                TariffValueType.FIXED,
                new BigDecimal("10.00"),
                TariffValueType.FIXED,
                new BigDecimal("15.00")
        );
        ensureTariffLine(
                new BigDecimal("2001.00"),
                new BigDecimal("5000.00"),
                TariffValueType.FIXED,
                new BigDecimal("50.00"),
                TariffValueType.FIXED,
                new BigDecimal("20.00"),
                TariffValueType.FIXED,
                new BigDecimal("30.00")
        );
    }

    private ImportedCatalog seedCurrencyCatalog() {
        List<CountryCurrencyRow> rows = loadCountryCurrencyRows();
        Map<String, String> phoneCodesByCountryKey = loadCountryCodeRows().stream()
                .collect(LinkedHashMap::new, (map, row) -> {
                    String countryName = normalizeLabel(row.name()).toUpperCase(Locale.ROOT);
                    if (!isPlaceholderCode(countryName)) {
                        map.putIfAbsent(countryName, normalizePhoneCode(row.dialCode()));
                    }

                    String code = normalizeCode(row.code());
                    if (!isPlaceholderCode(code)) {
                        map.putIfAbsent(code, normalizePhoneCode(row.dialCode()));
                    }
                }, Map::putAll);
        Map<String, Currency> currenciesByImportCode = new LinkedHashMap<>();
        Map<String, Country> countriesByImportCode = new HashMap<>();
        Map<String, Integer> codeOccurrences = new HashMap<>();
        Map<String, Currency> existingCurrenciesBySymbol = new HashMap<>();
        Map<String, Country> existingCountriesByCode = new HashMap<>();

        for (Currency existingCurrency : currencyRepository.findAll()) {
            if (existingCurrency.getSymbol() != null) {
                existingCurrenciesBySymbol.put(existingCurrency.getSymbol().trim().toUpperCase(), existingCurrency);
            }
        }
        for (Country existingCountry : countryRepository.findAll()) {
            if (existingCountry.getCode() != null) {
                existingCountriesByCode.put(existingCountry.getCode().trim().toUpperCase(), existingCountry);
            }
        }

        for (CountryCurrencyRow row : rows) {
            String currencyCode = normalizeCode(row.currencyCode());
            String currencyName = normalizeLabel(row.currencyName());
            Currency currency = currenciesByImportCode.computeIfAbsent(
                    currencyCode,
                    ignored -> ensureImportedCurrency(currencyCode, currencyName, existingCurrenciesBySymbol)
            );

            String storedCountryCode = resolveStoredCountryCode(row.countryCode(), codeOccurrences);
            Country country = ensureImportedCountry(
                    storedCountryCode,
                    normalizeLabel(row.country()),
                    currency,
                    lookupPhoneCode(phoneCodesByCountryKey, row.country(), row.countryCode()),
                    existingCountriesByCode
            );
            countriesByImportCode.putIfAbsent(normalizeCode(row.countryCode()), country);
        }

        return new ImportedCatalog(currenciesByImportCode, countriesByImportCode);
    }

    private void alignOperationalCountries(ImportedCatalog catalog) {
        Currency eur = ensureRequiredCurrency(catalog, "EUR");
        Country france = catalog.countriesByImportCode().get("FRA");
        if (france != null && (france.getCurrency() == null || !eur.getId().equals(france.getCurrency().getId()))) {
            france.setCurrency(eur);
            france.setUpdatedAt(LocalDateTime.now());
            countryRepository.save(france);
        }
    }

    private Currency ensureImportedCurrency(
            String currencyCode,
            String currencyName,
            Map<String, Currency> existingCurrenciesBySymbol
    ) {
        LocalDateTime now = LocalDateTime.now();
        String symbol = deriveSymbol(currencyCode);
        Currency currency = existingCurrenciesBySymbol.getOrDefault(symbol, new Currency());
        currency.setName(currencyName);
        currency.setSymbol(symbol);
        currency.setActive(true);
        if (currency.getCreatedAt() == null) {
            currency.setCreatedAt(now);
        }
        currency.setUpdatedAt(now);
        Currency saved = currencyRepository.save(currency);
        existingCurrenciesBySymbol.put(symbol, saved);
        return saved;
    }

    private Country ensureImportedCountry(
            String code,
            String name,
            Currency currency,
            String phoneCode,
            Map<String, Country> existingCountriesByCode
    ) {
        LocalDateTime now = LocalDateTime.now();
        Country country = existingCountriesByCode.getOrDefault(code, new Country());
        country.setCode(code);
        country.setName(name);
        country.setPhoneCode(phoneCode);
        country.setCurrency(currency);
        country.setActive(true);
        if (country.getCreatedAt() == null) {
            country.setCreatedAt(now);
        }
        country.setUpdatedAt(now);
        Country saved = countryRepository.save(country);
        existingCountriesByCode.put(code, saved);
        return saved;
    }

    private Currency findRequiredCurrency(ImportedCatalog catalog, String importCode) {
        Currency currency = ensureRequiredCurrency(catalog, importCode);
        if (currency == null) {
            throw new IllegalStateException("Missing required imported currency: " + importCode);
        }
        return currency;
    }

    private Currency ensureRequiredCurrency(ImportedCatalog catalog, String importCode) {
        String normalizedCode = normalizeCode(importCode);
        Currency currency = catalog.currenciesByImportCode().get(normalizedCode);
        if (currency != null) {
            return currency;
        }

        String fallbackName = REQUIRED_CURRENCIES.get(normalizedCode);
        if (fallbackName == null) {
            return null;
        }

        Currency ensured = currencyRepository.findBySymbolIgnoreCase(normalizedCode)
                .map(existing -> {
                    existing.setName(fallbackName);
                    existing.setActive(true);
                    existing.setUpdatedAt(LocalDateTime.now());
                    return currencyRepository.save(existing);
                })
                .orElseGet(() -> {
                    Currency created = new Currency();
                    created.setName(fallbackName);
                    created.setSymbol(normalizedCode);
                    created.setActive(true);
                    created.setCreatedAt(LocalDateTime.now());
                    created.setUpdatedAt(LocalDateTime.now());
                    return currencyRepository.save(created);
                });
        catalog.currenciesByImportCode().put(normalizedCode, ensured);
        return ensured;
    }

    private Country findRequiredCountry(ImportedCatalog catalog, String importCode) {
        Country country = catalog.countriesByImportCode().get(normalizeCode(importCode));
        if (country == null) {
            throw new IllegalStateException("Missing required imported country: " + importCode);
        }
        return country;
    }

    private List<CountryCurrencyRow> loadCountryCurrencyRows() {
        try (InputStream inputStream = openCountriesJson()) {
            return objectMapper.readValue(inputStream, new TypeReference<List<CountryCurrencyRow>>() { });
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to load " + COUNTRIES_JSON, ex);
        }
    }

    private List<CountryCodeRow> loadCountryCodeRows() {
        try (InputStream inputStream = openCountryCodesJson()) {
            return objectMapper.readValue(inputStream, new TypeReference<List<CountryCodeRow>>() { });
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to load " + COUNTRY_CODES_JSON, ex);
        }
    }

    private InputStream openCountriesJson() throws IOException {
        ClassPathResource classPathResource = new ClassPathResource(COUNTRIES_JSON);
        if (classPathResource.exists()) {
            return classPathResource.getInputStream();
        }

        Path workingDirectory = Path.of(System.getProperty("user.dir"));
        Path[] candidates = new Path[] {
                workingDirectory.resolve(COUNTRIES_JSON),
                workingDirectory.resolve("..").resolve(COUNTRIES_JSON).normalize()
        };

        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                return Files.newInputStream(candidate);
            }
        }
        throw new IOException("File not found: " + COUNTRIES_JSON);
    }

    private InputStream openCountryCodesJson() throws IOException {
        ClassPathResource classPathResource = new ClassPathResource(COUNTRY_CODES_JSON);
        if (classPathResource.exists()) {
            return classPathResource.getInputStream();
        }

        Path workingDirectory = Path.of(System.getProperty("user.dir"));
        Path[] candidates = new Path[] {
                workingDirectory.resolve(COUNTRY_CODES_JSON),
                workingDirectory.resolve("..").resolve(COUNTRY_CODES_JSON).normalize()
        };

        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                return Files.newInputStream(candidate);
            }
        }
        throw new IOException("File not found: " + COUNTRY_CODES_JSON);
    }

    private String resolveStoredCountryCode(String rawCode, Map<String, Integer> codeOccurrences) {
        String normalized = normalizeCode(rawCode);
        String base = isPlaceholderCode(normalized) ? "UNK" : normalized;
        int index = codeOccurrences.merge(base, 1, Integer::sum);
        if (index == 1) {
            return base;
        }
        return (base + "-" + index).substring(0, Math.min(base.length() + String.valueOf(index).length() + 1, 10));
    }

    private boolean isPlaceholderCode(String value) {
        return value == null || value.isBlank() || "-".equals(value);
    }

    private String normalizeCode(String value) {
        if (value == null) {
            return "-";
        }
        String normalized = value.trim().toUpperCase();
        return normalized.isEmpty() ? "-" : normalized;
    }

    private String normalizeLabel(String value) {
        if (value == null) {
            return "-";
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? "-" : normalized;
    }

    private String normalizePhoneCode(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replaceAll("\\s+", "");
        return normalized.isEmpty() ? null : normalized;
    }

    private String lookupPhoneCode(Map<String, String> phoneCodesByCountryKey, String countryName, String countryCode) {
        String normalizedName = normalizeLabel(countryName).toUpperCase(Locale.ROOT);
        if (!isPlaceholderCode(normalizedName)) {
            String byName = phoneCodesByCountryKey.get(normalizedName);
            if (byName != null) {
                return byName;
            }
        }

        String normalizedCode = normalizeCode(countryCode);
        if (!isPlaceholderCode(normalizedCode)) {
            return phoneCodesByCountryKey.get(normalizedCode);
        }

        return null;
    }

    private String deriveSymbol(String currencyCode) {
        return normalizeCode(currencyCode);
    }

    private Role ensureRole(String name) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            return roleRepository.save(role);
        });
    }

    private CentralAgency ensureCentralAgency() {
        CentralAgency agency = centralAgencyRepository.findByCode("OKANE-HQ").orElseGet(() -> {
            LocalDateTime now = LocalDateTime.now();
            CentralAgency created = new CentralAgency();
            created.setName("Agence Centrale Okane");
            created.setCode("OKANE-HQ");
            created.setAddress("12 Rue Principale");
            created.setCity("Casablanca");
            created.setCountry("Maroc");
            created.setPhone("+212600000010");
            created.setEmail("hq@okane.local");
            created.setDailyLimit(new BigDecimal("50000.00"));
            created.setCurrentBalance(new BigDecimal("500000.00"));
            created.setActive(true);
            created.setStatus(com.okane.agencymanagement.domain.AgencyStatus.ACTIVE);
            created.setCreatedAt(now);
            created.setUpdatedAt(now);
            return centralAgencyRepository.save(created);
        });

        if (agency.getCurrentBalance() == null) {
            agency.setCurrentBalance(new BigDecimal("500000.00"));
            agency.setUpdatedAt(LocalDateTime.now());
            agency = centralAgencyRepository.save(agency);
        }
        return agency;
    }

    private Agency ensureAgency(CentralAgency centralAgency) {
        Agency agency = agencyRepository.findByCode("OKANE-CASA-01").orElseGet(() -> {
            LocalDateTime now = LocalDateTime.now();
            Agency created = new Agency();
            created.setName("Agence Casablanca Centre");
            created.setCode("OKANE-CASA-01");
            created.setAddress("12 Rue Principale, Casablanca");
            created.setCity("Casablanca");
            created.setCountry("Maroc");
            created.setPhone("+212600000011");
            created.setEmail("casa@okane.local");
            created.setDailyLimit(new BigDecimal("50000.00"));
            created.setCurrentBalance(new BigDecimal("50000.00"));
            created.setActive(true);
            created.setStatus(com.okane.agencymanagement.domain.AgencyStatus.ACTIVE);
            created.setCentralAgency(centralAgency);
            created.setCreatedAt(now);
            created.setUpdatedAt(now);
            Agency saved = agencyRepository.save(created);
            if (centralAgency.getCurrentBalance() != null
                    && centralAgency.getCurrentBalance().compareTo(created.getCurrentBalance()) >= 0) {
                centralAgency.setCurrentBalance(centralAgency.getCurrentBalance().subtract(created.getCurrentBalance()));
                centralAgency.setUpdatedAt(now);
                centralAgencyRepository.save(centralAgency);
            }
            return saved;
        });

        if (agency.getCurrentBalance() == null) {
            agency.setCurrentBalance(new BigDecimal("50000.00"));
            agency.setUpdatedAt(LocalDateTime.now());
            agency = agencyRepository.save(agency);
            if (centralAgency.getCurrentBalance() != null
                    && centralAgency.getCurrentBalance().compareTo(agency.getCurrentBalance()) >= 0) {
                centralAgency.setCurrentBalance(centralAgency.getCurrentBalance().subtract(agency.getCurrentBalance()));
                centralAgency.setUpdatedAt(LocalDateTime.now());
                centralAgencyRepository.save(centralAgency);
            }
        }
        return agency;
    }

    private User ensureUser(
            String firstName,
            String lastName,
            String email,
            String phone,
            Role role,
            String rawPassword
    ) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            LocalDateTime now = LocalDateTime.now();
            User user = new User();
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email);
            user.setPhone(phone);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setEnabled(true);
            user.setAccountLocked(false);
            user.setAccountSuspended(false);
            user.setFailedLoginAttempts(0);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            user.setPasswordChangedAt(now);
            user.setRole(role);
            return userRepository.save(user);
        });
    }

    private void ensureAgencyMembership(Agency agency, User user) {
        if (agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId()).isPresent()) {
            return;
        }
        AgencyUser agencyUser = new AgencyUser();
        agencyUser.setAgency(agency);
        agencyUser.setUser(user);
        agencyUser.setAssignedAt(LocalDateTime.now());
        agencyUser.setActive(true);
        agencyUserRepository.save(agencyUser);
    }

    private void ensureCentralAgencyManager(CentralAgency centralAgency, User user) {
        if (centralAgency.getManager() != null && centralAgency.getManager().getId() != null
                && centralAgency.getManager().getId().equals(user.getId())) {
            return;
        }

        centralAgencyRepository.findByManager_Id(user.getId()).ifPresent(existing -> {
            if (!existing.getId().equals(centralAgency.getId())) {
                existing.setManager(null);
                existing.setUpdatedAt(LocalDateTime.now());
                centralAgencyRepository.save(existing);
            }
        });

        centralAgency.setManager(user);
        centralAgency.setUpdatedAt(LocalDateTime.now());
        centralAgencyRepository.save(centralAgency);
    }

    private void ensureCustomer(User user) {
        if (customerRepository.findByUser_Id(user.getId()).isPresent()) {
            return;
        }
        Customer customer = new Customer();
        customer.setUser(user);
        customer.setIdentityType("CNI");
        customer.setIdentityNumber("CL-2026-0001");
        customer.setCountry("Maroc");
        customer.setCity("Casablanca");
        customer.setAddress("Rue Exemple, Casablanca");
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        customerRepository.save(customer);
    }

    private TransferCorridor ensureCorridor(Country source, Country destination, BigDecimal dailyLimit, BigDecimal estimatedFees) {
        return transferCorridorRepository
                .findBySourceCountry_IdAndDestinationCountry_Id(source.getId(), destination.getId())
                .orElseGet(() -> {
                    TransferCorridor corridor = new TransferCorridor();
                    corridor.setSourceCountry(source);
                    corridor.setDestinationCountry(destination);
                    corridor.setActive(true);
                    corridor.setEstimatedFees(estimatedFees);
                    corridor.setDailyLimit(dailyLimit);
                    corridor.setCreatedAt(LocalDateTime.now());
                    corridor.setUpdatedAt(LocalDateTime.now());
                    return transferCorridorRepository.save(corridor);
                });
    }

    private ExchangeRate ensureExchangeRate(Currency from, Currency to, BigDecimal rate, String source, User createdBy) {
        return exchangeRateRepository
                .findFirstByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDescIdDesc(from.getId(), to.getId())
                .orElseGet(() -> {
                    ExchangeRate exchangeRate = new ExchangeRate();
                    exchangeRate.setFromCurrency(from);
                    exchangeRate.setToCurrency(to);
                    exchangeRate.setRate(rate);
                    exchangeRate.setSource(source);
                    exchangeRate.setEffectiveAt(LocalDateTime.now());
                    exchangeRate.setCreatedBy(createdBy);
                    return exchangeRateRepository.save(exchangeRate);
                });
    }

    private FeeGrid ensureFeeGrid(String name, TransferCorridor corridor, Currency currency, User createdBy) {
        return feeGridRepository.findByName(name).orElseGet(() -> {
            FeeGrid feeGrid = new FeeGrid();
            feeGrid.setName(name);
            feeGrid.setCorridor(corridor);
            feeGrid.setCurrency(currency);
            feeGrid.setActive(true);
            feeGrid.setEffectiveFrom(LocalDateTime.now());
            feeGrid.setEffectiveTo(LocalDateTime.now().plusYears(1));
            feeGrid.setCreatedBy(createdBy);
            feeGrid.setCreatedAt(LocalDateTime.now());
            feeGrid.setUpdatedAt(LocalDateTime.now());
            return feeGridRepository.save(feeGrid);
        });
    }

    private void ensureFeeBracket(FeeGrid feeGrid, BigDecimal min, BigDecimal max, String feeType, BigDecimal feeValue) {
        if (feeBracketRepository.existsByFeeGrid_IdAndMinAmountAndMaxAmountAndFeeTypeAndFeeValue(
                feeGrid.getId(),
                min,
                max,
                feeType,
                feeValue
        )) {
            return;
        }
        FeeBracket bracket = new FeeBracket();
        bracket.setFeeGrid(feeGrid);
        bracket.setMinAmount(min);
        bracket.setMaxAmount(max);
        bracket.setFeeType(feeType);
        bracket.setFeeValue(feeValue);
        bracket.setCreatedAt(LocalDateTime.now());
        feeBracketRepository.save(bracket);
    }

    private void ensureCommissionRule(FeeGrid feeGrid, BigDecimal agencyPct, BigDecimal centralPct) {
        if (commissionRuleRepository.existsByFeeGrid_Id(feeGrid.getId())) {
            return;
        }
        CommissionRule rule = new CommissionRule();
        rule.setFeeGrid(feeGrid);
        rule.setAgencyPercentage(agencyPct);
        rule.setCentralPercentage(centralPct);
        rule.setActive(true);
        rule.setCreatedAt(LocalDateTime.now());
        commissionRuleRepository.save(rule);
    }

    private void ensureTariffLine(
            BigDecimal minAmount,
            BigDecimal maxAmount,
            TariffValueType transferType,
            BigDecimal transferValue,
            TariffValueType agencyType,
            BigDecimal agencyValue,
            TariffValueType centralType,
            BigDecimal centralValue
    ) {
        boolean exists = tariffLineRepository.findAll().stream().anyMatch(line ->
                line.getMinAmount().compareTo(minAmount) == 0
                        && line.getMaxAmount().compareTo(maxAmount) == 0
                        && line.getTransferFeeType() == transferType
                        && line.getTransferFeeValue().compareTo(transferValue) == 0
                        && line.getAgencyCommissionType() == agencyType
                        && line.getAgencyCommissionValue().compareTo(agencyValue) == 0
                        && line.getCentralCommissionType() == centralType
                        && line.getCentralCommissionValue().compareTo(centralValue) == 0
        );
        if (exists) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        TariffLine line = new TariffLine();
        line.setMinAmount(minAmount);
        line.setMaxAmount(maxAmount);
        line.setTransferFeeType(transferType);
        line.setTransferFeeValue(transferValue);
        line.setAgencyCommissionType(agencyType);
        line.setAgencyCommissionValue(agencyValue);
        line.setCentralCommissionType(centralType);
        line.setCentralCommissionValue(centralValue);
        line.setCreatedAt(now);
        line.setUpdatedAt(now);
        tariffLineRepository.save(line);
    }

    private record CountryCurrencyRow(
            String COUNTRY,
            String COUNTRY_CODE,
            String CURRENCY_CODE,
            String NAME_OF_CURRENCY
    ) {
        String country() {
            return COUNTRY;
        }

        String countryCode() {
            return COUNTRY_CODE;
        }

        String currencyCode() {
            return CURRENCY_CODE;
        }

        String currencyName() {
            return NAME_OF_CURRENCY;
        }
    }

    private record CountryCodeRow(
            String name,
            String dial_code,
            String code
    ) {
        String dialCode() {
            return dial_code;
        }
    }

    private record ImportedCatalog(
            Map<String, Currency> currenciesByImportCode,
            Map<String, Country> countriesByImportCode
    ) {
    }
}
