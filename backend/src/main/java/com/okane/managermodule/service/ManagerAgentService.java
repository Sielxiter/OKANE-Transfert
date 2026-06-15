package com.okane.managermodule.service;

import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.managermodule.dto.AgentListDto;
import com.okane.managermodule.dto.AgentDetailsDto;
import com.okane.managermodule.exception.ManagerAccessDeniedException;
import com.okane.usermanagement.domain.AccountStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerAgentService {

    private final ManagerScopeResolver scopeResolver;
    private final AgencyUserRepository agencyUserRepository;
    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;

    public ManagerAgentService(ManagerScopeResolver scopeResolver,
                               AgencyUserRepository agencyUserRepository,
                               UserRepository userRepository,
                               AgencyRepository agencyRepository) {
        this.scopeResolver = scopeResolver;
        this.agencyUserRepository = agencyUserRepository;
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
    }

    @Transactional(readOnly = true)
    public List<AgentListDto> getAgents(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());

        return scope.getSubAgencyIds().stream()
                .flatMap(agencyId -> agencyUserRepository.findByAgency_IdAndUser_Role_NameAndActiveTrue(agencyId, "ROLE_AGENT").stream())
                .map(this::toAgentListDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AgentListDto getAgentById(Long agentId, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ManagerAccessDeniedException("Agent not found: " + agentId));

        AgencyUser assignment = agencyUserRepository.findFirstByUser_IdAndActiveTrue(agentId)
                .orElseThrow(() -> new ManagerAccessDeniedException("Agent not assigned to any agency"));

        if (!scope.getSubAgencyIds().contains(assignment.getAgency().getId())) {
            throw new ManagerAccessDeniedException("Access denied to agent: " + agentId);
        }

        return toAgentListDto(assignment);
    }

    @Transactional
    public void changeAgentStatus(Long agentId, String status, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ManagerAccessDeniedException("Agent not found: " + agentId));

        AgencyUser assignment = agencyUserRepository.findFirstByUser_IdAndActiveTrue(agentId)
                .orElseThrow(() -> new ManagerAccessDeniedException("Agent not assigned to any agency"));

        if (!scope.getSubAgencyIds().contains(assignment.getAgency().getId())) {
            throw new ManagerAccessDeniedException("Access denied to agent: " + agentId);
        }

        if ("SUSPENDED".equalsIgnoreCase(status)) {
            agent.setAccountSuspended(true);
            agent.setEnabled(false);
        } else if ("ACTIVE".equalsIgnoreCase(status)) {
            agent.setAccountSuspended(false);
            agent.setEnabled(true);
        }
        userRepository.save(agent);
    }

    private AgentListDto toAgentListDto(AgencyUser agencyUser) {
        User u = agencyUser.getUser();
        return new AgentListDto(
                u.getId(),
                u.getFirstName(),
                u.getLastName(),
                u.getFirstName() + " " + u.getLastName(),
                u.getEmail(),
                u.getPhone(),
                u.getAccountSuspended() != null && u.getAccountSuspended() ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE,
                null,
                agencyUser.getAgency().getId(),
                agencyUser.getAgency().getName(),
                agencyUser.getAgency().getCode(),
                u.getLastLoginAt(),
                u.getCreatedAt()
        );
    }
}
