# Règles du projet Okane Transfer

## 1. Règle globale

Ce projet est une **application monolithique Spring MVC**, pas un projet Spring Boot.

Toujours respecter :

```text
Spring = Spring MVC / écosystème Spring
Spring Boot = interdit
microservices = interdits
monolithe = obligatoire
```

---

## 2. Règles d'architecture

### Architecture obligatoire

Utiliser une architecture en couches :

```text
Controller -> Service -> Repository -> base de données
```

Couches autorisées :

1. couche Controller ;
2. couche Service ;
3. couche Repository ;
4. couche entités ;
5. couche DTO ;
6. couche configuration ;
7. couche infrastructure.

### Interdictions

- Ne pas mettre la logique métier dans les Controller.
- Ne pas appeler les Repository directement depuis les Controller.
- Ne pas exposer les entités JPA directement dans les réponses API.
- Ne pas mélanger la logique frontend avec la logique backend.
- Ne pas créer de microservices.
- Ne pas utiliser les annotations Spring Boot.

Annotations et classes interdites :

```java
@SpringBootApplication
SpringApplication.run(...)
application.yml avec style auto-configuration Spring Boot
```

---

## 3. Règles Spring MVC

Utiliser une configuration manuelle.

Classes de configuration requises :

- `WebConfig.java`
- `SecurityConfig.java`
- `JpaConfig.java`
- `SwaggerConfig.java`
- `CorsConfig.java`

L'application doit utiliser :

- `DispatcherServlet`
- `AbstractAnnotationConfigDispatcherServletInitializer`
- une configuration servlet manuelle
- une chaîne de filtres Spring Security manuelle

Exemple d'initialiseur :

```java
public class AppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {
    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class<?>[] { JpaConfig.class, SecurityConfig.class };
    }

    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class<?>[] { WebConfig.class, SwaggerConfig.class };
    }

    @Override
    protected String[] getServletMappings() {
        return new String[] { "/" };
    }
}
```

---

## 4. Règles de packages

Utiliser des packages organisés par module métier.

Structure recommandée :

```text
com.okane.transfer
|
+-- config
+-- common
+-- auth
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

Chaque module suit cette structure si nécessaire :

```text
module
+-- controller
+-- service
+-- repository
+-- entity
+-- dto
+-- mapper
+-- exception
```

---

## 5. Règles Controller

Les Controller doivent gérer uniquement les aspects HTTP.

Ils peuvent :

- recevoir les requêtes ;
- valider les DTO ;
- appeler les Service ;
- retourner les réponses.

Ils ne doivent pas :

- contenir de logique métier ;
- utiliser les Repository directement ;
- construire des calculs complexes ;
- gérer les transactions manuellement.

Exemple :

```java
@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransferResponse>> createTransfer(
            @Valid @RequestBody CreateTransferRequest request) {
        TransferResponse response = transferService.createTransfer(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

---

## 6. Règles Service

Les Service contiennent la logique métier.

Ils doivent :

- valider les règles métier ;
- utiliser les Repository ;
- gérer les transactions ;
- appeler d'autres Service si nécessaire ;
- retourner des DTO ou des résultats métier.

Utiliser `@Transactional` sur les méthodes qui modifient les données.

Exemple :

```java
@Service
public class TransferServiceImpl implements TransferService {

    @Transactional
    public TransferResponse createTransfer(CreateTransferRequest request) {
        // règles métier ici
        // création du transfert
        // création du mouvement de caisse
        // création du journal d'audit
        // retour du DTO de réponse
    }
}
```

---

## 7. Règles Repository

Les Repository gèrent uniquement l'accès à la base de données.

Utiliser les Repository Spring Data JPA.

Exemple :

```java
public interface TransferRepository extends JpaRepository<Transfer, Long> {
    Optional<Transfer> findByReference(String reference);
}
```

Les Repository ne doivent pas :

- contenir de logique de flux métier ;
- retourner directement des DTO de réponse API, sauf projection volontaire ;
- gérer la sécurité.

---

## 8. Règles entités

Les entités représentent les tables de base de données.

Règles :

- utiliser les annotations JPA ;
- garder les entités propres ;
- éviter la logique métier lourde dans les entités ;
- utiliser des enums pour les statuts fixes ;
- utiliser `BigDecimal` pour l'argent ;
- ne jamais utiliser `double` ou `float` pour l'argent.

Exemple :

```java
@Column(nullable = false, precision = 19, scale = 4)
private BigDecimal amount;
```

---

## 9. Règles DTO

Utiliser des DTO pour toutes les entrées et sorties API.

Types DTO requis :

```text
CreateXRequest
UpdateXRequest
XResponse
XSummaryResponse
SearchXCriteria
```

Règles :

- les requêtes doivent utiliser les annotations de validation ;
- les réponses ne doivent pas exposer les champs sensibles ;
- ne jamais exposer les hash de mot de passe ;
- ne jamais exposer les secrets internes des jetons ;
- ne jamais exposer les données complètes de pièce d'identité sauf nécessité.

Exemple :

```java
public class CreateTransferRequest {

    @NotNull
    private BigDecimal amount;

    @NotBlank
    private String senderPhone;

    @NotBlank
    private String beneficiaryPhone;
}
```

---

## 10. Règles Mapper

Utiliser des classes mapper pour convertir les entités en DTO.

Exemple :

```java
@Component
public class TransferMapper {
    public TransferResponse toResponse(Transfer transfer) {
        TransferResponse response = new TransferResponse();
        response.setReference(transfer.getReference());
        response.setStatus(transfer.getStatus());
        response.setAmount(transfer.getAmount());
        return response;
    }
}
```

Ne pas répéter manuellement la logique de mapping partout.

---

## 11. Règles de sécurité

La sécurité est obligatoire.

Utiliser :

- Spring Security 6 ;
- jetons d'accès JWT ;
- jetons d'actualisation ;
- sessions sans état ;
- encodeur BCrypt avec force 12 ;
- autorisation par rôles ;
- chaîne de filtres sécurité avant DispatcherServlet.

Règles :

- désactiver CSRF pour l'API REST ;
- configurer CORS ;
- protéger toutes les routes sensibles ;
- déclarer explicitement les points d'entrée publics ;
- ne jamais stocker les mots de passe en clair ;
- ne jamais journaliser les mots de passe ou jetons.

Rôles :

```text
ROLE_ADMIN
ROLE_MANAGER
ROLE_AGENT
ROLE_CLIENT
```

Exemple d'accès :

```text
/admin/**      -> ADMIN uniquement
/manager/**    -> MANAGER ou ADMIN
/agent/**      -> AGENT ou MANAGER ou ADMIN
/client/**     -> CLIENT uniquement
/auth/**       -> public
```

---

## 12. Règles JWT

Jeton d'accès :

```text
durée : 1 heure
```

Jeton d'actualisation :

```text
durée : 7 jours
```

Règles :

- stocker les jetons d'actualisation en base de données ;
- invalider le jeton d'actualisation à la déconnexion ;
- valider la signature du jeton ;
- valider l'expiration du jeton ;
- inclure l'identifiant utilisateur et les rôles dans les claims ;
- ne pas stocker de données sensibles dans les claims JWT.

---

## 13. Règles de validation

Utiliser Jakarta Validation.

Annotations courantes :

```java
@NotNull
@NotBlank
@NotEmpty
@Email
@Size
@Pattern
@Positive
@PositiveOrZero
```

La validation métier doit être dans les Service.

Exemples de validations :

- le montant doit être positif ;
- le téléphone expéditeur est obligatoire ;
- le téléphone bénéficiaire est obligatoire ;
- la devise doit exister ;
- le corridor doit être actif ;
- l'agent doit avoir une session de caisse active ;
- le transfert ne doit pas être déjà payé.

---

## 14. Règles de gestion des exceptions

Utiliser une gestion globale des exceptions.

Créer :

```text
GlobalExceptionHandler
BusinessException
ResourceNotFoundException
UnauthorizedException
ForbiddenException
ValidationException
```

Les erreurs API doivent être cohérentes.

Exemple de réponse :

```json
{
  "success": false,
  "message": "Transfert introuvable",
  "errors": [],
  "timestamp": "2026-05-20T12:00:00"
}
```

---

## 15. Règles de réponse API

Utiliser un wrapper de réponse commun.

Exemple :

```java
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
}
```

Utiliser des statuts HTTP clairs :

```text
200 OK
201 Created
400 Requête invalide
401 Non authentifié
403 Accès interdit
404 Ressource introuvable
409 Conflit
500 Erreur interne du serveur
```

---

## 16. Règles argent

Toujours utiliser `BigDecimal` pour l'argent.

Règles :

- ne jamais utiliser `double` pour les montants ;
- ne jamais utiliser `float` pour les montants ;
- toujours stocker la devise avec le montant ;
- toujours définir précision et échelle ;
- conserver l'historique des taux de change.

Exemple :

```java
private BigDecimal montantEnvoye;
private BigDecimal montantFrais;
private BigDecimal exchangeRate;
private BigDecimal montantRecu;
```

---

## 17. Règles métier des transferts

La création d'un transfert doit vérifier :

- l'expéditeur existe ou ses informations sont valides ;
- les informations du bénéficiaire sont valides ;
- le montant est positif ;
- la devise source existe ;
- la devise destination existe ;
- le corridor de transfert est actif ;
- la grille tarifaire existe ;
- l'agent possède une session de caisse active ;
- les règles de conformité sont validées.

Le paiement doit vérifier :

- le transfert existe ;
- le statut du transfert est PENDING ;
- le transfert n'est pas expiré ;
- le transfert n'est pas annulé ;
- le transfert n'est pas bloqué ;
- l'identité du bénéficiaire est vérifiée ;
- l'agent possède une session de caisse active ;
- le montant payé est égal au montant attendu.

Le paiement partiel n'est pas autorisé par défaut.

---

## 18. Règles de session de caisse

Chaque agent doit ouvrir une session de caisse avant les opérations d'argent.

Règles :

- une seule session de caisse active par agent et par jour ;
- les transferts doivent être liés à une session de caisse ;
- les paiements doivent être liés à une session de caisse ;
- le solde de clôture doit être saisi par l'agent ;
- le solde attendu doit être calculé par le système ;
- l'écart doit être déclaré.

Solde attendu :

```text
solde_attendu = solde_ouverture + entree_caisse - sortie_caisse + ajustement_entree - ajustement_sortie
```

En cas d'écart :

```text
ecart_caisse = solde_reel_cloture - solde_attendu
```

Créer un `CashDifferenceReport` si l'écart est différent de zéro.

---

## 19. Règles Devises & Change

Règles :

- le code devise doit utiliser un format ISO comme MAD, EUR, USD ;
- les taux de change doivent avoir une date d'application ;
- les anciens taux de change ne doivent pas être supprimés ;
- utiliser l'historique des taux de change ;
- les transferts doivent stocker le taux utilisé au moment de la création ;
- ne pas recalculer les anciens transferts avec de nouveaux taux.

---

## 20. Règles Frais & Commissions

Règles :

- les frais sont calculés avec des grilles tarifaires et des tranches tarifaires ;
- une tranche tarifaire est un intervalle de montant ;
- chaque transfert doit stocker les frais calculés ;
- la commission agence et la commission centrale doivent être stockées ;
- ne pas recalculer les anciens transferts si les règles de frais changent.

---

## 21. Règles de conformité

Les contrôles de conformité doivent s'exécuter avant la validation d'un transfert.

Contrôler :

- disponibilité du document KYC ;
- correspondance avec la liste noire ;
- montant suspect ;
- transactions répétées ;
- dépassement de seuil.

Si l'opération est suspecte :

- marquer le transfert comme BLOCKED ou UNDER_REVIEW ;
- créer une alerte de conformité ;
- notifier le manager ou l'administrateur si nécessaire.

Utiliser uniquement des données fictives.

---

## 22. Règles d'audit

Chaque action sensible doit créer une entrée dans le journal d'audit.

Actions à auditer :

- connexion réussie ;
- échec de connexion ;
- création de transfert ;
- paiement de transfert ;
- annulation de transfert ;
- modification du taux de change ;
- modification de la grille tarifaire ;
- création d'utilisateur ;
- suspension d'utilisateur ;
- suspension d'agence ;
- revue d'alerte de conformité ;
- ouverture de session de caisse ;
- clôture de session de caisse.

Le journal d'audit doit contenir :

```text
acteur_id
acteur_role
action
type_entite
entite_id
horodatage
adresse_ip si disponible
details
```

---

## 23. Règles base de données

Utiliser des noms de tables clairs.

Nommage recommandé :

```text
noms de tables en snake_case
noms de colonnes en snake_case
```

Exemples :

```text
utilisateurs
roles
agences
transferts
sessions_caisse_agent
mouvements_caisse
taux_change
grilles_tarifaires
tranches_tarifaires
journal_audit
```

Règles :

- utiliser des clés primaires ;
- utiliser des clés étrangères ;
- utiliser des index sur les champs de recherche ;
- utiliser des contraintes uniques si nécessaire ;
- éviter les champs nullable sauf justification ;
- utiliser les colonnes enum avec prudence.

Index importants :

```text
transfert.reference
transfert.code_retrait
utilisateur.email
utilisateur.telephone
agence.code
session_caisse.agent_id + date_session
```

---

## 24. Règles Swagger

Swagger doit documenter toutes les API REST.

Comme ce n'est pas Spring Boot :

- configurer SpringDoc manuellement ;
- configurer Swagger UI manuellement ;
- regrouper les API par module si possible.

Chaque point d'entrée API doit avoir :

- résumé ;
- description ;
- corps de requête ;
- exemples de réponse ;
- réponses d'erreur ;
- exigence de sécurité si protégé.

---

## 25. Règles Git

Utiliser Git correctement.

Règles :

- utiliser un dépôt GitHub privé ;
- faire au moins 3 commits par semaine ;
- ne jamais pousser de secrets ;
- ne jamais pousser de vrais mots de passe ;
- ne jamais pousser de clés privées ;
- utiliser `.gitignore` ;
- utiliser des branches par fonctionnalité.

Exemples de branches :

```text
main
dev
feature/auth
feature/transfer
feature/cash-session
feature/frontend-auth
```

Exemples de commits :

```text
feat(auth): ajouter le point d'entrée de connexion JWT
feat(transfer): créer le flux de transfert
fix(cash): corriger le calcul du solde attendu
chore(config): ajouter la configuration Spring MVC manuelle
```

---

## 26. Règles de gestion des secrets

Ne jamais committer :

```text
mot de passe base de données
secret JWT
mot de passe SMTP
clés API
clés privées
fichiers .env
application.properties contenant des secrets
```

Utiliser les variables d'environnement.

Exemples :

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
JWT_ACCESS_EXPIRATION
JWT_REFRESH_EXPIRATION
```

---

## 27. Règles frontend

Angular doit utiliser :

- Component ;
- Service ;
- Guards ;
- interceptors ;
- routing ;
- formulaires réactifs ;
- Chart.js pour les tableaux de bord.

Règles :

- stocker le JWT avec prudence ;
- joindre le jeton avec un interceptor HTTP ;
- protéger les routes avec des guards ;
- utiliser des interfaces compatibles DTO ;
- placer les URL API dans les fichiers d'environnement ;
- ne pas coder de secrets en dur dans le frontend.

---

## 28. Règles de nommage

Utiliser des noms clairs.

Java :

```text
ClassName
methodName
variableName
CONSTANT_NAME
```

Base de données :

```text
snake_case
```

Routes API :

```text
/api/auth/login
/api/transfers
/api/transfers/{reference}
/api/cash-sessions/open
/api/cash-sessions/close
```

---

## 29. Règles de temps

Utiliser :

```java
LocalDate
LocalDateTime
Instant
```

Règles :

- utiliser `LocalDate` pour la date de session ;
- utiliser `LocalDateTime` pour les horodatages métier ;
- utiliser `Instant` si une précision UTC est nécessaire ;
- stocker les horodatages de création et de modification si utile.

---

## 30. Règles de priorité équipe

Construire dans cet ordre :

1. structure du projet ;
2. configuration manuelle Spring MVC ;
3. configuration base de données ;
4. authentification et rôles ;
5. service agences ;
6. service sessions de caisse agent ;
7. service devises et change ;
8. service frais ;
9. création de transfert ;
10. paiement d'un transfert ;
11. journal d'audit ;
12. rapports de base ;
13. règles de conformité de base ;
14. simulation notifications ;
15. intégration frontend Angular ;
16. simulation chatbot ;
17. simulation Mobile Money ;
18. finition de démonstration.

Ne pas commencer les fonctionnalités avancées avant que le flux principal de transfert fonctionne.

---

## 31. Définition de terminé

Une fonctionnalité est terminée uniquement si :

- l'entité existe ;
- le Repository existe ;
- le Service existe ;
- le Controller existe ;
- les DTO existent ;
- la validation existe ;
- les erreurs sont gérées ;
- la sécurité est respectée ;
- la documentation Swagger existe ;
- un test manuel de base réussit ;
- une entrée d'audit est ajoutée si l'action est sensible.

---

## 32. Règle finale

Toujours préférer un noyau fonctionnel, propre et sécurisé à trop de fonctionnalités avancées inachevées.

Le flux de démonstration le plus important est :

```text
Connexion -> ouvrir la session de caisse agent -> créer un transfert -> rechercher le transfert -> payer le transfert -> fermer la session de caisse -> consulter le rapport
```
