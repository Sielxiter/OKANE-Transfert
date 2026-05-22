-- =====================================================
-- SERVICE RAPPORTS
-- Gère :
-- 1. l'historique des rapports générés
-- 2. les rapports exportés en PDF / CSV
-- 3. les statistiques du tableau de bord basées sur les tables existantes
-- =====================================================


-- =====================================================
-- TABLE : rapports_generes
-- Stocke les rapports générés par un administrateur ou un manager
-- Exemple : rapport quotidien des transactions, rapport de performance d'agence
-- =====================================================
CREATE TABLE rapports_generes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    -- Utilisateur ayant généré le rapport
    genere_par BIGINT NOT NULL,

    -- Agence optionnelle concernée par le rapport
    -- NULL signifie rapport global pour l'administrateur
    agence_id BIGINT NULL,

    -- Type de rapport :
    -- Transactions quotidiennes, transactions mensuelles,
    -- performance d'agence, commissions ou clôture de caisse
    type_declaration VARCHAR(50) NOT NULL,

    -- Format d'export : PDF / CSV / XLSX
    format VARCHAR(20) NOT NULL,

    -- Date de début de la période du rapport
    date_debut_periode DATE NOT NULL,

    -- Date de fin de la période du rapport
    date_fin_periode DATE NOT NULL,

    -- Chemin de fichier ou URL du rapport généré
    chemin_fichier VARCHAR(255),

    -- Statut de génération du rapport : généré / échoué
    statut VARCHAR(50) NOT NULL DEFAULT 'GENERATED',

    -- Horodatage de génération
    genere_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rapport_genere_par
        FOREIGN KEY (genere_par) REFERENCES utilisateurs(id),

    CONSTRAINT fk_rapport_agence
        FOREIGN KEY (agence_id) REFERENCES agences(id)
);


-- La plupart des données du tableau de bord doivent être calculées par requêtes ou vues SQL, pas stockées en double.

-- Exemples :

-- Volume quotidien des transferts
SELECT 
    DATE(envoye_le) AS jour,
    COUNT(*) AS total_transferts,
    SUM(montant) AS montant_total,
    SUM(montant_frais) AS total_frais
FROM transferts
GROUP BY DATE(envoye_le);


-- Performance des agences
SELECT 
    a.id,
    a.nom,
    COUNT(t.id) AS total_transferts,
    SUM(t.montant) AS montant_total,
    SUM(t.montant_frais) AS total_frais
FROM agences a
LEFT JOIN transferts t ON t.agence_source_id = a.id
GROUP BY a.id, a.nom;


-- Écarts de caisse
SELECT 
    fd.id,
    acs.date_session,
    fd.montant_ecart,
    fd.type_ecart,
    fd.statut
FROM ecarts_caisse fd
JOIN sessions_caisse_agent acs ON fd.session_caisse_id = acs.id;
