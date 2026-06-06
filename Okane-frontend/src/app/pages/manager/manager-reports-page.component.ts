// src/app/pages/manager/manager-reports-page.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ManagerDashboardService } from '../../manager/services/manager-dashboard.service';
import {
  ManagerDailyReport,
  ManagerRevenueReport,
  ManagerTransferReportLine,
} from '../../manager/models/manager-dashboard.models';

type ReportTab = 'daily' | 'revenue';

@Component({
  selector: 'okane-manager-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Tabs -->
    <div class="flex gap-2 border-b pb-2">
      <button
        type="button"
        class="px-4 py-2 text-sm font-semibold transition"
        [class.border-b-2]="activeTab === 'daily'"
        [class.border-primary]="activeTab === 'daily'"
        [class.text-primary]="activeTab === 'daily'"
        [class.text-muted-foreground]="activeTab !== 'daily'"
        (click)="switchTab('daily')"
      >
        Rapport journalier
      </button>
      <button
        type="button"
        class="px-4 py-2 text-sm font-semibold transition"
        [class.border-b-2]="activeTab === 'revenue'"
        [class.border-primary]="activeTab === 'revenue'"
        [class.text-primary]="activeTab === 'revenue'"
        [class.text-muted-foreground]="activeTab !== 'revenue'"
        (click)="switchTab('revenue')"
      >
        Chiffre d'affaires
      </button>
    </div>

    <!-- ══ TAB : RAPPORT JOURNALIER ══════════════════════════════════════════ -->
    @if (activeTab === 'daily') {
      <!-- Sélecteur de date -->
      <section class="rounded-xl border bg-background p-4 shadow-sm">
        <div class="flex flex-wrap items-end gap-3">
          <label class="text-sm">
            <span class="text-muted-foreground">Date</span>
            <input
              type="date"
              class="mt-1 block rounded-md border px-3 py-2 text-sm"
              [(ngModel)]="selectedDate"
              [max]="todayStr"
            />
          </label>
          <button
            type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            [disabled]="loadingDaily"
            (click)="loadDailyReport()"
          >
            {{ loadingDaily ? 'Chargement...' : 'Afficher' }}
          </button>
        </div>
        @if (dailyError) {
          <p class="mt-2 text-xs text-destructive">{{ dailyError }}</p>
        }
      </section>

      @if (dailyReport) {
        <!-- KPI Cards -->
        <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl border bg-background p-4 shadow-sm">
            <p class="text-xs text-muted-foreground">Total transferts</p>
            <p class="mt-1 text-2xl font-bold">{{ dailyReport.summary.totalTransferts }}</p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ dailyReport.summary.transfertsPaies }} payés ·
              {{ dailyReport.summary.transfertsEnAttente }} en attente
            </p>
          </div>
          <div class="rounded-xl border bg-background p-4 shadow-sm">
            <p class="text-xs text-muted-foreground">Montant total envoyé</p>
            <p class="mt-1 text-2xl font-bold">
              {{ formatMoney(dailyReport.summary.totalMontantEnvoye, dailyReport.summary.devise) }}
            </p>
          </div>
          <div class="rounded-xl border bg-background p-4 shadow-sm">
            <p class="text-xs text-muted-foreground">Frais collectés</p>
            <p class="mt-1 text-2xl font-bold">
              {{ formatMoney(dailyReport.summary.totalFraisCollectes, dailyReport.summary.devise) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">Sur transferts payés</p>
          </div>
          <div class="rounded-xl border bg-emerald-50 p-4 shadow-sm dark:bg-emerald-950/20">
            <p class="text-xs text-muted-foreground">CA Agence</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
              {{ formatMoney(dailyReport.summary.chiffreAffaires, dailyReport.summary.devise) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Commission :
              {{ formatMoney(dailyReport.summary.commissionAgence, dailyReport.summary.devise) }}
            </p>
          </div>
        </section>

        <!-- Breakdown statuts -->
        <section class="grid gap-3 sm:grid-cols-4">
          @for (item of statusBreakdown; track item.label) {
            <div class="rounded-lg border bg-background px-4 py-3">
              <p class="text-xs text-muted-foreground">{{ item.label }}</p>
              <p class="mt-1 text-lg font-semibold" [class]="item.colorClass">
                {{ item.value }}
              </p>
            </div>
          }
        </section>

        <!-- Filtre + tableau transferts -->
        <section class="rounded-xl border bg-background p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-semibold">
              Détail des transferts du {{ formatDateLabel(selectedDate) }}
            </h2>
            <div class="flex gap-2">
              <input
                class="rounded-md border px-3 py-1.5 text-sm"
                placeholder="Rechercher..."
                [(ngModel)]="dailySearch"
              />
              <select class="rounded-md border px-3 py-1.5 text-sm" [(ngModel)]="dailyStatusFilter">
                <option value="">Tous</option>
                <option value="PENDING">En attente</option>
                <option value="PAID">Payé</option>
                <option value="CANCELLED">Annulé</option>
                <option value="EXPIRED">Expiré</option>
              </select>
            </div>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[1000px] text-sm">
              <thead class="text-xs uppercase text-muted-foreground">
                <tr>
                  <th class="px-3 py-2 text-left">Référence</th>
                  <th class="px-3 py-2 text-left">Expéditeur</th>
                  <th class="px-3 py-2 text-left">Bénéficiaire</th>
                  <th class="px-3 py-2 text-left">Destination</th>
                  <th class="px-3 py-2 text-right">Montant</th>
                  <th class="px-3 py-2 text-right">Frais</th>
                  <th class="px-3 py-2 text-right">Net reçu</th>
                  <th class="px-3 py-2 text-left">Taux</th>
                  <th class="px-3 py-2 text-left">Statut</th>
                  <th class="px-3 py-2 text-left">Agent</th>
                  <th class="px-3 py-2 text-left">Heure</th>
                </tr>
              </thead>
              <tbody>
                @for (t of filteredDailyTransfers; track t.id) {
                  <tr class="border-t hover:bg-muted/30">
                    <td class="px-3 py-2.5 font-medium">{{ t.codeReference }}</td>
                    <td class="px-3 py-2.5">{{ t.nomExpediteur }}</td>
                    <td class="px-3 py-2.5">{{ t.nomBeneficiaire }}</td>
                    <td class="px-3 py-2.5">{{ t.paysDestination ?? '-' }}</td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(t.montant, t.deviseSource) }}
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(t.frais, t.deviseSource) }}
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(t.montantNet, t.deviseDestination) }}
                    </td>
                    <td class="px-3 py-2.5 text-muted-foreground">
                      1 {{ t.deviseSource }} = {{ t.tauxChange }} {{ t.deviseDestination }}
                    </td>
                    <td class="px-3 py-2.5">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-semibold"
                        [class]="statusBadge(t.statut)"
                      >
                        {{ formatStatut(t.statut) }}
                      </span>
                    </td>
                    <td class="px-3 py-2.5 text-muted-foreground">{{ t.agentCreateur ?? '-' }}</td>
                    <td class="px-3 py-2.5 text-muted-foreground">{{ formatTime(t.creeLe) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td class="px-3 py-8 text-center text-sm text-muted-foreground" colspan="11">
                      Aucun transfert pour cette journée.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    }

    <!-- ══ TAB : CHIFFRE D'AFFAIRES ══════════════════════════════════════════ -->
    @if (activeTab === 'revenue') {
      <!-- Sélecteur de période -->
      <section class="rounded-xl border bg-background p-4 shadow-sm">
        <div class="flex flex-wrap items-end gap-3">
          <label class="text-sm">
            <span class="text-muted-foreground">Du</span>
            <input
              type="date"
              class="mt-1 block rounded-md border px-3 py-2 text-sm"
              [(ngModel)]="revenueStart"
              [max]="todayStr"
            />
          </label>
          <label class="text-sm">
            <span class="text-muted-foreground">Au</span>
            <input
              type="date"
              class="mt-1 block rounded-md border px-3 py-2 text-sm"
              [(ngModel)]="revenueEnd"
              [max]="todayStr"
            />
          </label>
          <button
            type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            [disabled]="loadingRevenue"
            (click)="loadRevenueReport()"
          >
            {{ loadingRevenue ? 'Chargement...' : 'Afficher' }}
          </button>
        </div>
        @if (revenueError) {
          <p class="mt-2 text-xs text-destructive">{{ revenueError }}</p>
        }
      </section>

      @if (revenueReport) {
        <!-- KPI globaux -->
        <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl border bg-background p-4 shadow-sm">
            <p class="text-xs text-muted-foreground">Transferts payés</p>
            <p class="mt-1 text-2xl font-bold">{{ revenueReport.totalTransfertsPaies }}</p>
            <p class="mt-1 text-xs text-muted-foreground">Sur la période</p>
          </div>
          <div class="rounded-xl border bg-background p-4 shadow-sm">
            <p class="text-xs text-muted-foreground">Total frais collectés</p>
            <p class="mt-1 text-2xl font-bold">
              {{ formatMoney(revenueReport.totalFraisCollectes, revenueReport.devise) }}
            </p>
          </div>
          <div class="rounded-xl border bg-background p-4 shadow-sm">
            <p class="text-xs text-muted-foreground">Commission centrale</p>
            <p class="mt-1 text-2xl font-bold">
              {{ formatMoney(revenueReport.totalCommissionCentrale, revenueReport.devise) }}
            </p>
          </div>
          <div class="rounded-xl border bg-emerald-50 p-4 shadow-sm dark:bg-emerald-950/20">
            <p class="text-xs text-muted-foreground">CA Agence (période)</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
              {{ formatMoney(revenueReport.totalChiffreAffaires, revenueReport.devise) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Commission :
              {{ formatMoney(revenueReport.totalCommissionAgence, revenueReport.devise) }}
            </p>
          </div>
        </section>

        <!-- Tableau par jour -->
        <section class="rounded-xl border bg-background p-4 shadow-sm">
          <h2 class="text-base font-semibold">
            Détail par jour — {{ formatDateLabel(revenueReport.periodStart) }} au
            {{ formatDateLabel(revenueReport.periodEnd) }}
          </h2>
          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[700px] text-sm">
              <thead class="text-xs uppercase text-muted-foreground">
                <tr>
                  <th class="px-3 py-2 text-left">Date</th>
                  <th class="px-3 py-2 text-right">Transferts payés</th>
                  <th class="px-3 py-2 text-right">Frais collectés</th>
                  <th class="px-3 py-2 text-right">Commission agence</th>
                  <th class="px-3 py-2 text-right">Commission centrale</th>
                  <th class="px-3 py-2 text-right">CA agence</th>
                </tr>
              </thead>
              <tbody>
                @for (day of revenueReport.byDay; track day.date) {
                  <tr class="border-t hover:bg-muted/30">
                    <td class="px-3 py-2.5 font-medium">{{ formatDateLabel(day.date) }}</td>
                    <td class="px-3 py-2.5 text-right">{{ day.transfertsPaies }}</td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(day.fraisCollectes, revenueReport.devise) }}
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(day.commissionAgence, revenueReport.devise) }}
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(day.commissionCentrale, revenueReport.devise) }}
                    </td>
                    <td class="px-3 py-2.5 text-right font-semibold text-emerald-700">
                      {{ formatMoney(day.chiffreAffaires, revenueReport.devise) }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td class="px-3 py-6 text-center text-sm text-muted-foreground" colspan="6">
                      Aucune donnée pour cette période.
                    </td>
                  </tr>
                }
                <!-- Ligne total -->
                @if (revenueReport.byDay.length > 1) {
                  <tr class="border-t bg-muted/40 font-semibold">
                    <td class="px-3 py-2.5">Total</td>
                    <td class="px-3 py-2.5 text-right">{{ revenueReport.totalTransfertsPaies }}</td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(revenueReport.totalFraisCollectes, revenueReport.devise) }}
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(revenueReport.totalCommissionAgence, revenueReport.devise) }}
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      {{ formatMoney(revenueReport.totalCommissionCentrale, revenueReport.devise) }}
                    </td>
                    <td class="px-3 py-2.5 text-right text-emerald-700">
                      {{ formatMoney(revenueReport.totalChiffreAffaires, revenueReport.devise) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    }
  `,
})
export class ManagerReportsPageComponent implements OnInit {
  private readonly _service = inject(ManagerDashboardService);
  private readonly _cdr = inject(ChangeDetectorRef);

  activeTab: ReportTab = 'daily';
  todayStr = new Date().toISOString().slice(0, 10);

  // Daily
  selectedDate = this.todayStr;
  dailyReport: ManagerDailyReport | null = null;
  dailySearch = '';
  dailyStatusFilter = '';
  loadingDaily = false;
  dailyError = '';

  // Revenue
  revenueStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  revenueEnd = this.todayStr;
  revenueReport: ManagerRevenueReport | null = null;
  loadingRevenue = false;
  revenueError = '';

  ngOnInit(): void {
    this.loadDailyReport();
  }

  switchTab(tab: ReportTab): void {
    this.activeTab = tab;
    if (tab === 'revenue' && !this.revenueReport) {
      this.loadRevenueReport();
    }
  }

  get statusBreakdown() {
    const s = this.dailyReport?.summary;
    if (!s) return [];
    return [
      { label: 'Payés', value: s.transfertsPaies, colorClass: 'text-emerald-700' },
      { label: 'En attente', value: s.transfertsEnAttente, colorClass: 'text-amber-600' },
      { label: 'Annulés', value: s.transfertsAnnules, colorClass: 'text-rose-600' },
      { label: 'Expirés', value: s.transfertsExpires, colorClass: 'text-slate-500' },
    ];
  }

  get filteredDailyTransfers(): ManagerTransferReportLine[] {
    if (!this.dailyReport) return [];
    const q = this.dailySearch.trim().toLowerCase();
    return this.dailyReport.transfers.filter((t) => {
      const matchesSearch =
        !q ||
        t.codeReference?.toLowerCase().includes(q) ||
        t.nomExpediteur?.toLowerCase().includes(q) ||
        t.nomBeneficiaire?.toLowerCase().includes(q);
      const matchesStatus =
        !this.dailyStatusFilter || this.normalizeStatus(t.statut) === this.dailyStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  loadDailyReport(): void {
    this.loadingDaily = true;
    this.dailyError = '';
    this._service.getDailyReport(this.selectedDate).subscribe({
      next: (report) => {
        this.dailyReport = report;
        this.loadingDaily = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        this.dailyError = err?.error?.message ?? 'Impossible de charger le rapport.';
        this.loadingDaily = false;
        this._cdr.markForCheck();
      },
    });
  }

  loadRevenueReport(): void {
    this.loadingRevenue = true;
    this.revenueError = '';
    this._service.getRevenueReport(this.revenueStart, this.revenueEnd).subscribe({
      next: (report) => {
        this.revenueReport = report;
        this.loadingRevenue = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        this.revenueError = err?.error?.message ?? 'Impossible de charger le rapport CA.';
        this.loadingRevenue = false;
        this._cdr.markForCheck();
      },
    });
  }

  formatMoney(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  }

  formatDateLabel(value: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('fr-FR');
  }

  formatTime(value: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatStatut(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'PENDING' || s === 'EN_ATTENTE') return 'EN ATTENTE';
    if (s === 'PAID' || s === 'PAYE') return 'PAYÉ';
    if (s === 'CANCELLED' || s === 'ANNULE') return 'ANNULÉ';
    if (s === 'EXPIRED' || s === 'EXPIRE') return 'EXPIRÉ';
    return status;
  }

  statusBadge(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'PAID' || s === 'PAYE') return 'bg-emerald-100 text-emerald-800';
    if (s === 'CANCELLED' || s === 'ANNULE') return 'bg-rose-100 text-rose-800';
    if (s === 'EXPIRED' || s === 'EXPIRE') return 'bg-slate-200 text-slate-600';
    return 'bg-amber-100 text-amber-800';
  }

  private normalizeStatus(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'EN_ATTENTE') return 'PENDING';
    if (s === 'PAYE' || s === 'PAYÉ') return 'PAID';
    if (s === 'ANNULE' || s === 'ANNULÉ') return 'CANCELLED';
    if (s === 'EXPIRE' || s === 'EXPIRÉ') return 'EXPIRED';
    return s;
  }
}
