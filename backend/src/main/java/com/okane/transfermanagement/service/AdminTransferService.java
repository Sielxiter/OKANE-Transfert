package com.okane.transfermanagement.service;

import com.okane.agency.entity.Agency;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.customer.entity.Customer;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.repository.TransferRepository;
import com.okane.transfermanagement.domain.TransferStatus;
import com.okane.transfermanagement.dto.TransferFilterDTO;
import com.okane.transfermanagement.dto.TransferResponseDTO;
import com.okane.transfermanagement.exception.InvalidTransferStatusException;
import com.okane.transfermanagement.exception.TransferNotFoundException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
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
public class AdminTransferService {

    private static final int MAX_RESULTS = 200;

    private final TransferRepository transferRepository;
    private final UserRepository userRepository;
    private final TransferAuditService auditService;

    public AdminTransferService(
            TransferRepository transferRepository,
            UserRepository userRepository,
            TransferAuditService auditService
    ) {
        this.transferRepository = transferRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<TransferResponseDTO> findAll(TransferFilterDTO filter) {
        Specification<Transfer> spec = buildSpecification(filter);
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        List<Transfer> transfers = transferRepository.findAll(spec, sort);
        if (transfers.size() > MAX_RESULTS) {
            transfers = transfers.subList(0, MAX_RESULTS);
        }
        List<TransferResponseDTO> responses = new ArrayList<>(transfers.size());
        for (Transfer transfer : transfers) {
            responses.add(toResponse(transfer));
        }
        return responses;
    }

    @Transactional
    public TransferResponseDTO findById(Long id, Authentication authentication) {
        Transfer transfer = transferRepository.findById(id).orElseThrow(() -> new TransferNotFoundException(id));
        auditService.logTransferViewed(currentUserOrNull(authentication), transfer);
        return toResponse(transfer);
    }

    @Transactional
    public TransferResponseDTO markSuspect(Long id, Authentication authentication) {
        Transfer transfer = transferRepository.findById(id).orElseThrow(() -> new TransferNotFoundException(id));
        TransferStatus current = TransferStatus.fromRaw(transfer.getStatus());

        if (current == TransferStatus.PAYE) {
            throw new InvalidTransferStatusException(
                    "Un transfert PAYE ne peut pas être marqué comme suspect");
        }
        if (current == TransferStatus.ANNULE || current == TransferStatus.EXPIRE) {
            throw new InvalidTransferStatusException(
                    "Un transfert " + current.name() + " ne peut pas être marqué comme suspect");
        }
        if (current == TransferStatus.SUSPECT) {
            // idempotent: nothing to do
            return toResponse(transfer);
        }

        transfer.setStatus(TransferStatus.SUSPECT.name());
        transfer.setUpdatedAt(LocalDateTime.now());
        Transfer saved = transferRepository.save(transfer);

        auditService.logTransferMarkedSuspect(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    @Transactional
    public TransferResponseDTO cancel(Long id, Authentication authentication) {
        Transfer transfer = transferRepository.findById(id).orElseThrow(() -> new TransferNotFoundException(id));
        TransferStatus current = TransferStatus.fromRaw(transfer.getStatus());

        if (current == TransferStatus.PAYE) {
            throw new InvalidTransferStatusException(
                    "Un transfert déjà PAYE ne peut pas être annulé");
        }
        if (current == TransferStatus.ANNULE) {
            // idempotent
            return toResponse(transfer);
        }
        if (current == TransferStatus.EXPIRE) {
            throw new InvalidTransferStatusException(
                    "Un transfert EXPIRE ne peut pas être annulé");
        }

        transfer.setStatus(TransferStatus.ANNULE.name());
        transfer.setUpdatedAt(LocalDateTime.now());
        Transfer saved = transferRepository.save(transfer);

        auditService.logTransferCancelled(currentUserOrNull(authentication), saved);
        return toResponse(saved);
    }

    private Specification<Transfer> buildSpecification(TransferFilterDTO filter) {
        return (root, query, cb) -> {
            if (filter == null) {
                return cb.conjunction();
            }
            List<Predicate> predicates = new ArrayList<>();

            if (filter.status() != null) {
                predicates.add(cb.equal(cb.upper(root.get("status")), filter.status().name()));
            }
            if (filter.currency() != null && !filter.currency().isBlank()) {
                Join<Transfer, ?> currencyJoin = root.join("currency");
                predicates.add(cb.equal(cb.upper(currencyJoin.get("code")),
                        filter.currency().trim().toUpperCase(Locale.ROOT)));
            }
            if (filter.sourceCountry() != null && !filter.sourceCountry().isBlank()) {
                Join<Transfer, Agency> agencyJoin = root.join("sourceAgency");
                predicates.add(cb.equal(cb.upper(agencyJoin.get("country")),
                        filter.sourceCountry().trim().toUpperCase(Locale.ROOT)));
            }
            if (filter.destinationCountry() != null && !filter.destinationCountry().isBlank()) {
                Join<Transfer, Customer> beneficiaryJoin = root.join("beneficiary");
                predicates.add(cb.equal(cb.upper(beneficiaryJoin.get("country")),
                        filter.destinationCountry().trim().toUpperCase(Locale.ROOT)));
            }
            if (filter.agentId() != null) {
                Join<Transfer, User> agentJoin = root.join("createdBy");
                predicates.add(cb.equal(agentJoin.get("id"), filter.agentId()));
            }
            if (filter.dateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        filter.dateFrom().atStartOfDay()));
            }
            if (filter.dateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("createdAt"),
                        LocalDateTime.of(filter.dateTo(), LocalTime.MAX)));
            }
            if (filter.search() != null && !filter.search().isBlank()) {
                String term = "%" + filter.search().trim().toLowerCase(Locale.ROOT) + "%";
                Join<Transfer, Customer> sender = root.join("sender");
                Join<Transfer, Customer> beneficiary = root.join("beneficiary");
                Join<?, ?> senderUser = sender.join("user");
                Join<?, ?> beneficiaryUser = beneficiary.join("user");
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("referenceCode")), term),
                        cb.like(cb.lower(root.get("withdrawalCode")), term),
                        cb.like(cb.lower(senderUser.get("firstName")), term),
                        cb.like(cb.lower(senderUser.get("lastName")), term),
                        cb.like(cb.lower(senderUser.get("phone")), term),
                        cb.like(cb.lower(beneficiaryUser.get("firstName")), term),
                        cb.like(cb.lower(beneficiaryUser.get("lastName")), term),
                        cb.like(cb.lower(beneficiaryUser.get("phone")), term)
                );
                predicates.add(searchPredicate);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private TransferResponseDTO toResponse(Transfer transfer) {
        Customer sender = transfer.getSender();
        Customer beneficiary = transfer.getBeneficiary();
        User senderUser = sender != null ? sender.getUser() : null;
        User beneficiaryUser = beneficiary != null ? beneficiary.getUser() : null;
        Agency sourceAgency = transfer.getSourceAgency();
        User agent = transfer.getCreatedBy();

        return new TransferResponseDTO(
                transfer.getId(),
                transfer.getReferenceCode(),
                transfer.getWithdrawalCode(),
                fullName(senderUser),
                senderUser != null ? senderUser.getPhone() : null,
                sender != null ? sender.getCountry() : null,
                fullName(beneficiaryUser),
                beneficiaryUser != null ? beneficiaryUser.getPhone() : null,
                beneficiary != null ? beneficiary.getCountry() : null,
                transfer.getAmount(),
                transfer.getCurrency() != null ? transfer.getCurrency().getCode() : null,
                transfer.getFeeAmount(),
                transfer.getNetAmount(),
                sourceAgency != null ? sourceAgency.getCountry() : null,
                beneficiary != null ? beneficiary.getCountry() : null,
                TransferStatus.fromRaw(transfer.getStatus()),
                transfer.getCreatedAt(),
                agent != null ? agent.getId() : null,
                fullName(agent),
                sourceAgency != null ? sourceAgency.getCode() : null,
                sourceAgency != null ? sourceAgency.getName() : null
        );
    }

    private String fullName(User user) {
        if (user == null) return null;
        String first = user.getFirstName() == null ? "" : user.getFirstName();
        String last = user.getLastName() == null ? "" : user.getLastName();
        String result = (first + " " + last).trim();
        return result.isEmpty() ? user.getEmail() : result;
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
