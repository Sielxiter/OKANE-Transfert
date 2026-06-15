package com.okane.webhook.service;

import com.okane.transfer.entity.Transfer;
import com.okane.transfer.repository.TransferRepository;
import com.okane.webhook.dto.DialogflowWebhookResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.Optional;
import java.util.List;

@Service
public class TransferTrackingService {

    private static final Logger log = LoggerFactory.getLogger(TransferTrackingService.class);

    @Autowired
    private TransferRepository transferRepository;

    @Transactional(readOnly = true)
    public DialogflowWebhookResponse getTransferStatus(Map<String, Object> parameters, String languageCode) {
        log.debug("Parameters reçus : {}", parameters);
        String referenceCode = extractTransferCode(parameters.get("transfer_code"));
        if (referenceCode == null || referenceCode.isBlank()) {
            return errorResponse(languageCode, "missing_code");
        }
        Optional<Transfer> transferOpt = transferRepository.findByReferenceCodeIgnoreCase(referenceCode);
        if (transferOpt.isEmpty()) {
            return errorResponse(languageCode, "not_found", referenceCode);
        }
        Transfer transfer = transferOpt.get();
        return new DialogflowWebhookResponse(formatStatusMessage(transfer, languageCode));
    }

    private String formatStatusMessage(Transfer transfer, String lang) {
        String status = transfer.getStatus();
        String ref = transfer.getReferenceCode();
        String amount = transfer.getAmount() != null ? transfer.getAmount().toString() : "0";
        String currency = transfer.getCurrency() != null ? transfer.getCurrency().getCode() : "MAD";
        String withdrawalCode = transfer.getWithdrawalCode();
        boolean en = lang != null && lang.toLowerCase().startsWith("en"); // ✅ robuste : "en", "en-US", "en-GB"

        if (en) {
            switch (status.toUpperCase()) {
                case "PENDING":
                    return "Your transfer " + ref + " is pending. Withdrawal code: " + withdrawalCode + ". Amount: " + amount + " " + currency;
                case "PAID":
                    return "Your transfer " + ref + " has been paid out.";
                case "EXPIRED":
                    return "Your transfer " + ref + " has expired.";
                case "CANCELLED":
                    return "Your transfer " + ref + " has been cancelled.";
                default:
                    return "Status of transfer " + ref + ": " + status;
            }
        } else {
            switch (status.toUpperCase()) {
                case "PENDING":
                    return "Votre transfert " + ref + " est en attente. Code de retrait : " + withdrawalCode + ". Montant : " + amount + " " + currency;
                case "PAID":
                    return "Votre transfert " + ref + " a été payé.";
                case "EXPIRED":
                    return "Votre transfert " + ref + " a expiré.";
                case "CANCELLED":
                    return "Votre transfert " + ref + " a été annulé.";
                default:
                    return "Statut du transfert " + ref + " : " + status;
            }
        }
    }

    private DialogflowWebhookResponse errorResponse(String lang, String key, Object... args) {
        boolean en = lang != null && lang.toLowerCase().startsWith("en"); // ✅ idem ici

        if (en) {
            if ("missing_code".equals(key))
                return new DialogflowWebhookResponse("Please provide a transfer code (e.g., TR-2026-06-14-77EC11).");
            if ("not_found".equals(key))
                return new DialogflowWebhookResponse("Transfer with code " + args[0] + " not found.");
        } else {
            if ("missing_code".equals(key))
                return new DialogflowWebhookResponse("Veuillez fournir un code de transfert (ex: TR-2026-06-14-77EC11).");
            if ("not_found".equals(key))
                return new DialogflowWebhookResponse("Transfert avec le code " + args[0] + " introuvable.");
        }
        return new DialogflowWebhookResponse("Error");
    }

    private String extractTransferCode(Object value) {
        if (value == null) return null;

        if (value instanceof List) {
            List<?> list = (List<?>) value;
            if (!list.isEmpty() && list.get(0) != null) {
                return list.get(0).toString().trim();
            }
            return null;
        }

        if (value instanceof String) {
            return ((String) value).trim();
        }

        if (value instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) value;
            Object resolved = map.get("resolved");
            if (resolved != null) return resolved.toString().trim();
            Object original = map.get("original");
            if (original != null) return original.toString().trim();
        }

        return value.toString().trim();
    }
}