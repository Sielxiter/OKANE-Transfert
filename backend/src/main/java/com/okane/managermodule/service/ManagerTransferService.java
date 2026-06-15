package com.okane.managermodule.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.managermodule.dto.TransferListDto;
import com.okane.managermodule.dto.TransferDetailsDto;
import com.okane.managermodule.exception.ManagerAccessDeniedException;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.repository.TransferRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ManagerTransferService {

    private final ManagerScopeResolver scopeResolver;
    private final TransferRepository transferRepository;
    private final AgencyRepository agencyRepository;

    public ManagerTransferService(ManagerScopeResolver scopeResolver,
                                   TransferRepository transferRepository,
                                   AgencyRepository agencyRepository) {
        this.scopeResolver = scopeResolver;
        this.transferRepository = transferRepository;
        this.agencyRepository = agencyRepository;
    }

    @Transactional(readOnly = true)
    public Page<TransferListDto> getTransfers(Authentication authentication, Pageable pageable) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        if (scope.getSubAgencyIds().isEmpty()) {
            return Page.empty(pageable);
        }
        return transferRepository.findBySourceAgency_IdIn(scope.getSubAgencyIds(), pageable)
                .map(this::toTransferListDto);
    }

    @Transactional(readOnly = true)
    public TransferDetailsDto getTransferDetails(Long transferId, Authentication authentication) {
        ManagerScope scope = scopeResolver.resolve(authentication.getName());
        Transfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new ManagerAccessDeniedException("Transfer not found: " + transferId));

        if (!scope.getSubAgencyIds().contains(transfer.getSourceAgency().getId())) {
            throw new ManagerAccessDeniedException("Access denied to transfer: " + transferId);
        }

        return toTransferDetailsDto(transfer);
    }

    private TransferListDto toTransferListDto(Transfer transfer) {
        String senderName = safeName(transfer.getSender());
        String senderPhone = safePhone(transfer.getSender());
        String beneficiaryName = safeName(transfer.getBeneficiary());
        String beneficiaryPhone = safePhone(transfer.getBeneficiary());
        String currencySymbol = transfer.getCurrency() != null ? transfer.getCurrency().getSymbol() : "MAD";
        String agencyName = transfer.getSourceAgency() != null ? transfer.getSourceAgency().getName() : "";
        String agencyCode = transfer.getSourceAgency() != null ? transfer.getSourceAgency().getCode() : "";
        String agentName = safeAgentName(transfer.getCreatedBy());

        return new TransferListDto(
                transfer.getId(),
                transfer.getReferenceCode(),
                transfer.getWithdrawalCode(),
                senderName,
                senderPhone,
                beneficiaryName,
                beneficiaryPhone,
                transfer.getAmount(),
                currencySymbol,
                transfer.getFeeAmount(),
                transfer.getNetAmount(),
                transfer.getStatus(),
                agencyName,
                agencyCode,
                agentName,
                transfer.getCreatedAt(),
                transfer.getSentAt()
        );
    }

    private TransferDetailsDto toTransferDetailsDto(Transfer transfer) {
        List<TransferDetailsDto.StatusHistoryDto> historyDtos = List.of();

        String senderName = safeName(transfer.getSender());
        String senderPhone = safePhone(transfer.getSender());
        String senderIdentityType = transfer.getSender() != null ? transfer.getSender().getIdentityType() : "";
        String senderIdentityNumber = transfer.getSender() != null ? transfer.getSender().getIdentityNumber() : "";
        String beneficiaryName = safeName(transfer.getBeneficiary());
        String beneficiaryPhone = safePhone(transfer.getBeneficiary());
        String beneficiaryIdentityType = transfer.getBeneficiary() != null ? transfer.getBeneficiary().getIdentityType() : "";
        String beneficiaryIdentityNumber = transfer.getBeneficiary() != null ? transfer.getBeneficiary().getIdentityNumber() : "";
        String currencySymbol = transfer.getCurrency() != null ? transfer.getCurrency().getSymbol() : "MAD";
        String agencyName = transfer.getSourceAgency() != null ? transfer.getSourceAgency().getName() : "";
        String agencyCode = transfer.getSourceAgency() != null ? transfer.getSourceAgency().getCode() : "";
        String agentName = safeAgentName(transfer.getCreatedBy());
        String agentEmail = transfer.getCreatedBy() != null ? transfer.getCreatedBy().getEmail() : "";

        return new TransferDetailsDto(
                transfer.getId(),
                transfer.getReferenceCode(),
                transfer.getWithdrawalCode(),
                senderName,
                senderPhone,
                senderIdentityType,
                senderIdentityNumber,
                beneficiaryName,
                beneficiaryPhone,
                beneficiaryIdentityType,
                beneficiaryIdentityNumber,
                transfer.getAmount(),
                currencySymbol,
                transfer.getFeeAmount(),
                transfer.getAgencyCommissionAmount(),
                transfer.getCentralCommissionAmount(),
                transfer.getExchangeRate(),
                transfer.getNetAmount(),
                transfer.getStatus(),
                agencyName,
                agencyCode,
                agentName,
                agentEmail,
                transfer.getCreatedAt(),
                transfer.getSentAt(),
                transfer.getExpiresAt(),
                historyDtos
        );
    }

    private String safeName(Object entity) {
        if (entity == null) return "";
        try {
            var user = (com.okane.customer.entity.Customer) entity;
            if (user.getUser() != null) {
                return (user.getUser().getFirstName() + " " + user.getUser().getLastName()).trim();
            }
        } catch (Exception e) {
            return "";
        }
        return "";
    }

    private String safePhone(Object entity) {
        if (entity == null) return "";
        try {
            var user = (com.okane.customer.entity.Customer) entity;
            if (user.getUser() != null) {
                return user.getUser().getPhone();
            }
        } catch (Exception e) {
            return "";
        }
        return "";
    }

    private String safeAgentName(com.okane.auth.entity.User user) {
        if (user == null) return "";
        return (user.getFirstName() + " " + user.getLastName()).trim();
    }
}
