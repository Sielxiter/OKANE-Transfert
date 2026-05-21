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
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepository,
            UserRepository userRepository,
            AgencyRepository agencyRepository,
            AgencyUserRepository agencyUserRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.customerRepository = customerRepository;
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
            agency.setName("Okane HQ");
            agency.setCode("OKANE-HQ");
            agency.setAddress("12 Main Street");
            agency.setCity("Casablanca");
            agency.setCountry("Morocco");
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
        customer.setIdentityType("NATIONAL_ID");
        customer.setIdentityNumber("CL-2026-0001");
        customer.setCountry("Morocco");
        customer.setCity("Casablanca");
        customer.setAddress("Rue Example, Casablanca");
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        customerRepository.save(customer);
    }
}
