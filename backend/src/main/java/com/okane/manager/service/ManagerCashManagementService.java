package com.okane.manager.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.cash.entity.*;
import com.okane.cash.repository.*;
import com.okane.manager.dto.*;
import org.hibernate.Hibernate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ManagerCashManagementService {

    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final AgentCashSessionRepository sessionRepository;
    private final CashMovementRepository movementRepository;
    private final CashClosureRepository closureRepository;
    private final FundDiscrepancyRepository discrepancyRepository;

    public ManagerCashManagementService(
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository,
            AgentCashSessionRepository sessionRepository,
            CashMovementRepository movementRepository,
            CashClosureRepository closureRepository,
            FundDiscrepancyRepository discrepancyRepository
    ) {
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.sessionRepository = sessionRepository;
        this.movementRepository = movementRepository;
        this.closureRepository = closureRepository;
        this.discrepancyRepository = discrepancyRepository;
    }

    @Transactional(readOnly = true)
    public ManagerCashSummaryDTO getDashboardSummary(Authentication authentication) {
        Agency agency = resolveAgency(authentication);
        LocalDate today = LocalDate.now();

        List<AgentCashSession> todaySessions = sessionRepository.findByAgency_IdAndSessionDateBetween(
                agency.getId(), today, today
        );

        BigDecimal totalOpening = BigDecimal.ZERO;
        BigDecimal totalEntries = BigDecimal.ZERO;
        BigDecimal totalExits = BigDecimal.ZERO;
        List<AgentCashSummary> agentsSummary = new ArrayList<>();

        for (AgentCashSession session : todaySessions) {
            BalanceInfo balances = computeSessionBalances(session);
            totalOpening = totalOpening.add(session.getOpeningBalance());
            totalEntries = totalEntries.add(balances.totalEntries);
            totalExits = totalExits.add(balances.totalExits);

            agentsSummary.add(new AgentCashSummary(
                    session.getAgent().getId(),
                    session.getAgent().getFirstName() + " " + session.getAgent().getLastName(),
                    session.getOpeningBalance(),
                    balances.totalEntries,
                    balances.totalExits,
                    balances.currentBalance,
                    session.getStatus()
            ));
        }

        BigDecimal totalCurrentBalance = totalOpening.add(totalEntries).subtract(totalExits);

        long openSessionsCount = sessionRepository.countByAgency_IdAndStatus(agency.getId(), "OPEN");
        long pendingDiscrepanciesCount = discrepancyRepository.countByCashSession_Agency_IdAndStatus(agency.getId(), "OPEN");

        return new ManagerCashSummaryDTO(
                today,
                new AgencyCashSummary(totalOpening, totalEntries, totalExits, totalCurrentBalance),
                agentsSummary,
                (int) openSessionsCount,
                (int) pendingDiscrepanciesCount
        );
    }

    @Transactional(readOnly = true)
    public List<ManagerCashSessionDTO> getSessions(Authentication authentication, LocalDate startDate, LocalDate endDate) {
        Agency agency = resolveAgency(authentication);

        List<AgentCashSession> sessions = sessionRepository.findByAgency_IdAndSessionDateBetween(
                agency.getId(), startDate, endDate
        );

        return sessions.stream()
                .map(this::toSessionDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ManagerCashSessionDTO getSessionDetails(Authentication authentication, Long sessionId) {
        Agency agency = resolveAgency(authentication);

        AgentCashSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session non trouvée"));

        if (!session.getAgency().getId().equals(agency.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette session n'appartient pas à votre agence");
        }

        return toSessionDTO(session);
    }

    @Transactional(readOnly = true)
    public ManagerCashMovementDetailDTO getMovementDetails(Authentication authentication, Long movementId) {
        Agency agency = resolveAgency(authentication);

        // Récupérer le mouvement normalement (sans FETCH)
        CashMovement movement = movementRepository.findById(movementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Mouvement non trouvé"));

        // Puis forcer le chargement des relations si nécessaire
        if (movement.getTransfer() != null) {
            // Forcer l'initialisation des proxies
            Hibernate.initialize(movement.getTransfer().getSender());
            Hibernate.initialize(movement.getTransfer().getBeneficiary());
        }

        if (!movement.getAgency().getId().equals(agency.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ce mouvement n'appartient pas à votre agence");
        }

        return toMovementDetailDTO(movement);
    }

    @Transactional(readOnly = true)
    public List<ManagerCashClosureDTO> getClosures(Authentication authentication, LocalDate startDate, LocalDate endDate) {
        Agency agency = resolveAgency(authentication);

        // Utiliser la nouvelle méthode
        List<CashClosure> closures = closureRepository.findByCashSession_Agency_IdAndClosedAtGreaterThanEqualAndClosedAtLessThanEqual(
                agency.getId(),
                startDate.atStartOfDay(),
                endDate.atTime(23, 59, 59)
        );

        return closures.stream()
                .map(this::toClosureDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ManagerCashClosureDTO getClosureDetails(Authentication authentication, Long sessionId) {
        Agency agency = resolveAgency(authentication);

        CashClosure closure = closureRepository.findByCashSession_Id(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Clôture non trouvée"));

        if (!closure.getCashSession().getAgency().getId().equals(agency.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette clôture n'appartient pas à votre agence");
        }

        return toClosureDTO(closure);
    }

    @Transactional(readOnly = true)
    public List<ManagerCashDiscrepancyDTO> getDiscrepancies(Authentication authentication, String status) {
        Agency agency = resolveAgency(authentication);

        List<FundDiscrepancy> discrepancies;
        // Gérer le cas "all" correctement
        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            discrepancies = discrepancyRepository.findByCashSession_Agency_IdAndStatusWithFetch(agency.getId(), status.toUpperCase());
        } else {
            discrepancies = discrepancyRepository.findByCashSession_Agency_IdOrderByReportedAtDescWithFetch(agency.getId());
        }

        return discrepancies.stream()
                .map(this::toDiscrepancyDTO)
                .toList();
    }

    @Transactional
    public ManagerCashDiscrepancyDTO resolveDiscrepancy(Authentication authentication, Long discrepancyId) {
        Agency agency = resolveAgency(authentication);
        User manager = resolveUser(authentication);

        FundDiscrepancy discrepancy = discrepancyRepository.findById(discrepancyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Écart non trouvé"));

        if (!discrepancy.getCashSession().getAgency().getId().equals(agency.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cet écart n'appartient pas à votre agence");
        }

        if ("RESOLVED".equals(discrepancy.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cet écart est déjà résolu");
        }

        discrepancy.setStatus("RESOLVED");
        discrepancyRepository.save(discrepancy);

        return toDiscrepancyDTO(discrepancy);
    }

    private ManagerCashSessionDTO toSessionDTO(AgentCashSession session) {
        BalanceInfo balances = computeSessionBalances(session);

        return new ManagerCashSessionDTO(
                session.getId(),
                session.getAgent().getId().toString(),
                session.getAgent().getFirstName() + " " + session.getAgent().getLastName(),
                session.getAgent().getEmail(),
                session.getSessionDate(),
                session.getOpeningBalance(),
                balances.totalEntries,
                balances.totalExits,
                balances.currentBalance,
                session.getStatus(),
                session.getOpenedAt(),
                session.getClosedAt()
        );
    }

    private ManagerCashClosureDTO toClosureDTO(CashClosure closure) {
        AgentCashSession session = closure.getCashSession();
        return new ManagerCashClosureDTO(
                closure.getId(),
                session.getId(),
                session.getAgent().getFirstName() + " " + session.getAgent().getLastName(),
                closure.getClosedBy().getFirstName() + " " + closure.getClosedBy().getLastName(),
                closure.getClosedAt(),
                closure.getExpectedBalance(),
                closure.getActualBalance(),
                closure.getDifferenceAmount(),
                closure.getNote()
        );
    }

    private ManagerCashDiscrepancyDTO toDiscrepancyDTO(FundDiscrepancy discrepancy) {
        AgentCashSession session = discrepancy.getCashSession();

        // Récupérer le nom de l'agent correctement
        String agentName = "Agent inconnu";
        String agentEmail = "email@inconnu.com";

        if (session != null && session.getAgent() != null) {
            User agent = session.getAgent();
            String firstName = agent.getFirstName() != null ? agent.getFirstName() : "";
            String lastName = agent.getLastName() != null ? agent.getLastName() : "";
            agentName = (firstName + " " + lastName).trim();
            if (agentName.isEmpty()) {
                agentName = agent.getEmail() != null ? agent.getEmail() : "Agent " + agent.getId();
            }
            agentEmail = agent.getEmail() != null ? agent.getEmail() : "email@inconnu.com";
        } else if (session == null) {
            agentName = "Session non trouvée";
        }

        return new ManagerCashDiscrepancyDTO(
                discrepancy.getId(),
                session != null ? session.getId() : null,
                agentName,
                agentEmail,
                discrepancy.getReportedAt(),
                discrepancy.getExpectedBalance(),
                discrepancy.getActualBalance(),
                discrepancy.getDifferenceAmount(),
                discrepancy.getDiscrepancyType(),
                discrepancy.getStatus(),
                discrepancy.getDescription(),
                null,  // resolvedAt
                null   // resolvedBy
        );
    }

    private ManagerCashMovementDetailDTO toMovementDetailDTO(CashMovement movement) {
        String movementType = movement.getMovementType();
        var transfer = movement.getTransfer();

        String senderName = null;
        String senderPhone = null;
        String senderCountry = null;
        String beneficiaryName = null;
        String beneficiaryPhone = null;
        String beneficiaryIdType = null;
        String beneficiaryIdNumber = null;
        String transferStatus = null;

        if (transfer != null) {
            transferStatus = transfer.getStatus();

            if ("IN".equalsIgnoreCase(movementType)) {
                if (transfer.getSender() != null) {
                    var senderUser = transfer.getSender().getUser();
                    senderName = (senderUser != null) ? senderUser.getFirstName() + " " + senderUser.getLastName() : null;
                    senderPhone = (senderUser != null) ? senderUser.getPhone() : null;
                    senderCountry = transfer.getSender().getCountry();
                }
            }

            if ("OUT".equalsIgnoreCase(movementType)) {
                if (transfer.getBeneficiary() != null) {
                    var beneficiaryUser = transfer.getBeneficiary().getUser();
                    beneficiaryName = (beneficiaryUser != null) ? beneficiaryUser.getFirstName() + " " + beneficiaryUser.getLastName() : null;
                    beneficiaryPhone = (beneficiaryUser != null) ? beneficiaryUser.getPhone() : null;
                    beneficiaryIdType = transfer.getBeneficiary().getIdentityType();
                    beneficiaryIdNumber = transfer.getBeneficiary().getIdentityNumber();
                }
            }
        }

        return new ManagerCashMovementDetailDTO(
                movement.getId(),
                movementType,
                movement.getAmount(),
                movement.getCurrencyOriginal() != null ? movement.getCurrencyOriginal() : "MAD",
                movement.getCreatedAt(),
                movement.getUser().getFirstName() + " " + movement.getUser().getLastName(),
                transfer != null ? transfer.getReferenceCode() : null,
                senderName,
                senderPhone,
                senderCountry,
                beneficiaryName,
                beneficiaryPhone,
                beneficiaryIdType,
                beneficiaryIdNumber,
                transferStatus
        );
    }

    private BalanceInfo computeSessionBalances(AgentCashSession session) {
        List<CashMovement> movements = movementRepository.findByCashSession_IdOrderByCreatedAtDesc(session.getId());

        BigDecimal totalEntries = movements.stream()
                .filter(m -> "IN".equalsIgnoreCase(m.getMovementType()))
                .map(m -> m.getAmountMad() != null ? m.getAmountMad() : m.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExits = movements.stream()
                .filter(m -> "OUT".equalsIgnoreCase(m.getMovementType()))
                .map(m -> m.getAmountMad() != null ? m.getAmountMad() : m.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal currentBalance = session.getOpeningBalance()
                .add(totalEntries)
                .subtract(totalExits);

        return new BalanceInfo(totalEntries, totalExits, currentBalance);
    }

    private record BalanceInfo(BigDecimal totalEntries, BigDecimal totalExits, BigDecimal currentBalance) {}

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

    @Transactional(readOnly = true)
    public List<ManagerCashMovementDetailDTO> getSessionMovements(Authentication authentication, Long sessionId) {
        Agency agency = resolveAgency(authentication);

        // Vérifier que la session existe et appartient à l'agence
        AgentCashSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session non trouvée"));

        if (!session.getAgency().getId().equals(agency.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette session n'appartient pas à votre agence");
        }

        // Récupérer les mouvements de la session
        List<CashMovement> movements = movementRepository.findByCashSession_IdOrderByCreatedAtDesc(sessionId);

        return movements.stream()
                .map(this::toMovementDetailDTO)
                .toList();
    }
}