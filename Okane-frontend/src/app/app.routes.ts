import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: 'admin/dashboard', component: DashboardPageComponent },
  { path: 'manager/dashboard', component: DashboardPageComponent },
  { path: 'agent/dashboard', component: DashboardPageComponent },
  { path: 'client/dashboard', component: DashboardPageComponent },
  { path: '**', redirectTo: 'login' },
];
