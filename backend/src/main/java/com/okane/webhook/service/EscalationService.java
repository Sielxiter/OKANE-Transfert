package com.okane.webhook.service;

import com.okane.webhook.dto.DialogflowWebhookResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class EscalationService {
    private static final Logger log = LoggerFactory.getLogger(EscalationService.class);

    private static final String CUSTOMER_SERVICE_NUMBER = "+212 5 22 00 00 00";

    // ✅ Mots français testés comme mots entiers uniquement (\b)
    private static final List<String> FRENCH_KEYWORDS = Arrays.asList(
            "je", "tu", "il", "nous", "vous", "ils",
            "mon", "ma", "mes", "veux", "voudrais", "souhaite",
            "parler", "joindre", "contacter", "aidez", "aide",
            "besoin", "bonjour", "salut", "merci", "svp", "stp",
            "transfert", "frais", "litige", "résoudre", "conseiller", "humain",
            "pouvez", "envoyer", "retirer", "problème"
    );

    // Méthode 2 args — rétrocompatibilité
    public DialogflowWebhookResponse escalateToHumanAgent(String sessionId, String languageCode) {
        return escalateToHumanAgent(sessionId, languageCode, null);
    }

    // Méthode 3 args — avec détection sur le texte réel
    public DialogflowWebhookResponse escalateToHumanAgent(String sessionId,
                                                          String languageCode,
                                                          String userText) {
        log.info("Escalation | session: {} | languageCode: {} | userText: {}",
                sessionId, languageCode, userText);

        String detectedLang = detectLanguage(userText, languageCode);
        log.info("Language used for response: {}", detectedLang);

        return new DialogflowWebhookResponse(buildMessageForLanguage(detectedLang));
    }

    private String detectLanguage(String userText, String fallbackLanguageCode) {
        if (userText != null && !userText.isBlank()) {

            // 1. Arabe — caractères Unicode Arabic block
            if (userText.matches(".*[\\u0600-\\u06FF]+.*")) {
                return "ar";
            }

            String lower = userText.toLowerCase();

            // 2. Français — mots entiers uniquement (\b pour éviter "ma" dans "human")
            boolean hasFrenchWord = FRENCH_KEYWORDS.stream()
                    .anyMatch(kw -> Pattern.compile("\\b" + Pattern.quote(kw) + "\\b")
                            .matcher(lower).find());

            if (hasFrenchWord) {
                return "fr";
            }

            // 3. Aucun indicateur français/arabe → anglais
            return "en";
        }

        // 4. Fallback sur languageCode Dialogflow
        if (fallbackLanguageCode != null) {
            String lc = fallbackLanguageCode.toLowerCase();
            if (lc.startsWith("ar")) return "ar";
            if (lc.startsWith("en")) return "en";
        }

        // 5. Français par défaut
        return "fr";
    }

    private String buildMessageForLanguage(String lang) {
        switch (lang) {
            case "en":
                return "I'm redirecting you to our Customer Service. "
                        + "You can reach them directly by calling: "
                        + CUSTOMER_SERVICE_NUMBER
                        + ". An agent will be happy to assist you.";
            case "ar":
                return "سيتم تحويلك إلى خدمة العملاء. "
                        + "يمكنك التواصل معهم مباشرةً على الرقم: "
                        + CUSTOMER_SERVICE_NUMBER
                        + ". سيكون أحد الوكلاء سعيداً بمساعدتك.";
            default: // fr
                return "Je vais vous rediriger vers notre Service Client. "
                        + "Vous pouvez les contacter directement au : "
                        + CUSTOMER_SERVICE_NUMBER
                        + ". Un conseiller sera ravi de vous aider.";
        }
    }
}