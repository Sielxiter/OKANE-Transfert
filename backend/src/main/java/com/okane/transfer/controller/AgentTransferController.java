package com.okane.transfer.controller;

import com.okane.transfer.dto.PayoutRequest;
import com.okane.transfer.dto.PayoutResponse;
import com.okane.transfer.dto.TransferCreateRequest;
import com.okane.transfer.dto.TransferResponse;
import com.okane.transfer.dto.TransferStatsResponse;
import com.okane.transfer.service.AgentTransferService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/agent/transfers")
public class AgentTransferController {

    private final AgentTransferService transferService;

    public AgentTransferController(AgentTransferService transferService) {
        this.transferService = transferService;
    }

    @GetMapping
    public ResponseEntity<List<TransferResponse>> getTransfers(Authentication authentication) {
        return ResponseEntity.ok(transferService.getTransfers(authentication));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<TransferResponse>> getRecentTransfers(
            Authentication authentication,
            @RequestParam(name = "limit", defaultValue = "4") int limit
    ) {
        return ResponseEntity.ok(transferService.getRecentTransfers(authentication, limit));
    }

    @GetMapping("/search")
    public ResponseEntity<TransferResponse> searchTransfer(
            Authentication authentication,
            @RequestParam(name = "reference", required = false) String reference,
            @RequestParam(name = "phone", required = false) String phone
    ) {
        return ResponseEntity.ok(transferService.searchTransfer(authentication, reference, phone));
    }

    @GetMapping("/stats")
    public ResponseEntity<TransferStatsResponse> getStats(Authentication authentication) {
        return ResponseEntity.ok(transferService.getStats(authentication));
    }

    @PostMapping
    public ResponseEntity<TransferResponse> createTransfer(
            @Valid @RequestBody TransferCreateRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(transferService.createTransfer(authentication, request));
    }

    @PostMapping("/{transferId}/payout")
    public ResponseEntity<PayoutResponse> payoutTransfer(
            @PathVariable("transferId") Long transferId,
            @Valid @RequestBody PayoutRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(transferService.payoutTransfer(authentication, transferId, request));
    }

    @PostMapping("/payout")
    public ResponseEntity<PayoutResponse> payoutTransferByPayload(
            @Valid @RequestBody PayoutRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(transferService.payoutTransfer(authentication, null, request));
    }
}
