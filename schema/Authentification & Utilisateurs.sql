-- 1. Rôles
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Utilisateurs
CREATE TABLE utilisateurs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,

    telephone VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    role_id BIGINT NOT NULL,

    CONSTRAINT fk_utilisateurs_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 3. Jetons d'actualisation
CREATE TABLE jetons_actualisation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    jeton VARCHAR(500) NOT NULL UNIQUE,
    date_expiration TIMESTAMP NOT NULL,
    revoque BOOLEAN NOT NULL DEFAULT FALSE,

    utilisateur_id BIGINT NOT NULL,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jetons_actualisation_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE CASCADE
);
