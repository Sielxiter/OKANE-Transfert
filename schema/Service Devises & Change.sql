-- =====================================================
-- SERVICE DEVISES & CHANGE
-- Gère :
-- 1. les devises
-- 2. les pays
-- 3. les corridors de transfert autorisés
-- 4. l'historique des taux de change
-- =====================================================


-- =====================================================
-- TABLE : devises
-- Stocke les devises prises en charge
-- Exemple : MAD, EUR, USD, GBP
-- =====================================================
CREATE TABLE devises (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Code ISO de la devise
    code VARCHAR(10) NOT NULL UNIQUE,

    -- Nom de la devise
    nom VARCHAR(100) NOT NULL,

    -- Symbole de la devise
    symbole VARCHAR(10),

    -- Devise active ou désactivée
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- TABLE : pays
-- Stocke les pays pris en charge
-- Chaque pays possède une devise par défaut
-- =====================================================
CREATE TABLE pays (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Code ISO du pays
    code VARCHAR(10) NOT NULL UNIQUE,

    -- Nom du pays
    nom VARCHAR(100) NOT NULL,

    -- Devise par défaut du pays
    devise_id BIGINT NOT NULL,

    -- Pays actif ou désactivé
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pays_devise
        FOREIGN KEY (devise_id) REFERENCES devises(id)
);


-- =====================================================
-- TABLE : corridors_transfert
-- Représente les routes de transfert autorisées
-- Exemple : Maroc -> Sénégal
-- =====================================================
CREATE TABLE corridors_transfert (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Pays de l'expéditeur
    pays_source_id BIGINT NOT NULL,

    -- Pays du bénéficiaire
    pays_destination_id BIGINT NOT NULL,

    -- Corridor actif ou désactivé
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    -- Plafond journalier optionnel pour ce corridor
    plafond_journalier DECIMAL(15,2),

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_corridor_pays_source
        FOREIGN KEY (pays_source_id) REFERENCES pays(id),

    CONSTRAINT fk_corridor_pays_destination
        FOREIGN KEY (pays_destination_id) REFERENCES pays(id),

    -- Évite les corridors en double
    CONSTRAINT uk_corridor
        UNIQUE (pays_source_id, pays_destination_id)
);


-- =====================================================
-- TABLE : taux_change
-- Stocke l'historique des taux de change
-- Utilisé pour calculer le montant net du transfert
-- =====================================================
CREATE TABLE taux_change (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Devise source
    devise_source_id BIGINT NOT NULL,

    -- Devise de destination
    devise_destination_id BIGINT NOT NULL,

    -- Valeur du taux
    -- Exemple : 1 EUR = 10.80 MAD
    taux DECIMAL(15,6) NOT NULL,

    -- MANUAL / EXTERNAL_API
    source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',

    -- Date et heure d'application de ce taux
    applique_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Utilisateur ayant ajouté ou modifié le taux
    cree_par BIGINT NULL,

    CONSTRAINT fk_taux_change_devise_source
        FOREIGN KEY (devise_source_id) REFERENCES devises(id),

    CONSTRAINT fk_taux_change_devise_destination
        FOREIGN KEY (devise_destination_id) REFERENCES devises(id),

    CONSTRAINT fk_taux_change_cree_par
        FOREIGN KEY (cree_par) REFERENCES utilisateurs(id)
);
