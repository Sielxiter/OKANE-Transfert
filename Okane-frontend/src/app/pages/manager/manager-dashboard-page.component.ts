// src/app/pages/manager/manager-dashboard-page.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ManagerDashboardService } from '../../manager/services/manager-dashboard.service';

export interface ManagerDashboardData {
  agencyOpeningBalance: number; // ← MODIFIÉ
  agencyCurrentBalance: number; // ← AJOUTÉ
  todayTransfersCount: number;
  todayTransfersAmount: number;
  todayFeesAmount: number;
  agencyCommission: number;
  centralShare: number;
  pendingPayoutsCount: number;
  pendingPayoutsAmount: number;
  activeAgentsCount: number;
  totalAgentsCount: number;
  unresolvedDiscrepanciesCount: number;
}

@Component({
  selector: 'okane-manager-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p class="text-muted-foreground text-sm">Vue d'ensemble de votre agence</p>
        </div>
        <div class="text-right text-sm text-muted-foreground">
          Dernière mise à jour : {{ lastUpdate | date: 'HH:mm:ss' }}
        </div>
      </div>

      @if (loading) {
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="mb-2 text-lg font-semibold">Chargement...</div>
            <p class="text-sm text-muted-foreground">Récupération des données</p>
          </div>
        </div>
      } @else if (error) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <p class="font-semibold">Erreur</p>
          <p class="text-sm">{{ error }}</p>
          <button
            class="mt-2 rounded-md bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200"
            (click)="loadDashboard()"
          >
            Réessayer
          </button>
        </div>
      } @else {
        <!-- Cartes KPI principales -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Solde de l'agence - Version avec deux soldes -->
          <div
            class="rounded-lg border bg-background p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-muted-foreground">Solde de l'agence</span>
              <span class="mt-2 text-2xl font-bold">{{
                formatMoney(dashboardData?.agencyCurrentBalance, 'EUR')
              }}</span>
              <span class="mt-1 text-xs text-muted-foreground">
                Solde courant (ouverture:
                {{ formatMoney(dashboardData?.agencyOpeningBalance, 'EUR') }})
              </span>
              @if (
                (dashboardData?.agencyCurrentBalance || 0) !==
                (dashboardData?.agencyOpeningBalance || 0)
              ) {
                <span
                  class="mt-1 text-xs"
                  [class.text-emerald-600]="
                    (dashboardData?.agencyCurrentBalance || 0) >
                    (dashboardData?.agencyOpeningBalance || 0)
                  "
                  [class.text-rose-600]="
                    (dashboardData?.agencyCurrentBalance || 0) <
                    (dashboardData?.agencyOpeningBalance || 0)
                  "
                >
                  Variation:
                  {{
                    formatMoney(
                      (dashboardData?.agencyCurrentBalance || 0) -
                        (dashboardData?.agencyOpeningBalance || 0),
                      'EUR'
                    )
                  }}
                </span>
              }
            </div>
          </div>

          <!-- Transferts du jour -->
          <div
            class="rounded-lg border bg-background p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-muted-foreground">Transferts du jour</span>
              <span class="mt-2 text-2xl font-bold">{{
                dashboardData?.todayTransfersCount || 0
              }}</span>
              <span class="mt-1 text-xs text-muted-foreground"
                >{{ formatMoney(dashboardData?.todayTransfersAmount, 'EUR') }} de volume</span
              >
            </div>
          </div>

          <!-- Frais collectés -->
          <div
            class="rounded-lg border bg-background p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-muted-foreground">Frais collectés</span>
              <span class="mt-2 text-2xl font-bold">{{
                formatMoney(dashboardData?.todayFeesAmount, 'EUR')
              }}</span>
              <span class="mt-1 text-xs text-muted-foreground"
                >Commission agence: {{ formatMoney(dashboardData?.agencyCommission, 'EUR') }}</span
              >
            </div>
          </div>

          <!-- Paiements en attente -->
          <div
            class="rounded-lg border bg-background p-5 shadow-sm hover:shadow-md transition-shadow"
            [class.border-amber-200]="(dashboardData?.pendingPayoutsCount || 0) > 0"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-muted-foreground">Paiements en attente</span>
              <span
                class="mt-2 text-2xl font-bold"
                [class.text-amber-600]="(dashboardData?.pendingPayoutsCount || 0) > 0"
              >
                {{ dashboardData?.pendingPayoutsCount || 0 }}
              </span>
              <span class="mt-1 text-xs text-muted-foreground"
                >{{ formatMoney(dashboardData?.pendingPayoutsAmount, 'EUR') }} à payer</span
              >
            </div>
          </div>
        </div>

        <!-- Deuxième ligne -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Agents -->
          <div
            class="rounded-lg border bg-background p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-muted-foreground">Agents</span>
              <span class="mt-2 text-2xl font-bold"
                >{{ dashboardData?.activeAgentsCount || 0 }} /
                {{ dashboardData?.totalAgentsCount || 0 }}</span
              >
              <span class="mt-1 text-xs text-muted-foreground">Actifs / Total</span>
            </div>
          </div>

          <!-- Part Commission Agence -->
          <div
            class="rounded-lg border bg-background p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-muted-foreground">Commission agence</span>
              <span class="mt-2 text-2xl font-bold">{{
                formatMoney(dashboardData?.agencyCommission, 'EUR')
              }}</span>
              <span class="mt-1 text-xs text-muted-foreground">Part revenus de l'agence</span>
            </div>
          </div>

          <!-- Part Centrale -->
          <div
            class="rounded-lg border bg-background p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col">
              <span class="text-sm font-medium text-muted-foreground">Part centrale</span>
              <span class="mt-2 text-2xl font-bold">{{
                formatMoney(dashboardData?.centralShare, 'EUR')
              }}</span>
              <span class="mt-1 text-xs text-muted-foreground">Part reversée à la centrale</span>
            </div>
          </div>
        </div>

        <!-- Alerte écarts non résolus -->
        @if ((dashboardData?.unresolvedDiscrepanciesCount || 0) > 0) {
          <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-amber-800">Attention : Écarts de caisse</p>
                <p class="text-sm text-amber-700">
                  {{ dashboardData?.unresolvedDiscrepanciesCount }} écart(s) non résolu(s)
                  nécessite(nt) votre attention.
                </p>
              </div>
              <button
                class="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
                routerLink="/manager/cash-register"
              >
                Voir les écarts
              </button>
            </div>
          </div>
        }

        <!-- Section récapitulative -->
        <div class="rounded-lg border bg-background p-5 shadow-sm">
          <h3 class="mb-3 font-semibold">Récapitulatif du jour</h3>
          <div class="grid gap-3 text-sm sm:grid-cols-2">
            <div class="flex justify-between border-b pb-2">
              <span class="text-muted-foreground">Volume de transferts</span>
              <span class="font-medium">{{
                formatMoney(dashboardData?.todayTransfersAmount, 'EUR')
              }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
              <span class="text-muted-foreground">Frais générés</span>
              <span class="font-medium">{{
                formatMoney(dashboardData?.todayFeesAmount, 'EUR')
              }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
              <span class="text-muted-foreground">Revenu de l'agence</span>
              <span class="font-medium">{{
                formatMoney(dashboardData?.agencyCommission, 'EUR')
              }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
              <span class="text-muted-foreground">Nombre de transferts</span>
              <span class="font-medium">{{ dashboardData?.todayTransfersCount || 0 }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
              <span class="text-muted-foreground">Solde d'ouverture</span>
              <span class="font-medium">{{
                formatMoney(dashboardData?.agencyOpeningBalance, 'EUR')
              }}</span>
            </div>
            <div class="flex justify-between border-b pb-2">
              <span class="text-muted-foreground">Solde courant</span>
              <span class="font-medium">{{
                formatMoney(dashboardData?.agencyCurrentBalance, 'EUR')
              }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ManagerDashboardPageComponent implements OnInit, OnDestroy {
  private readonly _service = inject(ManagerDashboardService);
  private readonly _cdr = inject(ChangeDetectorRef);
  private refreshInterval: any;

  dashboardData: ManagerDashboardData | null = null;
  loading = false;
  error = '';
  lastUpdate: Date = new Date();

  ngOnInit(): void {
    this.loadDashboard();
    this.refreshInterval = setInterval(() => {
      this.loadDashboard(false);
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadDashboard(showLoading = true): void {
    if (showLoading) {
      this.loading = true;
    }
    this.error = '';

    this._service.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.lastUpdate = new Date();
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger les données';
        this.loading = false;
        this._cdr.markForCheck();
      },
    });
  }

  formatMoney(amount: number | undefined, currency: string): string {
    if (amount === undefined || amount === null) {
      return `0,00 ${currency}`;
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
