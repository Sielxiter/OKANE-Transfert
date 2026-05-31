package com.okane.manager.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.cash.entity.AgentCashSession;
import com.okane.cash.repository.AgentCashSessionRepository;
import com.okane.cash.repository.FundDiscrepancyRepository;
import com.okane.feescommission.repository.CommissionRuleRepository;
import com.okane.manager.dto.ManagerDashboardDTO;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.repository.TransferRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

@Service
public class ManagerDashboardService {

    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final AgentCashSessionRepository sessionRepository;
    private final TransferRepository transferRepository;
    private final FundDiscrepancyRepository discrepancyRepository;
    private final CommissionRuleRepository commissionRuleRepository;  // ← AJOUTÉ

    // ✅ VALEURS PAR DÉFAUT (si aucune règle n'existe en base)
    private static final BigDecimal DEFAULT_AGENCY_COMMISSION = BigDecimal.valueOf(40);
    private static final BigDecimal DEFAULT_CENTRAL_COMMISSION = BigDecimal.valueOf(60);

    public ManagerDashboardService(
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository,
            AgentCashSessionRepository sessionRepository,
            TransferRepository transferRepository,
            FundDiscrepancyRepository discrepancyRepository,
            CommissionRuleRepository commissionRuleRepository  // ← AJOUTÉ
    ) {
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.sessionRepository = sessionRepository;
        this.transferRepository = transferRepository;
        this.discrepancyRepository = discrepancyRepository;
        this.commissionRuleRepository = commissionRuleRepository;  // ← AJOUTÉ
    }

    @Transactional(readOnly = true)
    public ManagerDashboardDTO getDashboard(Authentication authentication) {
        Agency agency = resolveAgency(authentication);
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        // 1. 💰 Solde de l'agence
        List<AgentCashSession> todaySessions = sessionRepository.findByAgency_IdAndSessionDateBetween(agency.getId(), today, today);
        BigDecimal agencyCashBalance = todaySessions.stream()
                .map(AgentCashSession::getOpeningBalance)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. 📊 Transferts du jour
        List<Transfer> allTransfers = transferRepository.findBySourceAgency_IdOrderByCreatedAtDesc(agency.getId());

        List<Transfer> todayTransfers = allTransfers.stream()
                .filter(t -> t.getSentAt() != null &&
                        !t.getSentAt().isBefore(startOfDay) &&
                        !t.getSentAt().isAfter(endOfDay))
                .toList();

        long todayTransfersCount = todayTransfers.size();

        BigDecimal todayTransfersAmount = todayTransfers.stream()
                .map(Transfer::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal todayFeesAmount = todayTransfers.stream()
                .map(Transfer::getFeeAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. 💸 Commission - Lecture depuis la base de données
        BigDecimal agencyCommissionPercentage = DEFAULT_AGENCY_COMMISSION;
        BigDecimal centralCommissionPercentage = DEFAULT_CENTRAL_COMMISSION;

        // ✅ Récupérer la règle active depuis la base (sans @Query)
        var activeRule = commissionRuleRepository.findFirstByActiveTrueOrderByCreatedAtDesc();
        if (activeRule.isPresent()) {
            agencyCommissionPercentage = activeRule.get().getAgencyPercentage();
            centralCommissionPercentage = activeRule.get().getCentralPercentage();
        }

        BigDecimal agencyCommission = todayFeesAmount
                .multiply(agencyCommissionPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal centralShare = todayFeesAmount
                .multiply(centralCommissionPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // 4. ⏳ Paiements en attente
        List<Transfer> pendingTransfers = allTransfers.stream()
                .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus()))
                .toList();

        long pendingPayoutsCount = pendingTransfers.size();

        BigDecimal pendingPayoutsAmount = pendingTransfers.stream()
                .map(Transfer::getNetAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. 👥 Agents
        long activeAgentsCount = agencyUserRepository.countByAgency_IdAndActiveTrue(agency.getId());
        long totalAgentsCount = agencyUserRepository.countByAgency_Id(agency.getId());

        // 6. ⚠️ Écarts non résolus
        long unresolvedDiscrepanciesCount = discrepancyRepository.countByCashSession_Agency_IdAndStatus(agency.getId(), "OPEN");

        return new ManagerDashboardDTO(
                agencyCashBalance,
                todayTransfersCount,
                todayTransfersAmount,
                todayFeesAmount,
                agencyCommission,
                centralShare,
                pendingPayoutsCount,
                pendingPayoutsAmount,
                activeAgentsCount,
                totalAgentsCount,
                unresolvedDiscrepanciesCount
        );
    }

    private Agency resolveAgency(Authentication authentication) {
        User user = resolveUser(authentication);
        AgencyUser agencyUser = agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Manager non affecté à une agence"));
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