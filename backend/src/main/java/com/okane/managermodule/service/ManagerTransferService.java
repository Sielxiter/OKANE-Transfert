package com.okane.managermodule.service;

import com.okane.agency.repository.AgencyRepository;
import com.okane.auth.entity.User;
import com.okane.customer.entity.Customer;
import com.okane.managermodule.dto.TransferListDto;
import com.okane.managermodule.dto.TransferDetailsDto;
import com.okane.managermodule.exception.ManagerAccessDeniedException;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.entity.TransferBeneficiary;
import com.okane.transfer.repository.TransferRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        String senderName = safeCustomerName(transfer.getSender());
        String senderPhone = safeCustomerPhone(transfer.getSender());
        String beneficiaryName = beneficiaryName(transfer);
        String beneficiaryPhone = beneficiaryPhone(transfer);
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
        java.util.List<TransferDetailsDto.StatusHistoryDto> historyDtos = java.util.List.of();

        String senderName = safeCustomerName(transfer.getSender());
        String senderPhone = safeCustomerPhone(transfer.getSender());
        String senderIdentityType = transfer.getSender() != null ? transfer.getSender().getIdentityType() : "";
        String senderIdentityNumber = transfer.getSender() != null ? transfer.getSender().getIdentityNumber() : "";
        String beneficiaryName = beneficiaryName(transfer);
        String beneficiaryPhone = beneficiaryPhone(transfer);
        String beneficiaryIdentityType = beneficiaryIdentityType(transfer);
        String beneficiaryIdentityNumber = beneficiaryIdentityNumber(transfer);
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

    private String safeCustomerName(Customer customer) {
        if (customer == null || customer.getUser() == null) {
            return "";
        }
        return ((customer.getUser().getFirstName() != null ? customer.getUser().getFirstName() : "")
                + " "
                + (customer.getUser().getLastName() != null ? customer.getUser().getLastName() : "")).trim();
    }

    private String safeCustomerPhone(Customer customer) {
        if (customer == null || customer.getUser() == null || customer.getUser().getPhone() == null) {
            return "";
        }
        return customer.getUser().getPhone();
    }

    private String beneficiaryName(Transfer transfer) {
        TransferBeneficiary snapshot = transfer.getBeneficiarySnapshot();
        if (snapshot != null) {
            return ((snapshot.getFirstName() != null ? snapshot.getFirstName() : "")
                    + " "
                    + (snapshot.getLastName() != null ? snapshot.getLastName() : "")).trim();
        }
        return safeCustomerName(transfer.getBeneficiary());
    }

    private String beneficiaryPhone(Transfer transfer) {
        TransferBeneficiary snapshot = transfer.getBeneficiarySnapshot();
        if (snapshot != null && snapshot.getPhone() != null) {
            return snapshot.getPhone();
        }
        return safeCustomerPhone(transfer.getBeneficiary());
    }

    private String beneficiaryIdentityType(Transfer transfer) {
        TransferBeneficiary snapshot = transfer.getBeneficiarySnapshot();
        if (snapshot != null && snapshot.getIdentityType() != null) {
            return snapshot.getIdentityType();
        }
        return transfer.getBeneficiary() != null ? transfer.getBeneficiary().getIdentityType() : "";
    }

    private String beneficiaryIdentityNumber(Transfer transfer) {
        TransferBeneficiary snapshot = transfer.getBeneficiarySnapshot();
        if (snapshot != null && snapshot.getIdentityNumber() != null) {
            return snapshot.getIdentityNumber();
        }
        return transfer.getBeneficiary() != null ? transfer.getBeneficiary().getIdentityNumber() : "";
    }

    private String safeAgentName(User user) {
        if (user == null) {
            return "";
        }
        return ((user.getFirstName() != null ? user.getFirstName() : "")
                + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
    }
}
