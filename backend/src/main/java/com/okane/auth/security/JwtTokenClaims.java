package com.okane.auth.security;

import java.util.List;

public record JwtTokenClaims(
        Long userId,
        String email,
        List<String> roles,
        String tokenType,
        String jti
) {
}
