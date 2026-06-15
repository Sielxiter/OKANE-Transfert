-- =====================================================
-- SERVICE FRAIS & COMMISSIONS
-- Gère :
-- 1. les grilles tarifaires
-- 2. les tranches tarifaires par plage de montant
-- 3. le partage de commission entre l'agence et la centrale
-- =====================================================


-- =====================================================
-- TABLE : grilles_tarifaires
-- Représente une grille tarifaire
-- Exemple : grille tarifaire Maroc -> Sénégal
-- =====================================================
CREATE TABLE grilles_tarifaires (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Nom de la grille
    nom VARCHAR(150) NOT NULL,

    -- Relation optionnelle avec un corridor
    -- Si NULL, la grille peut être globale ou par défaut
    corridor_id BIGINT NULL,

    -- Devise utilisée pour les plages de montant et les frais
    devise_id BIGINT NOT NULL,

    -- Grille active ou inactive
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    -- Date de début de cette grille tarifaire
    date_debut TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Date de fin, NULL signifie toujours active
    date_fin TIMESTAMP NULL,

    -- Administrateur ayant créé cette grille
    cree_par BIGINT NULL,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_grille_tarifaire_corridor
        FOREIGN KEY (corridor_id) REFERENCES corridors_transfert(id),

    CONSTRAINT fk_grille_tarifaire_devise
        FOREIGN KEY (devise_id) REFERENCES devises(id),

    CONSTRAINT fk_grille_tarifaire_cree_par
        FOREIGN KEY (cree_par) REFERENCES utilisateurs(id)
);


-- =====================================================
-- TABLE : tranches_tarifaires
-- Stocke les règles de frais par intervalle de montant
-- Exemple :
-- 0 - 500 MAD => frais de 20 MAD
-- 501 - 1000 MAD => frais de 35 MAD
-- =====================================================
CREATE TABLE tranches_tarifaires (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Grille tarifaire parente
    grille_tarifaire_id BIGINT NOT NULL,

    -- Montant minimal du transfert
    montant_min DECIMAL(15,2) NOT NULL,

    -- Montant maximal du transfert
    montant_max DECIMAL(15,2) NOT NULL,

    -- FIXED (FIXE) ou PERCENTAGE (POURCENTAGE)
    type_frais VARCHAR(50) NOT NULL,

    -- Si FIXED : valeur_frais = montant exact des frais
    -- Si PERCENTAGE : valeur_frais = taux en pourcentage
    valeur_frais DECIMAL(15,2) NOT NULL,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tranche_tarifaire_grille
        FOREIGN KEY (grille_tarifaire_id) REFERENCES grilles_tarifaires(id)
        ON DELETE CASCADE
);


-- =====================================================
-- TABLE : regles_commission
-- Définit la répartition des frais collectés
-- entre l'agence et la société centrale
-- =====================================================
CREATE TABLE regles_commission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Grille tarifaire associée
    grille_tarifaire_id BIGINT NOT NULL,

    -- Part agence des frais en pourcentage
    -- Exemple : 40 signifie que l'agence reçoit 40 %
    pourcentage_agence DECIMAL(5,2) NOT NULL,

    -- Part de la société centrale en pourcentage
    -- Exemple : 60 signifie que la centrale reçoit 60 %
    pourcentage_centrale DECIMAL(5,2) NOT NULL,

    -- Règle active ou inactive
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_regle_commission_grille
        FOREIGN KEY (grille_tarifaire_id) REFERENCES grilles_tarifaires(id)
        ON DELETE CASCADE
);

