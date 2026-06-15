package com.okane.managermodule.service;

import com.okane.compliance.entity.ComplianceAlert;
import com.okane.compliancemanagement.repository.ComplianceAlertRepository;
import com.okane.managermodule.dto.AlertListDto;
import com.okane.transfer.repository.TransferRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerAlertService {

    private final ManagerScopeResolver scopeResolver;
    private final ComplianceAlertRepository complianceAlertRepository;
    private final TransferRepository transferRepository;

    public ManagerAlertService(ManagerScopeResolver scopeResolver,
                               ComplianceAlertRepository complianceAlertRepository,
                               TransferRepository transferRepository) {
        this.scopeResolver = scopeResolver;
        this.complianceAlertRepository = complianceAlertRepository;
        this.transferRepository = transferRepository;
    }

    @Transactional(readOnly = true)
    public long getUnresolvedCount(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        if (scope.getSubAgencyIds().isEmpty()) return 0L;
        // Since ComplianceAlert only has transferId, we need to check scope via transfer lookup
        List<ComplianceAlert> allPending = complianceAlertRepository.findByStatusAndAgencyIdsOrderByCreatedAtDesc("PENDING", scope.getSubAgencyIds());
        return allPending.size();
    }

    @Transactional(readOnly = true)
    public List<AlertListDto> getAlerts(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        if (scope.getSubAgencyIds().isEmpty()) return List.of();

        return complianceAlertRepository.findByAgencyIdsOrderByCreatedAtDesc(scope.getSubAgencyIds())
                .stream()
                .map(this::toAlertDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void resolveAlert(Long alertId, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        ComplianceAlert alert = complianceAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        
        // Verify alert belongs to manager's scope via transferId
        if (alert.getTransferId() != null) {
            var transfer = transferRepository.findById(alert.getTransferId());
            if (transfer.isPresent() && transfer.get().getSourceAgency() != null &&
                !scope.getSubAgencyIds().contains(transfer.get().getSourceAgency().getId())) {
                throw new RuntimeException("Access denied to alert: " + alertId);
            }
        }
        
        alert.setStatus("RESOLVED");
        complianceAlertRepository.save(alert);
    }

    private AlertListDto toAlertDto(ComplianceAlert alert) {
        return new AlertListDto(
                alert.getId(),
                alert.getAlertType(),
                alert.getRiskLevel(),
                alert.getMessage() != null && alert.getMessage().length() > 50 ? alert.getMessage().substring(0, 50) + "..." : alert.getMessage(),
                alert.getMessage(),
                alert.getStatus(),
                alert.getTransferId(),
                "TRANSFER",
                alert.getCreatedAt(),
                null
        );
    }
}
