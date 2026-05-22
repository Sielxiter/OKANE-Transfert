package com.okane.bootstrap;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
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
import com.okane.feescommission.repository.CommissionRuleRepository;
import com.okane.feescommission.repository.FeeBracketRepository;
import com.okane.feescommission.repository.FeeGridRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements ApplicationListener<ContextRefreshedEvent> {

    private static final AtomicBoolean INITIALIZED = new AtomicBoolean(false);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final CustomerRepository customerRepository;
    private final CurrencyRepository currencyRepository;
    private final CountryRepository countryRepository;
    private final TransferCorridorRepository transferCorridorRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final FeeGridRepository feeGridRepository;
    private final FeeBracketRepository feeBracketRepository;
    private final CommissionRuleRepository commissionRuleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepository,
            UserRepository userRepository,
            AgencyRepository agencyRepository,
            AgencyUserRepository agencyUserRepository,
            CustomerRepository customerRepository,
                CurrencyRepository currencyRepository,
                CountryRepository countryRepository,
                TransferCorridorRepository transferCorridorRepository,
                ExchangeRateRepository exchangeRateRepository,
                FeeGridRepository feeGridRepository,
                FeeBracketRepository feeBracketRepository,
                CommissionRuleRepository commissionRuleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.customerRepository = customerRepository;
        this.currencyRepository = currencyRepository;
        this.countryRepository = countryRepository;
        this.transferCorridorRepository = transferCorridorRepository;
        this.exchangeRateRepository = exchangeRateRepository;
        this.feeGridRepository = feeGridRepository;
        this.feeBracketRepository = feeBracketRepository;
        this.commissionRuleRepository = commissionRuleRepository;
        this.passwordEncoder = passwordEncoder;
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

        Agency agency = ensureAgency();
        ensureUser(
                "Admin",
                "Okane",
                "admin@okane.local",
                "+212600000001",
                adminRole,
                "Password@123"
        );
        User manager = ensureUser(
                "Mina",
                "Manager",
                "manager@okane.local",
                "+212600000002",
                managerRole,
                "Password@123"
        );
        User agent = ensureUser(
                "Amin",
                "Agent",
                "agent@okane.local",
                "+212600000003",
                agentRole,
                "Password@123"
        );
        User client = ensureUser(
                "Clara",
                "Client",
                "client@okane.local",
                "+212600000004",
                clientRole,
                "Password@123"
        );

        ensureAgencyMembership(agency, manager);
        ensureAgencyMembership(agency, agent);
        ensureCustomer(client);

        Currency mad = ensureCurrency("MAD", "Dirham marocain", "MAD");
        Currency eur = ensureCurrency("EUR", "Euro", "EUR");
        Currency usd = ensureCurrency("USD", "Dollar americain", "$");
        Currency xof = ensureCurrency("XOF", "Franc CFA", "XOF");

        Country maroc = ensureCountry("MA", "Maroc", mad);
        Country france = ensureCountry("FR", "France", eur);
        Country senegal = ensureCountry("SN", "Senegal", xof);

        TransferCorridor corridorMarocSenegal = ensureCorridor(maroc, senegal, new BigDecimal("75000.00"));
        ensureCorridor(maroc, france, new BigDecimal("50000.00"));

        ensureExchangeRate(mad, xof, new BigDecimal("65.000000"), "MANUEL", manager);
        ensureExchangeRate(eur, mad, new BigDecimal("10.900000"), "MANUEL", manager);
        ensureExchangeRate(usd, mad, new BigDecimal("10.100000"), "MANUEL", manager);

        FeeGrid feeGrid = ensureFeeGrid("Grille standard Maroc -> Senegal", corridorMarocSenegal, mad, manager);
        ensureFeeBracket(feeGrid, new BigDecimal("0.00"), new BigDecimal("1000.00"), "POURCENTAGE", new BigDecimal("2.50"));
        ensureFeeBracket(feeGrid, new BigDecimal("1000.01"), new BigDecimal("5000.00"), "POURCENTAGE", new BigDecimal("2.00"));
        ensureCommissionRule(feeGrid, new BigDecimal("40.00"), new BigDecimal("60.00"));
    }

    private Role ensureRole(String name) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            return roleRepository.save(role);
        });
    }

    private Agency ensureAgency() {
        return agencyRepository.findByCode("OKANE-HQ").orElseGet(() -> {
            LocalDateTime now = LocalDateTime.now();
            Agency agency = new Agency();
            agency.setName("Agence Centrale Okane");
            agency.setCode("OKANE-HQ");
            agency.setAddress("12 Rue Principale");
            agency.setCity("Casablanca");
            agency.setCountry("Maroc");
            agency.setPhone("+212600000010");
            agency.setEmail("hq@okane.local");
            agency.setDailyLimit(new BigDecimal("50000.00"));
            agency.setActive(true);
            agency.setCreatedAt(now);
            agency.setUpdatedAt(now);
            return agencyRepository.save(agency);
        });
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

    private Currency ensureCurrency(String code, String name, String symbol) {
        return currencyRepository.findByCode(code).orElseGet(() -> {
            Currency currency = new Currency();
            currency.setCode(code);
            currency.setName(name);
            currency.setSymbol(symbol);
            currency.setActive(true);
            currency.setCreatedAt(LocalDateTime.now());
            currency.setUpdatedAt(LocalDateTime.now());
            return currencyRepository.save(currency);
        });
    }

    private Country ensureCountry(String code, String name, Currency currency) {
        return countryRepository.findByCode(code).orElseGet(() -> {
            Country country = new Country();
            country.setCode(code);
            country.setName(name);
            country.setCurrency(currency);
            country.setActive(true);
            country.setCreatedAt(LocalDateTime.now());
            country.setUpdatedAt(LocalDateTime.now());
            return countryRepository.save(country);
        });
    }

    private TransferCorridor ensureCorridor(Country source, Country destination, BigDecimal dailyLimit) {
        return transferCorridorRepository
                .findBySourceCountry_IdAndDestinationCountry_Id(source.getId(), destination.getId())
                .orElseGet(() -> {
                    TransferCorridor corridor = new TransferCorridor();
                    corridor.setSourceCountry(source);
                    corridor.setDestinationCountry(destination);
                    corridor.setActive(true);
                    corridor.setDailyLimit(dailyLimit);
                    corridor.setCreatedAt(LocalDateTime.now());
                    corridor.setUpdatedAt(LocalDateTime.now());
                    return transferCorridorRepository.save(corridor);
                });
    }

    private ExchangeRate ensureExchangeRate(Currency from, Currency to, BigDecimal rate, String source, User createdBy) {
        return exchangeRateRepository
                .findByFromCurrency_IdAndToCurrency_Id(from.getId(), to.getId())
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
}
