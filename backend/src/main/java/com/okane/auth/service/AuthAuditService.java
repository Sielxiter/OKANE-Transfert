package com.okane.auth.service;

import com.okane.audit.entity.AuditLog;
import com.okane.auth.entity.User;
import com.okane.auth.repository.AuditLogRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthAuditService {

    private final AuditLogRepository auditLogRepository;

    public AuthAuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logLoginSuccess(User user, String ipAddress, String userAgent) {
        log(user, "AUTH_LOGIN_SUCCESS", "Login success", ipAddress, userAgent);
    }

    @Transactional
    public void logLoginFailure(User user, String description, String ipAddress, String userAgent) {
        log(user, "AUTH_LOGIN_FAILURE", description, ipAddress, userAgent);
    }

    @Transactional
    public void logLogout(User user, String ipAddress, String userAgent) {
        log(user, "AUTH_LOGOUT", "Logout", ipAddress, userAgent);
    }

    @Transactional
    public void logTokenRefresh(User user, String ipAddress, String userAgent) {
        log(user, "AUTH_TOKEN_REFRESH", "Refresh token exchanged", ipAddress, userAgent);
    }

    @Transactional
    public void logPasswordChange(User user, String ipAddress, String userAgent) {
        log(user, "AUTH_PASSWORD_CHANGE", "Password changed", ipAddress, userAgent);
    }

    @Transactional
    public void logAccountLockedOrSuspended(User user, String ipAddress, String userAgent) {
        log(user, "AUTH_ACCOUNT_LOCKED_OR_SUSPENDED", "Account locked or suspended", ipAddress, userAgent);
    }

    private void log(User user, String action, String description, String ipAddress, String userAgent) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(user);
        auditLog.setUserRole(user != null && user.getRole() != null ? user.getRole().getName() : null);
        auditLog.setAction(action);
        auditLog.setDescription(description);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }
}
