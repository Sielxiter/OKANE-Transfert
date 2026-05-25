-- =====================================================
-- SERVICE NOTIFICATIONS
-- Gère :
-- 1. les codes OTP pour la 2FA et les opérations sensibles
-- 2. l'historique des notifications courriel / SMS / push
-- 3. les préférences de notification des clients
-- =====================================================


-- =====================================================
-- TABLE : codes_otp
-- Stocke les codes OTP temporaires
-- Utilisé pour la 2FA, la confirmation de retrait et les actions sensibles
-- =====================================================
CREATE TABLE codes_otp (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Utilisateur recevant l'OTP
    utilisateur_id BIGINT NOT NULL,

    -- Code OTP, généralement 6 chiffres
    code VARCHAR(20) NOT NULL,

    -- LOGIN_2FA / TRANSFER_CONFIRMATION / PASSWORD_RESET / PAYOUT_CONFIRMATION
    objectif VARCHAR(50) NOT NULL,

    -- Canal : SMS ou courriel
    canal VARCHAR(50) NOT NULL,

    -- Date et heure d'expiration
    expire_le TIMESTAMP NOT NULL,

    -- TRUE si l'OTP est déjà utilisé
    utilise BOOLEAN NOT NULL DEFAULT FALSE,

    -- Horodatage de création
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Date et heure d'utilisation de l'OTP
    utilise_le TIMESTAMP NULL,

    CONSTRAINT fk_codes_otp_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE CASCADE
);


-- =====================================================
-- TABLE : notifications
-- Stocke toutes les notifications envoyées par le système
-- =====================================================
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Utilisateur destinataire
    utilisateur_id BIGINT NOT NULL,

    -- Canal : courriel, SMS ou notification push
    canal VARCHAR(50) NOT NULL,

    -- Type de notification :
    -- TRANSFER_CREATED / TRANSFER_PAID / TRANSFER_CANCELLED
    -- OTP / SYSTEM_ALERT
    type VARCHAR(50) NOT NULL,

    -- Titre de la notification
    titre VARCHAR(150),

    -- Contenu du message
    message TEXT NOT NULL,

    -- Statut : en attente / envoyée / échouée
    statut VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Réponse du fournisseur externe ou message d'erreur
    reponse_fournisseur TEXT,

    -- Date et heure de création de la notification
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Date et heure d'envoi de la notification
    envoye_le TIMESTAMP NULL,

    CONSTRAINT fk_notification_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE CASCADE
);


-- =====================================================
-- TABLE : preferences_notification
-- Stocke la manière dont le client souhaite recevoir les notifications
-- =====================================================
CREATE TABLE preferences_notification (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Utilisateur associé
    utilisateur_id BIGINT NOT NULL UNIQUE,

    -- Autorise les notifications courriel
    email_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Autorise les notifications SMS
    sms_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Autorise les notifications push
    push_active BOOLEAN NOT NULL DEFAULT FALSE,

    -- Langue préférée : FR / EN / AR
    langue_preferee VARCHAR(10) NOT NULL DEFAULT 'FR',

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_preferences_notification_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE CASCADE
);
