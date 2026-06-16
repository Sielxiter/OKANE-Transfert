package com.okane.currencymanagement.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class FrankfurterRateClient {

    private static final Logger log = LoggerFactory.getLogger(FrankfurterRateClient.class);
    private static final URI BASE_URI = URI.create("https://open.er-api.com/v6/latest/MAD");

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public FrankfurterRateClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public Map<String, BigDecimal> fetchRatesFromMad(Collection<String> quoteCodes) {
        List<String> sanitized = quoteCodes == null ? List.of() : quoteCodes.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(code -> !code.isBlank())
                .distinct()
                .toList();

        Map<String, BigDecimal> results = new LinkedHashMap<>();
        if (sanitized.isEmpty()) {
            return results;
        }

        try {
            results.putAll(fetchAllRates());
        } catch (Exception ex) {
            log.warn("FX fetch failed from open.er-api: {}", ex.getMessage());
            for (String quote : sanitized) {
                try {
                    BigDecimal rate = fetchSingle(quote);
                    if (rate != null) {
                        results.put(quote, rate);
                    }
                } catch (Exception singleEx) {
                    log.warn("FX fetch failed for {}: {}", quote, singleEx.getMessage());
                }
            }
        }

        return results;
    }

    private BigDecimal fetchSingle(String quoteCode) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://open.er-api.com/v6/latest/" + quoteCode))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .header("User-Agent", "Okane-Transfer/1.0")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IOException("open.er-api returned HTTP " + response.statusCode());
        }

        OpenErApiResponse apiResponse = objectMapper.readValue(response.body(), OpenErApiResponse.class);
        if (apiResponse == null || apiResponse.rates() == null) {
            return null;
        }
        if (apiResponse.result() != null && !"success".equalsIgnoreCase(apiResponse.result())) {
            throw new IOException("open.er-api returned result=" + apiResponse.result());
        }

        BigDecimal madRate = apiResponse.rates().get("MAD");
        if (madRate == null || madRate.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return BigDecimal.ONE.divide(madRate, 10, java.math.RoundingMode.HALF_UP);
    }

    private Map<String, BigDecimal> fetchAllRates() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(BASE_URI)
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .header("User-Agent", "Okane-Transfer/1.0")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IOException("open.er-api returned HTTP " + response.statusCode());
        }

        OpenErApiResponse apiResponse = objectMapper.readValue(response.body(), OpenErApiResponse.class);
        if (apiResponse == null || apiResponse.rates() == null || apiResponse.rates().isEmpty()) {
            return Map.of();
        }
        if (apiResponse.result() != null && !"success".equalsIgnoreCase(apiResponse.result())) {
            throw new IOException("open.er-api returned result=" + apiResponse.result());
        }

        Map<String, BigDecimal> results = new LinkedHashMap<>();
        for (Map.Entry<String, BigDecimal> entry : apiResponse.rates().entrySet()) {
            if (entry.getKey() == null || entry.getValue() == null) {
                continue;
            }
            String code = entry.getKey().trim().toUpperCase();
            if (!code.matches("[A-Z]{3}")) {
                continue;
            }
            if ("MAD".equals(code)) {
                results.put(code, BigDecimal.ONE);
                continue;
            }
            BigDecimal rate = entry.getValue();
            if (rate.compareTo(BigDecimal.ZERO) > 0) {
                results.put(code, BigDecimal.ONE.divide(rate, 10, java.math.RoundingMode.HALF_UP));
            }
        }
        return results;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record OpenErApiResponse(
            String result,
            String time_last_update_utc,
            String time_next_update_utc,
            String base_code,
            Map<String, BigDecimal> rates
    ) {
    }
}
