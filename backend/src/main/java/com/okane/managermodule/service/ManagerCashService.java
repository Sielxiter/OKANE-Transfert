package com.okane.managermodule.service;

import com.okane.cash.entity.CashClosure;
import com.okane.cash.entity.FundDiscrepancy;
import com.okane.cash.repository.AgentCashSessionRepository;
import com.okane.cash.repository.CashClosureRepository;
import com.okane.cash.repository.FundDiscrepancyRepository;
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
    private final FundDiscrepancyRepository discrepancyRepository;

    public ManagerCashService(ManagerScopeResolver scopeResolver,
                               AgentCashSessionRepository agentCashSessionRepository,
                               CashClosureRepository cashClosureRepository,
                               FundDiscrepancyRepository discrepancyRepository) {
        this.scopeResolver = scopeResolver;
        this.agentCashSessionRepository = agentCashSessionRepository;
        this.cashClosureRepository = cashClosureRepository;
        this.discrepancyRepository = discrepancyRepository;
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
    public List<CashClosureListDto> getCashDiscrepancies(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        if (scope.getSubAgencyIds().isEmpty()) return List.of();

        return discrepancyRepository.findByCashSession_Agency_IdInOrderByReportedAtDesc(scope.getSubAgencyIds())
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
        if (closure == null) {
            return new CashClosureListDto(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        }
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
                closure.getCashSession() != null && closure.getCashSession().getSessionDate() != null
                        ? closure.getCashSession().getSessionDate().toString()
                        : null,
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

    private CashClosureListDto toCashClosureListDto(FundDiscrepancy discrepancy) {
        CashClosure closure = discrepancy.getCashClosure();
        CashClosureListDto base = toCashClosureListDto(closure);
        return new CashClosureListDto(
                base.id(),
                base.sessionId(),
                base.agentName(),
                base.agentEmail(),
                base.agencyName(),
                base.agencyCode(),
                base.sessionDate(),
                base.openingBalance(),
                discrepancy.getExpectedBalance(),
                discrepancy.getActualBalance(),
                discrepancy.getDifferenceAmount(),
                discrepancy.getStatus(),
                discrepancy.getDescription(),
                closure != null ? closure.getClosedAt() : discrepancy.getReportedAt(),
                closure != null ? closure.getValidatedAt() : null
        );
    }
}
