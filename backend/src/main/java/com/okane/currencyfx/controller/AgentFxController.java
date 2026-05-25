package com.okane.currencyfx.controller;

import com.okane.currencyfx.dto.AgentFxContextResponse;
import com.okane.currencyfx.dto.CorridorDestinationResponse;
import com.okane.currencyfx.dto.ExchangeRateResponse;
import com.okane.currencyfx.service.AgentFxService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/agent/fx")
public class AgentFxController {

    private final AgentFxService fxService;

    public AgentFxController(AgentFxService fxService) {
        this.fxService = fxService;
    }

    @GetMapping("/context")
    public ResponseEntity<AgentFxContextResponse> getContext(Authentication authentication) {
        return ResponseEntity.ok(fxService.getContext(authentication));
    }

    @GetMapping("/corridors")
    public ResponseEntity<List<CorridorDestinationResponse>> getCorridors(Authentication authentication) {
        return ResponseEntity.ok(fxService.getDestinations(authentication));
    }

    @GetMapping("/exchange-rate")
    public ResponseEntity<ExchangeRateResponse> getExchangeRate(
            @RequestParam("from") String fromCurrency,
            @RequestParam("to") String toCurrency
    ) {
        return ResponseEntity.ok(fxService.getExchangeRate(fromCurrency, toCurrency));
    }
}
