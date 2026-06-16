package com.okane.agencybalance.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agencybalance.dto.AgencyBalanceDetailDto;
import com.okane.agencybalance.dto.AgencyBalanceDto;
import com.okane.agencybalance.dto.CashMovementDto;
import com.okane.agencybalance.dto.ClosureSummaryDto;
import com.okane.agencybalance.dto.FundAgencyRequestDto;
import com.okane.agencybalance.dto.SessionSummaryDto;
import com.okane.agencybalance.exception.InsufficientBalanceException;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.cash.entity.AgentCashSession;
import com.okane.cash.entity.CashClosure;
import com.okane.cash.entity.CashMovement;
import com.okane.cash.repository.AgentCashSessionRepository;
import com.okane.cash.repository.CashClosureRepository;
import com.okane.cash.repository.CashMovementRepository;
import com.okane.centralagency.entity.CentralAgency;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgencyBalanceService {

    private final AgencyRepository agencyRepository;
    private final CashMovementRepository cashMovementRepository;
    private final AgentCashSessionRepository agentCashSessionRepository;
    private final CashClosureRepository cashClosureRepository;
    private final UserRepository userRepository;

    public AgencyBalanceService(
            AgencyRepository agencyRepository,
            CashMovementRepository cashMovementRepository,
            AgentCashSessionRepository agentCashSessionRepository,
            CashClosureRepository cashClosureRepository,
            UserRepository userRepository) {
        this.agencyRepository = agencyRepository;
        this.cashMovementRepository = cashMovementRepository;
        this.agentCashSessionRepository = agentCashSessionRepository;
        this.cashClosureRepository = cashClosureRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AgencyBalanceDto> listAllAgencyBalances() {
        List<Agency> agencies = agencyRepository.findAllByOrderByCreatedAtDesc();
        List<AgencyBalanceDto> result = new ArrayList<>(agencies.size());
        for (Agency agency : agencies) {
            result.add(buildAgencyBalanceDto(agency));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public AgencyBalanceDto getAgencyBalance(Long agencyId) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new IllegalArgumentException("Agence introuvable : " + agencyId));
        return buildAgencyBalanceDto(agency);
    }

    @Transactional(readOnly = true)
    public AgencyBalanceDetailDto getAgencyBalanceDetails(Long agencyId) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new IllegalArgumentException("Agence introuvable : " + agencyId));

        AgencyBalanceDto summary = buildAgencyBalanceDto(agency);
        List<CashMovementDto> recentMovements = buildRecentMovements(agencyId);
        List<SessionSummaryDto> activeSessions = buildActiveSessions(agencyId);
        List<ClosureSummaryDto> pendingClosures = buildPendingClosures(agencyId);

        return new AgencyBalanceDetailDto(summary, recentMovements, activeSessions, pendingClosures);
    }

    @Transactional
    public void fundAgency(Long agencyId, FundAgencyRequestDto request, String adminUsername) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new IllegalArgumentException("Agence introuvable : " + agencyId));
        User admin = userRepository.findByEmailIgnoreCase(adminUsername)
                .orElseThrow(() -> new IllegalArgumentException("Administrateur introuvable : " + adminUsername));

        BigDecimal amount = request.amount();
        agency.setCurrentBalance(agency.getCurrentBalance().add(amount));
        agency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(agency);

        CashMovement movement = new CashMovement();
        movement.setAgency(agency);
        movement.setUser(admin);
        movement.setMovementType("FUNDING");
        movement.setAmount(amount);
        movement.setDescription(request.description());
        movement.setCreatedAt(LocalDateTime.now());
        cashMovementRepository.save(movement);
    }

    @Transactional
    public void withdrawFromAgency(Long agencyId, FundAgencyRequestDto request, String adminUsername) {
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new IllegalArgumentException("Agence introuvable : " + agencyId));
        User admin = userRepository.findByEmailIgnoreCase(adminUsername)
                .orElseThrow(() -> new IllegalArgumentException("Administrateur introuvable : " + adminUsername));

        BigDecimal amount = request.amount();
        if (agency.getCurrentBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(
                    "Solde insuffisant. Solde actuel : " + agency.getCurrentBalance() + ", Montant demandé : " + amount);
        }

        agency.setCurrentBalance(agency.getCurrentBalance().subtract(amount));
        agency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(agency);

        CashMovement movement = new CashMovement();
        movement.setAgency(agency);
        movement.setUser(admin);
        movement.setMovementType("WITHDRAWAL");
        movement.setAmount(amount);
        movement.setDescription(request.description());
        movement.setCreatedAt(LocalDateTime.now());
        cashMovementRepository.save(movement);
    }

    @Transactional(readOnly = true)
    public List<CashMovementDto> getMovements(Long agencyId, LocalDate from, LocalDate to) {
        if (from != null && to != null) {
            LocalDateTime start = from.atStartOfDay();
            LocalDateTime end = to.atTime(LocalTime.MAX);
            return cashMovementRepository.findByAgency_IdAndCreatedAtBetweenOrderByCreatedAtDesc(agencyId, start, end)
                    .stream()
                    .map(this::toCashMovementDto)
                    .collect(Collectors.toList());
        }
        return cashMovementRepository.findByAgency_IdOrderByCreatedAtDesc(agencyId)
                .stream()
                .map(this::toCashMovementDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void recordTransferIn(Agency agency, User agent, BigDecimal amount, BigDecimal feeAmount,
                                  com.okane.transfer.entity.Transfer transfer, AgentCashSession session) {
        BigDecimal totalIn = amount.add(feeAmount);
        agency.setCurrentBalance(agency.getCurrentBalance().add(totalIn));
        agency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(agency);

        CashMovement movement = new CashMovement();
        movement.setAgency(agency);
        movement.setUser(agent);
        movement.setCashSession(session);
        movement.setMovementType("TRANSFER_IN");
        movement.setAmount(totalIn);
        movement.setTransfer(transfer);
        movement.setDescription("Transfert créé : " + transfer.getReferenceCode());
        movement.setCreatedAt(LocalDateTime.now());
        cashMovementRepository.save(movement);
    }

    @Transactional
    public void recordCommissionAgency(Agency agency, User agent, BigDecimal amount,
                                        com.okane.transfer.entity.Transfer transfer, AgentCashSession session) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        agency.setCurrentBalance(agency.getCurrentBalance().add(amount));
        agency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(agency);

        CashMovement movement = new CashMovement();
        movement.setAgency(agency);
        movement.setUser(agent);
        movement.setCashSession(session);
        movement.setMovementType("COMMISSION_AGENCY");
        movement.setAmount(amount);
        movement.setTransfer(transfer);
        movement.setDescription("Commission agence : " + transfer.getReferenceCode());
        movement.setCreatedAt(LocalDateTime.now());
        cashMovementRepository.save(movement);
    }

    @Transactional
    public void recordCommissionCentral(Agency centralAgency, User agent, BigDecimal amount,
                                         com.okane.transfer.entity.Transfer transfer, AgentCashSession session) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        centralAgency.setCurrentBalance(centralAgency.getCurrentBalance().add(amount));
        centralAgency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(centralAgency);

        CashMovement movement = new CashMovement();
        movement.setAgency(centralAgency);
        movement.setUser(agent);
        movement.setCashSession(session);
        movement.setMovementType("COMMISSION_CENTRAL");
        movement.setAmount(amount);
        movement.setTransfer(transfer);
        movement.setDescription("Commission centrale : " + transfer.getReferenceCode());
        movement.setCreatedAt(LocalDateTime.now());
        cashMovementRepository.save(movement);
    }

    @Transactional
    public void recordPayoutOut(Agency payoutAgency, User agent, BigDecimal amount,
                                 com.okane.transfer.entity.Transfer transfer,
                                 com.okane.cash.entity.Payout payout, AgentCashSession session) {
        if (payoutAgency.getCurrentBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(
                    "Solde insuffisant pour le paiement. Solde : " + payoutAgency.getCurrentBalance()
                            + ", Montant : " + amount);
        }
        payoutAgency.setCurrentBalance(payoutAgency.getCurrentBalance().subtract(amount));
        payoutAgency.setUpdatedAt(LocalDateTime.now());
        agencyRepository.save(payoutAgency);

        CashMovement movement = new CashMovement();
        movement.setAgency(payoutAgency);
        movement.setUser(agent);
        movement.setCashSession(session);
        movement.setMovementType("PAYOUT_OUT");
        movement.setAmount(amount);
        movement.setTransfer(transfer);
        movement.setPayout(payout);
        movement.setDescription("Paiement transfert : " + transfer.getReferenceCode());
        movement.setCreatedAt(LocalDateTime.now());
        cashMovementRepository.save(movement);
    }

    private AgencyBalanceDto buildAgencyBalanceDto(Agency agency) {
        String agencyType = "SUB";
        Long centralAgencyId = null;
        String centralAgencyName = null;
        CentralAgency central = agency.getCentralAgency();
        if (central != null) {
            centralAgencyId = central.getId();
            centralAgencyName = central.getName();
        }

        int activeSessions = 0;
        int pendingClosures = 0;
        BigDecimal todayInflow = BigDecimal.ZERO;
        BigDecimal todayOutflow = BigDecimal.ZERO;

        try {
            List<Long> agencyIds = List.of(agency.getId());
            activeSessions = (int) agentCashSessionRepository
                    .findByAgency_IdInAndStatus(agencyIds, "OPEN")
                    .size();
            pendingClosures = (int) cashClosureRepository
                    .countByCashSession_Agency_IdInAndStatus(agencyIds, "PENDING");

            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
            BigDecimal todayFlow = cashMovementRepository.computeTodayFlowByAgencyId(agency.getId(), todayStart, todayEnd);
            if (todayFlow.compareTo(BigDecimal.ZERO) >= 0) {
                todayInflow = todayFlow;
            } else {
                todayOutflow = todayFlow.abs();
            }
        } catch (RuntimeException ex) {
            // Fallback: keep zeros
        }

        return new AgencyBalanceDto(
                agency.getId(),
                agency.getName(),
                agency.getCode(),
                agencyType,
                centralAgencyId,
                centralAgencyName,
                agency.getCurrentBalance(),
                agency.getDailyLimit(),
                activeSessions,
                pendingClosures,
                todayInflow,
                todayOutflow,
                agency.getStatus() != null ? agency.getStatus().name() : null
        );
    }

    private List<CashMovementDto> buildRecentMovements(Long agencyId) {
        try {
            return cashMovementRepository.findByAgency_IdOrderByCreatedAtDesc(agencyId)
                    .stream()
                    .limit(20)
                    .map(this::toCashMovementDto)
                    .collect(Collectors.toList());
        } catch (RuntimeException ex) {
            return List.of();
        }
    }

    private List<SessionSummaryDto> buildActiveSessions(Long agencyId) {
        try {
            List<Long> agencyIds = List.of(agencyId);
            return agentCashSessionRepository.findByAgency_IdInAndStatus(agencyIds, "OPEN")
                    .stream()
                    .map(this::toSessionSummaryDto)
                    .collect(Collectors.toList());
        } catch (RuntimeException ex) {
            return List.of();
        }
    }

    private List<ClosureSummaryDto> buildPendingClosures(Long agencyId) {
        try {
            List<Long> agencyIds = List.of(agencyId);
            return cashClosureRepository.findByCashSession_Agency_IdInAndStatusOrderByClosedAtDesc(agencyIds, "PENDING")
                    .stream()
                    .map(this::toClosureSummaryDto)
                    .collect(Collectors.toList());
        } catch (RuntimeException ex) {
            return List.of();
        }
    }

    private CashMovementDto toCashMovementDto(CashMovement cm) {
        String agentName = null;
        if (cm.getUser() != null) {
            agentName = fullName(cm.getUser());
        }
        return new CashMovementDto(
                cm.getId(),
                cm.getMovementType(),
                cm.getAmount(),
                cm.getDescription(),
                cm.getCreatedAt(),
                cm.getTransfer() != null ? cm.getTransfer().getId() : null,
                cm.getPayout() != null ? cm.getPayout().getId() : null,
                agentName
        );
    }

    private SessionSummaryDto toSessionSummaryDto(AgentCashSession session) {
        String agentName = null;
        if (session.getAgent() != null) {
            agentName = fullName(session.getAgent());
        }
        return new SessionSummaryDto(
                session.getId(),
                agentName,
                session.getSessionDate(),
                session.getOpeningBalance(),
                session.getStatus(),
                session.getOpenedAt()
        );
    }

    private ClosureSummaryDto toClosureSummaryDto(CashClosure closure) {
        AgentCashSession session = closure.getCashSession();
        String agentName = null;
        String agencyName = null;
        Long sessionId = null;
        if (session != null) {
            sessionId = session.getId();
            if (session.getAgent() != null) {
                agentName = fullName(session.getAgent());
            }
            if (session.getAgency() != null) {
                agencyName = session.getAgency().getName();
            }
        }
        return new ClosureSummaryDto(
                closure.getId(),
                sessionId,
                agentName,
                agencyName,
                closure.getExpectedBalance(),
                closure.getActualBalance(),
                closure.getDifferenceAmount(),
                closure.getStatus(),
                closure.getClosedAt(),
                closure.getValidatedAt()
        );
    }

    private String fullName(User user) {
        if (user == null) return null;
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String result = (first + " " + last).trim();
        return result.isEmpty() ? user.getEmail() : result;
    }
}
