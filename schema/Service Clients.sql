CREATE TABLE clients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Lien vers l'utilisateur d'authentification
    utilisateur_id BIGINT UNIQUE NOT NULL,

    type_piece_identite VARCHAR(50) NOT NULL,     -- CIN, PASSEPORT
    numero_piece_identite VARCHAR(100) NOT NULL,

    pays VARCHAR(100) NOT NULL,
    ville VARCHAR(100),
    adresse VARCHAR(255),
    nationalite VARCHAR(100),
    statut_kyc VARCHAR(30) DEFAULT 'NON_VERIFIE', -- NON_VERIFIE, EN_ATTENTE, VERIFIE, REJETE, A_REVOIR
    niveau_risque_aml VARCHAR(20),                -- LOW, MEDIUM, HIGH
    restreint BOOLEAN DEFAULT FALSE,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_customer_identity
        UNIQUE (type_piece_identite, numero_piece_identite),

    CONSTRAINT fk_clients_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE CASCADE
);

-- =====================================================
-- Documents KYC (OCR)
-- Stocke les images et résultats OCR des pièces d'identité
-- =====================================================
CREATE TABLE documents_kyc (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    client_id BIGINT NOT NULL,
    type_piece VARCHAR(30) NOT NULL,              -- CIN, PASSEPORT
    chemin_recto VARCHAR(500),
    chemin_verso VARCHAR(500),
    chemin_passeport VARCHAR(500),
    texte_ocr_brut TEXT,
    nom_extrait VARCHAR(150),
    prenom_extrait VARCHAR(150),
    numero_piece_extrait VARCHAR(100),
    nationalite_extraite VARCHAR(100),
    confiance_extraction DOUBLE,
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_documents_kyc_client
        FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- =====================================================
-- Alertes de conformité (AML)
-- Générées lors du screening AML via OpenSanctions
-- =====================================================
CREATE TABLE alertes_conformite (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    client_id BIGINT NOT NULL,
    transfert_id BIGINT,
    type_alerte VARCHAR(20) NOT NULL,             -- KYC, AML
    niveau_risque VARCHAR(20) NOT NULL,           -- LOW, MEDIUM, HIGH
    message VARCHAR(500),
    source VARCHAR(100),
    score_correspondance DOUBLE,
    nom_entite_correspondante VARCHAR(200),
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, VALIDE, REJETE, TRAITE
    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alertes_conformite_client
        FOREIGN KEY (client_id) REFERENCES clients(id)
);
