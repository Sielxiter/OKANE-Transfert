package com.okane.usermanagement.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.centralagency.entity.CentralAgency;
import com.okane.centralagency.repository.CentralAgencyRepository;
import com.okane.auth.entity.Role;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.RoleRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.compliance.entity.KycCheck;
import com.okane.customer.entity.Customer;
import com.okane.customer.repository.CustomerRepository;
import com.okane.usermanagement.domain.AccountStatus;
import com.okane.usermanagement.domain.KycStatus;
import com.okane.usermanagement.dto.ChangeUserStatusRequestDTO;
import com.okane.usermanagement.dto.CreateUserRequestDTO;
import com.okane.usermanagement.dto.UpdateUserRequestDTO;
import com.okane.usermanagement.dto.UserResponseDTO;
import com.okane.usermanagement.exception.EmailAlreadyExistsException;
import com.okane.usermanagement.exception.ForbiddenOperationException;
import com.okane.usermanagement.exception.InvalidRoleException;
import com.okane.usermanagement.exception.UserNotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementService {

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "ROLE_ADMIN",
            "ROLE_MANAGER",
            "ROLE_AGENT",
            "ROLE_CLIENT"
    );

    private static final Map<String, KycStatus> KYC_STATUS_BY_DB_VALUE = Map.of(
            "VERIFIE", KycStatus.VERIFIED,
            "VERIFIED", KycStatus.VERIFIED,
            "EN_ATTENTE", KycStatus.PENDING,
            "PENDING", KycStatus.PENDING,
            "REJETE", KycStatus.REJECTED,
            "REJECTED", KycStatus.REJECTED,
            "A_REVOIR", KycStatus.REVIEW_REQUIRED,
            "REVIEW_REQUIRED", KycStatus.REVIEW_REQUIRED
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AgencyRepository agencyRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final CentralAgencyRepository centralAgencyRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserManagementAuditService auditService;

    @PersistenceContext
    private EntityManager entityManager;

    public UserManagementService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            AgencyRepository agencyRepository,
            AgencyUserRepository agencyUserRepository,
            CentralAgencyRepository centralAgencyRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            UserManagementAuditService auditService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.agencyRepository = agencyRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.centralAgencyRepository = centralAgencyRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getClients() {
        return mapAll(userRepository.findByRole_NameOrderByCreatedAtDesc("ROLE_CLIENT"));
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAdmins() {
        return mapAll(userRepository.findByRole_NameOrderByCreatedAtDesc("ROLE_ADMIN"));
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getManagers() {
        return mapAll(userRepository.findByRole_NameOrderByCreatedAtDesc("ROLE_MANAGER"));
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAvailableManagers(Long agencyId) {
        List<User> allManagers = userRepository.findByRole_NameOrderByCreatedAtDesc("ROLE_MANAGER");
        return allManagers.stream()
                .filter(manager -> {
                    Optional<CentralAgency> assignment = centralAgencyRepository.findByManager_Id(manager.getId());
                    if (assignment.isEmpty()) {
                        return true;
                    }
                    return agencyId != null && assignment.get().getId().equals(agencyId);
                })
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAgents() {
        return mapAll(userRepository.findByRole_NameOrderByCreatedAtDesc("ROLE_AGENT"));
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        return toResponse(user);
    }

    @Transactional
    public UserResponseDTO createUser(CreateUserRequestDTO request, Authentication authentication) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        String roleName = request.role();
        if (!ALLOWED_ROLES.contains(roleName)) {
            throw new InvalidRoleException(roleName);
        }
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new InvalidRoleException(roleName));

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEnabled(true);
        user.setAccountLocked(false);
        user.setAccountSuspended(false);
        user.setFailedLoginAttempts(0);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setPasswordChangedAt(now);
        user.setRole(role);
        User saved = userRepository.save(user);

        if ("ROLE_CLIENT".equals(roleName)) {
            ensureCustomerProfile(saved, request.country());
        } else if (request.agencyId() != null) {
            assignAgency(saved, request.agencyId());
        }

        auditService.logUserCreated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public UserResponseDTO updateUser(Long id, UpdateUserRequestDTO request, Authentication authentication) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPhone(request.phone());
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        if (request.country() != null && isClient(saved)) {
            ensureCustomerProfile(saved, request.country());
        }

        if (request.agencyId() != null && !isClient(saved)) {
            assignAgency(saved, request.agencyId());
        }

        auditService.logUserUpdated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public UserResponseDTO changeStatus(Long id, ChangeUserStatusRequestDTO request, Authentication authentication) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        User actor = currentUserOrNull(authentication);
        ensureCanModify(user, actor, request.status());

        applyStatus(user, request.status());
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        auditService.logUserStatusChanged(actor, saved, request.status().name());
        return toResponse(saved);
    }

    /**
     * Soft delete: disable the user and mark them as suspended. Hard delete is
     * intentionally not exposed to preserve referential integrity with audit
     * logs, transfers, cash sessions, etc.
     */
    @Transactional
    public UserResponseDTO disableUser(Long id, Authentication authentication) {
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        User actor = currentUserOrNull(authentication);
        if (actor != null && actor.getId().equals(user.getId())) {
            throw new ForbiddenOperationException("You cannot disable your own admin account");
        }

        user.setEnabled(false);
        user.setAccountSuspended(true);
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        auditService.logUserDisabled(actor, saved);
        return toResponse(saved);
    }

    private List<UserResponseDTO> mapAll(List<User> users) {
        return users.stream().map(this::toResponse).toList();
    }

    private UserResponseDTO toResponse(User user) {
        Customer customer = isClient(user)
                ? customerRepository.findByUser_Id(user.getId()).orElse(null)
                : null;
        Agency agency = null;
        CentralAgency centralAgency = null;
        if (!isClient(user)) {
            if (isManager(user)) {
                centralAgency = centralAgencyRepository.findByManager_Id(user.getId()).orElse(null);
            } else {
                AgencyUser agencyUser = agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId()).orElse(null);
                agency = agencyUser != null ? agencyUser.getAgency() : null;
            }
        }

        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();

        return new UserResponseDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                fullName,
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().getName() : null,
                resolveAccountStatus(user),
                customer != null ? customer.getCountry() : null,
                isClient(user) ? resolveKycStatus(customer) : null,
                centralAgency != null ? centralAgency.getId() : agency != null ? agency.getId() : null,
                centralAgency != null ? centralAgency.getName() : agency != null ? agency.getName() : null,
                centralAgency != null ? centralAgency.getCode() : agency != null ? agency.getCode() : null,
                user.getCreatedAt(),
                user.getLastLoginAt()
        );
    }

    private AccountStatus resolveAccountStatus(User user) {
        if (Boolean.TRUE.equals(user.getAccountLocked())) {
            return AccountStatus.LOCKED;
        }
        if (Boolean.TRUE.equals(user.getAccountSuspended()) || !Boolean.TRUE.equals(user.getEnabled())) {
            return AccountStatus.SUSPENDED;
        }
        return AccountStatus.ACTIVE;
    }

    private void applyStatus(User user, AccountStatus status) {
        switch (status) {
            case ACTIVE -> {
                user.setEnabled(true);
                user.setAccountSuspended(false);
                user.setAccountLocked(false);
                user.setFailedLoginAttempts(0);
            }
            case SUSPENDED -> {
                user.setAccountSuspended(true);
                user.setAccountLocked(false);
                user.setEnabled(false);
            }
            case LOCKED -> {
                user.setAccountLocked(true);
                user.setEnabled(false);
            }
        }
    }

    private KycStatus resolveKycStatus(Customer customer) {
        if (customer == null || customer.getId() == null) {
            return KycStatus.PENDING;
        }

        // First check the Customer.kycStatus field (set by agent KYC flow)
        String customerKyc = customer.getKycStatus();
        if (customerKyc != null && !customerKyc.isBlank()) {
            KycStatus mapped = KYC_STATUS_BY_DB_VALUE.get(customerKyc.trim().toUpperCase(Locale.ROOT));
            if (mapped != null) return mapped;
        }

        // Fallback: check the KycCheck table for the latest verification
        try {
            TypedQuery<KycCheck> query = entityManager.createQuery(
                    "select k from KycCheck k where k.customer.id = :customerId order by k.checkedAt desc",
                    KycCheck.class
            );
            query.setParameter("customerId", customer.getId());
            query.setMaxResults(1);
            List<KycCheck> result = query.getResultList();
            if (result.isEmpty()) {
                return KycStatus.PENDING;
            }
            String raw = result.get(0).getStatus();
            if (raw == null) {
                return KycStatus.PENDING;
            }
            return KYC_STATUS_BY_DB_VALUE.getOrDefault(
                    raw.trim().toUpperCase(Locale.ROOT),
                    KycStatus.PENDING
            );
        } catch (RuntimeException ex) {
            return KycStatus.PENDING;
        }
    }

    private void ensureCustomerProfile(User user, String country) {
        Optional<Customer> existing = customerRepository.findByUser_Id(user.getId());
        LocalDateTime now = LocalDateTime.now();

        if (existing.isPresent()) {
            Customer customer = existing.get();
            if (country != null && !country.isBlank()) {
                customer.setCountry(country.trim());
                customer.setUpdatedAt(now);
                customerRepository.save(customer);
            }
            return;
        }

        if (country == null || country.isBlank()) {
            // Skip creating an incomplete customer record when no country is provided.
            // Validation can be tightened later if required.
            return;
        }

        Customer customer = new Customer();
        customer.setUser(user);
        customer.setIdentityType("PENDING");
        customer.setIdentityNumber("PENDING-" + user.getId());
        customer.setCountry(country.trim());
        customer.setCreatedAt(now);
        customer.setUpdatedAt(now);
        customerRepository.save(customer);
    }

    private void assignAgency(User user, Long agencyId) {
        if (isManager(user)) {
            assignCentralAgency(user, agencyId);
            return;
        }

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Agency not found: " + agencyId));

        Optional<AgencyUser> existing = agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId());
        if (existing.isPresent()) {
            AgencyUser current = existing.get();
            if (current.getAgency() != null && current.getAgency().getId().equals(agency.getId())) {
                return;
            }
            current.setActive(false);
            agencyUserRepository.save(current);
        }

        AgencyUser membership = new AgencyUser();
        membership.setAgency(agency);
        membership.setUser(user);
        membership.setActive(true);
        membership.setAssignedAt(LocalDateTime.now());
        agencyUserRepository.save(membership);
    }

    private void assignCentralAgency(User user, Long centralAgencyId) {
        CentralAgency centralAgency = centralAgencyRepository.findById(centralAgencyId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Central agency not found: " + centralAgencyId));

        Optional<CentralAgency> existing = centralAgencyRepository.findByManager_Id(user.getId());
        if (existing.isPresent()) {
            CentralAgency current = existing.get();
            if (current.getId().equals(centralAgency.getId())) {
                return;
            }
            current.setManager(null);
            current.setUpdatedAt(LocalDateTime.now());
            centralAgencyRepository.save(current);
        }

        centralAgency.setManager(user);
        centralAgency.setUpdatedAt(LocalDateTime.now());
        centralAgencyRepository.save(centralAgency);
    }

    private void ensureCanModify(User target, User actor, AccountStatus newStatus) {
        if (actor != null && actor.getId().equals(target.getId())
                && newStatus != AccountStatus.ACTIVE) {
            throw new ForbiddenOperationException("You cannot suspend or lock your own admin account");
        }
    }

    private boolean isClient(User user) {
        return user.getRole() != null && "ROLE_CLIENT".equals(user.getRole().getName());
    }

    private boolean isManager(User user) {
        return user.getRole() != null && "ROLE_MANAGER".equals(user.getRole().getName());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
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
            User managed = userRepository.findById(user.getId()).orElse(null);
            // Eagerly initialize Role to avoid LazyInitializationException in audit
            if (managed != null && managed.getRole() != null) {
                managed.getRole().getName();
            }
            return managed;
        }
        return null;
    }
}
