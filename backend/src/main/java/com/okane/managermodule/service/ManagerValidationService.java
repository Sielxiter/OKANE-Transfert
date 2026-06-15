package com.okane.managermodule.service;

import com.okane.compliance.entity.ComplianceAlert;
import com.okane.compliancemanagement.repository.ComplianceAlertRepository;
import com.okane.managermodule.dto.ValidationListDto;
import com.okane.transfer.repository.TransferRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ManagerValidationService {

    private final ManagerScopeResolver scopeResolver;
    private final ComplianceAlertRepository complianceAlertRepository;
    private final TransferRepository transferRepository;

    public ManagerValidationService(ManagerScopeResolver scopeResolver,
                                     ComplianceAlertRepository complianceAlertRepository,
                                     TransferRepository transferRepository) {
        this.scopeResolver = scopeResolver;
        this.complianceAlertRepository = complianceAlertRepository;
        this.transferRepository = transferRepository;
    }

    @Transactional(readOnly = true)
    public long getPendingCount(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        if (scope.getSubAgencyIds().isEmpty()) return 0L;
        List<ComplianceAlert> pending = complianceAlertRepository.findByStatusAndAgencyIdsOrderByCreatedAtDesc("PENDING", scope.getSubAgencyIds());
        return pending.size();
    }

    @Transactional(readOnly = true)
    public List<ValidationListDto> getValidations(Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        if (scope.getSubAgencyIds().isEmpty()) return List.of();

        return complianceAlertRepository.findByStatusAndAgencyIdsOrderByCreatedAtDesc("PENDING", scope.getSubAgencyIds())
                .stream()
                .map(this::toValidationDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveValidation(Long validationId, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        ComplianceAlert alert = complianceAlertRepository.findById(validationId)
                .orElseThrow(() -> new RuntimeException("Validation not found"));

        verifyScope(alert, scope, validationId);

        alert.setStatus("RESOLVED");
        complianceAlertRepository.save(alert);
    }

    @Transactional
    public void rejectValidation(Long validationId, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        ComplianceAlert alert = complianceAlertRepository.findById(validationId)
                .orElseThrow(() -> new RuntimeException("Validation not found"));

        verifyScope(alert, scope, validationId);

        alert.setStatus("REJECTED");
        complianceAlertRepository.save(alert);
    }

    private void verifyScope(ComplianceAlert alert, ManagerScope scope, Long validationId) {
        if (alert.getTransferId() != null) {
            var transfer = transferRepository.findById(alert.getTransferId());
            if (transfer.isPresent() && transfer.get().getSourceAgency() != null &&
                !scope.getSubAgencyIds().contains(transfer.get().getSourceAgency().getId())) {
                throw new RuntimeException("Access denied to validation: " + validationId);
            }
        }
    }

    private ValidationListDto toValidationDto(ComplianceAlert alert) {
        return new ValidationListDto(
                alert.getId(),
                alert.getAlertType(),
                "ALERT-" + alert.getId(),
                alert.getMessage(),
                alert.getCustomer() != null ? alert.getCustomer().getUser().getFirstName() + " " + alert.getCustomer().getUser().getLastName() : "System",
                "CLIENT",
                alert.getStatus(),
                alert.getCreatedAt(),
                alert.getTransferId(),
                "TRANSFER"
        );
    }
}
