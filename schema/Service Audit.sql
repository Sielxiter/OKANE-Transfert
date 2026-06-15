-- =====================================================
-- SERVICE AUDIT
-- Gère :
-- 1. le suivi des actions sensibles
-- 2. le journal d'activité des utilisateurs
-- 3. l'historique de sécurité et d'audit
-- =====================================================


-- =====================================================
-- TABLE : journal_audit
-- Stocke toutes les actions importantes effectuées dans le système
-- Exemple : transfert créé, paiement effectué, connexion utilisateur, grille tarifaire modifiée
-- =====================================================
CREATE TABLE journal_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Utilisateur ayant effectué l'action
    -- Peut être NULL pour les actions système
    utilisateur_id BIGINT NULL,

    -- Rôle utilisateur au moment de l'action
    -- Exemple : ROLE_ADMIN, ROLE_AGENT
    role_utilisateur VARCHAR(50),

    -- Type d'action
    -- Exemple : connexion réussie, connexion échouée,
    -- transfert créé, transfert annulé, paiement effectué,
    -- session de caisse ouverte, session de caisse fermée,
    -- grille tarifaire modifiée, taux de change modifié
    action VARCHAR(100) NOT NULL,

    -- Entité ou table concernée par l'action
    -- Exemple : transferts, paiements, utilisateurs, agences
    nom_entite VARCHAR(100),

    -- Identifiant de l'entité concernée
    id_entite BIGINT,

    -- Courte description de l'action
    description VARCHAR(255),

    -- Adresse IP de la requête
    adresse_ip VARCHAR(100),

    -- Informations navigateur ou appareil
    navigateur_utilisateur VARCHAR(255),

    -- Date et heure de l'action
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_journal_audit_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE SET NULL
);
