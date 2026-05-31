package com.okane.manager.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.Role;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.RoleRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.manager.dto.ManagerAgentRequest;
import com.okane.manager.dto.ManagerAgentResponse;
import com.okane.manager.dto.ManagerAgentUpdateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ManagerAgentManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final PasswordEncoder passwordEncoder;

    public ManagerAgentManagementService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            AgencyUserRepository agencyUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<ManagerAgentResponse> getAgents(Authentication authentication) {
        Agency agency = resolveAgency(authentication);

        List<AgencyUser> agencyUsers = agencyUserRepository.findByAgency_IdAndUser_Role_NameAndActiveTrue(
                agency.getId(),
                "ROLE_AGENT"
        );

        return agencyUsers.stream()
                .map(au -> toAgentResponse(au.getUser(), agency))
                .toList();
    }

    @Transactional(readOnly = true)
    public ManagerAgentResponse getAgent(Authentication authentication, Long agentId) {
        Agency agency = resolveAgency(authentication);

        AgencyUser agencyUser = agencyUserRepository
                .findByUser_IdAndAgency_Id(agentId, agency.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Agent non trouvé dans votre agence"
                ));

        User user = agencyUser.getUser();
        if (user.getRole() == null || !"ROLE_AGENT".equals(user.getRole().getName())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Cet utilisateur n'est pas un agent"
            );
        }

        return toAgentResponse(user, agency);
    }

    @Transactional
    public ManagerAgentResponse createAgent(Authentication authentication, ManagerAgentRequest request) {
        Agency agency = resolveAgency(authentication);

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Un utilisateur avec cet email existe déjà"
            );
        }

        boolean alreadyExists = agencyUserRepository.existsByUser_EmailAndAgency_IdAndActiveTrue(
                request.email(),
                agency.getId()
        );
        if (alreadyExists) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Un agent avec cet email est déjà affecté à votre agence"
            );
        }

        Role agentRole = roleRepository.findByName("ROLE_AGENT")
                .orElseThrow(() -> new ApiException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Rôle ROLE_AGENT non trouvé"
                ));

        User newAgent = new User();
        newAgent.setFirstName(request.prenom());
        newAgent.setLastName(request.nom());
        newAgent.setEmail(request.email().toLowerCase());
        newAgent.setPasswordHash(passwordEncoder.encode(request.motDePasse()));
        newAgent.setPhone(request.telephone());
        newAgent.setEnabled(request.actif());
        newAgent.setAccountLocked(false);
        newAgent.setAccountSuspended(false);
        newAgent.setFailedLoginAttempts(0);
        newAgent.setRole(agentRole);
        newAgent.setCreatedAt(LocalDateTime.now());
        newAgent.setUpdatedAt(LocalDateTime.now());

        userRepository.save(newAgent);

        AgencyUser agencyUser = new AgencyUser();
        agencyUser.setAgency(agency);
        agencyUser.setUser(newAgent);
        agencyUser.setActive(true);
        agencyUser.setAssignedAt(LocalDateTime.now());

        agencyUserRepository.save(agencyUser);

        return toAgentResponse(newAgent, agency);
    }

    @Transactional
    public ManagerAgentResponse updateAgent(
            Authentication authentication,
            Long agentId,
            ManagerAgentUpdateRequest request
    ) {
        Agency agency = resolveAgency(authentication);

        AgencyUser agencyUser = agencyUserRepository
                .findByUser_IdAndAgency_Id(agentId, agency.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Agent non trouvé dans votre agence"
                ));

        User agent = agencyUser.getUser();

        if (agent.getRole() == null || !"ROLE_AGENT".equals(agent.getRole().getName())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Cet utilisateur n'est pas un agent"
            );
        }

        if (!agent.getEmail().equalsIgnoreCase(request.email()) &&
                userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Un autre utilisateur avec cet email existe déjà"
            );
        }

        agent.setFirstName(request.prenom());
        agent.setLastName(request.nom());
        agent.setEmail(request.email().toLowerCase());
        agent.setPhone(request.telephone());
        agent.setEnabled(request.actif());
        agent.setUpdatedAt(LocalDateTime.now());

        userRepository.save(agent);

        return toAgentResponse(agent, agency);
    }

    @Transactional
    public ManagerAgentResponse toggleAgentStatus(Authentication authentication, Long agentId) {
        Agency agency = resolveAgency(authentication);

        AgencyUser agencyUser = agencyUserRepository
                .findByUser_IdAndAgency_Id(agentId, agency.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Agent non trouvé dans votre agence"
                ));

        User agent = agencyUser.getUser();

        if (agent.getRole() == null || !"ROLE_AGENT".equals(agent.getRole().getName())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Cet utilisateur n'est pas un agent"
            );
        }

        agent.setEnabled(!agent.getEnabled());
        agent.setUpdatedAt(LocalDateTime.now());

        userRepository.save(agent);

        return toAgentResponse(agent, agency);
    }

    @Transactional
    public void deleteAgent(Authentication authentication, Long agentId) {
        Agency agency = resolveAgency(authentication);

        AgencyUser agencyUser = agencyUserRepository
                .findByUser_IdAndAgency_Id(agentId, agency.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Agent non trouvé dans votre agence"
                ));

        agencyUser.setActive(false);
        agencyUserRepository.save(agencyUser);

        User agent = agencyUser.getUser();
        agent.setEnabled(false);
        agent.setUpdatedAt(LocalDateTime.now());
        userRepository.save(agent);
    }

    private ManagerAgentResponse toAgentResponse(User agent, Agency agency) {
        return new ManagerAgentResponse(
                agent.getId(),
                agent.getFirstName(),
                agent.getLastName(),
                agent.getEmail(),
                agent.getPhone(),
                agent.getEnabled(),
                agent.getRole() != null ? agent.getRole().getName() : null,
                agency != null ? agency.getName() : null,
                agent.getCreatedAt(),
                agent.getUpdatedAt()
        );
    }

    private Agency resolveAgency(Authentication authentication) {
        User user = resolveUser(authentication);
        AgencyUser agencyUser = agencyUserRepository
                .findFirstByUser_IdAndActiveTrue(user.getId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Manager non affecté à une agence"
                ));
        return agencyUser.getAgency();
    }

    private User resolveUser(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof OkaneUserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findById(principal.getUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }
}