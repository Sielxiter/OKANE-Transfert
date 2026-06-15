package com.okane.managermodule.service;

import com.okane.cash.entity.CashClosure;
import com.okane.cash.repository.AgentCashSessionRepository;
import com.okane.cash.repository.CashClosureRepository;
import com.okane.managermodule.dto.CashClosureListDto;
import com.okane.managermodule.exception.ManagerAccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerCashService {

    private final ManagerScopeResolver scopeResolver;
    private final AgentCashSessionRepository agentCashSessionRepository;
    private final CashClosureRepository cashClosureRepository;

    public ManagerCashService(ManagerScopeResolver scopeResolver,
                               AgentCashSessionRepository agentCashSessionRepository,
                               CashClosureRepository cashClosureRepository) {
        this.scopeResolver = scopeResolver;
        this.agentCashSessionRepository = agentCashSessionRepository;
        this.cashClosureRepository = cashClosureRepository;
    }

    @Transactional(readOnly = true)
    public List<CashClosureListDto> getCashClosures(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        if (scope.getSubAgencyIds().isEmpty()) return List.of();

        return cashClosureRepository.findByCashSession_Agency_IdInOrderByClosedAtDesc(scope.getSubAgencyIds())
                .stream()
                .map(this::toCashClosureListDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CashClosureListDto getCashClosureDetails(Long closureId, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        CashClosure closure = cashClosureRepository.findByIdAndCashSession_Agency_IdIn(closureId, scope.getSubAgencyIds())
                .orElseThrow(() -> new ManagerAccessDeniedException("Cash closure not found or access denied: " + closureId));
        return toCashClosureListDto(closure);
    }

    @Transactional
    public void validateCashClosure(Long closureId, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        CashClosure closure = cashClosureRepository.findByIdAndCashSession_Agency_IdIn(closureId, scope.getSubAgencyIds())
                .orElseThrow(() -> new ManagerAccessDeniedException("Cash closure not found or access denied: " + closureId));

        closure.setStatus("VALIDATED");
        closure.setValidatedAt(LocalDateTime.now());
        cashClosureRepository.save(closure);
    }

    private CashClosureListDto toCashClosureListDto(CashClosure closure) {
        return new CashClosureListDto(
                closure.getId(),
                closure.getCashSession() != null ? closure.getCashSession().getId() : null,
                closure.getCashSession() != null && closure.getCashSession().getAgent() != null
                        ? closure.getCashSession().getAgent().getFirstName() + " " + closure.getCashSession().getAgent().getLastName()
                        : "Unknown",
                closure.getCashSession() != null && closure.getCashSession().getAgent() != null
                        ? closure.getCashSession().getAgent().getEmail()
                        : null,
                closure.getCashSession() != null && closure.getCashSession().getAgency() != null
                        ? closure.getCashSession().getAgency().getName()
                        : null,
                closure.getCashSession() != null && closure.getCashSession().getAgency() != null
                        ? closure.getCashSession().getAgency().getCode()
                        : null,
                closure.getCashSession() != null ? closure.getCashSession().getSessionDate().toString() : null,
                closure.getCashSession() != null ? closure.getCashSession().getOpeningBalance() : null,
                closure.getExpectedBalance(),
                closure.getActualBalance(),
                closure.getDifferenceAmount(),
                closure.getStatus(),
                closure.getNote(),
                closure.getClosedAt(),
                closure.getValidatedAt()
        );
    }
}
