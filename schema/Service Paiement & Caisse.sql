-- =====================================================
-- SERVICE PAIEMENT / CAISSE
-- Gère :
-- 1. les sessions de caisse quotidiennes des agents
-- 2. le paiement des transferts
-- 3. les mouvements de caisse
-- 4. la clôture de caisse
-- 5. les déclarations de fonds manquants ou excédentaires
-- =====================================================


-- =====================================================
-- TABLE : sessions_caisse_agent
-- Représente la session de caisse de travail d'un agent pour la journée
-- L'agent doit ouvrir une session avant de créer des transferts ou paiements
-- =====================================================
CREATE TABLE sessions_caisse_agent (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Agent propriétaire de cette session de caisse
    agent_id BIGINT NOT NULL,

    -- Agence où l'agent travaille pendant cette session
    agence_id BIGINT NOT NULL,

    -- Date métier de cette session
    date_session DATE NOT NULL,

    -- Espèces disponibles au début de la session
    solde_ouverture DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Statut : ouverte / fermée
    statut VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    -- Horodatage d'ouverture
    ouverte_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Horodatage de clôture
    cloturee_le TIMESTAMP NULL,

    CONSTRAINT fk_session_caisse_agent
        FOREIGN KEY (agent_id) REFERENCES utilisateurs(id),

    CONSTRAINT fk_session_caisse_agence
        FOREIGN KEY (agence_id) REFERENCES agences(id),

    -- Une seule session de caisse par agent et par jour
    CONSTRAINT uk_agent_date_session
        UNIQUE (agent_id, date_session)
);


-- =====================================================
-- TABLE : paiements_transfert
-- Stocke le retrait ou paiement d'un transfert
-- Un transfert ne peut être payé qu'une seule fois
-- =====================================================
CREATE TABLE paiements_transfert (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Transfert en cours de retrait
    transfert_id BIGINT NOT NULL UNIQUE,

    -- Session de caisse de l'agent qui paie le bénéficiaire
    session_caisse_id BIGINT NOT NULL,

    -- Bénéficiaire recevant l'argent
    beneficiaire_id BIGINT NOT NULL,

    -- Agence où le retrait a eu lieu
    agence_paiement_id BIGINT NOT NULL,

    -- Agent ayant traité le retrait
    paye_par BIGINT NOT NULL,

    -- Doit être égal au montant net du transfert
    montant_paye DECIMAL(15,2) NOT NULL,

    -- Horodatage du paiement
    paye_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_paiement_transfert
        FOREIGN KEY (transfert_id) REFERENCES transferts(id),

    CONSTRAINT fk_paiement_session_caisse
        FOREIGN KEY (session_caisse_id) REFERENCES sessions_caisse_agent(id),

    CONSTRAINT fk_paiement_beneficiaire
        FOREIGN KEY (beneficiaire_id) REFERENCES clients(id),

    CONSTRAINT fk_paiement_agence
        FOREIGN KEY (agence_paiement_id) REFERENCES agences(id),

    CONSTRAINT fk_paiement_paye_par
        FOREIGN KEY (paye_par) REFERENCES utilisateurs(id)
);


-- =====================================================
-- TABLE : mouvements_caisse
-- Suit chaque mouvement d'argent dans une session de caisse agent
-- =====================================================
CREATE TABLE mouvements_caisse (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Session de caisse concernée par ce mouvement
    session_caisse_id BIGINT NOT NULL,

    -- Agence concernée
    agence_id BIGINT NOT NULL,

    -- Agent ayant effectué l'opération
    utilisateur_id BIGINT NOT NULL,

    -- TRANSFER_IN = l'expéditeur paie le montant + les frais
    -- PAYOUT_OUT  = le bénéficiaire reçoit le montant net du transfert
    type_mouvement VARCHAR(50) NOT NULL,

    -- Montant caisse principal, toujours converti en MAD
    montant DECIMAL(15,2) NOT NULL,

    -- Montant et devise réellement manipulés avant conversion caisse
    montant_original DECIMAL(15,2) NULL,
    devise_originale VARCHAR(10) NULL,

    -- Taux appliqué pour convertir le montant original vers MAD
    taux_change_mad DECIMAL(18,8) NULL,

    -- Montant utilisé dans les totaux caisse, toujours en MAD
    montant_mad DECIMAL(15,2) NULL,

    -- Transfert associé, si le mouvement correspond à une création de transfert
    transfert_id BIGINT NULL,

    -- Paiement associé, si le mouvement correspond à un retrait
    paiement_id BIGINT NULL,

    -- Horodatage du mouvement
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Explication optionnelle
    description VARCHAR(255),

    CONSTRAINT fk_mouvement_caisse_session
        FOREIGN KEY (session_caisse_id) REFERENCES sessions_caisse_agent(id),

    CONSTRAINT fk_mouvement_caisse_agence
        FOREIGN KEY (agence_id) REFERENCES agences(id),

    CONSTRAINT fk_mouvement_caisse_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),

    CONSTRAINT fk_mouvement_caisse_transfert
        FOREIGN KEY (transfert_id) REFERENCES transferts(id),

    CONSTRAINT fk_mouvement_caisse_paiement
        FOREIGN KEY (paiement_id) REFERENCES paiements_transfert(id)
);


-- =====================================================
-- TABLE : clotures_caisse
-- Réconciliation de caisse en fin de journée pour une session de caisse
-- =====================================================
CREATE TABLE clotures_caisse (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Session en cours de clôture
    session_caisse_id BIGINT NOT NULL UNIQUE,

    -- Agent qui clôture la session
    cloture_par BIGINT NOT NULL,

    -- Calculé par le système :
    -- solde_ouverture
    -- + SUM(TRANSFER_IN)
    -- - SUM(PAYOUT_OUT)
    solde_attendu DECIMAL(15,2) NOT NULL,

    -- Espèces réellement comptées par l'agent
    solde_reel DECIMAL(15,2) NOT NULL,

    -- solde_réel - solde_attendu
    montant_ecart DECIMAL(15,2) NOT NULL,

    -- Horodatage de clôture
    cloturee_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Note optionnelle
    notes VARCHAR(255),

    CONSTRAINT fk_cloture_caisse_session
        FOREIGN KEY (session_caisse_id) REFERENCES sessions_caisse_agent(id),

    CONSTRAINT fk_cloture_caisse_utilisateur
        FOREIGN KEY (cloture_par) REFERENCES utilisateurs(id)
);


-- =====================================================
-- TABLE : ecarts_caisse
-- Déclare les fonds manquants ou excédentaires après clôture de caisse
-- Créé uniquement si montant_ecart != 0
-- =====================================================
CREATE TABLE ecarts_caisse (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Clôture de caisse associée
    cloture_caisse_id BIGINT NOT NULL UNIQUE,

    -- Session de caisse où l'écart s'est produit
    session_caisse_id BIGINT NOT NULL,

    -- Agent ou manager ayant signalé l'écart
    signale_par BIGINT NOT NULL,

    -- Espèces attendues par le système
    solde_attendu DECIMAL(15,2) NOT NULL,

    -- Espèces réellement comptées
    solde_reel DECIMAL(15,2) NOT NULL,

    -- solde_réel - solde_attendu
    montant_ecart DECIMAL(15,2) NOT NULL,

    -- MISSING_FUNDS (FONDS_MANQUANTS) / EXTRA_FUNDS (FONDS_EXCÉDENTAIRES)
    type_ecart VARCHAR(50) NOT NULL,

    -- Statut : ouvert / résolu
    statut VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    -- Explication
    description VARCHAR(255),

    -- Horodatage du signalement
    signale_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ecart_cloture
        FOREIGN KEY (cloture_caisse_id) REFERENCES clotures_caisse(id),

    CONSTRAINT fk_ecart_session
        FOREIGN KEY (session_caisse_id) REFERENCES sessions_caisse_agent(id),

    CONSTRAINT fk_ecart_signale_par
        FOREIGN KEY (signale_par) REFERENCES utilisateurs(id)
);
