import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { AgentLayoutShellComponent } from './agent/layout/agent-layout-shell.component';
import { AgentDashboardPageComponent } from './pages/agent/agent-dashboard-page.component';
import { AgentNewTransferPageComponent } from './pages/agent/new-transfer-page.component';
import { AgentPayoutTransferPageComponent } from './pages/agent/payout-transfer-page.component';
import { AgentCustomersPageComponent } from './pages/agent/customers-page.component';
import { AgentCashRegisterPageComponent } from './pages/agent/cash-register-page.component';
import { AgentTransferHistoryPageComponent } from './pages/agent/transfer-history-page.component';
import { AgentKycVerificationPageComponent } from './pages/agent/kyc-verification-page.component';
import { AgentNotificationsPageComponent } from './pages/agent/notifications-page.component';
import { AgentSettingsPageComponent } from './pages/agent/settings-page.component';
import { ManagerLayoutShellComponent } from './manager/layout/manager-layout-shell.component';
import { ManagerClientsPageComponent } from './pages/manager/manager-clients-page.component';
import { ManagerPaymentsPageComponent } from './pages/manager/manager-payments-page.component';
import { ManagerAgentsPageComponent } from './pages/manager/manager-agents-page.component';
import { ManagerDashboardPageComponent } from './pages/manager/manager-dashboard-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: 'admin/dashboard', component: DashboardPageComponent },
  {
    path: 'manager',
    component: ManagerLayoutShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: ManagerDashboardPageComponent,
        data: { pageTitle: 'Tableau de bord' },
      },
      { path: 'clients', component: ManagerClientsPageComponent, data: { pageTitle: 'Clients' } },
      {
        path: 'payments',
        component: ManagerPaymentsPageComponent,
        data: { pageTitle: 'Paiements' },
      },
      {
        path: 'agents',
        component: ManagerAgentsPageComponent,
        data: { pageTitle: 'Agents' },
      },
    ],
  },
  {
    path: 'agent',
    component: AgentLayoutShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: AgentDashboardPageComponent,
        data: { pageTitle: 'Tableau de bord' },
      },
      {
        path: 'new-transfer',
        component: AgentNewTransferPageComponent,
        data: { pageTitle: 'Nouvel envoi' },
      },
      {
        path: 'payout-transfer',
        component: AgentPayoutTransferPageComponent,
        data: { pageTitle: "Paiement d'un transfert" },
      },
      { path: 'customers', component: AgentCustomersPageComponent, data: { pageTitle: 'Clients' } },
      {
        path: 'cash-register',
        component: AgentCashRegisterPageComponent,
        data: { pageTitle: 'Gestion de caisse' },
      },
      {
        path: 'transfer-history',
        component: AgentTransferHistoryPageComponent,
        data: { pageTitle: 'Historique des transferts' },
      },
      {
        path: 'kyc-verification',
        component: AgentKycVerificationPageComponent,
        data: { pageTitle: 'Vérification KYC' },
      },
      {
        path: 'notifications',
        component: AgentNotificationsPageComponent,
        data: { pageTitle: 'Notifications' },
      },
      {
        path: 'settings',
        component: AgentSettingsPageComponent,
        data: { pageTitle: 'Paramètres' },
      },
    ],
  },
  { path: 'client/dashboard', component: DashboardPageComponent },
  { path: '**', redirectTo: 'login' },
];
