package com.okane.auth.dto;

public record AuthResponse(
        String accessToken,
        long accessTokenExpiresInSeconds,
        String refreshToken,
        long refreshTokenExpiresInSeconds,
        String tokenType,
        String redirectTo,
        UserResponse user
) {
}
