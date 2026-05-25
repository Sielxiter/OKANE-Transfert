package com.okane.notification.service;

import com.okane.agent.dto.AgentNotificationResponse;
import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.notification.entity.Notification;
import com.okane.notification.entity.NotificationPreference;
import com.okane.notification.repository.NotificationPreferenceRepository;
import com.okane.notification.repository.NotificationRepository;
import com.okane.transfer.entity.Transfer;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgentNotificationService {

    public static final String TYPE_SUCCESS = "SUCCESS";
    public static final String TYPE_ALERT = "ALERT";
    public static final String TYPE_INFO = "INFO";
    public static final String TYPE_ERROR = "ERROR";

    public static final String STATUS_UNREAD = "UNREAD";
    public static final String STATUS_READ = "READ";

    public static final String CATEGORY_TRANSFER_CREATED = "TRANSFER_CREATED";
    public static final String CATEGORY_TRANSFER_PAID = "TRANSFER_PAID";
    public static final String CATEGORY_PAYOUT_FAILED = "PAYOUT_FAILED";
    public static final String CATEGORY_INVALID_WITHDRAWAL_SEARCH = "INVALID_WITHDRAWAL_SEARCH";
    public static final String CATEGORY_CASH_SESSION_OPENED = "CASH_SESSION_OPENED";
    public static final String CATEGORY_CASH_SESSION_CLOSED = "CASH_SESSION_CLOSED";
    public static final String CATEGORY_CASH_DISCREPANCY = "CASH_DISCREPANCY";
    public static final String CATEGORY_TRANSFER_EXPIRED = "TRANSFER_EXPIRED";

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public AgentNotificationService(
            NotificationRepository notificationRepository,
            NotificationPreferenceRepository preferenceRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public List<AgentNotificationResponse> getNotifications(Authentication authentication) {
        User user = resolveUser(authentication);
        NotificationPreference preferences = getOrCreatePreferences(user);
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(notification -> shouldDisplay(notification, preferences))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void markAsRead(Authentication authentication, Long notificationId) {
        User user = resolveUser(authentication);
        Notification notification = notificationRepository.findByIdAndUser_Id(notificationId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification introuvable."));
        if (!STATUS_READ.equalsIgnoreCase(notification.getStatus())) {
            notification.setStatus(STATUS_READ);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public NotificationPreference getOrCreatePreferences(User user) {
        return preferenceRepository.findByUser_Id(user.getId()).orElseGet(() -> {
            LocalDateTime now = LocalDateTime.now();
            NotificationPreference preference = new NotificationPreference();
            preference.setUser(user);
            preference.setEmailEnabled(Boolean.TRUE);
            preference.setSmsEnabled(Boolean.FALSE);
            preference.setPushEnabled(Boolean.TRUE);
            preference.setPreferredLanguage("FR");
            preference.setTransferPaidAlerts(Boolean.TRUE);
            preference.setCashSessionAlerts(Boolean.TRUE);
            preference.setSystemAlerts(Boolean.TRUE);
            preference.setKycAlerts(Boolean.TRUE);
            preference.setCashDiscrepancyAlerts(Boolean.TRUE);
            preference.setCreatedAt(now);
            preference.setUpdatedAt(now);
            return preferenceRepository.save(preference);
        });
    }

    @Transactional
    public void notifyTransferCreated(User user, Transfer transfer) {
        createNotification(
                user,
                TYPE_SUCCESS,
                CATEGORY_TRANSFER_CREATED,
                "Transfert cree",
                "Nouveau transfert cree avec succes : " + transfer.getReferenceCode() + ".",
                transfer.getReferenceCode()
        );
    }

    @Transactional
    public void notifyTransferPaid(User user, Transfer transfer) {
        createNotification(
                user,
                TYPE_SUCCESS,
                CATEGORY_TRANSFER_PAID,
                "Paiement confirme",
                "Transfert paye avec succes. Code retrait : " + transfer.getWithdrawalCode() + ".",
                transfer.getReferenceCode()
        );
    }

    @Transactional
    public void notifyPayoutFailed(User user, String referenceCode, String reason) {
        createNotification(
                user,
                TYPE_ERROR,
                CATEGORY_PAYOUT_FAILED,
                "Paiement echoue",
                "Tentative de paiement echouee" + formatReference(referenceCode) + formatReason(reason) + ".",
                referenceCode
        );
    }

    @Transactional
    public void notifyInvalidWithdrawalSearch(User user, String attemptedCode) {
        createNotification(
                user,
                TYPE_ALERT,
                CATEGORY_INVALID_WITHDRAWAL_SEARCH,
                "Code de retrait invalide",
                "Recherche de code de retrait invalide : " + safeValue(attemptedCode) + ".",
                attemptedCode
        );
    }

    @Transactional
    public void notifyCashSessionOpened(User user, BigDecimal openingBalance) {
        createNotification(
                user,
                TYPE_INFO,
                CATEGORY_CASH_SESSION_OPENED,
                "Session de caisse ouverte",
                "Session de caisse ouverte avec un solde initial de " + formatMoney(openingBalance) + ".",
                null
        );
    }

    @Transactional
    public void notifyCashSessionClosed(User user, BigDecimal expectedBalance, BigDecimal actualBalance) {
        createNotification(
                user,
                TYPE_INFO,
                CATEGORY_CASH_SESSION_CLOSED,
                "Session de caisse cloturee",
                "Session de caisse cloturee. Montant attendu : " + formatMoney(expectedBalance)
                        + ", montant reel : " + formatMoney(actualBalance) + ".",
                null
        );
    }

    @Transactional
    public void notifyCashDiscrepancy(User user, BigDecimal difference) {
        createNotification(
                user,
                TYPE_ALERT,
                CATEGORY_CASH_DISCREPANCY,
                "Ecart de caisse detecte",
                "Ecart de caisse detecte : " + formatMoney(difference) + ".",
                null
        );
    }

    @Transactional
    public void notifyTransferExpired(User user, Transfer transfer) {
        createNotification(
                user,
                TYPE_ALERT,
                CATEGORY_TRANSFER_EXPIRED,
                "Transfert expire",
                "Le transfert " + transfer.getReferenceCode() + " a expire.",
                transfer.getReferenceCode()
        );
    }

    private Notification createNotification(
            User user,
            String type,
            String category,
            String title,
            String message,
            String referenceCode
    ) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setChannel("IN_APP");
        notification.setType(type);
        notification.setCategory(category);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setStatus(STATUS_UNREAD);
        notification.setReferenceCode(referenceCode);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    private boolean shouldDisplay(Notification notification, NotificationPreference preferences) {
        String category = notification.getCategory();
        if (CATEGORY_TRANSFER_PAID.equalsIgnoreCase(category)) {
            return isEnabled(preferences.getTransferPaidAlerts());
        }
        if (CATEGORY_CASH_SESSION_OPENED.equalsIgnoreCase(category)
                || CATEGORY_CASH_SESSION_CLOSED.equalsIgnoreCase(category)) {
            return isEnabled(preferences.getCashSessionAlerts());
        }
        if (CATEGORY_CASH_DISCREPANCY.equalsIgnoreCase(category)) {
            return isEnabled(preferences.getCashDiscrepancyAlerts()) && isEnabled(preferences.getCashSessionAlerts());
        }
        return isEnabled(preferences.getSystemAlerts());
    }

    private AgentNotificationResponse toResponse(Notification notification) {
        return new AgentNotificationResponse(
                notification.getId() != null ? notification.getId().toString() : null,
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getStatus(),
                notification.getReferenceCode(),
                notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : null
        );
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

    private boolean isEnabled(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private String formatMoney(BigDecimal amount) {
        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
        return safeAmount.stripTrailingZeros().toPlainString() + " MAD";
    }

    private String formatReference(String referenceCode) {
        return referenceCode == null || referenceCode.isBlank() ? "" : " pour " + referenceCode;
    }

    private String formatReason(String reason) {
        return reason == null || reason.isBlank() ? "" : " : " + reason.trim();
    }

    private String safeValue(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }
}
