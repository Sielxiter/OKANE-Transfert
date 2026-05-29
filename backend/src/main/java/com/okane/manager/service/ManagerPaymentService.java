package com.okane.manager.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.cash.entity.Payout;
import com.okane.cash.repository.PayoutRepository;
import com.okane.manager.dto.ManagerCancelPayoutRequest;
import com.okane.manager.dto.ManagerPaymentResponse;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.entity.TransferStatusHistory;
import com.okane.transfer.repository.TransferRepository;
import com.okane.transfer.repository.TransferStatusHistoryRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ManagerPaymentService {

    private final PayoutRepository payoutRepository;
    private final TransferRepository transferRepository;
    private final TransferStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;

    public ManagerPaymentService(
            PayoutRepository payoutRepository,
            TransferRepository transferRepository,
            TransferStatusHistoryRepository statusHistoryRepository,
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository
    ) {
        this.payoutRepository = payoutRepository;
        this.transferRepository = transferRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
    }

    // ── Historique de tous les paiements ─────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ManagerPaymentResponse> getAllPayments(Authentication authentication) {
        Agency agency = resolveAgency(authentication);
        return payoutRepository.findByPayoutAgency_IdOrderByPaidAtDesc(agency.getId())
                .stream()
                .map(this::toPaymentResponse)
                .toList();
    }

    // ── Paiements en attente (transfers PENDING de l'agence) ─────────────────
    @Transactional(readOnly = true)
    public List<ManagerPaymentResponse> getPendingPayments(Authentication authentication) {
        Agency agency = resolveAgency(authentication);
        // "En attente" = transfers PENDING qui n'ont pas encore de payout
        return transferRepository.findBySourceAgency_IdOrderByCreatedAtDesc(agency.getId())
                .stream()
                .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus())
                        || "EN_ATTENTE".equalsIgnoreCase(t.getStatus()))
                .filter(t -> !payoutRepository.existsByTransfer_Id(t.getId()))
                .map(this::toPendingPaymentResponse)
                .toList();
    }

    // ── Annuler un paiement (transfer doit être PENDING) ─────────────────────
    @Transactional
    public ManagerPaymentResponse cancelPayout(
            Authentication authentication,
            Long transferId,
            ManagerCancelPayoutRequest request
    ) {
        Agency agency = resolveAgency(authentication);
        User manager = resolveUser(authentication);

        Transfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transfert introuvable."));

        // Vérifier que le transfert appartient à l'agence du manager
        if (transfer.getSourceAgency() == null
                || !agency.getId().equals(transfer.getSourceAgency().getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ce transfert n'appartient pas à votre agence.");
        }

        // On ne peut annuler que si PENDING
        String currentStatus = transfer.getStatus();
        if (!"PENDING".equalsIgnoreCase(currentStatus)
                && !"EN_ATTENTE".equalsIgnoreCase(currentStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Seuls les transferts en attente peuvent être annulés.");
        }

        // Si un payout existe déjà → déjà payé
        if (payoutRepository.existsByTransfer_Id(transfer.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce transfert a déjà été payé.");
        }

        // Changer le statut
        transfer.setStatus("CANCELLED");
        transfer.setUpdatedAt(LocalDateTime.now());
        transferRepository.save(transfer);

        // Historique
        TransferStatusHistory history = new TransferStatusHistory();
        history.setTransfer(transfer);
        history.setOldStatus(currentStatus);
        history.setNewStatus("CANCELLED");
        history.setChangedBy(manager);
        history.setChangedAt(LocalDateTime.now());
        history.setReason(request.raison());
        statusHistoryRepository.save(history);

        return toPendingPaymentResponse(transfer);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private ManagerPaymentResponse toPaymentResponse(Payout payout) {
        Transfer transfer = payout.getTransfer();
        String currency = transfer != null && transfer.getDestinationCurrency() != null
                ? transfer.getDestinationCurrency().getCode()
                : (transfer != null && transfer.getCurrency() != null
                ? transfer.getCurrency().getCode()
                : "MAD");
        return new ManagerPaymentResponse(
                payout.getId().toString(),
                transfer != null ? transfer.getReferenceCode() : null,
                transfer != null ? transfer.getWithdrawalCode() : null,
                transfer != null ? buildFullName(transfer.getSenderFirstName(), transfer.getSenderLastName()) : null,
                transfer != null ? buildFullName(transfer.getBeneficiaryFirstName(), transfer.getBeneficiaryLastName()) : null,
                transfer != null ? transfer.getBeneficiaryPhone() : null,
                payout.getPaidAmount() != null ? payout.getPaidAmount().doubleValue() : 0d,
                currency,
                payout.getPayoutAgency() != null ? payout.getPayoutAgency().getName() : null,
                payout.getPaidBy() != null ? formatUserName(payout.getPaidBy()) : null,
                payout.getPaidAt() != null ? payout.getPaidAt().toString() : null,
                transfer != null ? transfer.getStatus() : null
        );
    }

    // Pour les transferts PENDING (pas encore payés), pas de Payout
    private ManagerPaymentResponse toPendingPaymentResponse(Transfer transfer) {
        String currency = transfer.getCurrency() != null
                ? transfer.getCurrency().getCode()
                : "MAD";
        return new ManagerPaymentResponse(
                transfer.getId().toString(),
                transfer.getReferenceCode(),
                transfer.getWithdrawalCode(),
                buildFullName(transfer.getSenderFirstName(), transfer.getSenderLastName()),
                buildFullName(transfer.getBeneficiaryFirstName(), transfer.getBeneficiaryLastName()),
                transfer.getBeneficiaryPhone(),
                transfer.getNetAmount() != null ? transfer.getNetAmount().doubleValue() : 0d,
                currency,
                transfer.getSourceAgency() != null ? transfer.getSourceAgency().getName() : null,
                null,   // pas encore payé par un agent
                null,   // pas encore de date
                transfer.getStatus()
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

    private String buildFullName(String firstName, String lastName) {
        return ((firstName != null ? firstName : "") + " "
                + (lastName != null ? lastName : "")).trim();
    }

    private String formatUserName(User user) {
        return ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
    }
}