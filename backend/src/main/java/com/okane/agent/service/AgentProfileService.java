package com.okane.agent.service;

import com.okane.agency.entity.AgencyUser;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.agent.dto.AgentProfileResponse;
import com.okane.agent.dto.AgentProfileUpdateRequest;
import com.okane.agent.dto.NotificationPreferencesResponse;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.notification.entity.NotificationPreference;
import com.okane.notification.repository.NotificationPreferenceRepository;
import com.okane.notification.service.AgentNotificationService;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgentProfileService {

    private final UserRepository userRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final AgentNotificationService agentNotificationService;

    public AgentProfileService(
            UserRepository userRepository,
            AgencyUserRepository agencyUserRepository,
            NotificationPreferenceRepository preferenceRepository,
            AgentNotificationService agentNotificationService
    ) {
        this.userRepository = userRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.preferenceRepository = preferenceRepository;
        this.agentNotificationService = agentNotificationService;
    }

    @Transactional
    public AgentProfileResponse getProfile(Authentication authentication) {
        User user = resolveUser(authentication);
        return toResponse(user);
    }

    @Transactional
    public AgentProfileResponse updateProfile(Authentication authentication, AgentProfileUpdateRequest request) {
        User user = resolveUser(authentication);
        NameParts nameParts = splitFullName(request.fullName());
        user.setFirstName(nameParts.firstName());
        user.setLastName(nameParts.lastName());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        NotificationPreference preference = agentNotificationService.getOrCreatePreferences(user);
        applyPreferences(preference, request.notificationPreferences(), request.preferredLanguage());
        preference.setUpdatedAt(LocalDateTime.now());
        preferenceRepository.save(preference);

        return toResponse(user);
    }

    private AgentProfileResponse toResponse(User user) {
        AgencyUser agencyUser = agencyUserRepository.findFirstByUser_IdAndActiveTrue(user.getId()).orElse(null);
        NotificationPreference preference = agentNotificationService.getOrCreatePreferences(user);
        return new AgentProfileResponse(
                user.getId(),
                formatFullName(user),
                user.getEmail(),
                agencyUser != null && agencyUser.getAgency() != null ? agencyUser.getAgency().getName() : null,
                user.getRole() != null ? user.getRole().getName() : null,
                normalizeLanguage(preference.getPreferredLanguage()),
                new NotificationPreferencesResponse(
                        Boolean.TRUE.equals(preference.getTransferPaidAlerts()),
                        Boolean.TRUE.equals(preference.getCashSessionAlerts()),
                        Boolean.TRUE.equals(preference.getSystemAlerts()),
                        Boolean.TRUE.equals(preference.getKycAlerts()),
                        Boolean.TRUE.equals(preference.getCashDiscrepancyAlerts())
                )
        );
    }

    private void applyPreferences(
            NotificationPreference preference,
            NotificationPreferencesResponse preferences,
            String preferredLanguage
    ) {
        preference.setPreferredLanguage(normalizeLanguage(preferredLanguage));
        preference.setTransferPaidAlerts(preferences.transferPaid());
        preference.setCashSessionAlerts(preferences.cashSession());
        preference.setSystemAlerts(preferences.systemAlerts());
        preference.setKycAlerts(preferences.kycAlerts());
        preference.setCashDiscrepancyAlerts(preferences.cashDiscrepancy());
        if (preference.getEmailEnabled() == null) {
            preference.setEmailEnabled(Boolean.TRUE);
        }
        if (preference.getSmsEnabled() == null) {
            preference.setSmsEnabled(Boolean.FALSE);
        }
        if (preference.getPushEnabled() == null) {
            preference.setPushEnabled(Boolean.TRUE);
        }
        if (preference.getCreatedAt() == null) {
            preference.setCreatedAt(LocalDateTime.now());
        }
    }

    private NameParts splitFullName(String fullName) {
        String normalized = fullName == null ? "" : fullName.trim().replaceAll("\\s+", " ");
        if (normalized.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le nom complet est obligatoire.");
        }
        int separator = normalized.indexOf(' ');
        if (separator < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le nom complet doit contenir au moins un prenom et un nom.");
        }
        String firstName = normalized.substring(0, separator).trim();
        String lastName = normalized.substring(separator + 1).trim();
        if (firstName.isBlank() || lastName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le nom complet doit contenir au moins un prenom et un nom.");
        }
        return new NameParts(firstName, lastName);
    }

    private String formatFullName(User user) {
        return ((user.getFirstName() != null ? user.getFirstName().trim() : "")
                + " "
                + (user.getLastName() != null ? user.getLastName().trim() : "")).trim();
    }

    private String normalizeLanguage(String value) {
        String normalized = value == null ? "FR" : value.trim().toUpperCase();
        return switch (normalized) {
            case "FR", "EN", "AR" -> normalized;
            case "FRANCAIS", "FRANÇAIS" -> "FR";
            case "ANGLAIS", "ENGLISH" -> "EN";
            case "ARABE", "ARABIC" -> "AR";
            default -> "FR";
        };
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof OkaneUserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = principal.getUser();
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }

    private record NameParts(String firstName, String lastName) {
    }
}
