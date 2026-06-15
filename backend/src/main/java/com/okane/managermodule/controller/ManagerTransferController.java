package com.okane.managermodule.controller;

import com.okane.managermodule.dto.TransferListDto;
import com.okane.managermodule.dto.TransferDetailsDto;
import com.okane.managermodule.service.ManagerTransferService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/manager/transfers")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ManagerTransferController {

    private final ManagerTransferService managerTransferService;

    public ManagerTransferController(ManagerTransferService managerTransferService) {
        this.managerTransferService = managerTransferService;
    }

    @GetMapping
    public ResponseEntity<Page<TransferListDto>> getTransfers(Authentication authentication, Pageable pageable) {
        return ResponseEntity.ok(managerTransferService.getTransfers(authentication, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferDetailsDto> getTransferDetails(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(managerTransferService.getTransferDetails(id, authentication));
    }
}
