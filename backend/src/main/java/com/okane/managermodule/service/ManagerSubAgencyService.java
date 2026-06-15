package com.okane.managermodule.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.managermodule.dto.SubAgencyListDto;
import com.okane.managermodule.dto.SubAgencyDetailsDto;
import com.okane.managermodule.exception.ManagerAccessDeniedException;
import com.okane.managermodule.exception.SubAgencyNotFoundException;
import com.okane.transfer.repository.TransferRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerSubAgencyService {

    private final ManagerScopeResolver scopeResolver;
    private final AgencyRepository agencyRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final TransferRepository transferRepository;

    public ManagerSubAgencyService(ManagerScopeResolver scopeResolver,
                                   AgencyRepository agencyRepository,
                                   AgencyUserRepository agencyUserRepository,
                                   TransferRepository transferRepository) {
        this.scopeResolver = scopeResolver;
        this.agencyRepository = agencyRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.transferRepository = transferRepository;
    }

    @Transactional(readOnly = true)
    public List<SubAgencyListDto> getSubAgencies(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        List<Agency> agencies = agencyRepository.findByCentralAgency_IdOrderByCreatedAtDesc(scope.getCentralAgencyId());

        return agencies.stream()
                .map(this::toSubAgencyListDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubAgencyDetailsDto getSubAgencyDetails(Long agencyId, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new SubAgencyNotFoundException("Sub-agency not found: " + agencyId));

        if (!agency.getCentralAgency().getId().equals(scope.getCentralAgencyId())) {
            throw new ManagerAccessDeniedException("Access denied to sub-agency: " + agencyId);
        }

        return toSubAgencyDetailsDto(agency);
    }

    private SubAgencyListDto toSubAgencyListDto(Agency agency) {
        long agentCount = agencyUserRepository.countByAgency_IdAndUser_Role_NameAndActiveTrue(agency.getId(), "ROLE_AGENT");

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        long transferCountToday = transferRepository.countByCreatedAtBetweenAndSourceAgency_IdIn(todayStart, todayEnd, List.of(agency.getId()));

        return new SubAgencyListDto(
                agency.getId(),
                agency.getName(),
                agency.getCode(),
                agency.getCity(),
                agency.getCountry(),
                agency.getPhone(),
                agency.getEmail(),
                agency.getDailyLimit(),
                agency.getStatus(),
                agentCount,
                transferCountToday,
                agency.getCreatedAt()
        );
    }

    private SubAgencyDetailsDto toSubAgencyDetailsDto(Agency agency) {
        long agentCount = agencyUserRepository.countByAgency_IdAndUser_Role_NameAndActiveTrue(agency.getId(), "ROLE_AGENT");
        long activeAgentCount = agentCount;

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        long transferCountToday = transferRepository.countByCreatedAtBetweenAndSourceAgency_IdIn(todayStart, todayEnd, List.of(agency.getId()));

        List<AgencyUser> agents = agencyUserRepository.findByAgency_IdAndUser_Role_NameAndActiveTrue(agency.getId(), "ROLE_AGENT");
        List<SubAgencyDetailsDto.AgentSummaryDto> agentSummaries = agents.stream()
                .map(au -> {
                    User u = au.getUser();
                    return new SubAgencyDetailsDto.AgentSummaryDto(
                            u.getId(),
                            u.getFirstName() + " " + u.getLastName(),
                            u.getEmail(),
                            u.getPhone(),
                            u.getEnabled() != null && u.getEnabled()
                    );
                })
                .collect(Collectors.toList());

        return new SubAgencyDetailsDto(
                agency.getId(),
                agency.getName(),
                agency.getCode(),
                agency.getCity(),
                agency.getCountry(),
                agency.getAddress(),
                agency.getPhone(),
                agency.getEmail(),
                agency.getDailyLimit(),
                agency.getStatus(),
                agentCount,
                activeAgentCount,
                transferCountToday,
                BigDecimal.ZERO,
                agency.getCreatedAt(),
                agency.getUpdatedAt(),
                agentSummaries
        );
    }
}
