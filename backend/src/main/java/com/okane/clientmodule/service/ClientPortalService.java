package com.okane.clientmodule.service;

import com.okane.auth.entity.User;
import com.okane.auth.exception.ApiException;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.clientmodule.dto.ChangePasswordRequest;
import com.okane.clientmodule.dto.ClientDashboardSummaryDTO;
import com.okane.clientmodule.dto.ClientNotificationDTO;
import com.okane.clientmodule.dto.ClientProfileDTO;
import com.okane.clientmodule.dto.ClientTrackTransferDTO;
import com.okane.clientmodule.dto.ClientTransferDetailsDTO;
import com.okane.clientmodule.dto.ClientTransferListItemDTO;
import com.okane.clientmodule.dto.ClientTransferReceiptDTO;
import com.okane.clientmodule.dto.NotificationPreferencesRequest;
import com.okane.clientmodule.dto.TransferStatusHistoryDTO;
import com.okane.clientmodule.dto.UpdateClientProfileRequest;
import com.okane.currencyfx.entity.Country;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.repository.CountryRepository;
import com.okane.customer.entity.Customer;
import com.okane.customer.repository.CustomerRepository;
import com.okane.notification.entity.Notification;
import com.okane.notification.entity.NotificationPreference;
import com.okane.notification.repository.NotificationPreferenceRepository;
import com.okane.notification.repository.NotificationRepository;
import com.okane.transfer.entity.Transfer;
import com.okane.transfer.entity.TransferBeneficiary;
import com.okane.transfer.repository.TransferRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientPortalService {

    private static final String DEFAULT_LANGUAGE = "fr";
    private static final String READ_STATUS = "READ";
    private static final String UNREAD_STATUS = "UNREAD";

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final TransferRepository transferRepository;
    private final CountryRepository countryRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final PasswordEncoder passwordEncoder;

    public ClientPortalService(
            UserRepository userRepository,
            CustomerRepository customerRepository,
            TransferRepository transferRepository,
            CountryRepository countryRepository,
            NotificationRepository notificationRepository,
            NotificationPreferenceRepository notificationPreferenceRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.transferRepository = transferRepository;
        this.countryRepository = countryRepository;
        this.notificationRepository = notificationRepository;
        this.notificationPreferenceRepository = notificationPreferenceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public ClientDashboardSummaryDTO getSummary(Authentication authentication) {
        User user = currentUser(authentication);
        long userId = user.getId();
        Customer customer = currentCustomer(userId);

        long totalTransfers = transferRepository.countBySender_User_Id(userId);
        long pendingTransfers = transferRepository.countBySender_User_IdAndStatus(userId, "EN_ATTENTE");
        long paidTransfers = transferRepository.countBySender_User_IdAndStatus(userId, "PAYE");
        long cancelledTransfers = transferRepository.countBySender_User_IdAndStatus(userId, "ANNULE");
        long expiredTransfers = transferRepository.countBySender_User_IdAndStatus(userId, "EXPIRE");

        BigDecimal totalSentAmount = defaultMoney(transferRepository.sumAmountBySender_User_Id(userId));
        BigDecimal totalReceivedAmount = defaultMoney(transferRepository.sumNetAmountBySender_User_Id(userId));
        BigDecimal totalFeesPaid = defaultMoney(transferRepository.sumFeeAmountBySender_User_Id(userId));

        return new ClientDashboardSummaryDTO(
                totalTransfers,
                pendingTransfers,
                paidTransfers,
                cancelledTransfers,
                expiredTransfers,
                totalSentAmount,
                totalReceivedAmount,
                totalFeesPaid,
                resolveDefaultCurrency(customer)
        );
    }

    @Transactional(readOnly = true)
    public Page<ClientTransferListItemDTO> getTransfers(
            Authentication authentication,
            String status,
            String fromDate,
            String toDate,
            String reference,
            Pageable pageable
    ) {
        long userId = currentUser(authentication).getId();
        Specification<Transfer> spec = transferForClientSpec(userId, status, fromDate, toDate, reference);
        return transferRepository.findAll(spec, pageable).map(this::toListItem);
    }

    @Transactional(readOnly = true)
    public ClientTransferDetailsDTO getTransferDetails(Authentication authentication, String reference) {
        Transfer transfer = getClientTransfer(authentication, reference);
        return toDetails(transfer);
    }

    @Transactional(readOnly = true)
    public ClientTrackTransferDTO trackTransfer(Authentication authentication, String reference) {
        Transfer transfer = getClientTransfer(authentication, reference);
        ClientTransferDetailsDTO details = toDetails(transfer);
        return new ClientTrackTransferDTO(
                details.reference(),
                details.beneficiaryFullName(),
                details.sendAmount(),
                details.sendCurrency(),
                details.receiveAmount(),
                details.receiveCurrency(),
                details.status(),
                details.receiveCountry(),
                details.createdAt(),
                details.statusHistory()
        );
    }

    @Transactional(readOnly = true)
    public ClientTransferReceiptDTO getReceipt(Authentication authentication, String reference) {
        Transfer transfer = getClientTransfer(authentication, reference);
        return new ClientTransferReceiptDTO(
                transfer.getReferenceCode(),
                transfer.getWithdrawalCode(),
                beneficiaryLabel(transfer),
                defaultMoney(transfer.getAmount()),
                resolveSendCurrency(transfer),
                defaultMoney(transfer.getFeeAmount()),
                defaultMoney(transfer.getNetAmount()),
                defaultMoney(transfer.getExchangeRate()),
                safeAgencyName(transfer),
                safeAgentName(transfer),
                transfer.getStatus(),
                transfer.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public Page<ClientNotificationDTO> getNotifications(Authentication authentication, Boolean read, String type, Pageable pageable) {
        long userId = currentUser(authentication).getId();
        Specification<Notification> spec = notificationSpec(userId, read, type);
        return notificationRepository.findAll(spec, pageable).map(this::toNotification);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Authentication authentication) {
        try {
            long userId = currentUser(authentication).getId();
            return notificationRepository.countByUser_IdAndStatusIgnoreCase(userId, UNREAD_STATUS);
        } catch (RuntimeException ex) {
            return 0L;
        }
    }

    @Transactional
    public void markNotificationRead(Authentication authentication, Long id) {
        Notification notification = notificationRepository
                .findByIdAndUser_Id(id, currentUser(authentication).getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification introuvable."));
        notification.setStatus(READ_STATUS);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllNotificationsRead(Authentication authentication) {
        long userId = currentUser(authentication).getId();
        List<Notification> notifications = notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId, Pageable.unpaged()).getContent();
        for (Notification notification : notifications) {
            if (!READ_STATUS.equalsIgnoreCase(notification.getStatus())) {
                notification.setStatus(READ_STATUS);
                notification.setReadAt(LocalDateTime.now());
            }
        }
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void deleteNotification(Authentication authentication, Long id) {
        long userId = currentUser(authentication).getId();
        Notification notification = notificationRepository
                .findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification introuvable."));
        notificationRepository.delete(notification);
    }

    @Transactional(readOnly = true)
    public ClientProfileDTO getProfile(Authentication authentication) {
        User user = currentUser(authentication);
        Customer customer = currentCustomer(user.getId());
        NotificationPreference preference = currentPreference(user.getId());
        return toProfile(user, customer, preference);
    }

    @Transactional
    public ClientProfileDTO updateProfile(Authentication authentication, UpdateClientProfileRequest request) {
        User user = currentUser(authentication);
        Customer customer = currentCustomer(user.getId());

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPhone(normalizeNullable(request.phone()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        if (request.country() != null && !request.country().isBlank()) {
            customer.setCountry(request.country().trim());
        }
        customer.setUpdatedAt(LocalDateTime.now());
        customerRepository.save(customer);

        NotificationPreference preference = currentPreference(user.getId());
        if (request.preferredLanguage() != null && !request.preferredLanguage().isBlank()) {
            preference.setPreferredLanguage(request.preferredLanguage().trim().toLowerCase(Locale.ROOT));
            preference.setUpdatedAt(LocalDateTime.now());
            notificationPreferenceRepository.save(preference);
        }

        return toProfile(user, customer, preference);
    }

    @Transactional
    public void changePassword(Authentication authentication, ChangePasswordRequest request) {
        if (!Objects.equals(request.newPassword(), request.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La confirmation du mot de passe est invalide.");
        }

        User user = currentUser(authentication);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le mot de passe actuel est incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public ClientProfileDTO updateNotificationPreferences(Authentication authentication, NotificationPreferencesRequest request) {
        User user = currentUser(authentication);
        Customer customer = currentCustomer(user.getId());
        NotificationPreference preference = currentPreference(user.getId());
        preference.setEmailEnabled(request.emailNotificationsEnabled());
        preference.setSmsEnabled(request.smsNotificationsEnabled());
        preference.setUpdatedAt(LocalDateTime.now());
        notificationPreferenceRepository.save(preference);
        return toProfile(user, customer, preference);
    }

    private Transfer getClientTransfer(Authentication authentication, String reference) {
        long userId = currentUser(authentication).getId();
        return transferRepository.findByReferenceCodeAndSender_User_Id(reference, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Aucun transfert trouvé avec cette référence."));
    }

    private ClientTransferListItemDTO toListItem(Transfer transfer) {
        return new ClientTransferListItemDTO(
                transfer.getReferenceCode(),
                beneficiaryLabel(transfer),
                safeCountryName(transfer.getSender() != null ? transfer.getSender().getCountry() : null),
                resolveReceiveCountry(transfer),
                defaultMoney(transfer.getAmount()),
                resolveSendCurrency(transfer),
                defaultMoney(transfer.getNetAmount()),
                resolveReceiveCurrency(transfer),
                defaultMoney(transfer.getFeeAmount()),
                transfer.getStatus(),
                transfer.getCreatedAt()
        );
    }

    private ClientTransferDetailsDTO toDetails(Transfer transfer) {
        LocalDateTime createdAt = transfer.getCreatedAt();
        return new ClientTransferDetailsDTO(
                transfer.getReferenceCode(),
                senderLabel(transfer),
                transfer.getSender() != null ? transfer.getSender().getUser().getPhone() : null,
                beneficiaryLabel(transfer),
                safeBeneficiaryPhone(transfer),
                safeCountryName(transfer.getSender() != null ? transfer.getSender().getCountry() : null),
                resolveReceiveCountry(transfer),
                defaultMoney(transfer.getAmount()),
                resolveSendCurrency(transfer),
                defaultMoney(transfer.getNetAmount()),
                resolveReceiveCurrency(transfer),
                defaultMoney(transfer.getFeeAmount()),
                defaultMoney(transfer.getExchangeRate()),
                transfer.getStatus(),
                safeAgencyName(transfer),
                null,
                createdAt,
                buildStatusHistory(transfer.getStatus(), createdAt)
        );
    }

    private ClientNotificationDTO toNotification(Notification notification) {
        boolean read = READ_STATUS.equalsIgnoreCase(notification.getStatus()) || notification.getReadAt() != null;
        return new ClientNotificationDTO(
                notification.getId(),
                notification.getTitle() != null ? notification.getTitle() : notification.getType(),
                notification.getMessage(),
                notification.getType(),
                read,
                notification.getCreatedAt(),
                notification.getTransferReference()
        );
    }

    private ClientProfileDTO toProfile(User user, Customer customer, NotificationPreference preference) {
        return new ClientProfileDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                customer.getCountry(),
                preference.getPreferredLanguage() != null ? preference.getPreferredLanguage() : DEFAULT_LANGUAGE,
                Boolean.TRUE.equals(preference.getEmailEnabled()),
                Boolean.TRUE.equals(preference.getSmsEnabled())
        );
    }

    private List<TransferStatusHistoryDTO> buildStatusHistory(String status, LocalDateTime createdAt) {
        List<TransferStatusHistoryDTO> history = new ArrayList<>();
        history.add(new TransferStatusHistoryDTO(status, labelForStatus(status), descriptionForStatus(status), createdAt));
        return history;
    }

    private String labelForStatus(String status) {
        if (status == null) {
            return "Transfert créé";
        }
        return switch (status.toUpperCase(Locale.ROOT)) {
            case "PAYE" -> "Transfert payé";
            case "ANNULE" -> "Transfert annulé";
            case "EXPIRE" -> "Transfert expiré";
            case "SUSPECT" -> "Transfert signalé";
            default -> "Transfert créé";
        };
    }

    private String descriptionForStatus(String status) {
        if (status == null) {
            return "Le transfert a été créé.";
        }
        return switch (status.toUpperCase(Locale.ROOT)) {
            case "PAYE" -> "Le transfert a été remis au bénéficiaire.";
            case "ANNULE" -> "Le transfert a été annulé.";
            case "EXPIRE" -> "Le transfert a expiré.";
            case "SUSPECT" -> "Le transfert a été signalé pour revue.";
            default -> "Le transfert attend une action.";
        };
    }

    private String senderLabel(Transfer transfer) {
        if (transfer.getSender() == null || transfer.getSender().getUser() == null) {
            return "-";
        }
        User user = transfer.getSender().getUser();
        return (safeText(user.getFirstName()) + " " + safeText(user.getLastName())).trim();
    }

    private String beneficiaryLabel(Transfer transfer) {
        TransferBeneficiary beneficiary = transfer.getBeneficiarySnapshot();
        if (beneficiary != null) {
            return (safeText(beneficiary.getFirstName()) + " " + safeText(beneficiary.getLastName())).trim();
        }
        if (transfer.getBeneficiary() != null && transfer.getBeneficiary().getUser() != null) {
            User user = transfer.getBeneficiary().getUser();
            return (safeText(user.getFirstName()) + " " + safeText(user.getLastName())).trim();
        }
        return "-";
    }

    private String safeBeneficiaryPhone(Transfer transfer) {
        TransferBeneficiary beneficiary = transfer.getBeneficiarySnapshot();
        if (beneficiary != null && beneficiary.getPhone() != null) {
            return beneficiary.getPhone();
        }
        return transfer.getBeneficiary() != null && transfer.getBeneficiary().getUser() != null
                ? transfer.getBeneficiary().getUser().getPhone()
                : null;
    }

    private String resolveReceiveCountry(Transfer transfer) {
        TransferBeneficiary beneficiary = transfer.getBeneficiarySnapshot();
        if (beneficiary != null && beneficiary.getCountryName() != null) {
            return beneficiary.getCountryName();
        }
        return transfer.getBeneficiary() != null ? safeCountryName(transfer.getBeneficiary().getCountry()) : "-";
    }

    private String resolveSendCurrency(Transfer transfer) {
        Currency currency = transfer.getCurrency();
        return currency != null ? safeText(currency.getSymbol()) : "MAD";
    }

    private String resolveReceiveCurrency(Transfer transfer) {
        TransferBeneficiary beneficiary = transfer.getBeneficiarySnapshot();
        if (beneficiary == null || beneficiary.getCountryCode() == null || beneficiary.getCountryCode().isBlank()) {
            return resolveSendCurrency(transfer);
        }
        return countryRepository.findByCode(beneficiary.getCountryCode().trim().toUpperCase(Locale.ROOT))
                .map(Country::getCurrency)
                .map(Currency::getSymbol)
                .filter(symbol -> !symbol.isBlank())
                .orElse(resolveSendCurrency(transfer));
    }

    private String safeAgencyName(Transfer transfer) {
        if (transfer.getSourceAgency() != null) {
            return transfer.getSourceAgency().getName();
        }
        return null;
    }

    private String safeAgentName(Transfer transfer) {
        if (transfer.getCreatedBy() == null) {
            return null;
        }
        return (safeText(transfer.getCreatedBy().getFirstName()) + " " + safeText(transfer.getCreatedBy().getLastName())).trim();
    }

    private String safeCountryName(String country) {
        return country != null && !country.isBlank() ? country : "-";
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String safeText(String value) {
        return value != null ? value : "";
    }

    private String resolveDefaultCurrency(Customer customer) {
        if (customer != null && customer.getCountry() != null) {
            String country = customer.getCountry().trim().toLowerCase(Locale.ROOT);
            if (country.contains("maroc") || country.contains("morocco")) {
                return "MAD";
            }
        }
        return "MAD";
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifie.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof OkaneUserPrincipal okaneUserPrincipal) {
            return okaneUserPrincipal.getUser();
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifie."));
    }

    private Customer currentCustomer(long userId) {
        return customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profil client introuvable."));
    }

    private NotificationPreference currentPreference(long userId) {
        return notificationPreferenceRepository.findByUser_Id(userId).orElseGet(() -> {
            NotificationPreference preference = new NotificationPreference();
            preference.setUser(userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable.")));
            preference.setEmailEnabled(true);
            preference.setSmsEnabled(true);
            preference.setPushEnabled(true);
            preference.setPreferredLanguage(DEFAULT_LANGUAGE);
            preference.setCreatedAt(LocalDateTime.now());
            preference.setUpdatedAt(LocalDateTime.now());
            return notificationPreferenceRepository.save(preference);
        });
    }

    private Specification<Transfer> transferForClientSpec(
            long userId,
            String status,
            String fromDate,
            String toDate,
            String reference
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("sender").get("user").get("id"), userId));

            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase(Locale.ROOT)));
            }
            if (reference != null && !reference.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("referenceCode")), "%" + reference.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (fromDate != null && !fromDate.isBlank()) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), LocalDate.parse(fromDate).atStartOfDay()));
            }
            if (toDate != null && !toDate.isBlank()) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), LocalDate.parse(toDate).atTime(23, 59, 59)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<Notification> notificationSpec(long userId, Boolean read, String type) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            if (read != null) {
                if (read) {
                    predicates.add(cb.or(
                            cb.equal(cb.upper(root.get("status")), READ_STATUS),
                            cb.isNotNull(root.get("readAt"))
                    ));
                } else {
                    predicates.add(cb.and(
                            cb.notEqual(cb.upper(root.get("status")), READ_STATUS),
                            cb.isNull(root.get("readAt"))
                    ));
                }
            }

            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("type")), type.trim().toUpperCase(Locale.ROOT)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
