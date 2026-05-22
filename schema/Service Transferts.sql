-- =====================================================
-- SERVICE TRANSFERTS
-- Gère la création et le suivi des transferts
-- Le retrait ou paiement est géré par le Service Paiement / Caisse
-- =====================================================

CREATE TABLE transferts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Référence publique utilisée pour suivre le transfert
    code_reference VARCHAR(50) NOT NULL UNIQUE,

    -- Code secret de retrait utilisé par le bénéficiaire
    code_retrait VARCHAR(50) NOT NULL UNIQUE,

    -- Client expéditeur
    expediteur_id BIGINT NOT NULL,

    -- Client bénéficiaire
    beneficiaire_id BIGINT NOT NULL,

    -- Agence où le transfert a été créé
    agence_source_id BIGINT NOT NULL,

    -- Agent ayant créé le transfert
    cree_par BIGINT NOT NULL,

    -- Session de caisse de l'agent pendant la création du transfert
    session_caisse_id BIGINT NOT NULL,

    -- Devise utilisée dans le transfert
    devise_id BIGINT NOT NULL,

    -- Montant envoyé par l'expéditeur, hors frais
    montant DECIMAL(15,2) NOT NULL,

    -- Frais payés par l'expéditeur
    montant_frais DECIMAL(15,2) NOT NULL,

    -- Taux de change utilisé au moment de la création
    taux_change DECIMAL(15,6) NOT NULL,

    -- Montant que le bénéficiaire doit recevoir
    montant_net_recu DECIMAL(15,2) NOT NULL,

    -- Statut : en attente / payé / annulé / expiré
    statut VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Heure de création du transfert
    envoye_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Date et heure d'expiration du code de retrait
    expire_le TIMESTAMP NULL,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transfert_expediteur
        FOREIGN KEY (expediteur_id) REFERENCES clients(id),

    CONSTRAINT fk_transfert_beneficiaire
        FOREIGN KEY (beneficiaire_id) REFERENCES clients(id),

    CONSTRAINT fk_transfert_agence_source
        FOREIGN KEY (agence_source_id) REFERENCES agences(id),

    CONSTRAINT fk_transfert_cree_par
        FOREIGN KEY (cree_par) REFERENCES utilisateurs(id),

    CONSTRAINT fk_transfert_session_caisse
        FOREIGN KEY (session_caisse_id) REFERENCES sessions_caisse_agent(id),

    CONSTRAINT fk_transfert_devise
        FOREIGN KEY (devise_id) REFERENCES devises(id)
);


-- =====================================================
-- TABLE : historique_statuts_transfert
-- Suit chaque changement de statut d'un transfert
-- =====================================================
CREATE TABLE historique_statuts_transfert (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Transfert associé
    transfert_id BIGINT NOT NULL,

    -- Ancien statut
    ancien_statut VARCHAR(50),

    -- Nouveau statut
    nouveau_statut VARCHAR(50) NOT NULL,

    -- Utilisateur ayant modifié le statut
    modifie_par BIGINT NULL,

    -- Horodatage du changement
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Motif optionnel
    motif VARCHAR(255),

    CONSTRAINT fk_statut_transfert
        FOREIGN KEY (transfert_id) REFERENCES transferts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_statut_modifie_par
        FOREIGN KEY (modifie_par) REFERENCES utilisateurs(id)
);
