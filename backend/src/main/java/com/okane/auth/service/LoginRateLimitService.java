package com.okane.auth.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LoginRateLimitService {

    private final Map<String, Deque<Instant>> failedAttempts = new ConcurrentHashMap<>();

    @Value("${app.auth.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.auth.login.window-minutes:10}")
    private long windowMinutes;

    public boolean isBlocked(String key) {
        prune(key);
        return failedAttempts.getOrDefault(key, new ConcurrentLinkedDeque<>()).size() >= maxAttempts;
    }

    public void recordFailure(String key) {
        prune(key);
        failedAttempts.computeIfAbsent(key, ignored -> new ConcurrentLinkedDeque<>()).addLast(Instant.now());
    }

    public void reset(String key) {
        failedAttempts.remove(key);
    }

    private void prune(String key) {
        Deque<Instant> attempts = failedAttempts.get(key);
        if (attempts == null) {
            return;
        }

        Instant cutoff = Instant.now().minus(Duration.ofMinutes(windowMinutes));
        while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
            attempts.removeFirst();
        }

        if (attempts.isEmpty()) {
            failedAttempts.remove(key);
        }
    }
}
