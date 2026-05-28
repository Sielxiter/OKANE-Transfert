// src/app/pages/manager/manager-payments-page.component.ts
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
import { ManagerPayment } from '../../manager/models/manager-dashboard.models';

type Tab = 'all' | 'pending';

@Component({
  selector: 'okane-manager-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Tabs -->
    <div class="flex gap-2 border-b pb-2">
      <button
        type="button"
        class="rounded-t-md px-4 py-2 text-sm font-semibold transition"
        [class.border-b-2]="activeTab === 'all'"
        [class.border-primary]="activeTab === 'all'"
        [class.text-primary]="activeTab === 'all'"
        [class.text-muted-foreground]="activeTab !== 'all'"
        (click)="switchTab('all')"
      >
        Historique des paiements
      </button>
      <button
        type="button"
        class="rounded-t-md px-4 py-2 text-sm font-semibold transition"
        [class.border-b-2]="activeTab === 'pending'"
        [class.border-primary]="activeTab === 'pending'"
        [class.text-primary]="activeTab === 'pending'"
        [class.text-muted-foreground]="activeTab !== 'pending'"
        (click)="switchTab('pending')"
      >
        En attente
        @if (pendingPayments.length) {
          <span class="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
            {{ pendingPayments.length }}
          </span>
        }
      </button>
    </div>

    <!-- Filtres -->
    <section class="rounded-xl border bg-background p-4 shadow-sm">
      <div class="grid gap-3 md:grid-cols-3">
        <label class="text-sm">
          <span class="text-muted-foreground">Recherche</span>
          <input
            class="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Référence, expéditeur, bénéficiaire..."
            [(ngModel)]="search"
          />
        </label>
        @if (activeTab === 'all') {
          <label class="text-sm">
            <span class="text-muted-foreground">Statut</span>
            <select class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="statusFilter">
              <option value="">Tous</option>
              <option value="PAID">Payé</option>
              <option value="CANCELLED">Annulé</option>
              <option value="EXPIRED">Expiré</option>
            </select>
          </label>
          <label class="text-sm">
            <span class="text-muted-foreground">Date (à partir de)</span>
            <input
              class="mt-1 w-full rounded-md border px-3 py-2"
              type="date"
              [(ngModel)]="dateFilter"
            />
          </label>
        }
      </div>
    </section>

    <!-- Tableau -->
    <section class="rounded-xl border bg-background p-4 shadow-sm">
      @if (loading) {
        <p class="py-6 text-center text-sm text-muted-foreground">Chargement...</p>
      } @else if (error) {
        <p class="text-sm text-destructive">{{ error }}</p>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-sm">
            <thead class="text-xs uppercase text-muted-foreground">
              <tr>
                <th class="px-3 py-2 text-left">Référence</th>
                <th class="px-3 py-2 text-left">Code retrait</th>
                <th class="px-3 py-2 text-left">Expéditeur</th>
                <th class="px-3 py-2 text-left">Bénéficiaire</th>
                <th class="px-3 py-2 text-right">Montant</th>
                <th class="px-3 py-2 text-left">Statut</th>
                <th class="px-3 py-2 text-left">Agent</th>
                <th class="px-3 py-2 text-left">Date</th>
                @if (activeTab === 'pending') {
                  <th class="px-3 py-2 text-left">Action</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (payment of filteredPayments; track payment.id) {
                <tr class="border-t">
                  <td class="px-3 py-3 font-medium">{{ payment.transferReference }}</td>
                  <td class="px-3 py-3">{{ payment.withdrawalCode }}</td>
                  <td class="px-3 py-3">{{ payment.nomExpediteur }}</td>
                  <td class="px-3 py-3">{{ payment.nomBeneficiaire }}</td>
                  <td class="px-3 py-3 text-right">
                    {{ formatMoney(payment.montantPaye, payment.devise) }}
                  </td>
                  <td class="px-3 py-3">
                    <span
                      class="rounded-full px-2 py-1 text-xs font-semibold"
                      [class]="statusBadge(payment.transferStatut)"
                    >
                      {{ formatStatut(payment.transferStatut) }}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-muted-foreground">{{ payment.payePar ?? '-' }}</td>
                  <td class="px-3 py-3">{{ formatDate(payment.payeLe) }}</td>
                  @if (activeTab === 'pending') {
                    <td class="px-3 py-3">
                      @if (isPending(payment.transferStatut)) {
                        <button
                          type="button"
                          class="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          [disabled]="cancellingId === payment.id"
                          (click)="openCancelModal(payment)"
                        >
                          {{ cancellingId === payment.id ? 'En cours...' : 'Annuler' }}
                        </button>
                      }
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td
                    class="px-3 py-8 text-center text-sm text-muted-foreground"
                    [attr.colspan]="activeTab === 'pending' ? 9 : 8"
                  >
                    Aucun paiement trouvé.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <!-- Modal annulation -->
    @if (showCancelModal && paymentToCancel) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-md rounded-xl border bg-background p-5 shadow-xl">
          <h3 class="text-sm font-semibold">Confirmer l'annulation</h3>
          <p class="mt-2 text-xs text-muted-foreground">
            Transfert : <strong>{{ paymentToCancel.transferReference }}</strong
            ><br />
            Bénéficiaire : {{ paymentToCancel.nomBeneficiaire }}<br />
            Montant : {{ formatMoney(paymentToCancel.montantPaye, paymentToCancel.devise) }}
          </p>
          <label class="mt-4 block text-sm">
            <span class="text-muted-foreground">Raison de l'annulation *</span>
            <textarea
              class="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              rows="3"
              [(ngModel)]="cancelRaison"
              placeholder="Motif obligatoire..."
            ></textarea>
          </label>
          @if (cancelError) {
            <p class="mt-2 text-xs text-rose-600">{{ cancelError }}</p>
          }
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md border px-4 py-2 text-sm font-semibold"
              (click)="closeCancelModal()"
            >
              Fermer
            </button>
            <button
              type="button"
              class="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              [disabled]="!cancelRaison.trim() || cancellingId !== null"
              (click)="confirmCancel()"
            >
              Annuler le transfert
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ManagerPaymentsPageComponent implements OnInit {
  private readonly _service = inject(ManagerDashboardService);
  private readonly _cdr = inject(ChangeDetectorRef);

  activeTab: Tab = 'all';
  allPayments: ManagerPayment[] = [];
  pendingPayments: ManagerPayment[] = [];
  search = '';
  statusFilter = '';
  dateFilter = '';
  loading = false;
  error = '';

  showCancelModal = false;
  paymentToCancel: ManagerPayment | null = null;
  cancelRaison = '';
  cancelError = '';
  cancellingId: string | null = null;

  ngOnInit(): void {
    this.loadAll();
    this.loadPending();
  }

  get filteredPayments(): ManagerPayment[] {
    const payments = this.activeTab === 'pending' ? this.pendingPayments : this.allPayments;
    const q = this.search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesSearch =
        !q ||
        p.transferReference?.toLowerCase().includes(q) ||
        p.nomExpediteur?.toLowerCase().includes(q) ||
        p.nomBeneficiaire?.toLowerCase().includes(q) ||
        p.withdrawalCode?.toLowerCase().includes(q);

      const matchesStatus =
        !this.statusFilter || this.normalizeStatus(p.transferStatut) === this.statusFilter;

      const matchesDate =
        !this.dateFilter || (p.payeLe ? p.payeLe.slice(0, 10) >= this.dateFilter : false);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  switchTab(tab: Tab): void {
    this.activeTab = tab;
    this.search = '';
    this.statusFilter = '';
    this.dateFilter = '';
  }

  openCancelModal(payment: ManagerPayment): void {
    this.paymentToCancel = payment;
    this.cancelRaison = '';
    this.cancelError = '';
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.paymentToCancel = null;
    this.cancelRaison = '';
    this.cancelError = '';
  }

  confirmCancel(): void {
    if (!this.paymentToCancel || !this.cancelRaison.trim()) return;
    this.cancellingId = this.paymentToCancel.id;
    this.cancelError = '';

    this._service.cancelPayout(this.paymentToCancel.id, this.cancelRaison).subscribe({
      next: (updated) => {
        // Mettre à jour la liste pending
        this.pendingPayments = this.pendingPayments.filter(
          (p) => p.id !== this.paymentToCancel?.id,
        );
        this.cancellingId = null;
        this.showCancelModal = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        this.cancelError = err?.error?.message ?? "Impossible d'annuler ce transfert.";
        this.cancellingId = null;
        this._cdr.markForCheck();
      },
    });
  }

  isPending(status: string): boolean {
    const s = status?.toUpperCase();
    return s === 'PENDING' || s === 'EN_ATTENTE';
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

  formatMoney(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  }

  formatDate(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('fr-FR');
  }

  private normalizeStatus(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'PAYE' || s === 'PAYÉ') return 'PAID';
    if (s === 'ANNULE' || s === 'ANNULÉ') return 'CANCELLED';
    if (s === 'EXPIRE' || s === 'EXPIRÉ') return 'EXPIRED';
    return s;
  }

  private loadAll(): void {
    this.loading = true;
    this._service.getAllPayments().subscribe({
      next: (payments) => {
        this.allPayments = payments;
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.error = 'Impossible de charger les paiements.';
        this.loading = false;
        this._cdr.markForCheck();
      },
    });
  }

  private loadPending(): void {
    this._service.getPendingPayments().subscribe({
      next: (payments) => {
        this.pendingPayments = payments;
        this._cdr.markForCheck();
      },
    });
  }
}
