package com.okane.compliancemanagement.service;

import com.okane.compliance.entity.KycCheck;
import com.okane.compliance.entity.SuspiciousReport;
import com.okane.compliance.entity.WatchlistEntry;
import com.okane.compliancemanagement.dto.AmlAlertResponseDTO;
import com.okane.compliancemanagement.dto.BlacklistEntryResponseDTO;
import com.okane.compliancemanagement.dto.ChangeAmlStatusRequestDTO;
import com.okane.compliancemanagement.dto.ComplianceSummaryDTO;
import com.okane.compliancemanagement.dto.KycRecordResponseDTO;
import com.okane.compliancemanagement.dto.RejectKycRequestDTO;
import com.okane.compliancemanagement.exception.AmlAlertNotFoundException;
import com.okane.compliancemanagement.exception.InvalidAmlStatusException;
import com.okane.compliancemanagement.exception.InvalidKycStatusException;
import com.okane.compliancemanagement.exception.KycRecordNotFoundException;
import com.okane.compliancemanagement.repository.KycCheckRepository;
import com.okane.compliancemanagement.repository.SuspiciousReportRepository;
import com.okane.compliancemanagement.repository.WatchlistEntryRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminComplianceService {

    private static final DateTimeFormatter DISPLAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final Set<String> VALID_AML_STATUSES =
            Set.of("NEW", "IN_ANALYSIS", "RESOLVED", "ESCALATED");

    private final KycCheckRepository kycRepository;
    private final SuspiciousReportRepository amlRepository;
    private final WatchlistEntryRepository blacklistRepository;
    private final ComplianceAuditService auditService;

    public AdminComplianceService(KycCheckRepository kycRepository,
                                   SuspiciousReportRepository amlRepository,
                                   WatchlistEntryRepository blacklistRepository,
                                   ComplianceAuditService auditService) {
        this.kycRepository = kycRepository;
        this.amlRepository = amlRepository;
        this.blacklistRepository = blacklistRepository;
        this.auditService = auditService;
    }

    // ─── Summary ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ComplianceSummaryDTO getSummary() {
        long pending = kycRepository.countByStatus("PENDING")
                + kycRepository.countByStatus("REVIEW_REQUIRED");
        long verified = kycRepository.countByStatus("VERIFIED");
        long rejected = kycRepository.countByStatus("REJECTED");
        long amlAlerts = amlRepository.countByAlertStatusNot("RESOLVED");
        long suspicious = amlRepository.countByRiskLevelIn(Arrays.asList("HIGH", "CRITICAL"));
        long blacklisted = blacklistRepository.countByWatchlistStatus("ACTIVE");

        return new ComplianceSummaryDTO(pending, verified, rejected, amlAlerts, suspicious, blacklisted);
    }

    // ─── KYC ────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<KycRecordResponseDTO> listKyc() {
        return kycRepository.findAllByOrderBySubmittedAtDesc()
                .stream()
                .map(this::toKycDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public KycRecordResponseDTO getKyc(Long id) {
        KycCheck kyc = kycRepository.findById(id)
                .orElseThrow(() -> new KycRecordNotFoundException(id));
        return toKycDTO(kyc);
    }

    @Transactional
    public KycRecordResponseDTO verifyKyc(Long id) {
        KycCheck kyc = kycRepository.findById(id)
                .orElseThrow(() -> new KycRecordNotFoundException(id));
        if ("VERIFIED".equals(kyc.getStatus())) {
            throw new InvalidKycStatusException("Ce dossier est déjà vérifié.");
        }
        kyc.setStatus("VERIFIED");
        kyc.setCheckedAt(LocalDateTime.now());
        kyc.setCheckedBy(currentUser());
        kycRepository.save(kyc);
        auditService.logKycVerified(id);
        return toKycDTO(kyc);
    }

    @Transactional
    public KycRecordResponseDTO rejectKyc(Long id, RejectKycRequestDTO request) {
        KycCheck kyc = kycRepository.findById(id)
                .orElseThrow(() -> new KycRecordNotFoundException(id));
        if ("REJECTED".equals(kyc.getStatus())) {
            throw new InvalidKycStatusException("Ce dossier est déjà rejeté.");
        }
        kyc.setStatus("REJECTED");
        kyc.setRejectionReason(request.getReason());
        kyc.setCheckedAt(LocalDateTime.now());
        kyc.setCheckedBy(currentUser());
        kycRepository.save(kyc);
        auditService.logKycRejected(id, request.getReason());
        return toKycDTO(kyc);
    }

    @Transactional
    public KycRecordResponseDTO markKycReview(Long id) {
        KycCheck kyc = kycRepository.findById(id)
                .orElseThrow(() -> new KycRecordNotFoundException(id));
        kyc.setStatus("REVIEW_REQUIRED");
        kycRepository.save(kyc);
        auditService.logKycMarkedReview(id);
        return toKycDTO(kyc);
    }

    // ─── AML Alerts ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AmlAlertResponseDTO> listAmlAlerts() {
        return amlRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toAmlDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AmlAlertResponseDTO getAmlAlert(Long id) {
        SuspiciousReport report = amlRepository.findById(id)
                .orElseThrow(() -> new AmlAlertNotFoundException(id));
        return toAmlDTO(report);
    }

    @Transactional
    public AmlAlertResponseDTO changeAmlStatus(Long id, ChangeAmlStatusRequestDTO request) {
        String newStatus = request.getStatus();
        if (!VALID_AML_STATUSES.contains(newStatus)) {
            throw new InvalidAmlStatusException("Statut AML invalide : " + newStatus);
        }
        SuspiciousReport report = amlRepository.findById(id)
                .orElseThrow(() -> new AmlAlertNotFoundException(id));
        report.setAlertStatus(newStatus);
        if ("RESOLVED".equals(newStatus)) {
            report.setResolvedAt(LocalDateTime.now());
        }
        amlRepository.save(report);
        auditService.logAmlStatusChanged(id, newStatus);
        return toAmlDTO(report);
    }

    // ─── Blacklist ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BlacklistEntryResponseDTO> listBlacklist() {
        auditService.logBlacklistViewed();
        return blacklistRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toBlacklistDTO)
                .collect(Collectors.toList());
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private KycRecordResponseDTO toKycDTO(KycCheck kyc) {
        KycRecordResponseDTO dto = new KycRecordResponseDTO();
        dto.setId(kyc.getId());
        dto.setStatus(kyc.getStatus() != null ? kyc.getStatus() : "PENDING");
        dto.setRiskLevel(kyc.getRiskLevel() != null ? kyc.getRiskLevel() : "LOW");
        dto.setDocumentType(kyc.getDocumentType() != null ? kyc.getDocumentType() : "—");
        dto.setMaskedDocumentNumber(maskDocumentNumber(kyc.getMaskedDocumentNumber()));
        dto.setRejectionReason(kyc.getRejectionReason());
        dto.setSubmittedAt(kyc.getSubmittedAt() != null ? kyc.getSubmittedAt().format(DISPLAY_FMT) : "—");
        dto.setReviewedAt(kyc.getCheckedAt() != null ? kyc.getCheckedAt().format(DISPLAY_FMT) : null);

        if (kyc.getCheckedBy() != null) {
            dto.setReviewedBy(kyc.getCheckedBy().getFirstName() + " " + kyc.getCheckedBy().getLastName());
        }

        if (kyc.getCustomer() != null) {
            dto.setClientId("CL-" + kyc.getCustomer().getId());
            dto.setCountry(kyc.getCustomer().getCountry() != null ? kyc.getCustomer().getCountry() : "—");
            dto.setCountryCode("—");
            if (kyc.getCustomer().getUser() != null) {
                var user = kyc.getCustomer().getUser();
                dto.setClientName(user.getFirstName() + " " + user.getLastName());
                dto.setEmail(user.getEmail());
                dto.setPhone(user.getPhone() != null ? user.getPhone() : "—");
            }
        }
        return dto;
    }

    private AmlAlertResponseDTO toAmlDTO(SuspiciousReport report) {
        AmlAlertResponseDTO dto = new AmlAlertResponseDTO();
        dto.setId(report.getId());
        dto.setReference(report.getAlertReference() != null
                ? report.getAlertReference() : "AML-" + report.getId());
        dto.setAlertType(report.getAlertType() != null ? report.getAlertType() : report.getReportType());
        dto.setAmount(report.getAlertAmount());
        dto.setCurrency(report.getAlertCurrency() != null ? report.getAlertCurrency() : "MAD");
        dto.setRiskLevel(report.getRiskLevel() != null ? report.getRiskLevel() : "MEDIUM");
        dto.setStatus(report.getAlertStatus() != null ? report.getAlertStatus() : report.getStatus());
        dto.setCreatedAt(report.getCreatedAt() != null ? report.getCreatedAt().format(DISPLAY_FMT) : "—");
        dto.setResolvedAt(report.getResolvedAt() != null ? report.getResolvedAt().format(DISPLAY_FMT) : null);

        if (report.getCustomer() != null && report.getCustomer().getUser() != null) {
            var user = report.getCustomer().getUser();
            dto.setClientId("CL-" + report.getCustomer().getId());
            dto.setClientName(user.getFirstName() + " " + user.getLastName());
        }
        return dto;
    }

    private BlacklistEntryResponseDTO toBlacklistDTO(WatchlistEntry entry) {
        BlacklistEntryResponseDTO dto = new BlacklistEntryResponseDTO();
        dto.setId(entry.getId());
        dto.setFullName(entry.getFullName() != null ? entry.getFullName() : "—");
        dto.setCountry(entry.getCountry() != null ? entry.getCountry() : "—");
        dto.setCountryCode(entry.getCountryCode() != null ? entry.getCountryCode() : "—");
        dto.setType(entry.getEntityType() != null ? entry.getEntityType() : "ENTITY");
        dto.setSource(entry.getSource() != null ? entry.getSource() : "INTERNAL");
        // Derive status: active=true → ACTIVE, watchlistStatus if set
        if (entry.getWatchlistStatus() != null) {
            dto.setStatus(entry.getWatchlistStatus());
        } else {
            dto.setStatus(Boolean.TRUE.equals(entry.getActive()) ? "ACTIVE" : "CLEARED");
        }
        dto.setAddedAt(entry.getCreatedAt() != null ? entry.getCreatedAt().format(DATE_FMT) : "—");
        return dto;
    }

    /** Mask a document number: keep first 2 and last 2 chars, replace middle with ••••. */
    private String maskDocumentNumber(String raw) {
        if (raw == null || raw.isBlank()) return "••••••";
        if (raw.contains("•")) return raw; // already masked
        if (raw.length() <= 4) return "••••";
        return raw.substring(0, 2) + "••••" + raw.substring(raw.length() - 2);
    }

    private com.okane.auth.entity.User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof com.okane.auth.security.OkaneUserPrincipal p) {
            return p.getUser();
        }
        return null;
    }
}
