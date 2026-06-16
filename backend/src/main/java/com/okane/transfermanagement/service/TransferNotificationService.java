package com.okane.transfermanagement.service;

import com.okane.transfer.entity.Transfer;
import com.okane.transfer.entity.TransferBeneficiary;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Properties;
import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TransferNotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TransferNotificationService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.FRANCE);

    @Value("${app.mail.enabled:true}")
    private boolean enabled;

    @Value("${app.mail.smtp-host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${app.mail.smtp-port:587}")
    private int smtpPort;

    @Value("${app.mail.username:}")
    private String username;

    @Value("${app.mail.password:}")
    private String password;

    @Value("${app.mail.from:${app.mail.username:}}")
    private String fromAddress;

    @Value("${app.mail.auth-enabled:true}")
    private boolean authEnabled;

    @Value("${app.mail.starttls-enabled:true}")
    private boolean starttlsEnabled;

    public void notifyTransferCreated(Transfer transfer, TransferBeneficiary beneficiary, String senderEmail) {
        if (!enabled) {
            LOGGER.info("Email notifications are disabled. Transfer {} notifications skipped.", safeReference(transfer));
            return;
        }

        try {
            Session session = createSession();
            String from = resolveFromAddress();
            if (senderEmail != null && !senderEmail.isBlank()) {
                sendMessage(session, from, senderEmail, buildSenderSubject(transfer), buildSenderBody(transfer, beneficiary, senderEmail));
            }
            if (beneficiary != null && beneficiary.getEmail() != null && !beneficiary.getEmail().isBlank()) {
                sendMessage(session, from, beneficiary.getEmail(), buildBeneficiarySubject(transfer), buildBeneficiaryBody(transfer, beneficiary));
            }
        } catch (Exception ex) {
            LOGGER.warn("Unable to send transfer notification emails for transfer {}: {}", safeReference(transfer), ex.getMessage(), ex);
        }
    }

    private Session createSession() {
        Properties props = new Properties();
        props.put("mail.smtp.host", smtpHost);
        props.put("mail.smtp.port", String.valueOf(smtpPort));
        props.put("mail.smtp.auth", String.valueOf(authEnabled));
        props.put("mail.smtp.starttls.enable", String.valueOf(starttlsEnabled));
        props.put("mail.smtp.ssl.trust", smtpHost);
        props.put("mail.mime.charset", StandardCharsets.UTF_8.name());

        Authenticator authenticator = new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        };

        return Session.getInstance(props, authenticator);
    }

    private void sendMessage(Session session, String from, String to, String subject, String body) throws Exception {
        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(from));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to, false));
        message.setSubject(subject, StandardCharsets.UTF_8.name());
        message.setText(body, StandardCharsets.UTF_8.name());
        Transport.send(message);
    }

    private String resolveFromAddress() {
        if (fromAddress != null && !fromAddress.isBlank()) {
            return fromAddress.trim();
        }
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        throw new IllegalStateException("SMTP sender address is not configured.");
    }

    private String buildSenderSubject(Transfer transfer) {
        return "Okane Transfer - Confirmation de transfert " + safeReference(transfer);
    }

    private String buildBeneficiarySubject(Transfer transfer) {
        return "Okane Transfer - Votre transfert est disponible " + safeReference(transfer);
    }

    private String buildSenderBody(Transfer transfer, TransferBeneficiary beneficiary, String senderEmail) {
        return """
                Bonjour,

                Votre transfert a bien ete cree sur Okane Transfer.

                Reference: %s
                Code de retrait: %s
                Beneficiaire: %s %s
                Email beneficiaire: %s
                Montant envoye: %s MAD
                Frais transfer: %s MAD
                Montant net a recevoir: %s MAD
                Date de creation: %s

                Ce message a ete envoye a %s.
                """.formatted(
                safeReference(transfer),
                safeWithdrawalCode(transfer),
                safeText(beneficiary != null ? beneficiary.getFirstName() : null),
                safeText(beneficiary != null ? beneficiary.getLastName() : null),
                safeText(beneficiary != null ? beneficiary.getEmail() : null),
                formatMoney(transfer.getAmount()),
                formatMoney(transfer.getFeeAmount()),
                formatMoney(transfer.getNetAmount()),
                transfer.getCreatedAt() != null ? transfer.getCreatedAt().format(DATE_FORMAT) : "-",
                senderEmail
        );
    }

    private String buildBeneficiaryBody(Transfer transfer, TransferBeneficiary beneficiary) {
        return """
                Bonjour %s,

                Un transfert a ete cree a votre nom sur Okane Transfer.

                Reference: %s
                Code de retrait: %s
                Expediteur: %s
                Pays beneficiaire: %s
                Montant a recevoir: %s MAD
                Frais de transfert: %s MAD
                Date de creation: %s

                Preservez ce code de retrait pour retirer votre argent.
                """.formatted(
                safeText(beneficiary != null ? beneficiary.getFirstName() : null),
                safeReference(transfer),
                safeWithdrawalCode(transfer),
                transfer.getSender() != null && transfer.getSender().getUser() != null
                        ? safeFullName(transfer.getSender().getUser().getFirstName(), transfer.getSender().getUser().getLastName())
                        : "Expediteur",
                beneficiary != null ? safeText(beneficiary.getCountryName()) : "-",
                formatMoney(transfer.getNetAmount()),
                formatMoney(transfer.getFeeAmount()),
                transfer.getCreatedAt() != null ? transfer.getCreatedAt().format(DATE_FORMAT) : "-"
        );
    }

    private String formatMoney(BigDecimal value) {
        if (value == null) {
            return "0.00";
        }
        NumberFormat formatter = NumberFormat.getNumberInstance(Locale.FRANCE);
        formatter.setMinimumFractionDigits(2);
        formatter.setMaximumFractionDigits(2);
        return formatter.format(value);
    }

    private String safeReference(Transfer transfer) {
        return transfer != null && transfer.getReferenceCode() != null ? transfer.getReferenceCode() : "-";
    }

    private String safeWithdrawalCode(Transfer transfer) {
        return transfer != null && transfer.getWithdrawalCode() != null ? transfer.getWithdrawalCode() : "-";
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String safeFullName(String firstName, String lastName) {
        String fullName = (safeText(firstName) + " " + safeText(lastName)).trim();
        return fullName.isBlank() ? "-" : fullName;
    }
}
