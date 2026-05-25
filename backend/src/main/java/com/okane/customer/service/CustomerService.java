package com.okane.customer.service;

import com.okane.auth.entity.Role;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.RoleRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.customer.dto.CustomerCreateRequest;
import com.okane.customer.dto.CustomerResponse;
import com.okane.customer.entity.Customer;
import com.okane.customer.repository.CustomerRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(
            CustomerRepository customerRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> getCustomers() {
        return customerRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerCreateRequest request) {
        Role role = roleRepository.findByName("ROLE_CLIENT")
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "ROLE_CLIENT is missing"));

        if (customerRepository.existsByIdentityTypeAndIdentityNumber(request.typePiece(), request.numeroPiece())) {
            throw new ApiException(HttpStatus.CONFLICT, "Identity document already exists");
        }

        String email = buildUniqueEmail(request.telephone(), request.prenom(), request.nom());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setFirstName(request.prenom());
        user.setLastName(request.nom());
        user.setEmail(email);
        user.setPhone(request.telephone());
        user.setPasswordHash(passwordEncoder.encode(generatePassword()));
        user.setEnabled(true);
        user.setAccountLocked(false);
        user.setAccountSuspended(false);
        user.setFailedLoginAttempts(0);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setPasswordChangedAt(now);
        user.setRole(role);
        user = userRepository.save(user);

        Customer customer = new Customer();
        customer.setUser(user);
        customer.setIdentityType(request.typePiece());
        customer.setIdentityNumber(request.numeroPiece());
        customer.setCountry(request.pays());
        customer.setCreatedAt(now);
        customer.setUpdatedAt(now);
        customer = customerRepository.save(customer);

        return toResponse(customer);
    }

    private CustomerResponse toResponse(Customer customer) {
        User user = customer.getUser();
        String createdAt = customer.getCreatedAt() != null
                ? customer.getCreatedAt().toString()
                : LocalDateTime.now().toString();

        return new CustomerResponse(
                customer.getId() != null ? customer.getId().toString() : null,
                user != null ? user.getFirstName() : null,
                user != null ? user.getLastName() : null,
                user != null ? user.getPhone() : null,
                customer.getCountry(),
                customer.getIdentityType(),
                customer.getIdentityNumber(),
                "PENDING",
                createdAt
        );
    }

    private String buildUniqueEmail(String phone, String firstName, String lastName) {
        String base = normalizeValue(phone);
        if (base.isBlank()) {
            base = normalizeValue(firstName + "." + lastName);
        }
        if (base.isBlank()) {
            base = "client";
        }

        String prefix = "client." + base;
        String candidate = prefix + "@okane.local";
        int index = 1;
        while (userRepository.existsByEmailIgnoreCase(candidate)) {
            candidate = prefix + "-" + index + "@okane.local";
            index += 1;
        }
        return candidate;
    }

    private String normalizeValue(String value) {
        if (value == null) {
            return "";
        }
        return value.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "")
                .replaceAll("^_+|_+$", "");
    }

    private String generatePassword() {
        return UUID.randomUUID().toString() + "@";
    }
}
