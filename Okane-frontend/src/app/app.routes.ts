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

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: 'admin/dashboard', component: DashboardPageComponent },
  { path: 'manager/dashboard', component: DashboardPageComponent },
  { path: 'agent/dashboard', component: AgentDashboardPageComponent },
  { path: 'agent/new-transfer', component: AgentNewTransferPageComponent },
  { path: 'agent/payout-transfer', component: AgentPayoutTransferPageComponent },
  { path: 'agent/customers', component: AgentCustomersPageComponent },
  { path: 'agent/cash-register', component: AgentCashRegisterPageComponent },
  { path: 'agent/transfer-history', component: AgentTransferHistoryPageComponent },
  { path: 'agent/kyc-verification', component: AgentKycVerificationPageComponent },
  { path: 'agent/notifications', component: AgentNotificationsPageComponent },
  { path: 'agent/settings', component: AgentSettingsPageComponent },
  { path: 'client/dashboard', component: DashboardPageComponent },
  { path: '**', redirectTo: 'login' },
];
