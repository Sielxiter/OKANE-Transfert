CREATE TABLE clients (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Lien vers l'utilisateur d'authentification
    utilisateur_id BIGINT UNIQUE NOT NULL,

    type_piece_identite VARCHAR(50) NOT NULL,     -- CNI, PASSEPORT
    numero_piece_identite VARCHAR(100) NOT NULL,

    pays VARCHAR(100) NOT NULL,
    ville VARCHAR(100),
    adresse VARCHAR(255),

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_customer_identity
        UNIQUE (type_piece_identite, numero_piece_identite),

    CONSTRAINT fk_clients_utilisateur
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
        ON DELETE CASCADE
);
