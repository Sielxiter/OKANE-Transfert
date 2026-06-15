package com.okane.webhook.service;

import com.okane.webhook.dto.DialogflowWebhookRequest;
import com.okane.webhook.dto.DialogflowWebhookResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DialogflowFulfillmentService {

    private static final Logger log = LoggerFactory.getLogger(DialogflowFulfillmentService.class);

    @Autowired
    private TransferTrackingService trackingService;
    @Autowired
    private FeesCalculationService feesService;
    @Autowired
    private EscalationService escalationService;

    public DialogflowWebhookResponse handleRequest(DialogflowWebhookRequest request) {
        String action = request.getQueryResult().getAction();
        String queryText = request.getQueryResult().getQueryText();
        String lang = detectLanguage(queryText);
        var params = request.getQueryResult().getParameters();

        log.info("Webhook called - action: {}, lang détecté: {}, queryText: {}", action, lang, queryText);
        try {
            switch (action) {
                case "transfer.status":
                    return trackingService.getTransferStatus(params, lang);
                case "fees.calculate":
                    return feesService.calculateFees(params, lang);
                case "escalate.agent":
                    // ✅ On passe queryText pour que EscalationService détecte la langue lui-même
                    return escalationService.escalateToHumanAgent(request.getSession(), lang, queryText);
                default:
                    return new DialogflowWebhookResponse(getFallbackMessage(lang));
            }
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return new DialogflowWebhookResponse("en".equals(lang)
                    ? "An error occurred. Please try again later."
                    : "Une erreur est survenue. Veuillez réessayer plus tard.");
        }
    }

    private String detectLanguage(String text) {
        if (text == null || text.isBlank()) return "fr";

        // 1. Détection arabe en priorité absolue
        if (text.matches(".*[\\u0600-\\u06FF]+.*")) {
            return "ar";
        }

        String lower = text.toLowerCase();

        // 2. Mots français détectés en priorité sur l'anglais
        //    "je", "veux", "parler", "un", "une" etc. → forcément français
        if (lower.matches(".*\\b(je|tu|il|nous|vous|ils|mon|ma|mes|veux|voudrais|souhaite|" +
                "parler|joindre|contacter|aidez|aide|besoin|bonjour|salut|merci|" +
                "transfert|frais|envoyer|retirer|combien|quel|quelle|svp|stp|" +
                "s'il|plaît|avec|pour|par|sur|pas|litige|résoudre|conseiller|humain)\\b.*")) {
            return "fr";
        }

        // 3. Mots exclusivement anglais (sans "agent" qui est commun fr/en)
        if (lower.matches(".*\\b(status|my|what|show|give|check|paid|pending|cancel|" +
                "expired|send|fees|cost|how much|help|hello|hi|speak|talk|human|" +
                "transfer|calculate|withdraw)\\b.*")) {
            return "en";
        }

        // 4. Français par défaut (marché cible Okane)
        return "fr";
    }

    private String getFallbackMessage(String lang) {
        switch (lang) {
            case "en":
                return "I can help you with: track a transfer, calculate fees, send money, withdraw, or contact an agent.";
            case "ar":
                return "يمكنني مساعدتك في: تتبع تحويل، حساب الرسوم، إرسال الأموال، سحب تحويل، أو الاتصال بوكيل.";
            default:
                return "Je peux vous aider à : suivre un transfert, calculer les frais, envoyer de l'argent, retirer un transfert, ou contacter un agent.";
        }
    }
}