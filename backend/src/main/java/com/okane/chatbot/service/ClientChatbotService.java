package com.okane.chatbot.service;

import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.auth.security.OkaneUserPrincipal;
import com.okane.chatbot.dto.ChatbotConversationDTO;
import com.okane.chatbot.dto.ChatbotMessageDTO;
import com.okane.chatbot.dto.ChatbotSendMessageRequestDTO;
import com.okane.chatbot.entity.ChatbotMessage;
import com.okane.chatbot.entity.ChatbotSession;
import com.okane.chatbot.repository.ChatbotMessageRepository;
import com.okane.chatbot.repository.ChatbotSessionRepository;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientChatbotService {
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String SENDER_USER = "USER";
    private static final String SENDER_ASSISTANT = "ASSISTANT";

    private static final List<String> SUGGESTED_QUESTIONS = List.of(
            "Comment suivre un transfert ?",
            "Quels sont les frais ?",
            "Comment mettre à jour mon profil ?",
            "Que faire si mon transfert est bloqué ?",
            "Comment fonctionne la vérification KYC ?"
    );

    private final ChatbotSessionRepository sessionRepository;
    private final ChatbotMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final GeminiChatbotClient geminiChatbotClient;

    public ClientChatbotService(
            ChatbotSessionRepository sessionRepository,
            ChatbotMessageRepository messageRepository,
            UserRepository userRepository,
            GeminiChatbotClient geminiChatbotClient
    ) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.geminiChatbotClient = geminiChatbotClient;
    }

    @Transactional(readOnly = true)
    public ChatbotConversationDTO getConversation(Authentication authentication, String language) {
        ChatbotSession session = getOrCreateSession(authentication, language);
        return toConversation(session);
    }

    @Transactional
    public ChatbotConversationDTO sendMessage(Authentication authentication, ChatbotSendMessageRequestDTO request) {
        String language = normalizeLanguage(request.language());
        User currentUser = currentUser(authentication);
        ChatbotSession session = getOrCreateSession(authentication, language);
        session.setLanguage(language);
        sessionRepository.save(session);

        String userMessageText = sanitize(request.message());
        String normalized = normalize(userMessageText);
        String intent = detectIntent(normalized);

        ChatbotMessage userMessage = new ChatbotMessage();
        userMessage.setSession(session);
        userMessage.setSenderType(SENDER_USER);
        userMessage.setSenderUser(currentUser);
        userMessage.setMessage(userMessageText);
        userMessage.setDetectedIntent(intent);
        userMessage.setCreatedAt(LocalDateTime.now());
        messageRepository.save(userMessage);

        String reply = buildReply(language, normalized, userMessageText, session);

        ChatbotMessage assistantMessage = new ChatbotMessage();
        assistantMessage.setSession(session);
        assistantMessage.setSenderType(SENDER_ASSISTANT);
        assistantMessage.setMessage(reply);
        assistantMessage.setDetectedIntent(intent);
        assistantMessage.setCreatedAt(LocalDateTime.now());
        messageRepository.save(assistantMessage);

        return toConversation(session);
    }

    private ChatbotConversationDTO toConversation(ChatbotSession session) {
        List<ChatbotMessageDTO> messages = messageRepository.findBySession_IdOrderByCreatedAtAsc(session.getId())
                .stream()
                .map(message -> new ChatbotMessageDTO(
                        message.getId(),
                        message.getSenderType(),
                        message.getMessage(),
                        message.getDetectedIntent(),
                        message.getCreatedAt()
                ))
                .toList();

        return new ChatbotConversationDTO(
                session.getId(),
                session.getStatus(),
                session.getLanguage(),
                session.getStartedAt(),
                session.getEndedAt(),
                messages,
                SUGGESTED_QUESTIONS
        );
    }

    private String buildReply(String language, String normalizedMessage, String originalMessage, ChatbotSession session) {
        Optional<LocalFaqAnswer> localAnswer = findLocalAnswer(normalizedMessage, language);
        if (localAnswer.isPresent()) {
            return localAnswer.get().answer();
        }

        if (!isInScope(normalizedMessage)) {
            return refusalMessage(language);
        }

        List<ChatbotMessage> recentMessages = messageRepository.findBySession_IdOrderByCreatedAtAsc(session.getId());
        String faqContext = buildFaqContext(language);
        String reply = geminiChatbotClient.generateReply(language, recentMessages, originalMessage, faqContext);
        if (reply == null || reply.isBlank()) {
            return fallbackMessage(language);
        }
        return reply.trim();
    }

    private String buildFaqContext(String language) {
        return String.join("\n", List.of(
                faqLine(language, "Suivi transfert", "Le client suit un transfert depuis le menu Suivi transfert ou depuis le détail du transfert.", "The client tracks a transfer from the Track Transfer menu or from the transfer details screen.", "يمكن للعميل متابعة التحويل من صفحة تتبع التحويل أو من تفاصيل التحويل."),
                faqLine(language, "Frais", "Les frais sont calculés automatiquement selon la grille tarifaire et le corridor applicable.", "Fees are calculated automatically from the tariff grid and the applicable corridor.", "تُحسب الرسوم تلقائياً حسب جدول التعرفة والممر المطبق."),
                faqLine(language, "Profil", "Le profil se met à jour depuis l'espace Profil du client.", "The profile can be updated from the client Profile area.", "يمكن تحديث الملف الشخصي من صفحة الملف الشخصي للعميل."),
                faqLine(language, "KYC / AML", "La vérification KYC / AML se fait dans l'espace Vérification KYC / AML avec dépôt du document.", "KYC / AML verification is done from the KYC / AML Verification area by uploading a document.", "يتم التحقق KYC / AML من صفحة التحقق عبر رفع الوثيقة."),
                faqLine(language, "Transfert bloqué", "Si un transfert est bloqué, il faut vérifier les notifications et contacter le support si nécessaire.", "If a transfer is blocked, check notifications and contact support if needed.", "إذا كان التحويل متوقفاً، تحقق من الإشعارات وتواصل مع الدعم إذا لزم الأمر.")
        ));
    }

    private String faqLine(String language, String title, String fr, String en, String ar) {
        String content = switch (normalizeLanguage(language)) {
            case "en" -> en;
            case "ar" -> ar;
            default -> fr;
        };
        return "- " + title + ": " + content;
    }

    private Optional<LocalFaqAnswer> findLocalAnswer(String normalizedMessage, String language) {
        if (containsAny(normalizedMessage, "comment suivre un transfert", "suivi transfert", "suivre transfert", "where is my transfer", "track transfer", "suivi de transfert")) {
            return Optional.of(new LocalFaqAnswer("TRACK_TRANSFER", switch (normalizeLanguage(language)) {
                case "en" -> "Tu peux suivre un transfert depuis la page Suivi transfert ou depuis la liste de tes transferts. Utilise la référence du transfert pour voir son statut et son historique.";
                case "ar" -> "يمكنك تتبع التحويل من صفحة تتبع التحويل أو من قائمة التحويلات الخاصة بك. استخدم مرجع التحويل لعرض الحالة والتاريخ.";
                default -> "Tu peux suivre un transfert depuis la page Suivi transfert ou depuis la liste de tes transferts. Utilise la référence du transfert pour voir son statut et son historique.";
            }));
        }

        if (containsAny(normalizedMessage, "frais", "commission", "tarif", "tariff", "combien coute", "combien coute", "fees")) {
            return Optional.of(new LocalFaqAnswer("FEES", switch (normalizeLanguage(language)) {
                case "en" -> "Les fees are calculated automatically according to the tariff grid and the corridor applied to the transfer. The final amount is shown before validation.";
                case "ar" -> "تُحسب الرسوم تلقائياً حسب جدول التعرفة والممر المطبق على التحويل. يتم عرض المبلغ النهائي قبل التأكيد.";
                default -> "Les frais sont calculés automatiquement selon la grille tarifaire et le corridor appliqué au transfert. Le montant final est affiché avant validation.";
            }));
        }

        if (containsAny(normalizedMessage, "profil", "mettre a jour mon profil", "mettre a jour", "change password", "mot de passe", "account profile")) {
            return Optional.of(new LocalFaqAnswer("PROFILE", switch (normalizeLanguage(language)) {
                case "en" -> "Tu peux mettre à jour ton profil depuis l'espace Profil. Tu peux aussi changer ton mot de passe et tes préférences de notification depuis cette zone.";
                case "ar" -> "يمكنك تحديث ملفك الشخصي من صفحة الملف الشخصي. كما يمكنك تغيير كلمة المرور وتفضيلات الإشعارات من نفس المكان.";
                default -> "Tu peux mettre à jour ton profil depuis l'espace Profil. Tu peux aussi changer ton mot de passe et tes préférences de notification depuis cette zone.";
            }));
        }

        if (containsAny(normalizedMessage, "kyc", "aml", "verification", "vérification", "piece", "passeport", "cin", "document")) {
            return Optional.of(new LocalFaqAnswer("KYC_AML", switch (normalizeLanguage(language)) {
                case "en" -> "La vérification KYC / AML se fait dans l'espace Vérification KYC / AML. Il faut déposer une pièce d'identité ou un passeport pour lancer l'analyse côté serveur.";
                case "ar" -> "يتم التحقق KYC / AML من صفحة التحقق KYC / AML. يجب رفع بطاقة الهوية أو جواز السفر لبدء التحليل من جهة الخادم.";
                default -> "La vérification KYC / AML se fait dans l'espace Vérification KYC / AML. Il faut déposer une pièce d'identité ou un passeport pour lancer l'analyse côté serveur.";
            }));
        }

        if (containsAny(normalizedMessage, "bloque", "bloque", "retard", "annule", "annule", "cancelled", "stuck")) {
            return Optional.of(new LocalFaqAnswer("BLOCKED_TRANSFER", switch (normalizeLanguage(language)) {
                case "en" -> "Si ton transfert est bloqué, vérifie d'abord les notifications liées au dossier, puis contacte le support Okane Transfer si le blocage persiste.";
                case "ar" -> "إذا كان التحويل متوقفاً، تحقق أولاً من الإشعارات المرتبطة بالملف، ثم تواصل مع دعم Okane Transfer إذا استمر التوقف.";
                default -> "Si ton transfert est bloqué, vérifie d'abord les notifications liées au dossier, puis contacte le support Okane Transfer si le blocage persiste.";
            }));
        }

        if (containsAny(normalizedMessage, "notification", "notifications", "alerte", "alert", "message", "compte")) {
            return Optional.of(new LocalFaqAnswer("NOTIFICATIONS", switch (normalizeLanguage(language)) {
                case "en" -> "Tu peux consulter tes notifications depuis l'espace Notifications. Les alertes de transfert et de compte y sont regroupées.";
                case "ar" -> "يمكنك الاطلاع على الإشعارات من صفحة الإشعارات. يتم تجميع تنبيهات التحويل والحساب هناك.";
                default -> "Tu peux consulter tes notifications depuis l'espace Notifications. Les alertes de transfert et de compte y sont regroupées.";
            }));
        }

        return Optional.empty();
    }

    private boolean isInScope(String normalizedMessage) {
        return containsAny(normalizedMessage,
                "okane", "transfer", "transfert", "transferts", "frais", "commission", "corridor", "kyc", "aml", "profil", "profile", "notification", "notifications", "compte", "client", "support", "suivi", "track", "payout", "paiement", "sender", "beneficiaire", "beneficiaire", "devises", "change"
        );
    }

    private String detectIntent(String normalizedMessage) {
        return findLocalAnswer(normalizedMessage, "fr")
                .map(LocalFaqAnswer::intent)
                .orElseGet(() -> isInScope(normalizedMessage) ? "OKANE_SUPPORT" : "OUT_OF_SCOPE");
    }

    private ChatbotSession getOrCreateSession(Authentication authentication, String language) {
        User user = currentUser(authentication);
        return sessionRepository.findFirstByUser_IdAndStatusOrderByStartedAtDesc(user.getId(), STATUS_ACTIVE)
                .orElseGet(() -> createSession(user, language));
    }

    private ChatbotSession createSession(User user, String language) {
        ChatbotSession session = new ChatbotSession();
        session.setUser(user);
        session.setStatus(STATUS_ACTIVE);
        session.setLanguage(language);
        session.setStartedAt(LocalDateTime.now());
        return sessionRepository.save(session);
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof OkaneUserPrincipal principal)) {
            throw new IllegalStateException("Utilisateur authentifié introuvable.");
        }

        return userRepository.findById(principal.getUser().getId())
                .orElseThrow(() -> new IllegalStateException("Utilisateur authentifié introuvable."));
    }

    private String normalizeLanguage(String language) {
        if (language == null) {
            return "fr";
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "en", "ar" -> normalized;
            default -> "fr";
        };
    }

    private String sanitize(String message) {
        return message == null ? "" : message.trim();
    }

    private String normalize(String message) {
        return Normalizer.normalize(message == null ? "" : message, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace('’', '\'')
                .replaceAll("[^a-z0-9+ ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(normalize(term))) {
                return true;
            }
        }
        return false;
    }

    private String refusalMessage(String language) {
        return switch (normalizeLanguage(language)) {
            case "en" -> "Je peux seulement répondre aux questions sur la plateforme Okane Transfer: transfers, fees, tracking, KYC/AML, profile, notifications and account support. Pour le reste, contacte l'équipe support.";
            case "ar" -> "يمكنني الرد فقط على الأسئلة المتعلقة بمنصة Okane Transfer: التحويلات، الرسوم، التتبع، KYC/AML، الملف الشخصي، الإشعارات، ودعم الحساب. للأسئلة الأخرى، تواصل مع فريق الدعم.";
            default -> "Je peux seulement répondre aux questions sur la plateforme Okane Transfer: transferts, frais, suivi, KYC/AML, profil, notifications et support du compte. Pour le reste, contacte l'équipe support.";
        };
    }

    private String fallbackMessage(String language) {
        return switch (normalizeLanguage(language)) {
            case "en" -> "Je n'arrive pas à formuler une réponse détaillée pour le moment. Tu peux reformuler ta question sur Okane Transfer ou consulter les questions fréquentes proposées.";
            case "ar" -> "لا أستطيع صياغة إجابة مفصلة حالياً. يمكنك إعادة صياغة سؤالك حول Okane Transfer أو الاطلاع على الأسئلة الشائعة المقترحة.";
            default -> "Je n'arrive pas à formuler une réponse détaillée pour le moment. Tu peux reformuler ta question sur Okane Transfer ou consulter les questions fréquentes proposées.";
        };
    }

    private record LocalFaqAnswer(String intent, String answer) {
    }
}
