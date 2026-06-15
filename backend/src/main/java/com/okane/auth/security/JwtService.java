package com.okane.auth.security;

import com.okane.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.issuer}")
    private String issuer;

    @Value("${app.jwt.access-token-minutes:60}")
    private long accessTokenMinutes;

    @Value("${app.jwt.refresh-token-days:7}")
    private long refreshTokenDays;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(User user) {
        return buildToken(user, Duration.ofMinutes(accessTokenMinutes), "access");
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, Duration.ofDays(refreshTokenDays), "refresh");
    }

    public JwtTokenClaims parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        List<?> rawRoles = claims.get("roles", List.class);
        List<String> roles = rawRoles == null
                ? List.of()
                : rawRoles.stream()
                .map(Object::toString)
                .toList();

        return new JwtTokenClaims(
                Long.valueOf(claims.getSubject()),
                claims.get("email", String.class),
                roles,
                claims.get("tokenType", String.class),
                claims.getId()
        );
    }

    public long getAccessTokenExpirySeconds() {
        return Duration.ofMinutes(accessTokenMinutes).toSeconds();
    }

    public long getRefreshTokenExpirySeconds() {
        return Duration.ofDays(refreshTokenDays).toSeconds();
    }

    private String buildToken(User user, Duration ttl, String tokenType) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuer(issuer)
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(now.plus(ttl)))
                .id(UUID.randomUUID().toString())
                .claim("email", user.getEmail())
                .claim("roles", List.of(user.getRole().getName()))
                .claim("tokenType", tokenType)
                .signWith(signingKey)
                .compact();
    }
}
