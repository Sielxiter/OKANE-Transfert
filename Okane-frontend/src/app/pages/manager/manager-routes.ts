import { Routes } from '@angular/router';
import { ManagerLayoutComponent } from './manager-layout.component';
import { ManagerDashboardPageComponent } from '../../features/manager/dashboard/manager-dashboard-page.component';
import { ManagerSubAgenciesPageComponent } from '../../features/manager/subagencies/subagencies-page.component';
import { ManagerSubAgencyDetailsComponent } from '../../features/manager/subagencies/subagency-details.component';
import { ManagerAgentsPageComponent } from '../../features/manager/agents/agents-page.component';
import { ManagerTransfersPageComponent } from '../../features/manager/transfers/transfers-page.component';
import { ManagerValidationsPageComponent } from '../../features/manager/validations/validations-page.component';
import { ManagerCashPageComponent } from '../../features/manager/cash/cash-page.component';
import { ManagerReportsPageComponent } from '../../features/manager/reports/reports-page.component';
import { ManagerAlertsPageComponent } from '../../features/manager/alerts/alerts-page.component';
import { ManagerAuditPageComponent } from '../../features/manager/audit/audit-page.component';
import { ManagerProfilePageComponent } from '../../features/manager/profile/profile-page.component';
import { authGuard } from '../../core/auth/auth.guard';

export const MANAGER_ROUTES: Routes = [
  {
    path: 'manager',
    component: ManagerLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'dashboard', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: ManagerDashboardPageComponent, data: { title: 'Tableau de bord Manager' } },
      { path: 'sub-agencies', component: ManagerSubAgenciesPageComponent, data: { title: 'Sous-Agences' } },
      { path: 'sub-agencies/:id', component: ManagerSubAgencyDetailsComponent, data: { title: 'Details Sous-Agence' } },
      { path: 'agents', component: ManagerAgentsPageComponent, data: { title: 'Agents' } },
      { path: 'transfers', component: ManagerTransfersPageComponent, data: { title: 'Transferts' } },
      { path: 'validations', component: ManagerValidationsPageComponent, data: { title: 'Validations' } },
      { path: 'cash', component: ManagerCashPageComponent, data: { title: 'Supervision Caisse' } },
      { path: 'reports', component: ManagerReportsPageComponent, data: { title: 'Rapports' } },
      { path: 'alerts', component: ManagerAlertsPageComponent, data: { title: 'Alertes' } },
      { path: 'audit-log', component: ManagerAuditPageComponent, data: { title: "Journal d'audit" } },
      { path: 'profile', component: ManagerProfilePageComponent, data: { title: 'Profil' } },
    ],
  },
];
