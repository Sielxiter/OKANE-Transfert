// src/app/pages/manager/manager-clients-page.component.ts
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
  ManagerClient,
  ManagerClientDetail,
  ManagerClientTransaction,
} from '../../manager/models/manager-dashboard.models';

@Component({
  selector: 'okane-manager-clients-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl border bg-background p-4 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 class="text-base font-semibold">Clients de l'agence</h2>
        <input
          class="w-full rounded-md border px-3 py-2 text-sm md:max-w-xs"
          placeholder="Rechercher un client..."
          [(ngModel)]="search"
        />
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <!-- Liste clients -->
        <div class="lg:col-span-1">
          @if (loading) {
            <p class="text-sm text-muted-foreground">Chargement...</p>
          } @else if (error) {
            <p class="text-sm text-destructive">{{ error }}</p>
          } @else {
            <div class="divide-y rounded-lg border">
              @for (client of filteredClients; track client.id) {
                <button
                  type="button"
                  class="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-muted/50"
                  [class.bg-muted]="selectedClient?.client?.id === client.id"
                  (click)="selectClient(client)"
                >
                  <div>
                    <p class="text-sm font-semibold">{{ client.prenom }} {{ client.nom }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ client.telephone }} · {{ client.pays }}
                    </p>
                  </div>
                  <span
                    class="rounded-full px-2 py-1 text-xs font-semibold"
                    [class]="kycBadgeClass(client.statutKyc)"
                  >
                    {{ formatKyc(client.statutKyc) }}
                  </span>
                </button>
              } @empty {
                <p class="px-4 py-6 text-center text-sm text-muted-foreground">
                  Aucun client trouvé.
                </p>
              }
            </div>
          }
        </div>

        <!-- Détail client -->
        <div class="rounded-lg border bg-muted/30 p-4 lg:col-span-2">
          @if (loadingDetail) {
            <p class="text-sm text-muted-foreground">Chargement du détail...</p>
          } @else if (selectedClient) {
            <div class="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 class="text-sm font-semibold">
                  {{ selectedClient.client.prenom }} {{ selectedClient.client.nom }}
                </h3>
                <p class="text-xs text-muted-foreground">
                  {{ selectedClient.client.telephone }} · {{ selectedClient.client.pays }}
                </p>
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-md border px-3 py-1 text-xs font-semibold"
                  [class.bg-primary]="activePanel === 'details'"
                  [class.text-primary-foreground]="activePanel === 'details'"
                  (click)="activePanel = 'details'"
                >
                  Infos
                </button>
                <button
                  type="button"
                  class="rounded-md border px-3 py-1 text-xs font-semibold"
                  [class.bg-primary]="activePanel === 'history'"
                  [class.text-primary-foreground]="activePanel === 'history'"
                  (click)="activePanel = 'history'"
                >
                  Transactions ({{ selectedClient.transactions.length }})
                </button>
              </div>
            </div>

            @if (activePanel === 'details') {
              <div class="grid gap-2 text-xs">
                @for (row of clientInfoRows; track row.label) {
                  <div class="flex items-center justify-between gap-2 border-b pb-2">
                    <span class="text-muted-foreground">{{ row.label }}</span>
                    <span class="text-right font-medium">{{ row.value }}</span>
                  </div>
                }
              </div>
              <div class="mt-4 flex justify-end">
                <button
                  type="button"
                  class="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  [class]="isSuspended()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-rose-600 text-white hover:bg-rose-700'"
                  [disabled]="suspending"
                  (click)="toggleSuspend()"
                >
                  {{ suspending ? 'En cours...' : isSuspended() ? 'Débloquer' : 'Bloquer' }}
                </button>
              </div>
            }

            @if (activePanel === 'history') {
              @if (!selectedClient.transactions.length) {
                <p class="text-sm text-muted-foreground">Aucune transaction.</p>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[640px] text-xs">
                    <thead class="uppercase text-muted-foreground">
                      <tr>
                        <th class="px-2 py-2 text-left">Référence</th>
                        <th class="px-2 py-2 text-left">Type</th>
                        <th class="px-2 py-2 text-right">Montant</th>
                        <th class="px-2 py-2 text-left">Destination</th>
                        <th class="px-2 py-2 text-left">Statut</th>
                        <th class="px-2 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (tx of selectedClient.transactions; track tx.transferId) {
                        <tr class="border-t">
                          <td class="px-2 py-2 font-medium">{{ tx.codeReference }}</td>
                          <td class="px-2 py-2">
                            <span
                              class="rounded-full px-2 py-1 font-semibold"
                              [class]="
                                tx.type === 'ENVOI'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              "
                            >
                              {{ tx.type }}
                            </span>
                          </td>
                          <td class="px-2 py-2 text-right">
                            {{ formatMoney(tx.montant, tx.deviseSource) }}
                          </td>
                          <td class="px-2 py-2">{{ tx.paysDestination ?? '-' }}</td>
                          <td class="px-2 py-2">
                            <span
                              class="rounded-full px-2 py-1 font-semibold"
                              [class]="statusBadge(tx.statut)"
                            >
                              {{ formatStatut(tx.statut) }}
                            </span>
                          </td>
                          <td class="px-2 py-2">{{ formatDate(tx.creeLe) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          } @else {
            <p class="text-sm text-muted-foreground">
              Sélectionnez un client pour voir ses informations.
            </p>
          }
        </div>
      </div>
    </section>
  `,
})
export class ManagerClientsPageComponent implements OnInit {
  private readonly _service = inject(ManagerDashboardService);
  private readonly _cdr = inject(ChangeDetectorRef);

  clients: ManagerClient[] = [];
  selectedClient: ManagerClientDetail | null = null;
  activePanel: 'details' | 'history' = 'details';
  search = '';
  loading = false;
  loadingDetail = false;
  suspending = false;
  error = '';

  ngOnInit(): void {
    this.loadClients();
  }

  get filteredClients(): ManagerClient[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.clients;
    return this.clients.filter(
      (c) =>
        `${c.prenom} ${c.nom}`.toLowerCase().includes(q) ||
        c.telephone.includes(q) ||
        c.numeroPiece.toLowerCase().includes(q),
    );
  }

  get clientInfoRows(): { label: string; value: string }[] {
    const c = this.selectedClient?.client;
    if (!c) return [];
    return [
      { label: 'Prénom', value: c.prenom },
      { label: 'Nom', value: c.nom },
      { label: 'Téléphone', value: c.telephone },
      { label: 'Pays', value: c.pays },
      { label: 'Type de pièce', value: c.typePiece },
      { label: 'Numéro de pièce', value: this.maskDoc(c.numeroPiece) },
      { label: 'Statut KYC', value: this.formatKyc(c.statutKyc) },
      { label: 'Statut compte', value: this.formatStatutCompte(c.statutCompte) },
      { label: 'Créé le', value: this.formatDate(c.creeLe) },
    ];
  }

  selectClient(client: ManagerClient): void {
    if (this.selectedClient?.client.id === client.id) return;
    this.activePanel = 'details';
    this.loadingDetail = true;
    this._service.getClientDetail(client.id).subscribe({
      next: (detail) => {
        this.selectedClient = detail;
        this.loadingDetail = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.loadingDetail = false;
        this._cdr.markForCheck();
      },
    });
  }

  isSuspended(): boolean {
    return this.selectedClient?.client.statutCompte === 'SUSPENDU';
  }

  toggleSuspend(): void {
    if (!this.selectedClient) return;
    this.suspending = true;
    this._service.suspendClient(this.selectedClient.client.id).subscribe({
      next: (updated) => {
        this.clients = this.clients.map(c => c.id === updated.id ? updated : c);
        this.selectedClient = { ...this.selectedClient!, client: updated };
        this.suspending = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.suspending = false;
        this._cdr.markForCheck();
      },
    });
  }

  formatStatutCompte(statut: string): string {
    if (statut === 'ACTIF') return '✅ Actif';
    if (statut === 'SUSPENDU') return '🚫 Suspendu';
    if (statut === 'VERROUILLE') return '🔒 Verrouillé';
    if (statut === 'INACTIF') return '⛔ Inactif';
    return statut;
  }

  formatKyc(status: string): string {
    return status === 'APPROVED' ? 'VALIDÉ' : status === 'REJECTED' ? 'REJETÉ' : 'EN ATTENTE';
  }

  kycBadgeClass(status: string): string {
    return status === 'APPROVED'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'REJECTED'
        ? 'bg-rose-100 text-rose-800'
        : 'bg-amber-100 text-amber-800';
  }

  statusBadge(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'PAID' || s === 'PAYE') return 'bg-emerald-100 text-emerald-800';
    if (s === 'CANCELLED' || s === 'ANNULE') return 'bg-rose-100 text-rose-800';
    if (s === 'EXPIRED' || s === 'EXPIRE') return 'bg-slate-200 text-slate-600';
    return 'bg-amber-100 text-amber-800';
  }

  formatStatut(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'PENDING' || s === 'EN_ATTENTE') return 'EN ATTENTE';
    if (s === 'PAID' || s === 'PAYE') return 'PAYÉ';
    if (s === 'CANCELLED' || s === 'ANNULE') return 'ANNULÉ';
    if (s === 'EXPIRED' || s === 'EXPIRE') return 'EXPIRÉ';
    return status;
  }

  formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  }

  formatDate(value: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('fr-FR');
  }

  maskDoc(value: string): string {
    if (!value || value.length <= 4) return value;
    return value.slice(0, 2) + '****' + value.slice(-2);
  }

  private loadClients(): void {
    this.loading = true;
    this._service.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: () => {
        this.error = 'Impossible de charger les clients.';
        this.loading = false;
        this._cdr.markForCheck();
      },
    });
  }
}
