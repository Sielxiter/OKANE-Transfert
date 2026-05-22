-- Migration FR: renommage des tables/colonnes
-- NOTE: utilisez une base de dev uniquement. En prod, adaptez les noms de contraintes si besoin.

SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- Renommage des tables
-- =========================
RENAME TABLE users TO utilisateurs;
RENAME TABLE roles TO roles;
RENAME TABLE agencies TO agences;
RENAME TABLE agency_users TO affectations_agence_utilisateurs;
RENAME TABLE customers TO clients;
RENAME TABLE currencies TO devises;
RENAME TABLE countries TO pays;
RENAME TABLE transfer_corridors TO corridors_transfert;
RENAME TABLE exchange_rates TO taux_change;
RENAME TABLE fee_grids TO grilles_tarifaires;
RENAME TABLE fee_brackets TO tranches_tarifaires;
RENAME TABLE commission_rules TO regles_commission;
RENAME TABLE transfers TO transferts;
RENAME TABLE transfer_status_history TO historique_statuts_transfert;
RENAME TABLE payouts TO paiements_transfert;
RENAME TABLE agent_cash_sessions TO sessions_caisse_agent;
RENAME TABLE cash_movements TO mouvements_caisse;
RENAME TABLE cash_closures TO clotures_caisse;
RENAME TABLE fund_discrepancies TO ecarts_caisse;
RENAME TABLE kyc_checks TO verifications_kyc;
RENAME TABLE aml_checks TO controles_aml;
RENAME TABLE watchlist_entries TO liste_surveillance;
RENAME TABLE suspicious_reports TO declarations_soupcon;
RENAME TABLE notifications TO notifications;
RENAME TABLE notification_preferences TO preferences_notification;
RENAME TABLE otp_codes TO codes_otp;
RENAME TABLE audit_logs TO journal_audit;
RENAME TABLE generated_reports TO rapports_generes;
RENAME TABLE chatbot_sessions TO sessions_chatbot;
RENAME TABLE chatbot_messages TO messages_chatbot;
RENAME TABLE mobile_money_operators TO operateurs_mobile_money;
RENAME TABLE mobile_money_transfers TO transferts_mobile_money;
RENAME TABLE mobile_money_reconciliations TO reconciliations_mobile_money;
RENAME TABLE refresh_tokens TO jetons_actualisation;

-- =========================
-- Renommage des colonnes
-- =========================
ALTER TABLE utilisateurs
    RENAME COLUMN first_name TO prenom,
    RENAME COLUMN last_name TO nom,
    RENAME COLUMN password_hash TO mot_de_passe_hash,
    RENAME COLUMN phone TO telephone,
    RENAME COLUMN enabled TO active,
    RENAME COLUMN account_locked TO compte_verrouille,
    RENAME COLUMN account_suspended TO compte_suspendu,
    RENAME COLUMN failed_login_attempts TO tentatives_echec_connexion,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le,
    RENAME COLUMN last_login_at TO dernier_login_le,
    RENAME COLUMN password_changed_at TO mot_de_passe_change_le;

ALTER TABLE roles
    RENAME COLUMN name TO nom;

ALTER TABLE agences
    RENAME COLUMN name TO nom,
    RENAME COLUMN address TO adresse,
    RENAME COLUMN city TO ville,
    RENAME COLUMN country TO pays,
    RENAME COLUMN phone TO telephone,
    RENAME COLUMN daily_limit TO plafond_journalier,
    RENAME COLUMN active TO actif,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE affectations_agence_utilisateurs
    RENAME COLUMN agency_id TO agence_id,
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN assigned_at TO affecte_le,
    RENAME COLUMN active TO actif;

ALTER TABLE clients
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN identity_type TO type_piece_identite,
    RENAME COLUMN identity_number TO numero_piece_identite,
    RENAME COLUMN country TO pays,
    RENAME COLUMN city TO ville,
    RENAME COLUMN address TO adresse,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE devises
    RENAME COLUMN name TO nom,
    RENAME COLUMN symbol TO symbole,
    RENAME COLUMN active TO actif,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE pays
    RENAME COLUMN name TO nom,
    RENAME COLUMN currency_id TO devise_id,
    RENAME COLUMN active TO actif,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE corridors_transfert
    RENAME COLUMN source_country_id TO pays_source_id,
    RENAME COLUMN destination_country_id TO pays_destination_id,
    RENAME COLUMN active TO actif,
    RENAME COLUMN daily_limit TO plafond_journalier,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE taux_change
    RENAME COLUMN from_currency_id TO devise_source_id,
    RENAME COLUMN to_currency_id TO devise_destination_id,
    RENAME COLUMN rate TO taux,
    RENAME COLUMN effective_at TO applique_le,
    RENAME COLUMN created_by TO cree_par;

ALTER TABLE grilles_tarifaires
    RENAME COLUMN name TO nom,
    RENAME COLUMN currency_id TO devise_id,
    RENAME COLUMN active TO actif,
    RENAME COLUMN effective_from TO date_debut,
    RENAME COLUMN effective_to TO date_fin,
    RENAME COLUMN created_by TO cree_par,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE tranches_tarifaires
    RENAME COLUMN fee_grid_id TO grille_tarifaire_id,
    RENAME COLUMN min_amount TO montant_min,
    RENAME COLUMN max_amount TO montant_max,
    RENAME COLUMN fee_type TO type_frais,
    RENAME COLUMN fee_value TO valeur_frais,
    RENAME COLUMN created_at TO cree_le;

ALTER TABLE regles_commission
    RENAME COLUMN fee_grid_id TO grille_tarifaire_id,
    RENAME COLUMN agency_percentage TO pourcentage_agence,
    RENAME COLUMN central_percentage TO pourcentage_centrale,
    RENAME COLUMN active TO actif,
    RENAME COLUMN created_at TO cree_le;

ALTER TABLE transferts
    RENAME COLUMN reference_code TO code_reference,
    RENAME COLUMN withdrawal_code TO code_retrait,
    RENAME COLUMN sender_id TO expediteur_id,
    RENAME COLUMN beneficiary_id TO beneficiaire_id,
    RENAME COLUMN source_agency_id TO agence_source_id,
    RENAME COLUMN created_by TO cree_par,
    RENAME COLUMN cash_session_id TO session_caisse_id,
    RENAME COLUMN currency_id TO devise_id,
    RENAME COLUMN amount TO montant,
    RENAME COLUMN fee_amount TO montant_frais,
    RENAME COLUMN exchange_rate TO taux_change,
    RENAME COLUMN net_amount TO montant_net_recu,
    RENAME COLUMN status TO statut,
    RENAME COLUMN sent_at TO envoye_le,
    RENAME COLUMN expires_at TO expire_le,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE historique_statuts_transfert
    RENAME COLUMN transfer_id TO transfert_id,
    RENAME COLUMN old_status TO ancien_statut,
    RENAME COLUMN new_status TO nouveau_statut,
    RENAME COLUMN changed_by TO modifie_par,
    RENAME COLUMN changed_at TO modifie_le,
    RENAME COLUMN reason TO motif;

ALTER TABLE paiements_transfert
    RENAME COLUMN transfer_id TO transfert_id,
    RENAME COLUMN cash_session_id TO session_caisse_id,
    RENAME COLUMN beneficiary_id TO beneficiaire_id,
    RENAME COLUMN payout_agency_id TO agence_paiement_id,
    RENAME COLUMN paid_by TO paye_par,
    RENAME COLUMN paid_amount TO montant_paye,
    RENAME COLUMN paid_at TO paye_le;

ALTER TABLE sessions_caisse_agent
    RENAME COLUMN agency_id TO agence_id,
    RENAME COLUMN session_date TO date_session,
    RENAME COLUMN opening_balance TO solde_ouverture,
    RENAME COLUMN status TO statut,
    RENAME COLUMN opened_at TO ouverte_le,
    RENAME COLUMN closed_at TO cloturee_le;

ALTER TABLE mouvements_caisse
    RENAME COLUMN cash_session_id TO session_caisse_id,
    RENAME COLUMN agency_id TO agence_id,
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN movement_type TO type_mouvement,
    RENAME COLUMN amount TO montant,
    RENAME COLUMN transfer_id TO transfert_id,
    RENAME COLUMN payout_id TO paiement_id,
    RENAME COLUMN created_at TO cree_le;

ALTER TABLE clotures_caisse
    RENAME COLUMN cash_session_id TO session_caisse_id,
    RENAME COLUMN closed_by TO cloture_par,
    RENAME COLUMN expected_balance TO solde_attendu,
    RENAME COLUMN actual_balance TO solde_reel,
    RENAME COLUMN difference_amount TO montant_ecart,
    RENAME COLUMN closed_at TO cloturee_le,
    RENAME COLUMN note TO notes;

ALTER TABLE ecarts_caisse
    RENAME COLUMN cash_closure_id TO cloture_caisse_id,
    RENAME COLUMN cash_session_id TO session_caisse_id,
    RENAME COLUMN reported_by TO signale_par,
    RENAME COLUMN expected_balance TO solde_attendu,
    RENAME COLUMN actual_balance TO solde_reel,
    RENAME COLUMN difference_amount TO montant_ecart,
    RENAME COLUMN discrepancy_type TO type_ecart,
    RENAME COLUMN status TO statut,
    RENAME COLUMN reported_at TO signale_le;

ALTER TABLE verifications_kyc
    RENAME COLUMN customer_id TO client_id,
    RENAME COLUMN checked_by TO verifie_par,
    RENAME COLUMN status TO statut,
    RENAME COLUMN identity_pattern_valid TO format_piece_valide,
    RENAME COLUMN checked_at TO verifie_le;

ALTER TABLE controles_aml
    RENAME COLUMN transfer_id TO transfert_id,
    RENAME COLUMN sender_id TO expediteur_id,
    RENAME COLUMN beneficiary_id TO beneficiaire_id,
    RENAME COLUMN status TO statut,
    RENAME COLUMN sender_watchlist_match TO expediteur_liste_surveillance,
    RENAME COLUMN beneficiary_watchlist_match TO beneficiaire_liste_surveillance,
    RENAME COLUMN amount_threshold_exceeded TO seuil_montant_depasse,
    RENAME COLUMN risk_score TO score_risque,
    RENAME COLUMN result_notes TO notes_resultat,
    RENAME COLUMN checked_at TO verifie_le;

ALTER TABLE liste_surveillance
    RENAME COLUMN full_name TO nom_complet,
    RENAME COLUMN identity_number TO numero_piece_identite,
    RENAME COLUMN country TO pays,
    RENAME COLUMN reason TO motif,
    RENAME COLUMN active TO actif,
    RENAME COLUMN created_at TO cree_le;

ALTER TABLE declarations_soupcon
    RENAME COLUMN transfer_id TO transfert_id,
    RENAME COLUMN aml_check_id TO controle_aml_id,
    RENAME COLUMN customer_id TO client_id,
    RENAME COLUMN report_type TO type_declaration,
    RENAME COLUMN status TO statut,
    RENAME COLUMN reviewed_by TO examine_par,
    RENAME COLUMN reviewed_at TO examine_le,
    RENAME COLUMN created_at TO cree_le;

ALTER TABLE notifications
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN channel TO canal,
    RENAME COLUMN title TO titre,
    RENAME COLUMN status TO statut,
    RENAME COLUMN provider_response TO reponse_fournisseur,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN sent_at TO envoye_le;

ALTER TABLE preferences_notification
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN email_enabled TO email_active,
    RENAME COLUMN sms_enabled TO sms_active,
    RENAME COLUMN push_enabled TO push_active,
    RENAME COLUMN preferred_language TO langue_preferee,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE codes_otp
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN purpose TO objectif,
    RENAME COLUMN channel TO canal,
    RENAME COLUMN expires_at TO expire_le,
    RENAME COLUMN used TO utilise,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN used_at TO utilise_le;

ALTER TABLE journal_audit
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN user_role TO role_utilisateur,
    RENAME COLUMN entity_name TO nom_entite,
    RENAME COLUMN entity_id TO id_entite,
    RENAME COLUMN ip_address TO adresse_ip,
    RENAME COLUMN user_agent TO navigateur_utilisateur,
    RENAME COLUMN created_at TO cree_le;

ALTER TABLE rapports_generes
    RENAME COLUMN generated_by TO genere_par,
    RENAME COLUMN agency_id TO agence_id,
    RENAME COLUMN report_type TO type_declaration,
    RENAME COLUMN period_start TO date_debut_periode,
    RENAME COLUMN period_end TO date_fin_periode,
    RENAME COLUMN file_path TO chemin_fichier,
    RENAME COLUMN status TO statut,
    RENAME COLUMN generated_at TO genere_le;

ALTER TABLE sessions_chatbot
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN status TO statut,
    RENAME COLUMN language TO langue,
    RENAME COLUMN started_at TO demarree_le,
    RENAME COLUMN ended_at TO terminee_le;

ALTER TABLE messages_chatbot
    RENAME COLUMN session_id TO session_chatbot_id,
    RENAME COLUMN sender_type TO type_expediteur,
    RENAME COLUMN sender_user_id TO utilisateur_expediteur_id,
    RENAME COLUMN detected_intent TO intention_detectee,
    RENAME COLUMN created_at TO cree_le;

ALTER TABLE operateurs_mobile_money
    RENAME COLUMN name TO nom,
    RENAME COLUMN country_id TO pays_id,
    RENAME COLUMN active TO actif,
    RENAME COLUMN created_at TO cree_le,
    RENAME COLUMN updated_at TO modifie_le;

ALTER TABLE transferts_mobile_money
    RENAME COLUMN transfer_id TO transfert_id,
    RENAME COLUMN operator_id TO operateur_id,
    RENAME COLUMN beneficiary_id TO beneficiaire_id,
    RENAME COLUMN wallet_phone TO telephone_wallet,
    RENAME COLUMN amount TO montant,
    RENAME COLUMN status TO statut,
    RENAME COLUMN operator_reference TO reference_operateur,
    RENAME COLUMN initiated_by TO initie_par,
    RENAME COLUMN requested_at TO demande_le,
    RENAME COLUMN completed_at TO terminee_le,
    RENAME COLUMN provider_response TO reponse_fournisseur;

ALTER TABLE reconciliations_mobile_money
    RENAME COLUMN mobile_money_transfer_id TO transfert_mobile_money_id,
    RENAME COLUMN operator_reference TO reference_operateur,
    RENAME COLUMN expected_amount TO montant_attendu,
    RENAME COLUMN operator_amount TO montant_operateur,
    RENAME COLUMN status TO statut,
    RENAME COLUMN reconciled_by TO reconcilie_par,
    RENAME COLUMN reconciled_at TO reconcilie_le,
    RENAME COLUMN note TO notes;

ALTER TABLE jetons_actualisation
    RENAME COLUMN token TO jeton,
    RENAME COLUMN expiry_date TO date_expiration,
    RENAME COLUMN revoked TO revoque,
    RENAME COLUMN user_id TO utilisateur_id,
    RENAME COLUMN created_at TO cree_le;

SET FOREIGN_KEY_CHECKS = 1;
