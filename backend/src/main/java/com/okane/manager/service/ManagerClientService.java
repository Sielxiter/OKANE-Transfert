package com.okane.manager.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.customer.entity.Customer;
import com.okane.customer.repository.CustomerRepository;
import com.okane.manager.dto.ManagerClientDetailResponse;
import com.okane.manager.dto.ManagerClientResponse;
import com.okane.manager.dto.ManagerClientTransactionResponse;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.repository.TransferRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ManagerClientService {

    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final CustomerRepository customerRepository;
    private final TransferRepository transferRepository;

    public ManagerClientService(
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository,
            CustomerRepository customerRepository,
            TransferRepository transferRepository
    ) {
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.customerRepository = customerRepository;
        this.transferRepository = transferRepository;
    }

    @Transactional(readOnly = true)
    public List<ManagerClientResponse> getClients(Authentication authentication) {
        // On retourne tous les clients qui ont participé à au moins un transfert
        // dans l'agence du manager (expéditeur ou bénéficiaire)
        Agency agency = resolveAgency(authentication);
        List<Transfer> transfers = transferRepository
                .findBySourceAgencyIdWithClients(agency.getId());

        // Déduplication par customerId
        java.util.Map<Long, Customer> clientsMap = new java.util.LinkedHashMap<>();
        for (Transfer t : transfers) {
            if (t.getSender() != null) {
                clientsMap.putIfAbsent(t.getSender().getId(), t.getSender());
            }
            if (t.getBeneficiary() != null) {
                clientsMap.putIfAbsent(t.getBeneficiary().getId(), t.getBeneficiary());
            }
        }

        return clientsMap.values().stream()
                .map(this::toClientResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ManagerClientDetailResponse getClientDetail(Authentication authentication, Long clientId) {
        Agency agency = resolveAgency(authentication);

        Customer customer = customerRepository.findByIdWithUser(clientId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Client introuvable."));

        // Vérifier que ce client a eu des transactions dans l'agence du manager
        List<Transfer> allTransfers = transferRepository
                .findBySourceAgencyIdWithClients(agency.getId());

        boolean belongsToAgency = allTransfers.stream().anyMatch(t ->
                (t.getSender() != null && t.getSender().getId().equals(clientId))
                        || (t.getBeneficiary() != null && t.getBeneficiary().getId().equals(clientId))
        );

        if (!belongsToAgency) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ce client n'appartient pas à votre agence.");
        }

        List<ManagerClientTransactionResponse> transactions = allTransfers.stream()
                .filter(t ->
                        (t.getSender() != null && t.getSender().getId().equals(clientId))
                                || (t.getBeneficiary() != null && t.getBeneficiary().getId().equals(clientId))
                )
                .map(t -> toTransactionResponse(t, clientId))
                .toList();

        return new ManagerClientDetailResponse(toClientResponse(customer), transactions);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ManagerClientResponse toClientResponse(Customer customer) {
        User user = customer.getUser();
        return new ManagerClientResponse(
                customer.getId().toString(),
                user != null ? user.getFirstName() : "",
                user != null ? user.getLastName() : "",
                user != null ? user.getPhone() : "",
                customer.getCountry(),
                customer.getIdentityType(),
                customer.getIdentityNumber(),
                "PENDING",   // KYC pas encore implémenté
                customer.getCreatedAt() != null ? customer.getCreatedAt().toString() : ""
        );
    }

    private ManagerClientTransactionResponse toTransactionResponse(Transfer t, Long clientId) {
        boolean isSender = t.getSender() != null && t.getSender().getId().equals(clientId);
        String type = isSender ? "ENVOI" : "RETRAIT";

        String sourceCurrency = t.getCurrency() != null ? t.getCurrency().getCode() : "MAD";
        String destCurrency = t.getDestinationCurrency() != null
                ? t.getDestinationCurrency().getCode()
                : sourceCurrency;

        double montant = isSender
                ? (t.getAmount() != null ? t.getAmount().doubleValue() : 0d)
                : (t.getNetAmount() != null ? t.getNetAmount().doubleValue() : 0d);

        return new ManagerClientTransactionResponse(
                t.getId() != null ? t.getId().toString() : null,
                t.getReferenceCode(),
                t.getWithdrawalCode(),
                type,
                montant,
                t.getFeeAmount() != null ? t.getFeeAmount().doubleValue() : 0d,
                t.getNetAmount() != null ? t.getNetAmount().doubleValue() : 0d,
                sourceCurrency,
                destCurrency,
                t.getBeneficiary() != null ? t.getBeneficiary().getCountry() : null,
                t.getStatus(),
                t.getCreatedAt() != null ? t.getCreatedAt().toString() : null
        );
    }

    private Agency resolveAgency(Authentication authentication) {
        User user = resolveUser(authentication);
        AgencyUser agencyUser = agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Manager non affecté à une agence."));
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