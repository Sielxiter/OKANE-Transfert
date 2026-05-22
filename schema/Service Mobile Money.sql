-- =====================================================
-- SERVICE MOBILE MONEY
-- Gère :
-- 1. les opérateurs Mobile Money
-- 2. le paiement d'un transfert vers un wallet mobile
-- 3. le statut simulé des transactions opérateur
-- 4. la réconciliation avec les relevés opérateur
-- =====================================================


-- =====================================================
-- TABLE : operateurs_mobile_money
-- Stocke les opérateurs Mobile Money pris en charge
-- Exemple : Orange Money, Wave, M-Pesa
-- =====================================================
CREATE TABLE operateurs_mobile_money (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Nom de l'opérateur
    nom VARCHAR(100) NOT NULL,

    -- Code de l'opérateur
    code VARCHAR(50) NOT NULL UNIQUE,

    -- Pays où l'opérateur est disponible
    pays_id BIGINT NOT NULL,

    -- Opérateur actif ou désactivé
    actif BOOLEAN NOT NULL DEFAULT TRUE,

    cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_operateur_mobile_money_pays
        FOREIGN KEY (pays_id) REFERENCES pays(id)
);


-- =====================================================
-- TABLE : transferts_mobile_money
-- Stocke la simulation de paiement Mobile Money
-- Un transfert peut avoir un seul paiement Mobile Money
-- =====================================================
CREATE TABLE transferts_mobile_money (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Transfert Okane associé
    transfert_id BIGINT NOT NULL UNIQUE,

    -- Opérateur Mobile Money utilisé
    operateur_id BIGINT NOT NULL,

    -- Client bénéficiaire
    beneficiaire_id BIGINT NOT NULL,

    -- Numéro de téléphone wallet du bénéficiaire
    telephone_wallet VARCHAR(30) NOT NULL,

    -- Montant envoyé vers le wallet
    -- Doit être égal au montant net du transfert
    montant DECIMAL(15,2) NOT NULL,

    -- Statut : en attente / réussi / échoué / annulé
    statut VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Référence fictive ou opérateur de la transaction
    reference_operateur VARCHAR(100) UNIQUE,

    -- Agent ou utilisateur système ayant initié le paiement Mobile Money
    initie_par BIGINT NOT NULL,

    -- Horodatage de la demande
    demande_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Horodatage de fin
    terminee_le TIMESTAMP NULL,

    -- Réponse opérateur ou motif d'échec
    reponse_fournisseur TEXT,

    CONSTRAINT fk_transfert_mobile_money_transfert
        FOREIGN KEY (transfert_id) REFERENCES transferts(id),

    CONSTRAINT fk_transfert_mobile_money_operateur
        FOREIGN KEY (operateur_id) REFERENCES operateurs_mobile_money(id),

    CONSTRAINT fk_transfert_mobile_money_beneficiaire
        FOREIGN KEY (beneficiaire_id) REFERENCES clients(id),

    CONSTRAINT fk_transfert_mobile_money_initie_par
        FOREIGN KEY (initie_par) REFERENCES utilisateurs(id)
);


-- =====================================================
-- TABLE : reconciliations_mobile_money
-- Stocke le résultat de réconciliation avec le relevé opérateur
-- Utilisée pour vérifier si l'opérateur simulé confirme le paiement
-- =====================================================
CREATE TABLE reconciliations_mobile_money (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Transfert Mobile Money associé
    transfert_mobile_money_id BIGINT NOT NULL UNIQUE,

    -- Référence opérateur contrôlée
    reference_operateur VARCHAR(100) NOT NULL,

    -- Montant attendu par le système Okane
    montant_attendu DECIMAL(15,2) NOT NULL,

    -- Montant confirmé par l'opérateur
    montant_operateur DECIMAL(15,2) NOT NULL,

    -- MATCHED (CONCORDANT) / AMOUNT_MISMATCH (ÉCART_MONTANT) / NOT_FOUND (INTROUVABLE)
    statut VARCHAR(50) NOT NULL,

    -- Utilisateur ayant effectué la réconciliation
    reconcilie_par BIGINT NULL,

    -- Horodatage de réconciliation
    reconcilie_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Note optionnelle
    notes VARCHAR(255),

    CONSTRAINT fk_reconciliation_mobile_money_transfert
        FOREIGN KEY (transfert_mobile_money_id) REFERENCES transferts_mobile_money(id),

    CONSTRAINT fk_reconciliation_mobile_money_utilisateur
        FOREIGN KEY (reconcilie_par) REFERENCES utilisateurs(id)
);
