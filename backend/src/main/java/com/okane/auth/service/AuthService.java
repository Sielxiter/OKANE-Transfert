package com.okane.auth.service;

import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.centralagency.entity.CentralAgency;
import com.okane.centralagency.repository.CentralAgencyRepository;
import com.okane.auth.dto.AgencyResponse;
import com.okane.auth.dto.AuthResponse;
import com.okane.auth.dto.ChangePasswordRequest;
import com.okane.auth.dto.LoginRequest;
import com.okane.auth.dto.LogoutRequest;
import com.okane.auth.dto.RefreshTokenRequest;
import com.okane.auth.dto.SimpleMessageResponse;
import com.okane.auth.dto.UserResponse;
import com.okane.auth.entity.RefreshToken;
import com.okane.auth.entity.User;
import com.okane.auth.exception.AccountLockedException;
import com.okane.auth.exception.BadCredentialsApiException;
import com.okane.auth.exception.InvalidTokenException;
import com.okane.auth.exception.RateLimitExceededException;
import com.okane.auth.repository.RefreshTokenRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.JwtService;
import com.okane.auth.security.JwtTokenClaims;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final CentralAgencyRepository centralAgencyRepository;
    private final LoginRateLimitService loginRateLimitService;
    private final AuthAuditService authAuditService;

    public AuthService(
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            AgencyUserRepository agencyUserRepository,
            CentralAgencyRepository centralAgencyRepository,
            LoginRateLimitService loginRateLimitService,
            AuthAuditService authAuditService
    ) {
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.centralAgencyRepository = centralAgencyRepository;
        this.loginRateLimitService = loginRateLimitService;
        this.authAuditService = authAuditService;
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String email = normalizeEmail(request.email());
        String rateLimitKey = buildRateLimitKey(email, ipAddress);

        if (loginRateLimitService.isBlocked(rateLimitKey)) {
            throw new RateLimitExceededException("Too many login attempts. Try again later.");
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (isAccountUnavailable(user)) {
            authAuditService.logAccountLockedOrSuspended(user, ipAddress, userAgent);
            throw new AccountLockedException("Account is locked or suspended.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (AuthenticationException ex) {
            loginRateLimitService.recordFailure(rateLimitKey);
            if (user != null) {
                user.setFailedLoginAttempts(safeFailedAttempts(user) + 1);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                authAuditService.logLoginFailure(user, "Invalid email or password", ipAddress, userAgent);
            } else {
                authAuditService.logLoginFailure(null, "Invalid email or password", ipAddress, userAgent);
            }
            throw new BadCredentialsApiException("Invalid email or password");
        }

        User authenticatedUser = extractUser(authentication);
        LocalDateTime now = LocalDateTime.now();
        authenticatedUser.setLastLoginAt(now);
        authenticatedUser.setFailedLoginAttempts(0);
        authenticatedUser.setUpdatedAt(now);
        userRepository.save(authenticatedUser);

        loginRateLimitService.reset(rateLimitKey);

        String accessToken = jwtService.generateAccessToken(authenticatedUser);
        String refreshToken = jwtService.generateRefreshToken(authenticatedUser);
        saveRefreshToken(authenticatedUser, refreshToken, now);
        authAuditService.logLoginSuccess(authenticatedUser, ipAddress, userAgent);

        return buildAuthResponse(authenticatedUser, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request, String ipAddress, String userAgent) {
        String refreshTokenValue = request.refreshToken().trim();
        JwtTokenClaims claims = parseRefreshToken(refreshTokenValue);
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (Boolean.TRUE.equals(storedToken.getRevoked())
                || storedToken.getExpiryDate() == null
                || storedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Invalid refresh token");
        }

        User user = storedToken.getUser();
        if (user == null || !user.getId().equals(claims.userId())) {
            throw new InvalidTokenException("Invalid refresh token");
        }

        if (isAccountUnavailable(user)) {
            authAuditService.logAccountLockedOrSuspended(user, ipAddress, userAgent);
            throw new AccountLockedException("Account is locked or suspended.");
        }

        refreshTokenRepository.revokeByToken(refreshTokenValue);

        LocalDateTime now = LocalDateTime.now();
        String accessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);
        saveRefreshToken(user, newRefreshToken, now);
        authAuditService.logTokenRefresh(user, ipAddress, userAgent);

        return buildAuthResponse(user, accessToken, newRefreshToken);
    }

    @Transactional
    public SimpleMessageResponse logout(LogoutRequest request, String ipAddress, String userAgent) {
        String refreshTokenValue = request.refreshToken().trim();
        JwtTokenClaims claims = parseRefreshToken(refreshTokenValue);
        refreshTokenRepository.revokeByToken(refreshTokenValue);
        User user = userRepository.findById(claims.userId()).orElse(null);
        if (user != null) {
            authAuditService.logLogout(user, ipAddress, userAgent);
        }
        return new SimpleMessageResponse("Logged out successfully");
    }

    @Transactional
    public SimpleMessageResponse changePassword(
            ChangePasswordRequest request,
            Authentication authentication,
            String ipAddress,
            String userAgent
    ) {
        User user = extractUser(authentication);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsApiException("Current password is incorrect");
        }

        String encodedPassword = passwordEncoder.encode(request.newPassword());
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadCredentialsApiException("New password must be different");
        }

        LocalDateTime now = LocalDateTime.now();
        user.setPasswordHash(encodedPassword);
        user.setPasswordChangedAt(now);
        user.setUpdatedAt(now);
        userRepository.save(user);
        refreshTokenRepository.revokeAllActiveByUserId(user.getId());
        authAuditService.logPasswordChange(user, ipAddress, userAgent);
        return new SimpleMessageResponse("Password changed successfully");
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Authentication authentication) {
        return toUserResponse(extractUser(authentication));
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return new AuthResponse(
                accessToken,
                jwtService.getAccessTokenExpirySeconds(),
                refreshToken,
                jwtService.getRefreshTokenExpirySeconds(),
                "Bearer",
                buildRedirectTo(user.getRole() != null ? user.getRole().getName() : null),
                toUserResponse(user)
        );
    }

    private UserResponse toUserResponse(User user) {
        AgencyResponse agencyResponse = null;
        if (user.getRole() != null && "ROLE_MANAGER".equals(user.getRole().getName())) {
            CentralAgency centralAgency = centralAgencyRepository.findByManager_Id(user.getId()).orElse(null);
            if (centralAgency != null) {
                agencyResponse = new AgencyResponse(
                        centralAgency.getId(),
                        centralAgency.getName(),
                        centralAgency.getCode()
                );
            }
        } else {
            AgencyUser agencyUser = agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId()).orElse(null);
            if (agencyUser != null && agencyUser.getAgency() != null) {
                agencyResponse = new AgencyResponse(
                        agencyUser.getAgency().getId(),
                        agencyUser.getAgency().getName(),
                        agencyUser.getAgency().getCode()
                );
            }
        }

        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.getEnabled(),
                user.getAccountLocked(),
                user.getAccountSuspended(),
                agencyResponse
        );
    }

    private void saveRefreshToken(User user, String tokenValue, LocalDateTime createdAt) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(tokenValue);
        refreshToken.setRevoked(false);
        refreshToken.setCreatedAt(createdAt);
        refreshToken.setExpiryDate(createdAt.plusSeconds(jwtService.getRefreshTokenExpirySeconds()));
        refreshTokenRepository.save(refreshToken);
    }

    private JwtTokenClaims parseRefreshToken(String tokenValue) {
        try {
            JwtTokenClaims claims = jwtService.parseToken(tokenValue);
            if (!"refresh".equalsIgnoreCase(claims.tokenType())) {
                throw new InvalidTokenException("Invalid refresh token");
            }
            return claims;
        } catch (RuntimeException ex) {
            throw new InvalidTokenException("Invalid refresh token");
        }
    }

    private User extractUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof com.okane.auth.security.OkaneUserPrincipal principal)) {
            throw new InvalidTokenException("Authentication required");
        }
        User user = principal.getUser();
        if (user == null) {
            throw new InvalidTokenException("Authentication required");
        }
        return userRepository.findById(user.getId()).orElseThrow(() -> new InvalidTokenException("Authentication required"));
    }

    private boolean isAccountUnavailable(User user) {
        return user == null
                || !Boolean.TRUE.equals(user.getEnabled())
                || Boolean.TRUE.equals(user.getAccountLocked())
                || Boolean.TRUE.equals(user.getAccountSuspended());
    }

    private int safeFailedAttempts(User user) {
        return user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String buildRateLimitKey(String email, String ipAddress) {
        return "login:" + email + ":" + (ipAddress == null ? "unknown" : ipAddress);
    }

    private String buildRedirectTo(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return "/dashboard";
        }
        String normalizedRole = roleName.startsWith("ROLE_") ? roleName.substring(5) : roleName;
        String roleLower = normalizedRole.toLowerCase(Locale.ROOT);
        if ("manager".equals(roleLower)) {
            return "/manager/overview";
        }
        return "/" + roleLower + "/dashboard";
    }
}
