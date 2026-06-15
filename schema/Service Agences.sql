-- 1. Agences
CREATE TABLE agences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    nom VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,

    adresse VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    pays VARCHAR(100) NOT NULL,

    telephone VARCHAR(30),
    email VARCHAR(150),

    plafond_journalier DECIMAL(15,2) NOT NULL DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Affectation des utilisateurs aux agences
-- Lie les managers et les agents à une agence
CREATE TABLE affectations_agence_utilisateurs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    agence_id BIGINT NOT NULL,
    utilisateur_id BIGINT NOT NULL,

    affecte_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_affectations_agence_agence
        FOREIGN KEY (agence_id) REFERENCES agences(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_affectations_agence_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_affectation_agence_utilisateur UNIQUE (agence_id, utilisateur_id)
);
