# Contexte du projet Okane Transfer

## 1. Vue d'ensemble

**Nom du projet :** Okane Transfer  
**Type :** application web de gestion de transferts d'argent  
**Domaine :** plateforme financière proche de Western Union / MoneyGram  
**Architecture :** architecture monolithique en couches  
**Contrainte importante :** Spring signifie Spring MVC et l'écosystème Spring, pas Spring Boot.

Okane Transfer est une plateforme complète permettant d'envoyer, recevoir, suivre et gérer des transferts d'argent via des agences et des agents. Le système doit gérer les transferts nationaux et internationaux, le change multi-devises, les frais et commissions, les contrôles de conformité, les rapports, les notifications et l'espace client.

---

## 2. Objectifs principaux

Le système doit permettre :

- l'envoi d'argent au niveau national et international ;
- le paiement des bénéficiaires ;
- la gestion des agences, agents, managers, clients et administrateurs ;
- la génération de références de transfert et de codes de retrait uniques ;
- le suivi des transferts en temps réel ;
- la gestion des devises et des taux de change ;
- le calcul automatique des frais et commissions ;
- la gestion des sessions de caisse agent et de la réconciliation quotidienne ;
- la détection des opérations suspectes avec logique KYC / AML ;
- l'envoi de notifications simulées par SMS, courriel et push ;
- la production de rapports et tableaux de bord ;
- l'assistance via chatbot pour les questions fréquentes et le suivi des transferts ;
- la simulation de fournisseurs Mobile Money comme Orange Money, Wave et M-Pesa.

---

## 3. Architecture globale

Le projet doit être une **application monolithique** organisée en couches.

### Couches

1. **Couche présentation**
   - Controller REST Spring MVC
   - DTO d'entrée et de sortie
   - validation des requêtes
   - formatage des réponses API

2. **Couche Service**
   - logique métier
   - transactions
   - règles de validation
   - orchestration des flux

3. **Couche persistance**
   - entités JPA
   - Repository
   - requêtes base de données

4. **Couche infrastructure**
   - configuration sécurité
   - configuration JWT
   - configuration Swagger
   - configuration CORS
   - gestion des exceptions
   - journal d'audit

---

## 4. Stack technique

### Backend

- Java
- Spring MVC 6
- Spring Security 6
- Spring Data JPA
- Hibernate
- authentification JWT
- API REST
- Jakarta Servlet API
- Jakarta Validation
- Maven

### Base de données

Utiliser l'un des moteurs suivants :

- PostgreSQL
- MySQL

### Frontend

- Angular 17+
- Angular Router
- Guards
- interceptors HTTP
- Chart.js
- prise en charge i18n

### Documentation API

- SpringDoc OpenAPI 3
- Swagger UI
- configuration manuelle sans Spring Boot

### Non prioritaire maintenant

Ces éléments existent dans le cahier de charge mais ne sont pas prioritaires :

- Docker
- Docker Compose
- CI/CD GitHub Actions
- Spring Actuator
- Micrometer
- monitoring avancé
- rapport technique complet

---

## 5. Rôles utilisateurs

Le système utilise Spring Security avec contrôle d'accès par rôles.

### ROLE_ADMIN

Responsabilités administrateur :

- gérer les utilisateurs ;
- gérer les agences ;
- gérer les devises ;
- gérer les taux de change ;
- gérer les frais et commissions ;
- consulter les rapports globaux ;
- consulter le journal d'audit ;
- superviser les alertes de conformité.

### ROLE_MANAGER

Responsabilités manager :

- gérer les agents de son agence ;
- valider les opérations sensibles ;
- consulter les rapports d'agence ;
- surveiller les plafonds journaliers ;
- superviser les sessions de caisse.

### ROLE_AGENT

Responsabilités agent :

- enregistrer les transferts d'argent ;
- vérifier l'identité de l'expéditeur ;
- vérifier l'identité du bénéficiaire ;
- payer les transferts ;
- gérer les opérations de caisse ;
- ouvrir et fermer les sessions de caisse quotidiennes ;
- déclarer les écarts de caisse.

### ROLE_CLIENT

Responsabilités client :

- s'inscrire et se connecter ;
- consulter l'historique des transferts ;
- suivre les transferts ;
- gérer son profil ;
- gérer ses préférences de notification.

---

## 6. Modules métier principaux

Même si l'application est monolithique, la logique doit être organisée par modules métier ou packages.

### 6.1 Service Authentification & Utilisateurs

Responsable de :

- l'inscription des utilisateurs ;
- la connexion ;
- la génération JWT ;
- la gestion des jetons d'actualisation ;
- le hachage des mots de passe avec BCrypt ;
- la gestion des rôles ;
- l'activation et la suspension des utilisateurs ;
- la simulation OTP SMS pour la 2FA.

Entités principales :

- User
- Role
- RefreshToken
- OtpCode
- ClientProfile
- EmployeeProfile

### 6.2 Service Agences

Responsable de :

- créer, modifier, suspendre et activer les agences ;
- affecter des managers et des agents ;
- définir les plafonds des agences ;
- consulter la performance d'agence.

Entités principales :

- Agency
- AgencyLimit
- AgencyAssignment

### 6.3 Service Transferts

Responsable de :

- créer les transferts ;
- générer la référence de transfert ;
- générer le code de retrait ou OTP ;
- gérer les informations expéditeur et bénéficiaire ;
- calculer le montant reçu ;
- gérer le statut du transfert ;
- annuler ou expirer des transferts.

Règle métier importante :

Si un expéditeur envoie 500 DH et que le bénéficiaire doit recevoir 500 DH, le bénéficiaire ne peut pas retirer seulement 300 DH et laisser 200 DH. Un paiement de transfert doit être complet, sauf si une fonctionnalité spécifique de paiement partiel est conçue explicitement, ce qui n'est pas requis maintenant.

Statuts principaux :

- PENDING : EN_ATTENTE
- PAID : PAYÉ
- CANCELLED : ANNULÉ
- EXPIRED : EXPIRÉ
- BLOCKED : BLOQUÉ

Entités principales :

- Transfer
- TransferSender
- TransferBeneficiary
- TransferStatusHistory
- WithdrawalCode

### 6.4 Service Paiement & Caisse

Responsable de :

- gérer les sessions de caisse agent ;
- ouvrir la session de caisse en début de journée ;
- fermer la session de caisse en fin de journée ;
- enregistrer les entrées et sorties de caisse ;
- lier les transferts et paiements aux sessions de caisse ;
- calculer le solde attendu ;
- calculer le solde réel de clôture ;
- déclarer les fonds manquants ou excédentaires ;
- réaliser la réconciliation.

Idée importante :

Chaque opération financière effectuée par un agent doit être liée à une session de caisse active.

Entités principales :

- AgentCashSession
- CashMovement
- CashReconciliation
- CashDifferenceReport

Types de mouvements de caisse :

- TRANSFER_IN
- PAYOUT_OUT
- ADJUSTMENT_IN
- ADJUSTMENT_OUT
- SESSION_OPENING
- SESSION_CLOSING

Signification des ajustements :

- `ADJUSTMENT_IN` : correction manuelle qui ajoute de l'argent au solde attendu ;
- `ADJUSTMENT_OUT` : correction manuelle qui retire de l'argent du solde attendu.

Formule du solde attendu :

```text
solde_attendu = solde_ouverture + total_entrees - total_sorties + ajustement_entree - ajustement_sortie
```

### 6.5 Service Devises & Change

Responsable de :

- gérer les devises ;
- gérer les pays ;
- gérer les corridors de transfert ;
- mettre à jour les taux de change ;
- stocker l'historique des taux de change ;
- convertir les montants entre devises.

Entités principales :

- Currency
- Country
- TransferCorridor
- ExchangeRate
- ExchangeRateHistory

### 6.6 Service Frais & Commissions

Responsable de :

- définir les grilles tarifaires ;
- définir les tranches de montant ;
- calculer les frais client ;
- calculer la commission agence ;
- calculer la commission centrale ;
- simuler les frais avant création du transfert ;
- exporter les frais en PDF / CSV si nécessaire.

Entités principales :

- FeeGrid
- FeeBracket
- CommissionRule
- FeeSimulation

Une tranche tarifaire représente un intervalle de montant utilisé pour calculer les frais.

Exemple :

```text
0 - 500 DH       => frais = 10 DH
501 - 1000 DH    => frais = 20 DH
1001 - 5000 DH   => frais = 50 DH
```

### 6.7 Service Notifications

Responsable de :

- envoyer une notification de confirmation de transfert ;
- envoyer une notification de paiement ;
- simuler l'OTP ou le code de retrait ;
- envoyer les mises à jour de statut ;
- gérer les préférences de notification.

Canaux :

- simulation SMS
- simulation courriel
- simulation push

Entités principales :

- Notification
- NotificationTemplate
- NotificationPreference

### 6.8 Service Conformité

Responsable de :

- vérifier le KYC ;
- suivre les pièces d'identité ;
- contrôler une liste noire fictive de type OFAC ;
- détecter les transactions suspectes ;
- appliquer les règles de seuil ;
- générer les alertes de conformité ;
- gérer la revue manuelle.

Entités principales :

- KycDocument
- ComplianceRule
- BlacklistEntry
- ComplianceAlert
- SuspiciousActivityReport

### 6.9 Service Rapports

Responsable de :

- produire les rapports financiers globaux ;
- produire les rapports d'agence ;
- calculer le volume quotidien et mensuel des transferts ;
- produire les rapports de revenus ;
- produire les rapports de commissions ;
- produire les rapports d'écarts de caisse ;
- produire les rapports de conformité.

Types principaux de rapports :

- rapport de volume quotidien ;
- rapport de volume mensuel ;
- rapport de performance d'agence ;
- rapport de commission ;
- rapport de réconciliation de caisse ;
- rapport d'activité suspecte.

### 6.10 Service Chatbot

Responsable de :

- répondre aux questions fréquentes ;
- expliquer les frais ;
- expliquer les délais de transfert ;
- suivre le statut du transfert ;
- escalader vers un support humain ;
- gérer plusieurs langues : français, anglais, arabe.

Entités principales :

- ChatSession
- ChatMessage
- ChatbotIntent
- EscalationTicket

### 6.11 Service Mobile Money

Responsable de la simulation des fournisseurs Mobile Money.

Fournisseurs simulés :

- Orange Money
- Wave
- M-Pesa

Fonctions :

- envoyer vers un wallet mobile ;
- recevoir depuis un wallet mobile ;
- simuler la confirmation SMS ;
- réconcilier les opérations fournisseur ;
- suivre les données dans le tableau de bord.

Entités principales :

- MobileMoneyProvider
- MobileMoneyTransaction
- MobileMoneyReconciliation

### 6.12 Service Audit

Responsable de :

- tracer qui a fait quoi ;
- tracer quand l'action a eu lieu ;
- tracer l'adresse IP si disponible ;
- tracer les opérations sensibles ;
- assurer la traçabilité sécurité et conformité.

Entités principales :

- AuditLog
- SecurityEvent

Exemples d'audit :

- connexion utilisateur ;
- échec de connexion ;
- transfert créé ;
- transfert payé ;
- transfert annulé ;
- taux de change modifié ;
- grille tarifaire modifiée ;
- agence suspendue ;
- alerte de conformité examinée.

---

## 7. Flux métier importants

### 7.1 Flux d'envoi d'argent

1. L'agent ouvre une session de caisse active.
2. L'agent saisit les informations de l'expéditeur.
3. L'agent saisit les informations du bénéficiaire.
4. L'agent saisit le montant, la devise source, le pays de destination et la devise destination.
5. Le système vérifie la disponibilité du corridor.
6. Le système calcule le taux de change si nécessaire.
7. Le système calcule les frais.
8. Le système calcule le montant à recevoir.
9. Le système lance les contrôles de conformité.
10. Si tout est valide, le système crée le transfert.
11. Le système génère la référence de transfert et le code de retrait.
12. Le système enregistre le mouvement de caisse.
13. Le système envoie la notification.
14. Le système imprime ou génère le reçu.

### 7.2 Flux de paiement d'un transfert

1. L'agent ouvre une session de caisse active.
2. L'agent recherche le transfert par référence, code de retrait ou téléphone bénéficiaire.
3. Le système vérifie le statut du transfert.
4. Le système vérifie que le transfert n'est pas expiré, annulé, bloqué ou déjà payé.
5. L'agent vérifie l'identité du bénéficiaire.
6. L'agent confirme le paiement.
7. Le système passe le transfert au statut PAID.
8. Le système enregistre le mouvement de caisse en sortie.
9. Le système lie le paiement à la session de caisse.
10. Le système envoie une notification.
11. Le système génère le reçu de paiement.

### 7.3 Flux de session de caisse

1. L'agent démarre la journée en ouvrant une session de caisse.
2. Le solde d'ouverture est enregistré.
3. Tous les transferts et paiements de la journée sont liés à cette session.
4. Le système calcule continuellement le solde attendu.
5. L'agent saisit le solde réel de clôture en fin de journée.
6. Le système compare le solde réel au solde attendu.
7. En cas d'écart, une déclaration d'écart de caisse est créée.
8. Le manager peut examiner et valider la session.

---

## 8. Exigences de sécurité

La sécurité est une partie majeure du projet.

Fonctionnalités requises :

- jeton d'accès JWT ;
- jeton d'actualisation ;
- authentification sans état ;
- chaîne de filtres Spring Security avant DispatcherServlet ;
- hachage BCrypt avec force 12 ;
- autorisation par rôles ;
- CSRF désactivé pour API REST sans état ;
- CORS configuré ;
- limitation des tentatives sur les points d'entrée sensibles ;
- OTP pour simulation 2FA ;
- journal d'audit ;
- validation des entrées avec Jakarta Validation ;
- aucun secret dans GitHub ;
- variables d'environnement pour la configuration sensible.

Règles des jetons :

```text
durée du jeton d'accès : 1 heure
durée du jeton d'actualisation : 7 jours
```

Exemple de limitation :

```text
maximum 5 tentatives de connexion par 10 minutes
```

---

## 9. Exigences non fonctionnelles

L'application doit être :

- robuste ;
- maintenable ;
- sécurisée ;
- testable ;
- évolutive au niveau architecture grâce aux sessions sans état ;
- claire et bien documentée.

Autres exigences :

- objectif de temps de réponse API : moins de 500 ms pour 95 % des requêtes ;
- principes de confidentialité proches du RGPD ;
- pseudonymisation si pertinente ;
- droit à la suppression si nécessaire ;
- accessibilité WCAG 2.1 niveau A ;
- prise en charge de l'internationalisation Angular.

---

## 10. Livrables

Livrables requis :

1. dépôt GitHub privé ;
2. fichier README ;
3. diagrammes UML ;
4. schéma de base de données ;
5. documentation Swagger UI ;
6. frontend Angular ;
7. backend Spring MVC ;
8. démonstration fonctionnelle ;
9. présentation / soutenance.

Non requis maintenant :

- rapport technique complet ;
- configuration Docker ;
- pipeline CI/CD ;
- stack de monitoring.

---

## 11. Contraintes de développement

- Utiliser une architecture monolithique.
- Ne pas créer de microservices.
- Ne pas utiliser Spring Boot.
- Utiliser une configuration Spring MVC manuelle.
- Utiliser une architecture en couches.
- Utiliser des DTO dans les réponses API, pas les entités.
- Utiliser les Repository uniquement dans la couche Service, pas dans les Controller.
- Utiliser les transactions dans la couche Service.
- Utiliser un dépôt GitHub privé.
- Réaliser au moins 3 commits par semaine.
- Ne jamais pousser de mots de passe, jetons ou secrets.
- Utiliser uniquement des données fictives.

---

## 12. Structure de packages recommandée

```text
com.okane.transfer
|
+-- config
|   +-- WebConfig.java
|   +-- SecurityConfig.java
|   +-- JpaConfig.java
|   +-- SwaggerConfig.java
|   +-- CorsConfig.java
|
+-- auth
|   +-- controller
|   +-- service
|   +-- repository
|   +-- entity
|   +-- dto
|   +-- security
|
+-- user
+-- agency
+-- transfer
+-- cash
+-- currency
+-- fee
+-- notification
+-- compliance
+-- reporting
+-- chatbot
+-- mobilemoney
+-- audit
```

---

## 13. Ordre de priorité

Ordre de développement recommandé :

1. Authentification & Utilisateurs
2. Gestion des agences
3. Sessions de caisse agent
4. Devises & Change
5. Frais & commissions
6. Création de transfert
7. Paiement d'un transfert
8. Notifications
9. Contrôles de conformité
10. Rapports
11. Chatbot
12. Simulation Mobile Money
13. Améliorations audit
14. Finition du frontend
15. Préparation Swagger et démonstration

---

## 14. Rappel final

Le projet doit paraître professionnel et complet, mais le temps est limité. Priorité au noyau fonctionnel :

- authentification ;
- rôles ;
- agences ;
- agents ;
- sessions de caisse ;
- envoi de transfert ;
- paiement de transfert ;
- frais ;
- devises ;
- rapports de base ;
- audit.

Les fonctionnalités avancées doivent être ajoutées progressivement.
