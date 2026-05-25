-- =====================================================
-- SERVICE CONFORMITÉ
-- Gère :
-- 1. la vérification d'identité KYC
-- 2. le contrôle AML sur liste de surveillance
-- 3. les déclarations de transactions suspectes
-- 4. les décisions de conformité
-- =====================================================


-- =====================================================
-- TABLE : verifications_kyc
-- Stocke le résultat de vérification d'identité des clients
-- =====================================================
CREATE TABLE verifications_kyc (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Client en cours de vérification
    client_id BIGINT NOT NULL,

    -- Agent ou administrateur ayant effectué la vérification
    verifie_par BIGINT NULL,

    -- Statut : en attente / vérifié / rejeté
    statut VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Résultat de validation du format CIN / passeport
    format_piece_valide BOOLEAN NOT NULL DEFAULT FALSE,

    -- Explication optionnelle
    notes VARCHAR(255),

    -- Horodatage de la vérification
    verifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_kyc_client
        FOREIGN KEY (client_id) REFERENCES clients(id),

    CONSTRAINT fk_kyc_verifie_par
        FOREIGN KEY (verifie_par) REFERENCES utilisateurs(id)
);


-- =====================================================
-- TABLE : liste_surveillance
-- Liste noire fictive de type OFAC
-- Utilisée pour détecter les personnes bloquées ou suspectes
-- =====================================================
CREATE TABLE liste_surveillance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Nom complet de la personne
    nom_complet VARCHAR(200) NOT NULL,

    -- Numéro de pièce d'identité optionnel
    numero_piece_identite VARCHAR(100),

    -- Pays optionnel
    pays VARCHAR(100),

    -- Motif d'inscription sur la liste
    motif VARCHAR(255),

    -- Entrée active / inactive
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    -- Horodatage de création
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- TABLE : controles_aml
-- Stocke le résultat du contrôle AML d'un transfert
-- =====================================================
CREATE TABLE controles_aml (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Transfert associé
    transfert_id BIGINT NOT NULL,

    -- Expéditeur contrôlé
    expediteur_id BIGINT NOT NULL,

    -- Bénéficiaire contrôlé
    beneficiaire_id BIGINT NOT NULL,

    -- Statut : en attente / validé / signalé / bloqué
    statut VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- TRUE si l'expéditeur correspond à la liste de surveillance
    expediteur_liste_surveillance BOOLEAN NOT NULL DEFAULT FALSE,

    -- TRUE si le bénéficiaire correspond à la liste de surveillance
    beneficiaire_liste_surveillance BOOLEAN NOT NULL DEFAULT FALSE,

    -- TRUE si le montant dépasse le seuil suspect
    seuil_montant_depasse BOOLEAN NOT NULL DEFAULT FALSE,

    -- Score de risque de 0 à 100
    score_risque INT NOT NULL DEFAULT 0,

    -- Explication du résultat
    notes_resultat VARCHAR(255),

    -- Horodatage du contrôle
    verifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_aml_transfert
        FOREIGN KEY (transfert_id) REFERENCES transferts(id),

    CONSTRAINT fk_aml_expediteur
        FOREIGN KEY (expediteur_id) REFERENCES clients(id),

    CONSTRAINT fk_aml_beneficiaire
        FOREIGN KEY (beneficiaire_id) REFERENCES clients(id)
);


-- =====================================================
-- TABLE : declarations_soupcon
-- Générées lorsqu'un contrôle AML détecte une activité suspecte
-- =====================================================
CREATE TABLE declarations_soupcon (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Transfert associé
    transfert_id BIGINT NOT NULL,

    -- Contrôle AML associé
    controle_aml_id BIGINT NOT NULL,

    -- Client concerné par le soupçon
    client_id BIGINT NOT NULL,

    -- Type d'alerte : correspondance de liste de surveillance, montant élevé, transferts répétés ou déclaration manuelle
    type_declaration VARCHAR(50) NOT NULL,

    -- Statut : ouverte / examinée / rejetée / confirmée
    statut VARCHAR(50) NOT NULL DEFAULT 'OPEN',

    -- Description de l'activité suspecte
    description TEXT NOT NULL,

    -- Administrateur ou utilisateur conformité ayant examiné la déclaration
    examine_par BIGINT NULL,

    -- Horodatage de l'examen
    examine_le TIMESTAMP NULL,

    -- Horodatage de création de la déclaration
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_declaration_transfert
        FOREIGN KEY (transfert_id) REFERENCES transferts(id),

    CONSTRAINT fk_declaration_controle_aml
        FOREIGN KEY (controle_aml_id) REFERENCES controles_aml(id),

    CONSTRAINT fk_declaration_client
        FOREIGN KEY (client_id) REFERENCES clients(id),

    CONSTRAINT fk_declaration_examine_par
        FOREIGN KEY (examine_par) REFERENCES utilisateurs(id)
);
