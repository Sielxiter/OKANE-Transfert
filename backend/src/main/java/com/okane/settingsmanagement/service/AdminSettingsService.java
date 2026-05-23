package com.okane.settingsmanagement.service;

import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.settingsmanagement.dto.AdminProfileDTO;
import com.okane.settingsmanagement.dto.AdminProfileUpdateDTO;
import com.okane.settingsmanagement.dto.NotificationSettingsDTO;
import com.okane.settingsmanagement.dto.PreferencesSettingsDTO;
import com.okane.settingsmanagement.dto.SecuritySettingsDTO;
import com.okane.settingsmanagement.dto.SecuritySettingsUpdateDTO;
import com.okane.settingsmanagement.dto.SystemSettingsDTO;
import com.okane.settingsmanagement.entity.SystemSetting;
import com.okane.settingsmanagement.entity.UserPreference;
import com.okane.settingsmanagement.exception.SettingsNotFoundException;
import com.okane.settingsmanagement.repository.SystemSettingRepository;
import com.okane.settingsmanagement.repository.UserPreferenceRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminSettingsService {

    private static final DateTimeFormatter DISPLAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // System setting keys (read-only, sourced from CDC)
    private static final String KEY_ACCESS_TOKEN = "access_token_ttl";
    private static final String KEY_REFRESH_TOKEN = "refresh_token_ttl";
    private static final String KEY_LOGIN_ATTEMPTS = "max_login_attempts";
    private static final String KEY_BCRYPT = "bcrypt_strength";
    private static final String KEY_MAINTENANCE = "maintenance_mode";

    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final SettingsAuditService auditService;

    public AdminSettingsService(UserRepository userRepository,
                                 UserPreferenceRepository preferenceRepository,
                                 SystemSettingRepository systemSettingRepository,
                                 SettingsAuditService auditService) {
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.auditService = auditService;
    }

    // ─── Profile ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminProfileDTO getProfile() {
        User user = currentUser();
        return toProfileDTO(user);
    }

    @Transactional
    public AdminProfileDTO updateProfile(AdminProfileUpdateDTO request) {
        User user = currentUser();
        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            user.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            user.setLastName(request.getLastName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        auditService.logProfileUpdated(user.getId());
        return toProfileDTO(user);
    }

    // ─── Security ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SecuritySettingsDTO getSecurity() {
        User user = currentUser();
        UserPreference pref = getOrCreatePreference(user);

        SecuritySettingsDTO dto = new SecuritySettingsDTO();
        dto.setTwoFactorEnabled(Boolean.TRUE.equals(pref.getSystemNotifications())); // proxy field
        dto.setSecurityAlertsEnabled(Boolean.TRUE.equals(pref.getComplianceAlerts())); // proxy field
        dto.setActiveSessionsCount(1); // TODO: count active refresh tokens
        dto.setLastLoginAt(user.getLastLoginAt() != null ? user.getLastLoginAt().format(DISPLAY_FMT) : "—");
        dto.setAccessTokenDuration("1 heure");
        dto.setRefreshTokenDuration("7 jours");
        dto.setMaxLoginAttempts(5);
        dto.setBcryptStrength(12);
        return dto;
    }

    @Transactional
    public SecuritySettingsDTO updateSecurity(SecuritySettingsUpdateDTO request) {
        User user = currentUser();
        UserPreference pref = getOrCreatePreference(user);
        if (request.getTwoFactorEnabled() != null) {
            pref.setSystemNotifications(request.getTwoFactorEnabled());
        }
        if (request.getSecurityAlertsEnabled() != null) {
            pref.setComplianceAlerts(request.getSecurityAlertsEnabled());
        }
        pref.setUpdatedAt(LocalDateTime.now());
        preferenceRepository.save(pref);
        auditService.logSecurityUpdated(user.getId());
        return getSecurity();
    }

    // ─── Notifications ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public NotificationSettingsDTO getNotifications() {
        User user = currentUser();
        UserPreference pref = getOrCreatePreference(user);
        return toNotificationDTO(pref);
    }

    @Transactional
    public NotificationSettingsDTO updateNotifications(NotificationSettingsDTO request) {
        User user = currentUser();
        UserPreference pref = getOrCreatePreference(user);
        pref.setEmailNotifications(request.isEmailNotifications());
        pref.setSystemNotifications(request.isSystemNotifications());
        pref.setComplianceAlerts(request.isComplianceAlerts());
        pref.setPaymentAlerts(request.isPaymentAlerts());
        pref.setSuspiciousTransferAlerts(request.isSuspiciousTransferAlerts());
        pref.setUpdatedAt(LocalDateTime.now());
        preferenceRepository.save(pref);
        auditService.logNotificationsUpdated(user.getId());
        return toNotificationDTO(pref);
    }

    // ─── Preferences ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PreferencesSettingsDTO getPreferences() {
        User user = currentUser();
        UserPreference pref = getOrCreatePreference(user);
        return toPreferencesDTO(pref);
    }

    @Transactional
    public PreferencesSettingsDTO updatePreferences(PreferencesSettingsDTO request) {
        User user = currentUser();
        UserPreference pref = getOrCreatePreference(user);
        if (request.getLanguage() != null) pref.setLanguage(request.getLanguage());
        if (request.getTheme() != null) pref.setTheme(request.getTheme());
        if (request.getDefaultCurrency() != null) pref.setDefaultCurrency(request.getDefaultCurrency());
        if (request.getTimezone() != null) pref.setTimezone(request.getTimezone());
        pref.setUpdatedAt(LocalDateTime.now());
        preferenceRepository.save(pref);
        auditService.logPreferencesUpdated(user.getId());
        return toPreferencesDTO(pref);
    }

    // ─── System ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SystemSettingsDTO getSystemSettings() {
        SystemSettingsDTO dto = new SystemSettingsDTO();
        dto.setAccessTokenDuration(getSettingValue(KEY_ACCESS_TOKEN, "1 heure"));
        dto.setRefreshTokenDuration(getSettingValue(KEY_REFRESH_TOKEN, "7 jours"));
        dto.setMaxLoginAttempts(parseIntSetting(KEY_LOGIN_ATTEMPTS, 5));
        dto.setBcryptStrength(parseIntSetting(KEY_BCRYPT, 12));
        dto.setMaintenanceMode("true".equalsIgnoreCase(getSettingValue(KEY_MAINTENANCE, "false")));
        return dto;
    }

    @Transactional
    public SystemSettingsDTO updateSystemSettings(SystemSettingsDTO request) {
        // Only maintenance mode is writable from the UI; other values are CDC constants.
        upsertSetting(KEY_MAINTENANCE, String.valueOf(request.isMaintenanceMode()),
                "Mode maintenance activé/désactivé");
        auditService.logSystemSettingsUpdated();
        return getSystemSettings();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new SettingsNotFoundException("Utilisateur non authentifié.");
        Object principal = auth.getPrincipal();
        if (principal instanceof OkaneUserPrincipal p) {
            return p.getUser();
        }
        throw new SettingsNotFoundException("Utilisateur non authentifié.");
    }

    private UserPreference getOrCreatePreference(User user) {
        return preferenceRepository.findByUser_Id(user.getId()).orElseGet(() -> {
            UserPreference pref = new UserPreference();
            pref.setUser(user);
            pref.setLanguage("FR");
            pref.setTheme("system");
            pref.setDefaultCurrency("MAD");
            pref.setTimezone("Africa/Casablanca");
            pref.setEmailNotifications(true);
            pref.setSystemNotifications(true);
            pref.setComplianceAlerts(true);
            pref.setPaymentAlerts(false);
            pref.setSuspiciousTransferAlerts(true);
            pref.setCreatedAt(LocalDateTime.now());
            pref.setUpdatedAt(LocalDateTime.now());
            return preferenceRepository.save(pref);
        });
    }

    private AdminProfileDTO toProfileDTO(User user) {
        AdminProfileDTO dto = new AdminProfileDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFirstName() + " " + user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone() != null ? user.getPhone() : "—");
        dto.setRole(user.getRole() != null ? user.getRole().getName() : "ROLE_ADMIN");
        dto.setLastLoginAt(user.getLastLoginAt() != null ? user.getLastLoginAt().format(DISPLAY_FMT) : "—");
        // Never expose passwordHash or tokens
        return dto;
    }

    private NotificationSettingsDTO toNotificationDTO(UserPreference pref) {
        NotificationSettingsDTO dto = new NotificationSettingsDTO();
        dto.setEmailNotifications(Boolean.TRUE.equals(pref.getEmailNotifications()));
        dto.setSystemNotifications(Boolean.TRUE.equals(pref.getSystemNotifications()));
        dto.setComplianceAlerts(Boolean.TRUE.equals(pref.getComplianceAlerts()));
        dto.setPaymentAlerts(Boolean.TRUE.equals(pref.getPaymentAlerts()));
        dto.setSuspiciousTransferAlerts(Boolean.TRUE.equals(pref.getSuspiciousTransferAlerts()));
        return dto;
    }

    private PreferencesSettingsDTO toPreferencesDTO(UserPreference pref) {
        PreferencesSettingsDTO dto = new PreferencesSettingsDTO();
        dto.setLanguage(pref.getLanguage() != null ? pref.getLanguage() : "FR");
        dto.setTheme(pref.getTheme() != null ? pref.getTheme() : "system");
        dto.setDefaultCurrency(pref.getDefaultCurrency() != null ? pref.getDefaultCurrency() : "MAD");
        dto.setTimezone(pref.getTimezone() != null ? pref.getTimezone() : "Africa/Casablanca");
        return dto;
    }

    private String getSettingValue(String key, String defaultValue) {
        return systemSettingRepository.findByKey(key)
                .map(SystemSetting::getValue)
                .orElse(defaultValue);
    }

    private int parseIntSetting(String key, int defaultValue) {
        try {
            return Integer.parseInt(getSettingValue(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private void upsertSetting(String key, String value, String description) {
        SystemSetting setting = systemSettingRepository.findByKey(key).orElseGet(() -> {
            SystemSetting s = new SystemSetting();
            s.setKey(key);
            s.setDescription(description);
            return s;
        });
        setting.setValue(value);
        setting.setUpdatedAt(LocalDateTime.now());
        setting.setUpdatedBy(currentUser());
        systemSettingRepository.save(setting);
    }
}
