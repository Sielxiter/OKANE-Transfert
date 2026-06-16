package com.okane.agentcash.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.cash.entity.AgentCashSession;
import com.okane.cash.entity.CashClosure;
import com.okane.cash.entity.CashMovement;
import com.okane.cash.entity.FundDiscrepancy;
import com.okane.cash.repository.AgentCashSessionRepository;
import com.okane.cash.repository.CashClosureRepository;
import com.okane.cash.repository.CashMovementRepository;
import com.okane.cash.repository.FundDiscrepancyRepository;
import com.okane.cash.repository.PayoutRepository;
import com.okane.agentcash.dto.AgentDashboardStatsDTO;
import com.okane.agentcash.dto.AgentSessionStatusDTO;
import com.okane.agentcash.dto.SessionCloseResultDTO;
import com.okane.agencybalance.service.AgencyBalanceService;
import com.okane.transfer.repository.TransferRepository;
import com.okane.transfermanagement.domain.TransferStatus;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgentCashSessionService {

    private static final String STATUS_OPEN = "OPEN";
    private static final String STATUS_CLOSED = "CLOSED";
    private static final int MONEY_SCALE = 2;

    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final AgentCashSessionRepository sessionRepository;
    private final CashMovementRepository movementRepository;
    private final CashClosureRepository closureRepository;
    private final FundDiscrepancyRepository discrepancyRepository;
    private final AgencyRepository agencyRepository;
    private final TransferRepository transferRepository;
    private final PayoutRepository payoutRepository;
    private final AgencyBalanceService agencyBalanceService;

    public AgentCashSessionService(
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository,
            AgentCashSessionRepository sessionRepository,
            CashMovementRepository movementRepository,
            CashClosureRepository closureRepository,
            FundDiscrepancyRepository discrepancyRepository,
            AgencyRepository agencyRepository,
            TransferRepository transferRepository,
            PayoutRepository payoutRepository,
            AgencyBalanceService agencyBalanceService
    ) {
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.sessionRepository = sessionRepository;
        this.movementRepository = movementRepository;
        this.closureRepository = closureRepository;
        this.discrepancyRepository = discrepancyRepository;
        this.agencyRepository = agencyRepository;
        this.transferRepository = transferRepository;
        this.payoutRepository = payoutRepository;
        this.agencyBalanceService = agencyBalanceService;
    }

    @Transactional(readOnly = true)
    public AgentSessionStatusDTO getSessionStatus(String agentEmail) {
        User agent = resolveAgent(agentEmail);
        Agency agency = resolveAgency(agent);
        AgentCashSession session = resolveOpenSession(agent);
        if (session == null) {
            BigDecimal balance = agency.getCurrentBalance() == null ? BigDecimal.ZERO : agency.getCurrentBalance();
            return new AgentSessionStatusDTO(false, null, null, balance, balance, STATUS_CLOSED, null);
        }

        BigDecimal currentBalance = resolveCurrentBalance(session, agency);
        return new AgentSessionStatusDTO(
                true,
                session.getId(),
                session.getSessionDate(),
                normalizeMoney(session.getOpeningBalance()),
                currentBalance,
                session.getStatus(),
                session.getOpenedAt()
        );
    }

    @Transactional
    public AgentSessionStatusDTO openSession(String agentEmail) {
        User agent = resolveAgent(agentEmail);
        Agency agency = resolveAgency(agent);
        AgentCashSession existing = resolveOpenSession(agent);
        if (existing != null) {
            return getSessionStatus(agentEmail);
        }

        BigDecimal openingBalance = normalizeMoney(agency.getCurrentBalance());
        AgentCashSession session = new AgentCashSession();
        session.setAgent(agent);
        session.setAgency(agency);
        session.setSessionDate(LocalDate.now());
        session.setOpeningBalance(openingBalance);
        session.setStatus(STATUS_OPEN);
        session.setOpenedAt(LocalDateTime.now());
        session.setClosedAt(null);
        sessionRepository.save(session);
        return new AgentSessionStatusDTO(true, session.getId(), session.getSessionDate(), openingBalance, openingBalance, STATUS_OPEN, session.getOpenedAt());
    }

    @Transactional
    public SessionCloseResultDTO closeSession(String agentEmail, BigDecimal actualBalance) {
        User agent = resolveAgent(agentEmail);
        Agency agency = resolveAgency(agent);
        AgentCashSession session = resolveOpenSession(agent);
        if (session == null) {
            throw new IllegalStateException("Aucune session de caisse active.");
        }

        BigDecimal expectedBalance = normalizeMoney(resolveCurrentBalance(session, agency));
        BigDecimal declaredBalance = normalizeMoney(actualBalance);
        BigDecimal difference = expectedBalance.subtract(declaredBalance).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        boolean discrepancyDetected = difference.compareTo(BigDecimal.ZERO) != 0;
        LocalDateTime now = LocalDateTime.now();

        CashClosure closure = new CashClosure();
        closure.setCashSession(session);
        closure.setClosedBy(agent);
        closure.setExpectedBalance(expectedBalance);
        closure.setActualBalance(declaredBalance);
        closure.setDifferenceAmount(difference);
        closure.setClosedAt(now);
        closure.setNote(discrepancyDetected ? "Ecart detecte lors de la fermeture de caisse." : "Cloture conforme.");
        closure.setStatus(discrepancyDetected ? "DISCREPANCY" : "VALIDATED");
        closure.setValidatedAt(discrepancyDetected ? null : now);
        CashClosure savedClosure = closureRepository.save(closure);

        if (discrepancyDetected) {
            FundDiscrepancy discrepancy = new FundDiscrepancy();
            discrepancy.setCashClosure(savedClosure);
            discrepancy.setCashSession(session);
            discrepancy.setReportedBy(agent);
            discrepancy.setExpectedBalance(expectedBalance);
            discrepancy.setActualBalance(declaredBalance);
            discrepancy.setDifferenceAmount(difference);
            discrepancy.setDiscrepancyType("CASH_SESSION");
            discrepancy.setStatus("REPORTED");
            discrepancy.setDescription("Cash discrepancy detected.");
            discrepancy.setReportedAt(now);
            discrepancyRepository.save(discrepancy);
        }

        session.setStatus(STATUS_CLOSED);
        session.setClosedAt(now);
        sessionRepository.save(session);

        return new SessionCloseResultDTO(
                savedClosure.getId(),
                session.getId(),
                expectedBalance,
                declaredBalance,
                difference,
                discrepancyDetected,
                discrepancyDetected ? "REPORTED" : "NONE",
                discrepancyDetected ? "Cash discrepancy detected. Signal sent successfully." : "Session closed successfully.",
                now
        );
    }

    @Transactional(readOnly = true)
    public List<CashMovement> getSessionMovements(String agentEmail) {
        User agent = resolveAgent(agentEmail);
        AgentCashSession session = resolveOpenSession(agent);
        if (session == null) {
            return List.of();
        }
        return movementRepository.findByCashSession_IdOrderByCreatedAtDesc(session.getId());
    }

    @Transactional(readOnly = true)
    public AgentDashboardStatsDTO getDashboardStats(String agentEmail) {
        User agent = resolveAgent(agentEmail);
        Agency agency = resolveAgency(agent);
        List<Long> agencyIds = List.of(agency.getId());
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);

        BigDecimal balance = normalizeMoney(agency.getCurrentBalance());
        long transfersToday = transferRepository.countByCreatedAtBetweenAndSourceAgency_IdIn(start, end, agencyIds);
        long payoutsToday = payoutRepository.countByPaidAtBetween(start, end);
        long pendingTransfers = transferRepository.countBySourceAgency_IdInAndStatus(agencyIds, TransferStatus.EN_ATTENTE.name());
        long pendingPayments = payoutRepository.countByStatus("EN_ATTENTE");
        BigDecimal revenues = normalizeMoney(transferRepository.sumAgencyCommissionByCreatedAtBetweenAndSourceAgency_IdIn(start, end, agencyIds));

        return new AgentDashboardStatsDTO(balance, transfersToday, payoutsToday, pendingTransfers, pendingPayments, revenues, "MAD");
    }

    private AgentCashSession resolveOpenSession(User agent) {
        return sessionRepository.findFirstByAgent_IdAndSessionDateAndClosedAtIsNullOrderByOpenedAtDesc(agent.getId(), LocalDate.now())
                .orElse(null);
    }

    private Agency resolveAgency(User agent) {
        AgencyUser membership = agencyUserRepository.findFirstByUser_IdAndActiveTrue(agent.getId())
                .orElseThrow(() -> new IllegalStateException("Aucune agence assignée à l'agent."));
        Agency agency = membership.getAgency();
        if (agency == null || agency.getId() == null) {
            throw new IllegalStateException("Agence introuvable pour l'agent.");
        }
        return agencyRepository.findById(agency.getId())
                .orElseThrow(() -> new EntityNotFoundException("Agence introuvable: " + agency.getId()));
    }

    private User resolveAgent(String agentEmail) {
        return userRepository.findByEmailIgnoreCase(agentEmail)
                .orElseThrow(() -> new IllegalStateException("Agent introuvable: " + agentEmail));
    }

    private BigDecimal resolveCurrentBalance(AgentCashSession session, Agency agency) {
        BigDecimal balance = agency.getCurrentBalance() == null ? BigDecimal.ZERO : agency.getCurrentBalance();
        List<CashMovement> movements = movementRepository.findByCashSession_IdOrderByCreatedAtDesc(session.getId());
        if (movements.isEmpty()) {
            return normalizeMoney(balance);
        }
        return normalizeMoney(balance);
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP) : value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
