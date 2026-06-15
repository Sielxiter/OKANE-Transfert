package com.okane.currencymanagement.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
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
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class FrankfurterRateClient {

    private static final Logger log = LoggerFactory.getLogger(FrankfurterRateClient.class);
    private static final URI BASE_URI = URI.create("https://api.frankfurter.dev/v2/rates");
    private static final int BATCH_SIZE = 20;

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

        for (int start = 0; start < sanitized.size(); start += BATCH_SIZE) {
            int end = Math.min(start + BATCH_SIZE, sanitized.size());
            List<String> batch = sanitized.subList(start, end);
            try {
                results.putAll(fetchBatch(batch));
            } catch (Exception ex) {
                log.warn("Bulk FX fetch failed for batch {}: {}", batch, ex.getMessage());
                for (String quote : batch) {
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
        }

        return results;
    }

    private Map<String, BigDecimal> fetchBatch(List<String> batchQuotes) throws IOException, InterruptedException {
        if (batchQuotes.isEmpty()) {
            return Map.of();
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(buildUri(batchQuotes))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .header("User-Agent", "Okane-Transfer/1.0")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IOException("Frankfurter returned HTTP " + response.statusCode());
        }

        List<FrankfurterRateRow> rows = objectMapper.readValue(response.body(), new TypeReference<List<FrankfurterRateRow>>() { });
        return rows.stream()
                .filter(row -> row.quote() != null && row.rate() != null)
                .collect(Collectors.toMap(
                        row -> row.quote().trim().toUpperCase(),
                        FrankfurterRateRow::rate,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    private BigDecimal fetchSingle(String quoteCode) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URI + "/MAD/" + quoteCode))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .header("User-Agent", "Okane-Transfer/1.0")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IOException("Frankfurter returned HTTP " + response.statusCode());
        }

        FrankfurterRateRow row = objectMapper.readValue(response.body(), FrankfurterRateRow.class);
        return row.rate();
    }

    private URI buildUri(List<String> quotes) {
        String query = String.join(",", quotes);
        return URI.create(BASE_URI + "?base=MAD&quotes=" + query);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record FrankfurterRateRow(String date, String base, String quote, BigDecimal rate) {
    }
}
