-- =====================================================
-- SERVICE CHATBOT
-- Gère :
-- 1. les conversations chatbot
-- 2. l'historique des messages chatbot
-- 3. la base de connaissances FAQ
-- 4. l'escalade vers un agent humain
-- =====================================================


-- =====================================================
-- TABLE : sessions_chatbot
-- Représente une conversation entre un utilisateur et le chatbot
-- =====================================================
CREATE TABLE sessions_chatbot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Utilisateur ayant démarré la session chatbot
    -- Peut être NULL si le visiteur n'est pas connecté
    utilisateur_id BIGINT NULL,

    -- Statut : ouverte / fermée / escaladée
    statut VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    -- Langue utilisée dans la conversation : FR / EN / AR
    langue VARCHAR(10) NOT NULL DEFAULT 'FR',

    -- Heure de début de session
    demarree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Heure de fin de session
    terminee_le TIMESTAMP NULL,

    CONSTRAINT fk_session_chatbot_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE SET NULL
);


-- =====================================================
-- TABLE : messages_chatbot
-- Stocke tous les messages échangés dans une session chatbot
-- =====================================================
CREATE TABLE messages_chatbot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Session chatbot associée
    session_chatbot_id BIGINT NOT NULL,

    -- Type d'expéditeur : utilisateur / robot / agent
    type_expediteur VARCHAR(50) NOT NULL,

    -- Utilisateur expéditeur optionnel si le message vient d'un utilisateur connecté ou d'un agent
    utilisateur_expediteur_id BIGINT NULL,

    -- Contenu du message
    message TEXT NOT NULL,

    -- Intention du message détectée par le chatbot
    -- Exemple : suivi de transfert, frais, délai ou question fréquente
    intention_detectee VARCHAR(100),

    -- Horodatage du message
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_message_chatbot_session
        FOREIGN KEY (session_chatbot_id) REFERENCES sessions_chatbot(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_message_chatbot_utilisateur
        FOREIGN KEY (utilisateur_expediteur_id) REFERENCES utilisateurs(id)
        ON DELETE SET NULL
);
