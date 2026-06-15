# Manager Dashboard — Detailed Implementation Prompt

## 0. Context

We are building **Okane Transfer**, a money transfer management platform similar to Western Union / MoneyGram.

The platform already has a **sidebar layout**. Do **not** rebuild the global layout from scratch. The goal is to implement the **Manager Dashboard** area inside the existing application structure.

The manager role is `ROLE_MANAGER`.

In our business model, the **Manager of the Central Agency** supervises multiple sub-agencies:

```text
                    ADMIN
        (Gestion globale de la plateforme)
                          │
                          │
              MANAGER AGENCE CENTRALE
           (Supervise toutes les sous-agences)
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Sous-Agence 1    Sous-Agence 2    Sous-Agence 3
        │                 │                 │
      Agents           Agents           Agents
        │                 │                 │
      Clients          Clients          Clients
```

The admin manages the full platform. The manager does **not** manage the full platform. The manager supervises only the agencies, agents, transfers, cash operations, reports, alerts, and validations related to his/her assigned central agency and its sub-agencies.

---

## 1. Main Objective

Create a complete **Manager Dashboard module** with:

1. A clean sidebar menu for manager pages.
2. A dashboard overview page.
3. Sub-agency supervision pages.
4. Agent management pages.
5. Transfer monitoring pages.
6. Sensitive operation validation pages.
7. Cash supervision pages.
8. Reports and statistics pages.
9. Alerts and anomalies pages.
10. Audit log page.
11. Manager profile/settings page.

The AI agent must implement this module **step by step**, page by page, and endpoint by endpoint.

---

## 2. Important Development Rules

### 2.1 Do not break existing layout

There is already a sidebar layout in the project. The agent must:

- Reuse the existing layout.
- Add only the manager-specific sidebar elements.
- Avoid creating a second global layout.
- Avoid duplicating header/sidebar components.
- Keep the same design system, colors, spacing, buttons, cards, tables, and modal style already used in the project.

### 2.2 Role protection

All manager routes must be protected by role-based access.

Frontend requirement:

```ts
requiredRole: 'ROLE_MANAGER'
```

Backend requirement:

```java
@PreAuthorize("hasRole('MANAGER')")
```

or the equivalent existing security convention used in the project.

### 2.3 Scope restriction

The manager must only see data related to:

- his/her central agency;
- sub-agencies attached to that central agency;
- agents working inside those sub-agencies;
- transfers created or paid inside those sub-agencies;
- cash operations related to those sub-agencies.

The manager must **not** see all platform data unless explicitly authorized by the admin.

### 2.4 No fake global access

Do not call admin endpoints from the manager dashboard.

Bad example:

```http
GET /api/admin/agencies
```

Good example:

```http
GET /api/manager/sub-agencies
```

---

## 3. Sidebar Structure

Add the following elements to the existing sidebar when the connected user has `ROLE_MANAGER`.

### 3.1 Sidebar items

```text
Manager Dashboard
│
├── Overview
├── Sub-Agencies
├── Agents
├── Transfers
├── Pending Validations
├── Cash Supervision
├── Reports
├── Alerts & Anomalies
├── Audit Log
└── Profile
```

### 3.2 Sidebar configuration

Each sidebar item must contain:

- label;
- icon;
- route;
- required role;
- active state;
- optional badge count.

Suggested configuration:

```ts
export const MANAGER_SIDEBAR_ITEMS = [
  {
    label: 'Overview',
    icon: 'dashboard',
    route: '/manager/overview',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Sub-Agencies',
    icon: 'account_balance',
    route: '/manager/sub-agencies',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Agents',
    icon: 'groups',
    route: '/manager/agents',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Transfers',
    icon: 'sync_alt',
    route: '/manager/transfers',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Pending Validations',
    icon: 'verified_user',
    route: '/manager/validations',
    role: 'ROLE_MANAGER',
    badgeEndpoint: '/api/manager/validations/count'
  },
  {
    label: 'Cash Supervision',
    icon: 'point_of_sale',
    route: '/manager/cash',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Reports',
    icon: 'bar_chart',
    route: '/manager/reports',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Alerts & Anomalies',
    icon: 'warning',
    route: '/manager/alerts',
    role: 'ROLE_MANAGER',
    badgeEndpoint: '/api/manager/alerts/unresolved/count'
  },
  {
    label: 'Audit Log',
    icon: 'history',
    route: '/manager/audit-log',
    role: 'ROLE_MANAGER'
  },
  {
    label: 'Profile',
    icon: 'person',
    route: '/manager/profile',
    role: 'ROLE_MANAGER'
  }
];
```

### 3.3 Sidebar badge behavior

For pages like **Pending Validations** and **Alerts & Anomalies**, show a small badge in the sidebar.

Examples:

```http
GET /api/manager/validations/count
GET /api/manager/alerts/unresolved/count
```

Expected response:

```json
{
  "count": 7
}
```

If the count is `0`, hide the badge or show no badge.

---

## 4. Frontend Routes

Create manager routes under `/manager`.

```ts
const managerRoutes: Routes = [
  {
    path: 'manager',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ROLE_MANAGER' },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: ManagerOverviewComponent },
      { path: 'sub-agencies', component: ManagerSubAgenciesComponent },
      { path: 'sub-agencies/:id', component: ManagerSubAgencyDetailsComponent },
      { path: 'agents', component: ManagerAgentsComponent },
      { path: 'agents/:id', component: ManagerAgentDetailsComponent },
      { path: 'transfers', component: ManagerTransfersComponent },
      { path: 'transfers/:id', component: ManagerTransferDetailsComponent },
      { path: 'validations', component: ManagerValidationsComponent },
      { path: 'cash', component: ManagerCashSupervisionComponent },
      { path: 'cash/closures/:id', component: ManagerCashClosureDetailsComponent },
      { path: 'reports', component: ManagerReportsComponent },
      { path: 'alerts', component: ManagerAlertsComponent },
      { path: 'audit-log', component: ManagerAuditLogComponent },
      { path: 'profile', component: ManagerProfileComponent }
    ]
  }
];
```

---

## 5. Shared UI Requirements for All Manager Pages

Every manager page must include:

1. Page title.
2. Short description under the title.
3. Main content card.
4. Loading state.
5. Empty state.
6. Error state.
7. Refresh button when useful.
8. Pagination for long tables.
9. Search input for tables.
10. Filters where needed.
11. Clear action buttons.
12. Responsive design.

### 5.1 Loading state

Show skeleton cards or spinner while the API is loading.

### 5.2 Empty state

Example:

```text
No transfers found for the selected filters.
```

### 5.3 Error state

Example:

```text
Unable to load manager transfers. Please try again.
```

### 5.4 Date format

Use one consistent date format:

```text
DD/MM/YYYY HH:mm
```

### 5.5 Currency format

Use formatted values:

```text
12,500.00 MAD
850.00 EUR
```

---

## 6. Page 1 — Manager Overview

### 6.1 Route

```http
/manager/overview
```

### 6.2 Objective

The overview page gives the manager a quick picture of the operational situation of all sub-agencies under his/her supervision.

### 6.3 UI elements

Add the following cards at the top:

1. **Total Transfers Today**
2. **Amount Sent Today**
3. **Amount Paid Today**
4. **Transfer Fees Collected**
5. **Pending Validations**
6. **Active Agents**
7. **Active Sub-Agencies**
8. **Open Alerts**

### 6.4 Charts

Add these charts:

1. Transfers by day for the last 7 days.
2. Transfers by sub-agency.
3. Status distribution: pending, paid, cancelled, expired.
4. Commission / fee evolution.

### 6.5 Tables

Add two tables:

#### Recent transfers table

Columns:

- Reference
- Sender
- Beneficiary
- Sub-agency
- Amount
- Status
- Created at
- Action: View

#### Latest alerts table

Columns:

- Type
- Severity
- Sub-agency
- Message
- Created at
- Action: View

### 6.6 Endpoint

```http
GET /api/manager/dashboard/overview
```

### 6.7 Expected response

```json
{
  "summary": {
    "totalTransfersToday": 42,
    "amountSentToday": 125000.00,
    "amountPaidToday": 98000.00,
    "transferFeesCollected": 3200.00,
    "pendingValidations": 6,
    "activeAgents": 18,
    "activeSubAgencies": 4,
    "openAlerts": 3,
    "currency": "MAD"
  },
  "charts": {
    "transfersLast7Days": [
      { "date": "2026-06-09", "count": 10, "amount": 24000.00 },
      { "date": "2026-06-10", "count": 12, "amount": 31500.00 }
    ],
    "transfersBySubAgency": [
      { "subAgencyId": 1, "subAgencyName": "Sous-Agence 1", "count": 16, "amount": 45000.00 },
      { "subAgencyId": 2, "subAgencyName": "Sous-Agence 2", "count": 13, "amount": 38000.00 }
    ],
    "statusDistribution": [
      { "status": "PENDING", "count": 12 },
      { "status": "PAID", "count": 25 },
      { "status": "CANCELLED", "count": 3 },
      { "status": "EXPIRED", "count": 2 }
    ],
    "feesEvolution": [
      { "date": "2026-06-09", "fees": 650.00 },
      { "date": "2026-06-10", "fees": 780.00 }
    ]
  },
  "recentTransfers": [],
  "latestAlerts": []
}
```

### 6.8 Implementation steps

1. Create `ManagerOverviewComponent`.
2. Create `ManagerDashboardService`.
3. Add method `getOverview()`.
4. Connect the component to `/api/manager/dashboard/overview`.
5. Render summary cards.
6. Render charts using Chart.js or the existing chart library.
7. Render recent transfers table.
8. Render latest alerts table.
9. Add loading, empty, and error states.
10. Test with a valid `ROLE_MANAGER` account.

---

## 7. Page 2 — Sub-Agencies

### 7.1 Route

```http
/manager/sub-agencies
```

### 7.2 Objective

Allow the manager to supervise all sub-agencies attached to his/her central agency.

### 7.3 UI elements

Top filters:

- Search by sub-agency name.
- Filter by country.
- Filter by status: active, suspended, inactive.
- Filter by city.

Main table columns:

- Sub-agency name
- Code
- Country
- City
- Address
- Status
- Daily ceiling
- Today transferred amount
- Number of agents
- Created at
- Actions

Actions:

- View details
- View agents
- View transfers
- View cash

### 7.4 Endpoints

#### List sub-agencies

```http
GET /api/manager/sub-agencies?page=0&size=10&search=&country=&status=&city=
```

Expected response:

```json
{
  "content": [
    {
      "id": 1,
      "name": "Sous-Agence 1",
      "code": "SA-001",
      "country": "Morocco",
      "city": "Marrakech",
      "address": "Rue Exemple",
      "status": "ACTIVE",
      "dailyCeiling": 100000.00,
      "todayTransferredAmount": 43000.00,
      "agentCount": 5,
      "createdAt": "2026-06-10T10:30:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1
}
```

#### Get sub-agency details

```http
GET /api/manager/sub-agencies/{subAgencyId}
```

#### Get sub-agency performance

```http
GET /api/manager/sub-agencies/{subAgencyId}/performance?from=2026-06-01&to=2026-06-30
```

### 7.5 Details page route

```http
/manager/sub-agencies/:id
```

### 7.6 Details page elements

Show:

- General information card.
- Daily ceiling card.
- Today activity card.
- Agents list preview.
- Transfers list preview.
- Cash balance preview.
- Performance chart.

### 7.7 Implementation steps

1. Create `ManagerSubAgenciesComponent`.
2. Create `ManagerSubAgencyDetailsComponent`.
3. Add methods in `ManagerSubAgencyService`:
   - `getSubAgencies(params)`
   - `getSubAgencyById(id)`
   - `getSubAgencyPerformance(id, from, to)`
4. Build the filters.
5. Connect filters to the API query params.
6. Add pagination.
7. Add actions that navigate to details, agents, transfers, and cash pages.
8. Test that the manager only sees assigned sub-agencies.

---

## 8. Page 3 — Agents

### 8.1 Route

```http
/manager/agents
```

### 8.2 Objective

Allow the manager to supervise agents working inside his/her sub-agencies.

### 8.3 UI elements

Top filters:

- Search by name, email, phone.
- Filter by sub-agency.
- Filter by status.
- Filter by activity level.

Main table columns:

- Full name
- Email
- Phone
- Sub-agency
- Status
- Transfers today
- Amount handled today
- Last login
- Actions

Actions:

- View details
- View transfers
- Activate / deactivate agent
- Reset password request if supported

### 8.4 Endpoints

#### List agents

```http
GET /api/manager/agents?page=0&size=10&search=&subAgencyId=&status=
```

#### Get agent details

```http
GET /api/manager/agents/{agentId}
```

#### Activate agent

```http
PATCH /api/manager/agents/{agentId}/activate
```

#### Deactivate agent

```http
PATCH /api/manager/agents/{agentId}/deactivate
```

#### Agent activity

```http
GET /api/manager/agents/{agentId}/activity?from=2026-06-01&to=2026-06-30
```

### 8.5 Expected list response

```json
{
  "content": [
    {
      "id": 12,
      "fullName": "Agent Example",
      "email": "agent@example.com",
      "phone": "+212600000000",
      "subAgencyId": 1,
      "subAgencyName": "Sous-Agence 1",
      "status": "ACTIVE",
      "transfersToday": 8,
      "amountHandledToday": 21500.00,
      "lastLoginAt": "2026-06-15T09:45:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1
}
```

### 8.6 Implementation steps

1. Create `ManagerAgentsComponent`.
2. Create `ManagerAgentDetailsComponent`.
3. Create `ManagerAgentService`.
4. Implement list, details, activate, deactivate, and activity endpoints.
5. Add confirmation modal before deactivate.
6. Refresh table after status update.
7. Add success and error toast notifications.
8. Ensure the manager cannot activate/deactivate agents outside assigned sub-agencies.

---

## 9. Page 4 — Transfers

### 9.1 Route

```http
/manager/transfers
```

### 9.2 Objective

Allow the manager to monitor all transfers created, paid, cancelled, or expired inside supervised sub-agencies.

### 9.3 UI elements

Top filters:

- Search by reference/code.
- Search by sender name.
- Search by beneficiary name.
- Filter by sub-agency.
- Filter by agent.
- Filter by status.
- Filter by date range.
- Filter by corridor: origin country → destination country.
- Filter by amount range.

Main table columns:

- Reference
- Withdrawal code masked
- Sender
- Beneficiary
- Origin country
- Destination country
- Sub-agency
- Agent
- Amount sent
- Transfer fee
- Amount received
- Status
- Created at
- Actions

Actions:

- View details
- View receipt
- View audit history
- Request cancellation if allowed

### 9.4 Endpoints

#### List transfers

```http
GET /api/manager/transfers?page=0&size=10&reference=&sender=&beneficiary=&subAgencyId=&agentId=&status=&from=&to=&originCountry=&destinationCountry=&minAmount=&maxAmount=
```

#### Get transfer details

```http
GET /api/manager/transfers/{transferId}
```

#### Get transfer audit history

```http
GET /api/manager/transfers/{transferId}/audit
```

#### Download transfer receipt

```http
GET /api/manager/transfers/{transferId}/receipt
```

### 9.5 Expected list response

```json
{
  "content": [
    {
      "id": 1001,
      "reference": "TRX-20260615-0001",
      "withdrawalCodeMasked": "AB****89",
      "senderFullName": "Sender Example",
      "beneficiaryFullName": "Beneficiary Example",
      "originCountry": "Morocco",
      "destinationCountry": "Senegal",
      "subAgencyName": "Sous-Agence 1",
      "agentFullName": "Agent Example",
      "amountSent": 1000.00,
      "transferFee": 45.00,
      "amountReceived": 955.00,
      "currency": "MAD",
      "status": "PENDING",
      "createdAt": "2026-06-15T10:00:00"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1
}
```

### 9.6 Transfer details page

Route:

```http
/manager/transfers/:id
```

Show sections:

1. Transfer summary.
2. Sender information.
3. Beneficiary information.
4. Payment information.
5. Fees and commission breakdown.
6. Status timeline.
7. Agent and sub-agency information.
8. Audit history.

### 9.7 Implementation steps

1. Create `ManagerTransfersComponent`.
2. Create `ManagerTransferDetailsComponent`.
3. Create `ManagerTransferService`.
4. Implement filters with query params.
5. Implement paginated table.
6. Implement details page.
7. Mask the withdrawal code in list view.
8. Do not expose full withdrawal code unless the backend already allows it safely.
9. Add receipt download action.
10. Add audit history section.

---

## 10. Page 5 — Pending Validations

### 10.1 Route

```http
/manager/validations
```

### 10.2 Objective

Allow the manager to validate or reject sensitive operations.

Sensitive operations may include:

- High amount transfer.
- Transfer cancellation request.
- Daily ceiling exceeded.
- Suspicious beneficiary match.
- Cash discrepancy.
- Manual correction request.
- Agent account deactivation request.

### 10.3 UI elements

Top cards:

- Total pending validations
- High priority validations
- Approved today
- Rejected today

Filters:

- Validation type.
- Priority.
- Sub-agency.
- Requested by.
- Date range.

Main table columns:

- Request ID
- Type
- Priority
- Sub-agency
- Requested by
- Related transfer/reference
- Reason
- Status
- Created at
- Actions

Actions:

- View details
- Approve
- Reject

### 10.4 Endpoints

#### Count validations

```http
GET /api/manager/validations/count
```

#### List validations

```http
GET /api/manager/validations?page=0&size=10&type=&priority=&subAgencyId=&status=PENDING&from=&to=
```

#### Get validation details

```http
GET /api/manager/validations/{validationId}
```

#### Approve validation

```http
POST /api/manager/validations/{validationId}/approve
Content-Type: application/json
```

Request body:

```json
{
  "comment": "Approved after identity and ceiling verification."
}
```

#### Reject validation

```http
POST /api/manager/validations/{validationId}/reject
Content-Type: application/json
```

Request body:

```json
{
  "reason": "Insufficient justification for exceeding daily ceiling."
}
```

### 10.5 Expected validation item

```json
{
  "id": 501,
  "type": "HIGH_AMOUNT_TRANSFER",
  "priority": "HIGH",
  "subAgencyName": "Sous-Agence 1",
  "requestedBy": "Agent Example",
  "relatedReference": "TRX-20260615-0001",
  "reason": "Transfer amount exceeds configured threshold.",
  "status": "PENDING",
  "createdAt": "2026-06-15T11:20:00"
}
```

### 10.6 Implementation steps

1. Create `ManagerValidationsComponent`.
2. Create `ManagerValidationService`.
3. Add validation count endpoint for sidebar badge.
4. Add validations table.
5. Add details modal or details panel.
6. Add approve button with comment modal.
7. Add reject button with reason modal.
8. Refresh count and table after approve/reject.
9. Add audit logging on backend for every approval/rejection.
10. Block approve/reject buttons when request is no longer pending.

---

## 11. Page 6 — Cash Supervision

### 11.1 Route

```http
/manager/cash
```

### 11.2 Objective

Allow the manager to supervise cash balances and daily cash closures of all sub-agencies.

### 11.3 UI elements

Top cards:

- Total cash balance across sub-agencies
- Total cash in
- Total cash out
- Open cash discrepancies
- Pending daily closures

Filters:

- Sub-agency.
- Date.
- Closure status.
- Has discrepancy: yes/no.

Main table columns:

- Sub-agency
- Opening balance
- Cash in
- Cash out
- Expected closing balance
- Declared closing balance
- Difference
- Closure status
- Closed by
- Closed at
- Actions

Actions:

- View closure details
- Validate closure
- Reject closure
- View discrepancy

### 11.4 Endpoints

#### Cash overview

```http
GET /api/manager/cash/overview?date=2026-06-15
```

#### Cash closures

```http
GET /api/manager/cash/closures?page=0&size=10&subAgencyId=&date=&status=&hasDiscrepancy=
```

#### Closure details

```http
GET /api/manager/cash/closures/{closureId}
```

#### Validate closure

```http
POST /api/manager/cash/closures/{closureId}/validate
```

Request body:

```json
{
  "comment": "Closure verified and accepted."
}
```

#### Reject closure

```http
POST /api/manager/cash/closures/{closureId}/reject
```

Request body:

```json
{
  "reason": "Declared closing balance does not match expected balance."
}
```

### 11.5 Implementation steps

1. Create `ManagerCashSupervisionComponent`.
2. Create `ManagerCashClosureDetailsComponent`.
3. Create `ManagerCashService`.
4. Render top cash summary cards.
5. Render closure table.
6. Highlight negative differences in the table.
7. Add validate/reject modals.
8. Refresh data after action.
9. Ensure cash operations are read-only except validation/rejection of closures.

---

## 12. Page 7 — Reports

### 12.1 Route

```http
/manager/reports
```

### 12.2 Objective

Allow the manager to generate and export reports for his/her sub-agencies.

### 12.3 Report types

Add report selector with these options:

1. Transfers report.
2. Fees and commissions report.
3. Sub-agency performance report.
4. Agent performance report.
5. Cash closure report.
6. Alerts and anomalies report.

### 12.4 Filters

- Date range.
- Sub-agency.
- Agent.
- Currency.
- Status.
- Corridor.

### 12.5 UI elements

- Report type selector.
- Filter form.
- Generate button.
- Export PDF button.
- Export CSV button.
- Summary cards.
- Result table.
- Chart preview when relevant.

### 12.6 Endpoints

#### Generate report preview

```http
GET /api/manager/reports/preview?type=TRANSFERS&from=2026-06-01&to=2026-06-30&subAgencyId=&agentId=&currency=&status=&originCountry=&destinationCountry=
```

#### Export PDF

```http
GET /api/manager/reports/export/pdf?type=TRANSFERS&from=2026-06-01&to=2026-06-30&subAgencyId=&agentId=&currency=&status=&originCountry=&destinationCountry=
```

#### Export CSV

```http
GET /api/manager/reports/export/csv?type=TRANSFERS&from=2026-06-01&to=2026-06-30&subAgencyId=&agentId=&currency=&status=&originCountry=&destinationCountry=
```

### 12.7 Expected report preview response

```json
{
  "type": "TRANSFERS",
  "period": {
    "from": "2026-06-01",
    "to": "2026-06-30"
  },
  "summary": {
    "totalTransfers": 320,
    "totalAmountSent": 875000.00,
    "totalAmountPaid": 740000.00,
    "totalFees": 22500.00,
    "currency": "MAD"
  },
  "rows": [],
  "charts": []
}
```

### 12.8 Implementation steps

1. Create `ManagerReportsComponent`.
2. Create `ManagerReportService`.
3. Build report type selector.
4. Build filter form.
5. Call preview endpoint only after clicking Generate.
6. Display summary and rows.
7. Implement PDF and CSV export.
8. Disable export buttons until a report is generated.
9. Show message when no rows are found.

---

## 13. Page 8 — Alerts & Anomalies

### 13.1 Route

```http
/manager/alerts
```

### 13.2 Objective

Allow the manager to monitor and resolve alerts related to supervised sub-agencies.

Alert examples:

- Daily ceiling exceeded.
- Repeated failed withdrawal code attempts.
- Suspicious transfer amount.
- Suspicious beneficiary.
- Cash difference detected.
- Agent repeated errors.
- Transfer blocked.

### 13.3 UI elements

Top cards:

- Open alerts
- Critical alerts
- Resolved today
- Alerts this week

Filters:

- Severity: low, medium, high, critical.
- Type.
- Sub-agency.
- Status: open, in review, resolved, dismissed.
- Date range.

Main table columns:

- Alert ID
- Type
- Severity
- Sub-agency
- Related reference
- Message
- Status
- Created at
- Actions

Actions:

- View details
- Mark as in review
- Resolve
- Dismiss

### 13.4 Endpoints

#### Count unresolved alerts

```http
GET /api/manager/alerts/unresolved/count
```

#### List alerts

```http
GET /api/manager/alerts?page=0&size=10&type=&severity=&subAgencyId=&status=&from=&to=
```

#### Get alert details

```http
GET /api/manager/alerts/{alertId}
```

#### Mark alert in review

```http
POST /api/manager/alerts/{alertId}/review
```

#### Resolve alert

```http
POST /api/manager/alerts/{alertId}/resolve
```

Request body:

```json
{
  "resolutionComment": "Verified by manager. No further action required."
}
```

#### Dismiss alert

```http
POST /api/manager/alerts/{alertId}/dismiss
```

Request body:

```json
{
  "reason": "False positive after verification."
}
```

### 13.5 Implementation steps

1. Create `ManagerAlertsComponent`.
2. Create `ManagerAlertService`.
3. Add unresolved count for sidebar badge.
4. Render severity badges with different visual styles.
5. Add alert details modal.
6. Implement review, resolve, dismiss actions.
7. Require a comment for resolve and dismiss.
8. Refresh badge and table after action.
9. Add audit event for every alert action.

---

## 14. Page 9 — Audit Log

### 14.1 Route

```http
/manager/audit-log
```

### 14.2 Objective

Allow the manager to consult audit logs related only to his/her agency scope.

### 14.3 UI elements

Filters:

- Actor.
- Action type.
- Entity type.
- Sub-agency.
- Date range.

Main table columns:

- Date
- Actor
- Role
- Action
- Entity type
- Entity reference
- Sub-agency
- IP address
- Details

Actions:

- View details

### 14.4 Endpoint

```http
GET /api/manager/audit-log?page=0&size=10&actor=&action=&entityType=&subAgencyId=&from=&to=
```

### 14.5 Expected response

```json
{
  "content": [
    {
      "id": 9001,
      "createdAt": "2026-06-15T12:00:00",
      "actorFullName": "Manager Example",
      "actorRole": "ROLE_MANAGER",
      "action": "APPROVE_VALIDATION",
      "entityType": "VALIDATION_REQUEST",
      "entityReference": "VAL-501",
      "subAgencyName": "Sous-Agence 1",
      "ipAddress": "192.168.1.10",
      "details": "Manager approved high amount transfer validation."
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1
}
```

### 14.6 Implementation steps

1. Create `ManagerAuditLogComponent`.
2. Create `ManagerAuditService`.
3. Build filters.
4. Render paginated table.
5. Add details modal.
6. Make this page read-only.
7. Do not allow audit deletion or modification.

---

## 15. Page 10 — Profile

### 15.1 Route

```http
/manager/profile
```

### 15.2 Objective

Allow the manager to view and update basic profile information.

### 15.3 UI elements

Sections:

1. Personal information.
2. Assigned central agency information.
3. Security information.
4. Notification preferences.

Editable fields:

- First name
- Last name
- Phone
- Preferred language
- Notification preferences

Non-editable fields:

- Email
- Role
- Central agency
- Account status

### 15.4 Endpoints

#### Get profile

```http
GET /api/manager/profile
```

#### Update profile

```http
PUT /api/manager/profile
```

Request body:

```json
{
  "firstName": "Manager",
  "lastName": "Example",
  "phone": "+212600000000",
  "preferredLanguage": "fr",
  "emailNotificationsEnabled": true,
  "smsNotificationsEnabled": false
}
```

#### Change password

```http
POST /api/manager/profile/change-password
```

Request body:

```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newStrongPassword123!"
}
```

### 15.5 Implementation steps

1. Create `ManagerProfileComponent`.
2. Create `ManagerProfileService`.
3. Load current profile.
4. Build reactive form with validation.
5. Submit updates using PUT endpoint.
6. Add password change form.
7. Show success/error messages.
8. Never display passwords in logs or UI.

---

## 16. Suggested Angular Services

Create or update these services:

```text
manager/
├── services/
│   ├── manager-dashboard.service.ts
│   ├── manager-sub-agency.service.ts
│   ├── manager-agent.service.ts
│   ├── manager-transfer.service.ts
│   ├── manager-validation.service.ts
│   ├── manager-cash.service.ts
│   ├── manager-report.service.ts
│   ├── manager-alert.service.ts
│   ├── manager-audit.service.ts
│   └── manager-profile.service.ts
```

Each service must:

- use the existing HTTP interceptor;
- rely on JWT authentication;
- return typed `Observable<T>` responses;
- not hardcode tokens;
- centralize endpoint URLs;
- handle query params cleanly.

Example:

```ts
@Injectable({ providedIn: 'root' })
export class ManagerTransferService {
  private readonly baseUrl = `${environment.apiUrl}/api/manager/transfers`;

  constructor(private http: HttpClient) {}

  getTransfers(params: ManagerTransferFilter): Observable<PageResponse<ManagerTransferListItem>> {
    return this.http.get<PageResponse<ManagerTransferListItem>>(this.baseUrl, { params: this.toHttpParams(params) });
  }

  getTransferById(id: number): Observable<ManagerTransferDetails> {
    return this.http.get<ManagerTransferDetails>(`${this.baseUrl}/${id}`);
  }

  private toHttpParams(params: ManagerTransferFilter): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}
```

---

## 17. Suggested TypeScript Interfaces

```ts
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CountResponse {
  count: number;
}

export type TransferStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
export type AgencyStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type ValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AlertStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ManagerSubAgencyListItem {
  id: number;
  name: string;
  code: string;
  country: string;
  city: string;
  address: string;
  status: AgencyStatus;
  dailyCeiling: number;
  todayTransferredAmount: number;
  agentCount: number;
  createdAt: string;
}

export interface ManagerAgentListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  subAgencyId: number;
  subAgencyName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  transfersToday: number;
  amountHandledToday: number;
  lastLoginAt: string | null;
}

export interface ManagerTransferListItem {
  id: number;
  reference: string;
  withdrawalCodeMasked: string;
  senderFullName: string;
  beneficiaryFullName: string;
  originCountry: string;
  destinationCountry: string;
  subAgencyName: string;
  agentFullName: string;
  amountSent: number;
  transferFee: number;
  amountReceived: number;
  currency: string;
  status: TransferStatus;
  createdAt: string;
}
```

---

## 18. Backend Controller Structure

Create manager controllers under a clear package.

Suggested package:

```text
com.okanetransfer.web.manager
```

Suggested controllers:

```text
ManagerDashboardController
ManagerSubAgencyController
ManagerAgentController
ManagerTransferController
ManagerValidationController
ManagerCashController
ManagerReportController
ManagerAlertController
ManagerAuditController
ManagerProfileController
```

Each controller must:

- be protected by `ROLE_MANAGER`;
- use DTOs instead of exposing entities directly;
- validate input using Jakarta Validation;
- use service layer methods;
- return clean HTTP responses;
- return paginated results for tables;
- apply manager scope restriction.

Example:

```java
@RestController
@RequestMapping("/api/manager/transfers")
@PreAuthorize("hasRole('MANAGER')")
public class ManagerTransferController {

    private final ManagerTransferService managerTransferService;

    public ManagerTransferController(ManagerTransferService managerTransferService) {
        this.managerTransferService = managerTransferService;
    }

    @GetMapping
    public Page<ManagerTransferListDto> findTransfers(
            ManagerTransferFilter filter,
            Pageable pageable,
            Authentication authentication
    ) {
        return managerTransferService.findTransfersForManager(authentication.getName(), filter, pageable);
    }

    @GetMapping("/{id}")
    public ManagerTransferDetailsDto getTransferDetails(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return managerTransferService.getTransferDetailsForManager(authentication.getName(), id);
    }
}
```

---

## 19. Backend Security Scope Rule

Every manager service method must start by resolving the manager agency scope.

Pseudo-logic:

```java
Manager manager = managerRepository.findByUserEmail(currentUserEmail)
    .orElseThrow(() -> new AccessDeniedException("Manager profile not found"));

Agency centralAgency = manager.getCentralAgency();
List<Long> allowedSubAgencyIds = agencyRepository.findSubAgencyIdsByCentralAgencyId(centralAgency.getId());
```

Then every query must filter by `allowedSubAgencyIds`.

Bad:

```java
transferRepository.findAll(pageable);
```

Good:

```java
transferRepository.findBySubAgencyIdIn(allowedSubAgencyIds, filter, pageable);
```

If the manager tries to access data outside his/her scope, return:

```http
403 Forbidden
```

---

## 20. Endpoint Summary

### Dashboard

```http
GET /api/manager/dashboard/overview
```

### Sub-agencies

```http
GET /api/manager/sub-agencies
GET /api/manager/sub-agencies/{subAgencyId}
GET /api/manager/sub-agencies/{subAgencyId}/performance
```

### Agents

```http
GET /api/manager/agents
GET /api/manager/agents/{agentId}
PATCH /api/manager/agents/{agentId}/activate
PATCH /api/manager/agents/{agentId}/deactivate
GET /api/manager/agents/{agentId}/activity
```

### Transfers

```http
GET /api/manager/transfers
GET /api/manager/transfers/{transferId}
GET /api/manager/transfers/{transferId}/audit
GET /api/manager/transfers/{transferId}/receipt
```

### Validations

```http
GET /api/manager/validations/count
GET /api/manager/validations
GET /api/manager/validations/{validationId}
POST /api/manager/validations/{validationId}/approve
POST /api/manager/validations/{validationId}/reject
```

### Cash

```http
GET /api/manager/cash/overview
GET /api/manager/cash/closures
GET /api/manager/cash/closures/{closureId}
POST /api/manager/cash/closures/{closureId}/validate
POST /api/manager/cash/closures/{closureId}/reject
```

### Reports

```http
GET /api/manager/reports/preview
GET /api/manager/reports/export/pdf
GET /api/manager/reports/export/csv
```

### Alerts

```http
GET /api/manager/alerts/unresolved/count
GET /api/manager/alerts
GET /api/manager/alerts/{alertId}
POST /api/manager/alerts/{alertId}/review
POST /api/manager/alerts/{alertId}/resolve
POST /api/manager/alerts/{alertId}/dismiss
```

### Audit

```http
GET /api/manager/audit-log
```

### Profile

```http
GET /api/manager/profile
PUT /api/manager/profile
POST /api/manager/profile/change-password
```

---

## 21. Step-by-Step Execution Plan for AI Agent

The AI agent must follow this order exactly.

### Step 1 — Inspect the existing project

Before coding:

1. Inspect existing Angular routing.
2. Inspect existing sidebar layout.
3. Inspect existing role guard.
4. Inspect existing auth service.
5. Inspect existing HTTP interceptor.
6. Inspect existing table/card/modal components.
7. Inspect existing backend controller style.
8. Inspect existing DTO naming convention.
9. Inspect existing security annotations.
10. Inspect existing pagination format.

Do not create new conventions if the project already has conventions.

### Step 2 — Add manager sidebar items

1. Locate current sidebar configuration.
2. Add manager menu items only for `ROLE_MANAGER`.
3. Add active route highlighting.
4. Add optional badge support for validations and alerts.
5. Test sidebar with manager account.
6. Ensure admin/agent/client sidebar items are not affected.

### Step 3 — Add manager route module

1. Create manager route file if it does not exist.
2. Register `/manager` routes.
3. Protect all routes with auth and role guard.
4. Redirect `/manager` to `/manager/overview`.
5. Create placeholder components first.
6. Test navigation for every sidebar item.

### Step 4 — Create shared manager models

1. Create interfaces for page response.
2. Create interfaces for count response.
3. Create enums/types for statuses.
4. Create interfaces for sub-agency, agent, transfer, validation, cash, report, alert, audit, and profile.
5. Ensure all services use typed responses.

### Step 5 — Implement Overview page

1. Backend: create `/api/manager/dashboard/overview`.
2. Frontend: create service method `getOverview()`.
3. Render summary cards.
4. Render charts.
5. Render recent transfers.
6. Render latest alerts.
7. Add loading/error/empty states.
8. Validate data scope.

### Step 6 — Implement Sub-Agencies page

1. Backend: implement list, details, performance endpoints.
2. Frontend: implement sub-agencies table.
3. Add filters.
4. Add pagination.
5. Add details page.
6. Add navigation actions.
7. Test manager cannot see external sub-agencies.

### Step 7 — Implement Agents page

1. Backend: implement agents list/details/activity.
2. Backend: implement activate/deactivate if allowed.
3. Frontend: implement agent table.
4. Add sub-agency filter.
5. Add status actions.
6. Add confirmation modal.
7. Test scope restriction.

### Step 8 — Implement Transfers page

1. Backend: implement filtered transfers endpoint.
2. Backend: implement details, receipt, audit endpoints.
3. Frontend: implement transfer filters.
4. Frontend: implement transfer table.
5. Frontend: implement transfer details page.
6. Mask withdrawal code.
7. Add receipt download.
8. Test all statuses.

### Step 9 — Implement Pending Validations page

1. Backend: implement count endpoint.
2. Backend: implement validation list/details.
3. Backend: implement approve/reject.
4. Backend: audit every decision.
5. Frontend: implement validations table.
6. Frontend: implement approve/reject modals.
7. Frontend: refresh badge after action.
8. Test high amount transfer validation scenario.

### Step 10 — Implement Cash Supervision page

1. Backend: implement cash overview.
2. Backend: implement closure list/details.
3. Backend: implement validate/reject closure.
4. Frontend: implement cash cards.
5. Frontend: implement closure table.
6. Highlight discrepancies.
7. Add action modals.
8. Test closure with and without discrepancy.

### Step 11 — Implement Reports page

1. Backend: implement preview endpoint.
2. Backend: implement PDF export.
3. Backend: implement CSV export.
4. Frontend: implement report type selector.
5. Frontend: implement filters.
6. Frontend: implement Generate button.
7. Frontend: implement export buttons.
8. Test reports for each type.

### Step 12 — Implement Alerts page

1. Backend: implement unresolved count.
2. Backend: implement alerts list/details.
3. Backend: implement review/resolve/dismiss.
4. Backend: audit every action.
5. Frontend: implement alert table.
6. Frontend: implement severity badges.
7. Frontend: implement action modals.
8. Refresh sidebar badge after action.

### Step 13 — Implement Audit Log page

1. Backend: implement scoped audit log endpoint.
2. Frontend: implement filters.
3. Frontend: implement paginated table.
4. Add details modal.
5. Keep page read-only.
6. Test that audit logs are scoped to manager sub-agencies.

### Step 14 — Implement Profile page

1. Backend: implement get profile.
2. Backend: implement update profile.
3. Backend: implement change password.
4. Frontend: build profile form.
5. Frontend: build password form.
6. Add validation.
7. Add success/error messages.

### Step 15 — Final integration testing

Test the full flow:

1. Login as manager.
2. Verify sidebar items.
3. Open overview.
4. Open sub-agencies.
5. Open agents.
6. Open transfers.
7. Approve a validation.
8. Reject a validation.
9. Validate a cash closure.
10. Resolve an alert.
11. Generate a report.
12. Export PDF.
13. Export CSV.
14. Check audit log.
15. Update profile.
16. Logout.

### Step 16 — Security testing

Test:

1. Manager cannot access admin dashboard.
2. Manager cannot access another manager's agencies.
3. Agent cannot access manager dashboard.
4. Client cannot access manager dashboard.
5. Unauthenticated user is redirected to login.
6. Invalid token is rejected.
7. Expired token is handled correctly.

---

## 22. Acceptance Criteria

The implementation is complete only if:

1. The manager sidebar appears only for `ROLE_MANAGER`.
2. Every sidebar item opens a working page.
3. Every page has loading, empty, and error states.
4. Every table has pagination.
5. Important tables have filters.
6. Dashboard cards display real backend data.
7. Pending validations badge works.
8. Alerts badge works.
9. Manager data is scoped to assigned sub-agencies.
10. Manager cannot access admin-only data.
11. Approve/reject actions create audit logs.
12. Cash validation/rejection works.
13. Reports can be previewed and exported.
14. Profile update works.
15. Swagger documents all manager endpoints.
16. UI is responsive.
17. No secrets are hardcoded.
18. No fake/mock data remains in production mode.

---

## 23. Final Prompt to Give to the AI Coding Agent

Use this exact prompt:

```text
You are working on the Okane Transfer project. Implement the Manager Dashboard module step by step.

Context:
- The application already has a sidebar layout. Do not rebuild the global layout.
- The manager role is ROLE_MANAGER.
- The Manager of the Central Agency supervises all attached sub-agencies, their agents, transfers, cash closures, validations, reports, alerts, and audit logs.
- The manager must only see data within his/her assigned agency scope.
- Do not use admin endpoints for manager pages.
- Use Angular for the frontend and Spring MVC/Spring Security/JPA for the backend according to the existing project conventions.

First inspect the existing project structure before coding:
1. Existing Angular routing.
2. Existing sidebar configuration.
3. Existing auth guard and role guard.
4. Existing HTTP interceptor.
5. Existing table/card/modal components.
6. Existing backend controller/service/repository style.
7. Existing security annotations.
8. Existing pagination format.

Then implement the manager module in this exact order:
1. Add manager sidebar items: Overview, Sub-Agencies, Agents, Transfers, Pending Validations, Cash Supervision, Reports, Alerts & Anomalies, Audit Log, Profile.
2. Add /manager routes protected by ROLE_MANAGER.
3. Create shared manager TypeScript interfaces and services.
4. Implement Manager Overview page using GET /api/manager/dashboard/overview.
5. Implement Sub-Agencies page using /api/manager/sub-agencies endpoints.
6. Implement Agents page using /api/manager/agents endpoints.
7. Implement Transfers page using /api/manager/transfers endpoints.
8. Implement Pending Validations page using /api/manager/validations endpoints.
9. Implement Cash Supervision page using /api/manager/cash endpoints.
10. Implement Reports page using /api/manager/reports endpoints.
11. Implement Alerts & Anomalies page using /api/manager/alerts endpoints.
12. Implement Audit Log page using /api/manager/audit-log.
13. Implement Profile page using /api/manager/profile endpoints.
14. Add loading, empty, error, pagination, filters, and toast notifications to every page.
15. Add security scope checks in backend services so the manager only accesses assigned sub-agencies.
16. Add audit logs for every sensitive action: approve validation, reject validation, validate cash closure, reject cash closure, resolve alert, dismiss alert.
17. Test all manager pages with a ROLE_MANAGER account.
18. Test that ROLE_AGENT, ROLE_CLIENT, and unauthenticated users cannot access manager pages.
19. Test that the manager cannot access data belonging to another central agency.
20. Update Swagger/OpenAPI documentation for all manager endpoints.

Do not move to the next page until the current page is functional, connected to backend endpoints, protected by role guard, and tested.
```

---

## 24. Recommended Page Priority

If there is limited time, implement in this priority order:

1. Manager Overview
2. Sub-Agencies
3. Agents
4. Transfers
5. Pending Validations
6. Cash Supervision
7. Reports
8. Alerts
9. Audit Log
10. Profile

Minimum acceptable manager dashboard for demo:

1. Sidebar manager items.
2. Overview cards.
3. Sub-agencies list.
4. Agents list.
5. Transfers list.
6. Pending validations approve/reject.
7. Basic reports preview.
