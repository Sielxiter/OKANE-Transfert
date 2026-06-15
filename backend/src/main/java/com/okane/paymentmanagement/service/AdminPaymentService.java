package com.okane.paymentmanagement.service;

import com.okane.agency.entity.Agency;
import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.cash.entity.Payout;
import com.okane.cash.repository.PayoutRepository;
import com.okane.currencyfx.entity.Currency;
import com.okane.customer.entity.Customer;
import com.okane.paymentmanagement.domain.PaymentStatus;
import com.okane.paymentmanagement.dto.PaymentAuditEntryDTO;
import com.okane.paymentmanagement.dto.PaymentFilterDTO;
import com.okane.paymentmanagement.dto.PaymentReceiptDTO;
import com.okane.paymentmanagement.dto.PaymentResponseDTO;
import com.okane.paymentmanagement.dto.PaymentSummaryDTO;
import com.okane.paymentmanagement.exception.InvalidPaymentStatusException;
import com.okane.paymentmanagement.exception.PaymentNotFoundException;
import com.okane.transfer.entity.Transfer;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPaymentService {

    private static final int MAX_RESULTS = 200;
    private static final String ENTITY_NAME = "Payment";

    private final PayoutRepository payoutRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PaymentAuditService auditService;

    public AdminPaymentService(
            PayoutRepository payoutRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            PaymentAuditService auditService
    ) {
        this.payoutRepository = payoutRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> findAll(PaymentFilterDTO filter) {
        Specification<Payout> spec = buildSpecification(filter);
        Sort sort = Sort.by(Sort.Direction.DESC, "paidAt");
        List<Payout> payouts = payoutRepository.findAll(spec, sort);
        if (payouts.size() > MAX_RESULTS) {
            payouts = payouts.subList(0, MAX_RESULTS);
        }
        List<PaymentResponseDTO> responses = new ArrayList<>(payouts.size());
        for (Payout payout : payouts) {
            responses.add(toResponse(payout));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public PaymentSummaryDTO getSummary() {
        long total = payoutRepository.count();
        long today = countTodaySafely();

        long pending = payoutRepository.countByStatus(PaymentStatus.EN_ATTENTE.name());
        long failed = payoutRepository.countByStatus(PaymentStatus.ECHOUE.name());
        long blocked = payoutRepository.countByStatus(PaymentStatus.BLOQUE.name());
        long cancelled = payoutRepository.countByStatus(PaymentStatus.ANNULE.name());
        long validatedExplicit = payoutRepository.countByStatus(PaymentStatus.VALIDE.name());
        long unspecified = payoutRepository.countByStatusIsNull();

        // Legacy rows (status = null) represent successful payouts persisted
        // before the status column was introduced. They count as VALIDE.
        long validated = validatedExplicit + unspecified;

        BigDecimal totalPaid = sumValidatedAmount();

        return new PaymentSummaryDTO(
                total,
                today,
                pending,
                validated,
                failed + blocked + cancelled,
                totalPaid
        );
    }

    @Transactional
    public PaymentResponseDTO findById(Long id, Authentication authentication) {
        Payout payout = payoutRepository.findById(id).orElseThrow(() -> new PaymentNotFoundException(id));
        auditService.logPaymentViewed(currentUserOrNull(authentication), payout);
        return toResponse(payout);
    }

    @Transactional
    public PaymentResponseDTO block(Long id, Authentication authentication) {
        Payout payout = payoutRepository.findById(id).orElseThrow(() -> new PaymentNotFoundException(id));
        PaymentStatus current = PaymentStatus.fromRaw(payout.getStatus());

        if (current == PaymentStatus.BLOQUE) {
            return toResponse(payout);
        }
        if (current == PaymentStatus.ANNULE) {
            throw new InvalidPaymentStatusException(
                    "Un paiement ANNULE ne peut pas être bloqué.");
        }

        payout.setStatus(PaymentStatus.BLOQUE.name());
        Payout saved = payoutRepository.save(payout);
        auditService.logPaymentBlocked(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public PaymentReceiptDTO viewReceipt(Long id, Authentication authentication) {
        Payout payout = payoutRepository.findById(id).orElseThrow(() -> new PaymentNotFoundException(id));
        auditService.logPaymentReceiptViewed(currentUserOrNull(authentication), payout);
        return toReceipt(payout);
    }

    @Transactional(readOnly = true)
    public List<PaymentAuditEntryDTO> findAuditTrail(Long id) {
        if (!payoutRepository.existsById(id)) {
            throw new PaymentNotFoundException(id);
        }
        List<AuditLog> logs = auditLogRepository
                .findByEntityNameAndEntityIdOrderByCreatedAtDesc(ENTITY_NAME, id);
        List<PaymentAuditEntryDTO> entries = new ArrayList<>(logs.size());
        for (AuditLog log : logs) {
            entries.add(new PaymentAuditEntryDTO(
                    log.getId(),
                    log.getAction(),
                    log.getDescription(),
                    actorLabel(log.getUser()),
                    log.getCreatedAt()
            ));
        }
        return entries;
    }

    private Specification<Payout> buildSpecification(PaymentFilterDTO filter) {
        return (root, query, cb) -> {
            if (filter == null) return cb.conjunction();
            List<Predicate> predicates = new ArrayList<>();

            if (filter.status() != null) {
                if (filter.status() == PaymentStatus.VALIDE) {
                    Predicate explicit = cb.equal(cb.upper(root.get("status")), PaymentStatus.VALIDE.name());
                    Predicate legacy = cb.isNull(root.get("status"));
                    predicates.add(cb.or(explicit, legacy));
                } else {
                    predicates.add(cb.equal(cb.upper(root.get("status")), filter.status().name()));
                }
            }
            if (filter.currency() != null && !filter.currency().isBlank()) {
                Join<Payout, Transfer> transferJoin = root.join("transfer");
                Join<Transfer, Currency> currencyJoin = transferJoin.join("currency");
                predicates.add(cb.equal(cb.upper(currencyJoin.get("code")),
                        filter.currency().trim().toUpperCase(Locale.ROOT)));
            }
            if (filter.agencyId() != null) {
                Join<Payout, Agency> agencyJoin = root.join("payoutAgency");
                predicates.add(cb.equal(agencyJoin.get("id"), filter.agencyId()));
            }
            if (filter.agentId() != null) {
                Join<Payout, User> agentJoin = root.join("paidBy");
                predicates.add(cb.equal(agentJoin.get("id"), filter.agentId()));
            }
            if (filter.dateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("paidAt"), filter.dateFrom().atStartOfDay()));
            }
            if (filter.dateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("paidAt"),
                        LocalDateTime.of(filter.dateTo(), LocalTime.MAX)));
            }
            if (filter.search() != null && !filter.search().isBlank()) {
                String term = "%" + filter.search().trim().toLowerCase(Locale.ROOT) + "%";
                Join<Payout, Transfer> transferJoin = root.join("transfer");
                Join<Payout, Customer> beneficiaryJoin = root.join("beneficiary");
                Join<?, ?> beneficiaryUser = beneficiaryJoin.join("user");
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(transferJoin.get("referenceCode")), term),
                        cb.like(cb.lower(transferJoin.get("withdrawalCode")), term),
                        cb.like(cb.lower(beneficiaryUser.get("firstName")), term),
                        cb.like(cb.lower(beneficiaryUser.get("lastName")), term),
                        cb.like(cb.lower(beneficiaryUser.get("phone")), term)
                );
                predicates.add(searchPredicate);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private long countTodaySafely() {
        try {
            LocalDate today = LocalDate.now();
            return payoutRepository.countByPaidAtBetween(
                    today.atStartOfDay(),
                    today.atTime(LocalTime.MAX)
            );
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    private BigDecimal sumValidatedAmount() {
        BigDecimal total = BigDecimal.ZERO;
        for (Payout payout : payoutRepository.findAll()) {
            PaymentStatus status = PaymentStatus.fromRaw(payout.getStatus());
            if (status == PaymentStatus.VALIDE && payout.getPaidAmount() != null) {
                total = total.add(payout.getPaidAmount());
            }
        }
        return total;
    }

    private PaymentResponseDTO toResponse(Payout payout) {
        Transfer transfer = payout.getTransfer();
        Customer beneficiary = payout.getBeneficiary();
        User beneficiaryUser = beneficiary != null ? beneficiary.getUser() : null;
        Agency agency = payout.getPayoutAgency();
        User agent = payout.getPaidBy();

        return new PaymentResponseDTO(
                payout.getId(),
                buildPaymentReference(payout),
                transfer != null ? transfer.getReferenceCode() : null,
                transfer != null ? transfer.getWithdrawalCode() : null,
                fullName(beneficiaryUser),
                payout.getPaidAmount(),
                transfer != null && transfer.getCurrency() != null
                        ? transfer.getCurrency().getCode()
                        : null,
                agency != null ? agency.getId() : null,
                agency != null ? agency.getCode() : null,
                agency != null ? agency.getName() : null,
                agent != null ? agent.getId() : null,
                fullName(agent),
                PaymentStatus.fromRaw(payout.getStatus()),
                payout.getPaidAt()
        );
    }

    private PaymentReceiptDTO toReceipt(Payout payout) {
        Transfer transfer = payout.getTransfer();
        Customer beneficiary = payout.getBeneficiary();
        User beneficiaryUser = beneficiary != null ? beneficiary.getUser() : null;
        Agency agency = payout.getPayoutAgency();
        User agent = payout.getPaidBy();

        return new PaymentReceiptDTO(
                payout.getId(),
                buildPaymentReference(payout),
                transfer != null ? transfer.getReferenceCode() : null,
                transfer != null ? transfer.getWithdrawalCode() : null,
                fullName(beneficiaryUser),
                payout.getPaidAmount(),
                transfer != null && transfer.getCurrency() != null
                        ? transfer.getCurrency().getCode()
                        : null,
                agency != null ? agency.getName() : null,
                fullName(agent),
                PaymentStatus.fromRaw(payout.getStatus()),
                payout.getPaidAt()
        );
    }

    private String buildPaymentReference(Payout payout) {
        if (payout == null || payout.getId() == null) return null;
        return String.format("PMT-%05d", payout.getId());
    }

    private String fullName(User user) {
        if (user == null) return null;
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String result = (first + " " + last).trim();
        return result.isEmpty() ? user.getEmail() : result;
    }

    private String actorLabel(User user) {
        if (user == null) return "Système";
        String full = fullName(user);
        return full == null ? "Système" : full;
    }

    private User currentUserOrNull(Authentication authentication) {
        if (authentication == null) return null;
        if (authentication.getPrincipal() instanceof OkaneUserPrincipal principal) {
            User user = principal.getUser();
            if (user == null || user.getId() == null) return null;
            return userRepository.findById(user.getId()).orElse(null);
        }
        return null;
    }
}
