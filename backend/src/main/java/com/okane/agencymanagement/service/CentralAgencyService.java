package com.okane.agencymanagement.service;

import com.okane.agency.repository.AgencyRepository;
import com.okane.agencymanagement.domain.AgencyStatus;
import com.okane.agencymanagement.domain.AgencyType;
import com.okane.agencymanagement.dto.AgencyResponseDTO;
import com.okane.agencymanagement.dto.AssignManagerRequestDTO;
import com.okane.agencymanagement.dto.ChangeAgencyStatusRequestDTO;
import com.okane.agencymanagement.dto.CreateAgencyRequestDTO;
import com.okane.agencymanagement.dto.UpdateAgencyRequestDTO;
import com.okane.agencymanagement.exception.AgencyCodeAlreadyExistsException;
import com.okane.agencymanagement.exception.AgencyEmailAlreadyExistsException;
import com.okane.agencymanagement.exception.AgencyNotFoundException;
import com.okane.agencymanagement.exception.InvalidManagerException;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.centralagency.entity.CentralAgency;
import com.okane.centralagency.repository.CentralAgencyRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CentralAgencyService {

    private static final String ROLE_MANAGER = "ROLE_MANAGER";

    private final CentralAgencyRepository centralAgencyRepository;
    private final AgencyRepository agencyRepository;
    private final UserRepository userRepository;
    private final CentralAgencyAuditService auditService;

    public CentralAgencyService(
            CentralAgencyRepository centralAgencyRepository,
            AgencyRepository agencyRepository,
            UserRepository userRepository,
            CentralAgencyAuditService auditService
    ) {
        this.centralAgencyRepository = centralAgencyRepository;
        this.agencyRepository = agencyRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AgencyResponseDTO> getAllCentralAgencies() {
        return centralAgencyRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AgencyResponseDTO getCentralAgencyById(Long id) {
        CentralAgency agency = centralAgencyRepository.findById(id)
                .orElseThrow(() -> new AgencyNotFoundException(id));
        return toResponse(agency);
    }

    @Transactional
    public AgencyResponseDTO createCentralAgency(CreateAgencyRequestDTO request, Authentication authentication) {
        String code = normalizeCode(request.code());
        if (existsCode(code)) {
            throw new AgencyCodeAlreadyExistsException(code);
        }

        String email = normalizeEmail(request.email());
        if (email != null && existsEmail(email)) {
            throw new AgencyEmailAlreadyExistsException(email);
        }

        LocalDateTime now = LocalDateTime.now();
        CentralAgency agency = new CentralAgency();
        agency.setName(request.name().trim());
        agency.setCode(code);
        agency.setCity(request.city().trim());
        agency.setCountry(request.country().trim());
        agency.setAddress(request.address().trim());
        agency.setPhone(request.phone());
        agency.setEmail(email);
        agency.setDailyLimit(request.dailyLimit());
        agency.setStatus(AgencyStatus.PENDING);
        agency.setActive(false);
        agency.setCreatedAt(now);
        agency.setUpdatedAt(now);
        CentralAgency saved = centralAgencyRepository.save(agency);

        if (request.managerId() != null) {
            assignManagerInternal(saved, request.managerId());
        }

        auditService.logAgencyCreated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public AgencyResponseDTO updateCentralAgency(Long id, UpdateAgencyRequestDTO request, Authentication authentication) {
        CentralAgency agency = centralAgencyRepository.findById(id)
                .orElseThrow(() -> new AgencyNotFoundException(id));

        String email = normalizeEmail(request.email());
        if (email != null
                && (agency.getEmail() == null || !email.equalsIgnoreCase(agency.getEmail()))
                && existsEmail(email)) {
            throw new AgencyEmailAlreadyExistsException(email);
        }

        agency.setName(request.name().trim());
        agency.setCity(request.city().trim());
        agency.setCountry(request.country().trim());
        agency.setAddress(request.address().trim());
        agency.setPhone(request.phone());
        agency.setEmail(email);
        agency.setDailyLimit(request.dailyLimit());
        agency.setUpdatedAt(LocalDateTime.now());
        CentralAgency saved = centralAgencyRepository.save(agency);

        if (request.managerId() != null) {
            assignManagerInternal(saved, request.managerId());
        }

        auditService.logAgencyUpdated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public AgencyResponseDTO changeStatus(Long id, ChangeAgencyStatusRequestDTO request, Authentication authentication) {
        CentralAgency agency = centralAgencyRepository.findById(id)
                .orElseThrow(() -> new AgencyNotFoundException(id));
        applyStatus(agency, request.status());
        agency.setUpdatedAt(LocalDateTime.now());
        CentralAgency saved = centralAgencyRepository.save(agency);

        auditService.logAgencyStatusChanged(currentUserOrNull(authentication), saved, request.status().name());
        return toResponse(saved);
    }

    @Transactional
    public AgencyResponseDTO assignManager(Long id, AssignManagerRequestDTO request, Authentication authentication) {
        CentralAgency agency = centralAgencyRepository.findById(id)
                .orElseThrow(() -> new AgencyNotFoundException(id));
        assignManagerInternal(agency, request.managerId());
        agency.setUpdatedAt(LocalDateTime.now());
        CentralAgency saved = centralAgencyRepository.save(agency);

        auditService.logManagerAssigned(currentUserOrNull(authentication), saved, request.managerId());
        return toResponse(saved);
    }

    @Transactional
    public AgencyResponseDTO disableCentralAgency(Long id, Authentication authentication) {
        CentralAgency agency = centralAgencyRepository.findById(id)
                .orElseThrow(() -> new AgencyNotFoundException(id));
        applyStatus(agency, AgencyStatus.SUSPENDED);
        agency.setUpdatedAt(LocalDateTime.now());
        CentralAgency saved = centralAgencyRepository.save(agency);

        auditService.logAgencyDisabled(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    private void assignManagerInternal(CentralAgency agency, Long managerId) {
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new InvalidManagerException("Manager not found: " + managerId));

        if (manager.getRole() == null || !ROLE_MANAGER.equals(manager.getRole().getName())) {
            throw new InvalidManagerException("User " + managerId + " is not a manager");
        }

        centralAgencyRepository.findByManager_Id(manager.getId()).ifPresent(existing -> {
            if (!existing.getId().equals(agency.getId())) {
                existing.setManager(null);
                existing.setUpdatedAt(LocalDateTime.now());
                centralAgencyRepository.save(existing);
            }
        });

        agency.setManager(manager);
    }

    private void applyStatus(CentralAgency agency, AgencyStatus status) {
        agency.setStatus(status);
        agency.setActive(status == AgencyStatus.ACTIVE);
    }

    private AgencyResponseDTO toResponse(CentralAgency agency) {
        AgencyStatus status = agency.getStatus();
        if (status == null) {
            status = Boolean.TRUE.equals(agency.getActive()) ? AgencyStatus.ACTIVE : AgencyStatus.PENDING;
        }

        return new AgencyResponseDTO(
                agency.getId(),
                agency.getName(),
                agency.getCode(),
                agency.getCity(),
                agency.getCountry(),
                agency.getAddress(),
                agency.getPhone(),
                agency.getEmail(),
                agency.getDailyLimit(),
                status,
                AgencyType.CENTRAL.name(),
                agency.getManager() != null ? agency.getManager().getId() : null,
                buildFullName(agency.getManager()),
                null,
                null,
                agencyRepository.countByCentralAgency_Id(agency.getId()),
                agency.getCreatedAt(),
                agency.getUpdatedAt()
        );
    }

    private boolean existsCode(String code) {
        return agencyRepository.existsByCode(code) || centralAgencyRepository.existsByCode(code);
    }

    private boolean existsEmail(String email) {
        return agencyRepository.existsByEmailIgnoreCase(email) || centralAgencyRepository.existsByEmailIgnoreCase(email);
    }

    private String normalizeCode(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String buildFullName(User user) {
        if (user == null) {
            return null;
        }
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String fullName = (first + " " + last).trim();
        return fullName.isBlank() ? null : fullName;
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
            if (managed != null && managed.getRole() != null) {
                managed.getRole().getName();
            }
            return managed;
        }
        return null;
    }
}
