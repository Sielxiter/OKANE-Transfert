# Plan d'Implémentation du Dashboard Manager

## Résumé

Créer un module complet de Dashboard Manager pour Okane Transfer, permettant aux managers d'agences centrales de superviser leurs sous-agences, agents, transferts, validations, caisse, rapports et alertes. Le module doit s'intégrer à l'architecture existante et réutiliser les patterns de l'Admin Dashboard.

## Analyse de l'État Actuel

### Frontend Structure Existante

```
Okane-frontend/src/app/
├── features/admin/          ✓ Admin Dashboard complet
│   ├── dashboard/
│   ├── users/
│   ├── agencies/
│   ├── currency/
│   ├── fees/
│   ├── transfers/
│   ├── payments/
│   ├── compliance/
│   ├── audit/
│   ├── reports/
│   └── settings/
├── pages/admin/             ✓ Layout Admin
├── core/
│   ├── api/                 ✓ Configuration API
│   └── auth/                ✓ Guards et intercepteurs
└── shared/
    └── i18n/                ✓ Internationalisation
```

### Backend Structure Existante

```
backend/src/main/java/com/okane/
├── auth/                    ✓ Authentification JWT
├── agency/                  ✓ Entités Agence
├── agencymanagement/        ✓ Controllers Admin Agences
├── usermanagement/        ✓ Controllers Admin Utilisateurs
├── transfermanagement/      ✓ Controllers Admin Transferts
├── compliancemanagement/    ✓ Controllers Admin Conformité
├── audit/                   ✓ Entités Audit
└── config/                  ✓ SecurityConfig
```

### Composants Réutilisables Existant

1. **Layout System**: Sidebar, Header, Content Area (déjà implémenté)
2. **UI Components**: Cards, Tables, Modals, Forms, Buttons (style cohérent)
3. **Table System**: Pagination, Sorting, Filtering (utilisé dans admin)
4. **Charts**: Chart.js intégré pour analytics
5. **Services Pattern**: HTTP services avec gestion d'erreurs
6. **Guards**: AuthGuard, RoleGuard déjà fonctionnels

## Changements Proposés

### 1. Structure des Fichiers (Frontend)

```
Okane-frontend/src/app/
├── features/manager/                    ✓ NOUVEAU
│   ├── dashboard/
│   │   ├── manager-dashboard-page.component.ts
│   │   ├── manager-dashboard.api.ts
│   │   └── manager-dashboard.mock.ts
│   ├── subagencies/
│   │   ├── subagencies-page.component.ts
│   │   ├── subagency-details.component.ts
│   │   └── manager-subagencies.api.ts
│   ├── agents/
│   │   ├── agents-page.component.ts
│   │   ├── agent-details.component.ts
│   │   └── manager-agents.api.ts
│   ├── transfers/
│   │   ├── transfers-page.component.ts
│   │   ├── transfer-details.component.ts
│   │   └── manager-transfers.api.ts
│   ├── validations/
│   │   ├── validations-page.component.ts
│   │   └── manager-validations.api.ts
│   ├── cash/
│   │   ├── cash-page.component.ts
│   │   ├── closure-details.component.ts
│   │   └── manager-cash.api.ts
│   ├── reports/
│   │   ├── reports-page.component.ts
│   │   └── manager-reports.api.ts
│   ├── alerts/
│   │   ├── alerts-page.component.ts
│   │   └── manager-alerts.api.ts
│   ├── audit/
│   │   ├── audit-page.component.ts
│   │   └── manager-audit.api.ts
│   └── profile/
│       ├── profile-page.component.ts
│       └── manager-profile.api.ts
├── pages/manager/                         ✓ NOUVEAU
│   ├── manager-layout.component.ts        ✓ Layout spécifique manager
│   └── manager-routes.ts                  ✓ Routes manager
├── shared/models/manager/                 ✓ NOUVEAU (interfaces partagées)
│   ├── subagency.model.ts
│   ├── agent.model.ts
│   ├── transfer.model.ts
│   ├── validation.model.ts
│   ├── cash.model.ts
│   ├── report.model.ts
│   ├── alert.model.ts
│   └── audit.model.ts
└── core/guards/
    └── role.guard.ts                      ✓ Déjà existant, à réutiliser
```

### 2. Structure des Fichiers (Backend)

```
backend/src/main/java/com/okane/
├── managermodule/                       ✓ NOUVEAU PACKAGE
│   ├── controller/
│   │   ├── ManagerDashboardController.java
│   │   ├── ManagerSubAgencyController.java
│   │   ├── ManagerAgentController.java
│   │   ├── ManagerTransferController.java
│   │   ├── ManagerValidationController.java
│   │   ├── ManagerCashController.java
│   │   ├── ManagerReportController.java
│   │   ├── ManagerAlertController.java
│   │   ├── ManagerAuditController.java
│   │   └── ManagerProfileController.java
│   ├── service/
│   │   ├── ManagerDashboardService.java
│   │   ├── ManagerSubAgencyService.java
│   │   ├── ManagerAgentService.java
│   │   ├── ManagerTransferService.java
│   │   ├── ManagerValidationService.java
│   │   ├── ManagerCashService.java
│   │   ├── ManagerReportService.java
│   │   ├── ManagerAlertService.java
│   │   ├── ManagerAuditService.java
│   │   └── ManagerProfileService.java
│   ├── dto/
│   │   ├── DashboardOverviewDto.java
│   │   ├── SubAgencyListDto.java
│   │   ├── SubAgencyDetailsDto.java
│   │   ├── AgentListDto.java
│   │   ├── AgentDetailsDto.java
│   │   ├── TransferListDto.java
│   │   ├── TransferDetailsDto.java
│   │   ├── ValidationListDto.java
│   │   ├── CashClosureListDto.java
│   │   ├── ReportDto.java
│   │   ├── AlertListDto.java
│   │   ├── AuditLogDto.java
│   │   └── ManagerProfileDto.java
│   ├── mapper/
│   │   └── ManagerMapper.java
│   └── exception/
│       ├── ManagerNotFoundException.java
│       ├── SubAgencyNotFoundException.java
│       └── ManagerAccessDeniedException.java
└── config/
    └── SecurityConfig.java              ✓ Mettre à jour pour /api/manager/**
```

### 3. Routes et Navigation

```typescript
// manager-routes.ts
export const MANAGER_ROUTES: Routes = [
  {
    path: 'manager',
    component: ManagerLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_MANAGER' },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: ManagerDashboardPageComponent },
      { path: 'sub-agencies', component: ManagerSubAgenciesPageComponent },
      { path: 'sub-agencies/:id', component: ManagerSubAgencyDetailsComponent },
      { path: 'agents', component: ManagerAgentsPageComponent },
      { path: 'agents/:id', component: ManagerAgentDetailsComponent },
      { path: 'transfers', component: ManagerTransfersPageComponent },
      { path: 'transfers/:id', component: ManagerTransferDetailsComponent },
      { path: 'validations', component: ManagerValidationsPageComponent },
      { path: 'cash', component: ManagerCashPageComponent },
      { path: 'cash/closures/:id', component: ManagerCashClosureDetailsComponent },
      { path: 'reports', component: ManagerReportsPageComponent },
      { path: 'alerts', component: ManagerAlertsPageComponent },
      { path: 'audit-log', component: ManagerAuditPageComponent },
      { path: 'profile', component: ManagerProfilePageComponent }
    ]
  }
];
```

### 4. Configuration Sidebar

```typescript
// Configuration des éléments sidebar pour manager
export const MANAGER_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Vue d\'ensemble',
    icon: 'lucideLayoutDashboard',
    route: '/manager/overview',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Sous-Agences',
    icon: 'lucideBuilding2',
    route: '/manager/sub-agencies',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Agents',
    icon: 'lucideUsers',
    route: '/manager/agents',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Transferts',
    icon: 'lucideArrowRightLeft',
    route: '/manager/transfers',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Validations en attente',
    icon: 'lucideClipboardCheck',
    route: '/manager/validations',
    role: 'ROLE_MANAGER',
    badgeEndpoint: '/api/manager/validations/pending-count'
  },
  {
    label: 'Supervision Caisse',
    icon: 'lucideBanknote',
    route: '/manager/cash',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Rapports',
    icon: 'lucideBarChart3',
    route: '/manager/reports',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Alertes',
    icon: 'lucideBell',
    route: '/manager/alerts',
    role: 'ROLE_MANAGER',
    badgeEndpoint: '/api/manager/alerts/unresolved-count'
  },
  {
    label: 'Journal d\'audit',
    icon: 'lucideHistory',
    route: '/manager/audit-log',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Profil',
    icon: 'lucideUser',
    route: '/manager/profile',
    role: 'ROLE_MANAGER'
  }
];
```

## Étapes d'Implémentation

### Phase 1: Exploration (Requise)

Avant d'écrire le plan, explorer le codebase existant:

1. **Explorer la structure frontend**:
   - Lire `Okane-frontend/src/app/app.routes.ts`
   - Lire `Okane-frontend/src/app/core/api/api.config.ts`
   - Explorer `Okane-frontend/src/app/features/admin/` pour comprendre les patterns
   - Lire `Okane-frontend/src/app/core/auth/` pour les guards

2. **Explorer la structure backend**:
   - Lire les contrôleurs existants dans `agencymanagement/`, `usermanagement/`, `transfermanagement/`
   - Comprendre les patterns de sécurité avec `@PreAuthorize`
   - Comprendre les patterns de DTOs et mappers

3. **Identifier les composants réutilisables**:
   - Tables avec pagination
   - Cards KPI
   - Modals/Dialogs
   - Formulaires réactifs
   - Charts/analytics

### Phase 2: Clarification (Si nécessaire)

Poser des questions si certaines informations manquent:

1. **Questions sur la structure existante**:
   - Le layout sidebar existe-t-il déjà ou faut-il le créer?
   - Quelle est la convention de nommage pour les routes API?
   - Y a-t-il déjà des composants réutilisables pour les tables/charts?

2. **Questions sur le scope**:
   - Toutes les pages sont-elles requises ou peut-on prioriser?
   - Quel est le délai de livraison attendu?

### Phase 3: Génération du Plan

Écrire le plan détaillé dans le fichier plan.

### Phase 4: Notification et Exécution

Notifier l'utilisateur que le plan est prêt et attendre l'approbation avant de commencer l'implémentation.

---

## Points Clés de l'Adaptation

1. **Réutilisation Maximale**: Utiliser les patterns, composants et services existants de l'Admin Dashboard
2. **Cohérence UI**: Respecter le design system existant (couleurs, spacing, typographie)
3. **Sécurité**: Implémenter la restriction de scope pour que les managers ne voient que leurs sous-agences
4. **Architecture**: Suivre la structure en couches (controller → service → repository → dto → mapper)
5. **API Design**: Utiliser les conventions RESTful et les patterns de pagination existants

## Fichiers Clés à Créer/Modifier

### Frontend (15+ nouveaux composants/services)

**Nouveaux Dossiers**:
- `features/manager/` - Tous les composants manager
- `pages/manager/` - Layout et routes
- `shared/models/manager/` - Interfaces TypeScript

**Fichiers Principaux**:
- `manager-routes.ts` - Définition des routes
- `manager-layout.component.ts` - Layout manager
- `manager-dashboard.service.ts` - Service API
- `manager-subagencies.service.ts` - API sous-agences
- `manager-agents.service.ts` - API agents
- `manager-transfers.service.ts` - API transferts
- `manager-validations.service.ts` - API validations
- `manager-cash.service.ts` - API caisse
- `manager-reports.service.ts` - API rapports
- `manager-alerts.service.ts` - API alertes
- `manager-audit.service.ts` - API audit
- `manager-profile.service.ts` - API profil

### Backend (20+ nouveaux fichiers)

**Nouveau Package**:
- `com.okane.managermodule/` - Module manager complet

**Controllers (10)**:
- `ManagerDashboardController.java`
- `ManagerSubAgencyController.java`
- `ManagerAgentController.java`
- `ManagerTransferController.java`
- `ManagerValidationController.java`
- `ManagerCashController.java`
- `ManagerReportController.java`
- `ManagerAlertController.java`
- `ManagerAuditController.java`
- `ManagerProfileController.java`

**Services (10)**:
- `ManagerDashboardService.java`
- `ManagerSubAgencyService.java`
- `ManagerAgentService.java`
- `ManagerTransferService.java`
- `ManagerValidationService.java`
- `ManagerCashService.java`
- `ManagerReportService.java`
- `ManagerAlertService.java`
- `ManagerAuditService.java`
- `ManagerProfileService.java`

**DTOs (20+)**:
- `DashboardOverviewDto.java`
- `SubAgencyListDto.java`
- `SubAgencyDetailsDto.java`
- `AgentListDto.java`
- `AgentDetailsDto.java`
- `TransferListDto.java`
- `TransferDetailsDto.java`
- `ValidationListDto.java`
- `CashClosureListDto.java`
- `ReportDto.java`
- `AlertListDto.java`
- `AuditLogDto.java`
- `ManagerProfileDto.java`

**Mappers**:
- `ManagerMapper.java` (MapStruct)

**Exceptions**:
- `ManagerNotFoundException.java`
- `SubAgencyNotFoundException.java`
- `ManagerAccessDeniedException.java`

### Modifications aux Fichiers Existants

**Frontend**:
- `app.routes.ts` - Ajouter les routes manager
- Sidebar configuration - Ajouter les items manager
- `api.config.ts` - Ajouter `MANAGER_API_BASE` si nécessaire

**Backend**:
- `SecurityConfig.java` - Ajouter les permissions pour `/api/manager/**`
- `AuditLog.java` - Potentiellement ajouter des champs si nécessaire

## Modèle de Données Spécifique Manager

### Scope Manager

```java
public class ManagerScope {
    private Long managerId;
    private Long centralAgencyId;
    private List<Long> subAgencyIds;
    private String managerEmail;
}
```

### Restriction de Scope

Toutes les requêtes doivent filtrer par `subAgencyId IN (:allowedSubAgencyIds)`

Exemple:
```java
// Dans ManagerTransferService
public Page<TransferListDto> getTransfers(String managerEmail, TransferFilter filter, Pageable pageable) {
    ManagerScope scope = scopeResolver.resolve(managerEmail);
    
    return transferRepository.findBySubAgencyIdIn(
        scope.getSubAgencyIds(),
        filter,
        pageable
    ).map(mapper::toListDto);
}
```

## Plan d'Implémentation Détaillé

### Phase 1: Fondation (Jour 1-2)

1. **Créer la structure de fichiers**
   - Créer tous les dossiers nécessaires
   - Créer les fichiers de base vides

2. **Implémenter le Scope Manager (Backend)**
   - `ManagerScope.java` - Classe de données
   - `ManagerScopeResolver.java` - Service de résolution
   - `ManagerSecurityService.java` - Vérification des permissions

3. **Configuration Sécurité**
   - Mettre à jour `SecurityConfig.java` pour `/api/manager/**`
   - Créer le package `com.okane.managermodule`

4. **Sidebar Frontend**
   - Configurer les items de navigation
   - Ajouter les icônes et labels
   - Connecter au service d'authentification

### Phase 2: Dashboard (Jour 3)

1. **Backend Dashboard**
   - `ManagerDashboardController.java`
   - `ManagerDashboardService.java`
   - `DashboardOverviewDto.java`
   - Endpoint: `GET /api/manager/dashboard/overview`

2. **Frontend Dashboard**
   - `manager-dashboard-page.component.ts`
   - `manager-dashboard.service.ts`
   - 8 KPI Cards
   - Charts Chart.js
   - Tables récentes

### Phase 3: Sous-Agences (Jour 4)

1. **Backend Sous-Agences**
   - `ManagerSubAgencyController.java`
   - `ManagerSubAgencyService.java`
   - `SubAgencyListDto.java`, `SubAgencyDetailsDto.java`
   - Endpoints: GET list, GET details, GET performance

2. **Frontend Sous-Agences**
   - `subagencies-page.component.ts`
   - `subagency-details.component.ts`
   - Table avec filtres
   - Page détails

### Phase 4: Agents (Jour 5)

1. **Backend Agents**
   - `ManagerAgentController.java`
   - `ManagerAgentService.java`
   - `AgentListDto.java`, `AgentDetailsDto.java`
   - Endpoints: GET list, GET details, PATCH activate/deactivate

2. **Frontend Agents**
   - `agents-page.component.ts`
   - `agent-details.component.ts`
   - Table avec filtres
   - Actions activate/deactivate

### Phase 5: Transferts (Jour 6-7)

1. **Backend Transferts**
   - `ManagerTransferController.java`
   - `ManagerTransferService.java`
   - `TransferListDto.java`, `TransferDetailsDto.java`
   - Endpoints: GET list, GET details, GET audit, GET receipt

2. **Frontend Transferts**
   - `transfers-page.component.ts`
   - `transfer-details.component.ts`
   - Filtres avancés (date, statut, corridor)
   - Table complète
   - Page détails avec timeline

### Phase 6: Validations (Jour 8)

1. **Backend Validations**
   - `ManagerValidationController.java`
   - `ManagerValidationService.java`
   - `ValidationListDto.java`
   - Endpoints: GET count, GET list, GET details, POST approve/reject

2. **Frontend Validations**
   - `validations-page.component.ts`
   - Badge sidebar dynamique
   - Table avec actions
   - Modals approve/reject

### Phase 7: Caisse (Jour 9)

1. **Backend Caisse**
   - `ManagerCashController.java`
   - `ManagerCashService.java`
   - `CashClosureListDto.java`
   - Endpoints: GET overview, GET closures, GET details, POST validate/reject

2. **Frontend Caisse**
   - `cash-page.component.ts`
   - Cartes résumé
   - Table des closures
   - Highlight des discrepancies

### Phase 8: Rapports (Jour 10)

1. **Backend Rapports**
   - `ManagerReportController.java`
   - `ManagerReportService.java`
   - `ReportDto.java`
   - Endpoints: GET preview, GET export/pdf, GET export/csv

2. **Frontend Rapports**
   - `reports-page.component.ts`
   - Sélecteur de type
   - Filtres
   - Preview
   - Export

### Phase 9: Alertes (Jour 11)

1. **Backend Alertes**
   - `ManagerAlertController.java`
   - `ManagerAlertService.java`
   - `AlertListDto.java`
   - Endpoints: GET count, GET list, GET details, POST review/resolve/dismiss

2. **Frontend Alertes**
   - `alerts-page.component.ts`
   - Badge sidebar
   - Table avec severity
   - Actions

### Phase 10: Audit et Profil (Jour 12)

1. **Backend Audit**
   - `ManagerAuditController.java`
   - `ManagerAuditService.java`
   - `AuditLogDto.java`
   - Endpoint: GET audit-log

2. **Frontend Audit**
   - `audit-page.component.ts`
   - Filtres
   - Table read-only

3. **Backend Profil**
   - `ManagerProfileController.java`
   - `ManagerProfileService.java`
   - `ManagerProfileDto.java`
   - Endpoints: GET profile, PUT profile, POST change-password

4. **Frontend Profil**
   - `profile-page.component.ts`
   - Formulaire éditable
   - Changement mot de passe

### Phase 11: Tests et Intégration (Jour 13-14)

1. **Tests Frontend**
   - Tester toutes les routes
   - Tester les guards
   - Tester les services
   - Vérifier la réactivité

2. **Tests Backend**
   - Tester tous les endpoints
   - Vérifier la restriction de scope
   - Tester la sécurité
   - Vérifier les audits

3. **Tests Intégration**
   - Flow complet manager
   - Test de sécurité cross-role
   - Test de performance

4. **Documentation**
   - Mettre à jour Swagger
   - Documenter les endpoints
   - Créer guide utilisateur manager

## Hypothèses et Décisions

### Décisions Techniques

1. **Architecture**: Suivre le pattern existant Admin Dashboard
2. **State Management**: Services Angular avec RxJS (pas de NgRx nécessaire)
3. **Pagination**: Server-side comme l'admin
4. **Charts**: Chart.js (déjà utilisé)
5. **Styling**: Même design system (Tailwind + Spartan UI)
6. **Backend**: Spring MVC (pas Spring Boot) comme le reste du projet
7. **Sécurité**: JWT existant + restriction de scope manager

### Hypothèses

1. Le système d'authentification JWT existe et fonctionne
2. Les guards de rôle existent (AuthGuard, RoleGuard)
3. Le design system est établi et cohérent
4. Les composants de base (tables, cards, modals) existent
5. Le backend a déjà les entités Agency, User, Transfer, etc.
6. Le pattern de pagination est établi
7. L'intercepteur HTTP existe pour ajouter les tokens JWT

## Vérification Finale

### Checklist d'Acceptation

- [ ] La sidebar manager apparaît uniquement pour `ROLE_MANAGER`
- [ ] Chaque item de sidebar ouvre une page fonctionnelle
- [ ] Chaque page a les états loading, empty et error
- [ ] Chaque table a la pagination
- [ ] Les tables importantes ont des filtres
- [ ] Les cartes du Dashboard affichent des données backend réelles
- [ ] Le badge des validations en attente fonctionne
- [ ] Le badge des alertes fonctionne
- [ ] Les données du manager sont limitées à ses sous-agences assignées
- [ ] Le manager ne peut pas accéder aux données admin-only
- [ ] Les actions approve/reject créent des logs d'audit
- [ ] La validation/rejection de caisse fonctionne
- [ ] Les rapports peuvent être prévisualisés et exportés
- [ ] La mise à jour du profil fonctionne
- [ ] Swagger documente tous les endpoints manager
- [ ] L'UI est responsive
- [ ] Aucun secret n'est en dur dans le code
- [ ] Aucune donnée fake/mock ne reste en mode production

---

**Note**: Ce plan doit être créé dans le fichier:
`c:\Users\My-PC\Desktop\OKANE-Transfert\.trae\documents\manager_dashboard_implementation_plan.md`

Après création, utiliser `NotifyUser` pour demander l'approbation avant de commencer l'implémentation.