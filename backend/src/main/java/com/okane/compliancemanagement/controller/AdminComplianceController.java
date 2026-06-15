package com.okane.compliancemanagement.controller;

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
import com.okane.compliancemanagement.service.AdminComplianceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/compliance")
@PreAuthorize("hasRole('ADMIN')")
public class AdminComplianceController {

    private final AdminComplianceService complianceService;

    public AdminComplianceController(AdminComplianceService complianceService) {
        this.complianceService = complianceService;
    }

    /** KPI cards */
    @GetMapping("/summary")
    public ResponseEntity<ComplianceSummaryDTO> getSummary() {
        return ResponseEntity.ok(complianceService.getSummary());
    }

    /** Table KYC */
    @GetMapping("/kyc")
    public ResponseEntity<List<KycRecordResponseDTO>> listKyc() {
        return ResponseEntity.ok(complianceService.listKyc());
    }

    /** Détails KYC */
    @GetMapping("/kyc/{id}")
    public ResponseEntity<?> getKyc(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(complianceService.getKyc(id));
        } catch (KycRecordNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    /** Vérifier KYC */
    @PatchMapping("/kyc/{id}/verify")
    public ResponseEntity<?> verifyKyc(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(complianceService.verifyKyc(id));
        } catch (KycRecordNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (InvalidKycStatusException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    /** Rejeter KYC */
    @PatchMapping("/kyc/{id}/reject")
    public ResponseEntity<?> rejectKyc(@PathVariable Long id,
                                        @Valid @RequestBody RejectKycRequestDTO request) {
        try {
            return ResponseEntity.ok(complianceService.rejectKyc(id, request));
        } catch (KycRecordNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (InvalidKycStatusException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    /** Marquer KYC pour révision */
    @PatchMapping("/kyc/{id}/review")
    public ResponseEntity<?> reviewKyc(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(complianceService.markKycReview(id));
        } catch (KycRecordNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    /** Alertes AML */
    @GetMapping("/aml-alerts")
    public ResponseEntity<List<AmlAlertResponseDTO>> listAmlAlerts() {
        return ResponseEntity.ok(complianceService.listAmlAlerts());
    }

    /** Détails alerte AML */
    @GetMapping("/aml-alerts/{id}")
    public ResponseEntity<?> getAmlAlert(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(complianceService.getAmlAlert(id));
        } catch (AmlAlertNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    /** Changer statut alerte AML */
    @PatchMapping("/aml-alerts/{id}/status")
    public ResponseEntity<?> changeAmlStatus(@PathVariable Long id,
                                              @Valid @RequestBody ChangeAmlStatusRequestDTO request) {
        try {
            return ResponseEntity.ok(complianceService.changeAmlStatus(id, request));
        } catch (AmlAlertNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (InvalidAmlStatusException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    /** Blacklist fictive */
    @GetMapping("/blacklist")
    public ResponseEntity<List<BlacklistEntryResponseDTO>> listBlacklist() {
        return ResponseEntity.ok(complianceService.listBlacklist());
    }
}
