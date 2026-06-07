package com.okane.agencymanagement.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.agencymanagement.domain.AgencyStatus;
import com.okane.agencymanagement.dto.AgencyResponseDTO;
import com.okane.agencymanagement.dto.AssignAgentRequestDTO;
import com.okane.agencymanagement.dto.AssignManagerRequestDTO;
import com.okane.agencymanagement.dto.ChangeAgencyStatusRequestDTO;
import com.okane.agencymanagement.dto.CreateAgencyRequestDTO;
import com.okane.agencymanagement.dto.UpdateAgencyRequestDTO;
import com.okane.agencymanagement.exception.AgencyCodeAlreadyExistsException;
import com.okane.agencymanagement.exception.AgencyEmailAlreadyExistsException;
import com.okane.agencymanagement.exception.AgencyNotFoundException;
import com.okane.agencymanagement.exception.InvalidAgentException;
import com.okane.agencymanagement.exception.InvalidManagerException;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgencyService {

    private static final String ROLE_MANAGER = "ROLE_MANAGER";
    private static final String ROLE_AGENT = "ROLE_AGENT";

    private final AgencyRepository agencyRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final UserRepository userRepository;
    private final AgencyAuditService auditService;

    public AgencyService(
            AgencyRepository agencyRepository,
            AgencyUserRepository agencyUserRepository,
            UserRepository userRepository,
            AgencyAuditService auditService
    ) {
        this.agencyRepository = agencyRepository;
        this.agencyUserRepository = agencyUserRepository;
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
        String code = request.code().trim();
        if (agencyRepository.existsByCode(code)) {
            throw new AgencyCodeAlreadyExistsException(code);
        }

        String email = request.email() == null ? null : request.email().trim();
        if (email != null && !email.isBlank() && agencyRepository.existsByEmailIgnoreCase(email)) {
            throw new AgencyEmailAlreadyExistsException(email);
        }

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
        agency.setStatus(AgencyStatus.PENDING);
        agency.setActive(false);
        agency.setCreatedAt(now);
        agency.setUpdatedAt(now);
        Agency saved = agencyRepository.save(agency);

        if (request.managerId() != null) {
            assignManagerInternal(saved, request.managerId());
        }

        auditService.logAgencyCreated(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public AgencyResponseDTO updateAgency(Long id, UpdateAgencyRequestDTO request, Authentication authentication) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));

        String email = request.email() == null ? null : request.email().trim();
        if (email != null && !email.isBlank()
                && (agency.getEmail() == null || !email.equalsIgnoreCase(agency.getEmail()))
                && agencyRepository.existsByEmailIgnoreCase(email)) {
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
        Agency saved = agencyRepository.save(agency);

        if (request.managerId() != null) {
            assignManagerInternal(saved, request.managerId());
        }

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
    public AgencyResponseDTO assignManager(
            Long id,
            AssignManagerRequestDTO request,
            Authentication authentication
    ) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));
        assignManagerInternal(agency, request.managerId());
        agency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(agency);

        auditService.logManagerAssigned(currentUserOrNull(authentication), agency, request.managerId());
        return toResponse(agency);
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

        Optional<AgencyUser> existing = agencyUserRepository.findFirstByUser_IdAndActiveTrue(agent.getId());
        if (existing.isPresent()) {
            AgencyUser current = existing.get();
            if (current.getAgency() != null && current.getAgency().getId().equals(agency.getId())) {
                // Already assigned: idempotent.
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

    /**
     * Soft delete: switches the agency to {@link AgencyStatus#SUSPENDED} and
     * flips the legacy {@code active} flag to false. We never hard-delete an
     * agency in order to preserve referential integrity with audit logs,
     * transfers, cash sessions, etc.
     */
    @Transactional
    public AgencyResponseDTO disableAgency(Long id, Authentication authentication) {
        Agency agency = agencyRepository.findById(id).orElseThrow(() -> new AgencyNotFoundException(id));
        applyStatus(agency, AgencyStatus.SUSPENDED);
        agency.setUpdatedAt(LocalDateTime.now());
        Agency saved = agencyRepository.save(agency);

        auditService.logAgencyDisabled(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    private void assignManagerInternal(Agency agency, Long managerId) {
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new InvalidManagerException("Manager not found: " + managerId));

        if (manager.getRole() == null || !ROLE_MANAGER.equals(manager.getRole().getName())) {
            throw new InvalidManagerException("User " + managerId + " is not a manager");
        }

        // Deactivate any other active manager already attached to this agency.
        agencyUserRepository
                .findFirstByAgency_IdAndUser_Role_NameAndActiveTrue(agency.getId(), ROLE_MANAGER)
                .ifPresent(existing -> {
                    if (!existing.getUser().getId().equals(manager.getId())) {
                        existing.setActive(false);
                        agencyUserRepository.save(existing);
                    }
                });

        // Move the manager away from any other agency they may currently manage.
        agencyUserRepository.findFirstByUser_IdAndActiveTrue(manager.getId()).ifPresent(existing -> {
            if (existing.getAgency() != null && !existing.getAgency().getId().equals(agency.getId())) {
                existing.setActive(false);
                agencyUserRepository.save(existing);
            }
        });

        Optional<AgencyUser> alreadyHere = agencyUserRepository
                .findFirstByAgency_IdAndUser_IdAndActiveTrue(agency.getId(), manager.getId());
        if (alreadyHere.isPresent()) {
            return;
        }

        AgencyUser membership = new AgencyUser();
        membership.setAgency(agency);
        membership.setUser(manager);
        membership.setActive(true);
        membership.setAssignedAt(LocalDateTime.now());
        agencyUserRepository.save(membership);
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

        AgencyUser managerLink = agencyUserRepository
                .findFirstByAgency_IdAndUser_Role_NameAndActiveTrue(agency.getId(), ROLE_MANAGER)
                .orElse(null);
        long agentsCount = agencyUserRepository
                .countByAgency_IdAndUser_Role_NameAndActiveTrue(agency.getId(), ROLE_AGENT);

        Long managerId = managerLink != null && managerLink.getUser() != null
                ? managerLink.getUser().getId()
                : null;
        String managerName = managerLink != null && managerLink.getUser() != null
                ? buildFullName(managerLink.getUser())
                : null;

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
                managerId,
                managerName,
                agentsCount,
                agency.getCreatedAt(),
                agency.getUpdatedAt()
        );
    }

    private String buildFullName(User user) {
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        return (first + " " + last).trim();
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
