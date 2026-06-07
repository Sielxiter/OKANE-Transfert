import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { AgentDashboardPageComponent } from './pages/agent/agent-dashboard-page.component';
import { AgentNewTransferPageComponent } from './pages/agent/new-transfer-page.component';
import { AgentPayoutTransferPageComponent } from './pages/agent/payout-transfer-page.component';
import { AgentCustomersPageComponent } from './pages/agent/customers-page.component';
import { AgentCashRegisterPageComponent } from './pages/agent/cash-register-page.component';
import { AgentTransferHistoryPageComponent } from './pages/agent/transfer-history-page.component';
import { AgentKycVerificationPageComponent } from './pages/agent/kyc-verification-page.component';
import { AgentNotificationsPageComponent } from './pages/agent/notifications-page.component';
import { AgentSettingsPageComponent } from './pages/agent/settings-page.component';
import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { AdminPlaceholderPageComponent } from './pages/admin/admin-placeholder-page.component';
import { AdminDashboardPageComponent } from './features/admin/dashboard/admin-dashboard-page.component';
import { AdminUsersClientsPageComponent } from './features/admin/users/clients/clients-page.component';
import { AdminUsersAdminsPageComponent } from './features/admin/users/admins/admins-page.component';
import { AdminUsersManagersPageComponent } from './features/admin/users/managers/managers-page.component';
import { AdminUsersAgentsPageComponent } from './features/admin/users/agents/agents-page.component';
import { AdminAgenciesPageComponent } from './features/admin/agencies/agencies-page.component';
import { AdminTransfersPageComponent } from './features/admin/transfers/transfers-page.component';
import { AdminPaymentsPageComponent } from './features/admin/payments/payments-page.component';
import { AdminCurrencyPageComponent } from './features/admin/currency/currency-page.component';
import { AdminFeesPageComponent } from './features/admin/fees/fees-page.component';
import { AdminCompliancePageComponent } from './features/admin/compliance/compliance-page.component';
import { AdminReportsPageComponent } from './features/admin/reports/reports-page.component';
import { AdminAuditPageComponent } from './features/admin/audit/audit-page.component';
import { AdminSettingsPageComponent } from './features/admin/settings/settings-page.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardPageComponent },
      { path: 'users/clients', component: AdminUsersClientsPageComponent, data: { title: 'Utilisateurs - Clients' } },
      { path: 'users/admins', component: AdminUsersAdminsPageComponent, data: { title: 'Utilisateurs - Admins' } },
      { path: 'users/managers', component: AdminUsersManagersPageComponent, data: { title: 'Utilisateurs - Managers' } },
      { path: 'users/agents', component: AdminUsersAgentsPageComponent, data: { title: 'Utilisateurs - Agents' } },
      { path: 'agencies', component: AdminAgenciesPageComponent, data: { title: 'Agences' } },
      { path: 'transfers', component: AdminTransfersPageComponent, data: { title: 'Transferts' } },
      { path: 'payments', component: AdminPaymentsPageComponent, data: { title: 'Paiements' } },
      { path: 'currency', component: AdminCurrencyPageComponent, data: { title: 'Devises et change' } },
      { path: 'fees', component: AdminFeesPageComponent, data: { title: 'Frais et commissions' } },
      { path: 'compliance', component: AdminCompliancePageComponent, data: { title: 'Conformité / KYC' } },
      { path: 'reports', component: AdminReportsPageComponent, data: { title: 'Rapports' } },
      { path: 'audit', component: AdminAuditPageComponent, data: { title: "Journal d'audit" } },
      { path: 'settings', component: AdminSettingsPageComponent, data: { title: 'Paramètres' } },
    ],
  },
  { path: 'manager/dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: 'agent/dashboard', component: AgentDashboardPageComponent, canActivate: [authGuard] },
  { path: 'agent/new-transfer', component: AgentNewTransferPageComponent, canActivate: [authGuard] },
  { path: 'agent/payout-transfer', component: AgentPayoutTransferPageComponent, canActivate: [authGuard] },
  { path: 'agent/customers', component: AgentCustomersPageComponent, canActivate: [authGuard] },
  { path: 'agent/cash-register', component: AgentCashRegisterPageComponent, canActivate: [authGuard] },
  { path: 'agent/transfer-history', component: AgentTransferHistoryPageComponent, canActivate: [authGuard] },
  { path: 'agent/kyc-verification', component: AgentKycVerificationPageComponent, canActivate: [authGuard] },
  { path: 'agent/notifications', component: AgentNotificationsPageComponent, canActivate: [authGuard] },
  { path: 'agent/settings', component: AgentSettingsPageComponent, canActivate: [authGuard] },
  { path: 'client/dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
