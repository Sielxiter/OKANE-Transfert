package com.okane.agencymanagement.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.centralagency.repository.CentralAgencyRepository;
import com.okane.agencymanagement.domain.AgencyStatus;
import com.okane.agencymanagement.domain.AgencyType;
import com.okane.agencymanagement.dto.AgencyResponseDTO;
import com.okane.agencymanagement.dto.AssignAgentRequestDTO;
import com.okane.agencymanagement.dto.ChangeAgencyStatusRequestDTO;
import com.okane.agencymanagement.dto.CreateAgencyRequestDTO;
import com.okane.agencymanagement.dto.UpdateAgencyRequestDTO;
import com.okane.agencymanagement.exception.AgencyCodeAlreadyExistsException;
import com.okane.agencymanagement.exception.AgencyEmailAlreadyExistsException;
import com.okane.agencymanagement.exception.AgencyNotFoundException;
import com.okane.agencymanagement.exception.InvalidAgentException;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.centralagency.entity.CentralAgency;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgencyService {

    private static final String ROLE_AGENT = "ROLE_AGENT";

    private final AgencyRepository agencyRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final CentralAgencyRepository centralAgencyRepository;
    private final UserRepository userRepository;
    private final AgencyAuditService auditService;

    public AgencyService(
            AgencyRepository agencyRepository,
            AgencyUserRepository agencyUserRepository,
            CentralAgencyRepository centralAgencyRepository,
            UserRepository userRepository,
            AgencyAuditService auditService
    ) {
        this.agencyRepository = agencyRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.centralAgencyRepository = centralAgencyRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AgencyResponseDTO> getAllAgencies() {
        return agencyRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AgencyResponseDTO getAgencyById(Long id) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));
        return toResponse(agency);
    }

    @Transactional
    public AgencyResponseDTO createAgency(CreateAgencyRequestDTO request, Authentication authentication) {
        String code = normalizeCode(request.code());
        if (existsCode(code)) {
            throw new AgencyCodeAlreadyExistsException(code);
        }

        String email = normalizeEmail(request.email());
        if (email != null && existsEmail(email)) {
            throw new AgencyEmailAlreadyExistsException(email);
        }

        Long centralAgencyId = request.centralAgencyId();
        if (centralAgencyId == null) {
            throw new InvalidAgentException("A central agency is required for a sub-agency");
        }
        CentralAgency centralAgency = centralAgencyRepository.findById(centralAgencyId)
                .orElseThrow(() -> new AgencyNotFoundException(centralAgencyId));

        LocalDateTime now = LocalDateTime.now();
        Agency agency = new Agency();
        agency.setName(request.name().trim());
        agency.setCode(code);
        agency.setCity(request.city().trim());
        agency.setCountry(request.country().trim());
        agency.setAddress(request.address().trim());
        agency.setPhone(request.phone());
        agency.setEmail(email);
        agency.setDailyLimit(request.dailyLimit());
        agency.setCentralAgency(centralAgency);
        agency.setStatus(AgencyStatus.PENDING);
        agency.setActive(false);
        agency.setCreatedAt(now);
        agency.setUpdatedAt(now);
        Agency saved = agencyRepository.save(agency);

        auditService.logAgencyCreated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public AgencyResponseDTO updateAgency(Long id, UpdateAgencyRequestDTO request, Authentication authentication) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));

        String email = normalizeEmail(request.email());
        if (email != null
                && (agency.getEmail() == null || !email.equalsIgnoreCase(agency.getEmail()))
                && existsEmail(email)) {
            throw new AgencyEmailAlreadyExistsException(email);
        }

        if (request.centralAgencyId() != null) {
            CentralAgency centralAgency = centralAgencyRepository.findById(request.centralAgencyId())
                    .orElseThrow(() -> new AgencyNotFoundException(request.centralAgencyId()));
            agency.setCentralAgency(centralAgency);
        }

        agency.setName(request.name().trim());
        agency.setCity(request.city().trim());
        agency.setCountry(request.country().trim());
        agency.setAddress(request.address().trim());
        agency.setPhone(request.phone());
        agency.setEmail(email);
        agency.setDailyLimit(request.dailyLimit());
        agency.setUpdatedAt(LocalDateTime.now());
        Agency saved = agencyRepository.save(agency);

        auditService.logAgencyUpdated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public AgencyResponseDTO changeAgencyStatus(
            Long id,
            ChangeAgencyStatusRequestDTO request,
            Authentication authentication
    ) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));
        applyStatus(agency, request.status());
        agency.setUpdatedAt(LocalDateTime.now());
        Agency saved = agencyRepository.save(agency);

        auditService.logAgencyStatusChanged(currentUserOrNull(authentication), saved, request.status().name());
        return toResponse(saved);
    }

    @Transactional
    public AgencyResponseDTO assignAgent(
            Long id,
            AssignAgentRequestDTO request,
            Authentication authentication
    ) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));
        User agent = userRepository.findById(request.agentId())
                .orElseThrow(() -> new InvalidAgentException("Agent not found: " + request.agentId()));

        if (agent.getRole() == null || !ROLE_AGENT.equals(agent.getRole().getName())) {
            throw new InvalidAgentException("User " + agent.getId() + " is not an agent");
        }

        var existing = agencyUserRepository.findFirstByUser_IdAndActiveTrue(agent.getId());
        if (existing.isPresent()) {
            AgencyUser current = existing.get();
            if (current.getAgency() != null && current.getAgency().getId().equals(agency.getId())) {
                return toResponse(agency);
            }
            throw new InvalidAgentException(
                    "Agent " + agent.getId() + " is already assigned to agency "
                            + current.getAgency().getCode());
        }

        AgencyUser membership = new AgencyUser();
        membership.setAgency(agency);
        membership.setUser(agent);
        membership.setActive(true);
        membership.setAssignedAt(LocalDateTime.now());
        agencyUserRepository.save(membership);

        agency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(agency);

        auditService.logAgentAssigned(currentUserOrNull(authentication), agency, agent.getId());
        return toResponse(agency);
    }

    @Transactional
    public AgencyResponseDTO removeAgent(Long id, Long agentId, Authentication authentication) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new InvalidAgentException("Agent not found: " + agentId));

        AgencyUser membership = agencyUserRepository
                .findFirstByAgency_IdAndUser_IdAndActiveTrue(agency.getId(), agent.getId())
                .orElseThrow(() -> new InvalidAgentException(
                        "Agent " + agentId + " is not assigned to agency " + agency.getCode()));

        if (agent.getRole() == null || !ROLE_AGENT.equals(agent.getRole().getName())) {
            throw new InvalidAgentException("User " + agentId + " is not an agent");
        }

        membership.setActive(false);
        agencyUserRepository.save(membership);

        agency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(agency);

        auditService.logAgentRemoved(currentUserOrNull(authentication), agency, agent.getId());
        return toResponse(agency);
    }

    @Transactional
    public AgencyResponseDTO disableAgency(Long id, Authentication authentication) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));
        applyStatus(agency, AgencyStatus.SUSPENDED);
        agency.setUpdatedAt(LocalDateTime.now());
        Agency saved = agencyRepository.save(agency);

        auditService.logAgencyDisabled(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    private void applyStatus(Agency agency, AgencyStatus status) {
        agency.setStatus(status);
        agency.setActive(status == AgencyStatus.ACTIVE);
    }

    private AgencyResponseDTO toResponse(Agency agency) {
        AgencyStatus status = agency.getStatus();
        if (status == null) {
            status = Boolean.TRUE.equals(agency.getActive()) ? AgencyStatus.ACTIVE : AgencyStatus.PENDING;
        }

        CentralAgency centralAgency = agency.getCentralAgency();
        long agentsCount = agencyUserRepository
                .countByAgency_IdAndUser_Role_NameAndActiveTrue(agency.getId(), ROLE_AGENT);

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
                AgencyType.SUB.name(),
                null,
                null,
                centralAgency != null ? centralAgency.getId() : null,
                centralAgency != null ? centralAgency.getName() : null,
                agentsCount,
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
