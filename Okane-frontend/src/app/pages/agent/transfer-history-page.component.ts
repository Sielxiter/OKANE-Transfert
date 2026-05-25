import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { StatutTransfert, Transfert } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-transfer-history-page',
	standalone: true,
	imports: [CommonModule, FormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<section class="rounded-xl border bg-background p-4 shadow-sm">
			<h2 class="text-base font-semibold">Filtres</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-4">
				<label class="text-sm">
					<span class="text-muted-foreground">Date</span>
					<input class="mt-1 w-full rounded-md border px-3 py-2" type="date" [(ngModel)]="filters.date" />
				</label>
				<label class="text-sm">
					<span class="text-muted-foreground">Statut</span>
					<select class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="filters.status">
						<option value="">Tous</option>
						<option value="PENDING">EN_ATTENTE</option>
						<option value="PAID">PAYE</option>
						<option value="CANCELLED">ANNULE</option>
						<option value="EXPIRED">EXPIRE</option>
					</select>
				</label>
				<label class="text-sm md:col-span-2">
					<span class="text-muted-foreground">Recherche</span>
					<input
						class="mt-1 w-full rounded-md border px-3 py-2"
						[(ngModel)]="filters.query"
						placeholder="Expediteur, beneficiaire, code retrait, reference"
					/>
				</label>
			</div>
		</section>

		<section class="rounded-xl border bg-background p-4 shadow-sm">
			<h2 class="text-base font-semibold">Transferts</h2>
			@if (errorMessage) {
				<p class="mt-4 text-sm text-destructive">{{ errorMessage }}</p>
			} @else if (loading) {
				<p class="mt-4 text-sm text-muted-foreground">Chargement des transferts...</p>
			} @else {
				<div class="mt-4 overflow-x-auto">
					<table class="w-full min-w-[1120px] text-sm">
						<thead class="text-xs uppercase text-muted-foreground">
							<tr>
								<th class="px-3 py-2 text-left">Reference transfert</th>
								<th class="px-3 py-2 text-left">Code retrait</th>
								<th class="px-3 py-2 text-left">Expediteur</th>
								<th class="px-3 py-2 text-left">Beneficiaire</th>
								<th class="px-3 py-2 text-right">Montant envoye</th>
								<th class="px-3 py-2 text-right">Frais</th>
								<th class="px-3 py-2 text-right">Montant net recu</th>
								<th class="px-3 py-2 text-left">Statut</th>
								<th class="px-3 py-2 text-left">Date creation</th>
							</tr>
						</thead>
						<tbody>
							@for (transfer of filteredTransfers; track transfer.id) {
								<tr class="border-t">
									<td class="px-3 py-3 font-medium">{{ transfer.codeReference }}</td>
									<td class="px-3 py-3">{{ transfer.codeRetrait }}</td>
									<td class="px-3 py-3">{{ transfer.nomExpediteur }}</td>
									<td class="px-3 py-3">{{ transfer.nomBeneficiaire }}</td>
									<td class="px-3 py-3 text-right">{{ formatMoney(transfer.montant, transfer.deviseSource ?? transfer.devise) }}</td>
									<td class="px-3 py-3 text-right">{{ formatMoney(transfer.montantFrais, transfer.deviseSource ?? transfer.devise) }}</td>
									<td class="px-3 py-3 text-right">{{ formatMoney(transfer.montantNet, transfer.deviseDestination ?? transfer.devise) }}</td>
									<td class="px-3 py-3">
										<span class="rounded-full px-2 py-1 text-xs font-semibold" [class]="statusBadgeClass(transfer.statut)">
											{{ formatStatut(transfer.statut) }}
										</span>
									</td>
									<td class="px-3 py-3">{{ formatDate(transfer.creeLe) }}</td>
								</tr>
							} @empty {
								<tr class="border-t">
									<td class="px-3 py-6 text-center text-sm text-muted-foreground" colspan="10">
										Aucun transfert trouve.
									</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			}
		</section>

				@if (selectedTransfer) {
					<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
						<div class="w-full max-w-2xl rounded-xl border bg-background p-4 shadow-lg">
							<div class="flex items-center justify-between">
								<h3 class="text-sm font-semibold">Detail du transfert</h3>
								<button class="text-xs text-muted-foreground" type="button" (click)="closeDetails()">Fermer</button>
							</div>
							<div class="mt-4 grid gap-2 text-xs text-muted-foreground">
								<div class="flex items-center justify-between gap-3">
									<span>Reference transfert</span>
									<span class="text-foreground">{{ selectedTransfer.codeReference }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Code retrait</span>
									<span class="text-foreground">{{ selectedTransfer.codeRetrait }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Expediteur</span>
									<span class="text-foreground">{{ selectedTransfer.nomExpediteur }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Beneficiaire</span>
									<span class="text-foreground">{{ selectedTransfer.nomBeneficiaire }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Pays source</span>
									<span class="text-foreground">{{ resolveSourceCountry(selectedTransfer) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Pays destination</span>
									<span class="text-foreground">{{ selectedTransfer.paysDestination }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Devise source</span>
									<span class="text-foreground">{{ selectedTransfer.deviseSource ?? selectedTransfer.devise }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Devise destination</span>
									<span class="text-foreground">{{ selectedTransfer.deviseDestination ?? selectedTransfer.devise }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Montant envoye</span>
									<span class="text-foreground">{{ formatMoney(selectedTransfer.montant, selectedTransfer.deviseSource ?? selectedTransfer.devise) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Frais</span>
									<span class="text-foreground">{{ formatMoney(selectedTransfer.montantFrais, selectedTransfer.deviseSource ?? selectedTransfer.devise) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Montant net recu</span>
									<span class="text-foreground">{{ formatMoney(selectedTransfer.montantNet, selectedTransfer.deviseDestination ?? selectedTransfer.devise) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Taux de change</span>
									<span class="text-foreground">{{ resolveExchangeRate(selectedTransfer) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Statut</span>
									<span class="text-foreground">{{ formatStatut(selectedTransfer.statut) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Date creation</span>
									<span class="text-foreground">{{ formatDate(selectedTransfer.creeLe) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Date paiement</span>
									<span class="text-foreground">{{ resolvePaidAt(selectedTransfer) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Agent createur</span>
									<span class="text-foreground">{{ resolveCreatedBy(selectedTransfer) }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Agent payeur</span>
									<span class="text-foreground">{{ resolvePaidBy(selectedTransfer) }}</span>
								</div>
							</div>
							<div class="mt-4 flex justify-end gap-2">
								<button class="rounded-md border px-3 py-2 text-xs font-semibold" type="button" (click)="closeDetails()">
									Fermer
								</button>
								@if (canPrint(selectedTransfer)) {
									<button class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground" type="button" (click)="printTransfer()">
										Imprimer recu
									</button>
								}
							</div>
						</div>
					</div>
				}
	`,
})
export class AgentTransferHistoryPageComponent implements OnInit {
	private readonly _service = inject(AgentDashboardService);
	private readonly _cdr = inject(ChangeDetectorRef);

	public transfers: Transfert[] = [];
	public selectedTransfer: Transfert | null = null;
	public loading = false;
	public errorMessage = '';
	public filters = {
		date: '',
		status: '',
		query: '',
	};

	public ngOnInit(): void {
		this.loadTransfers();
	}

	public get filteredTransfers(): Transfert[] {
		const query = this.normalize(this.filters.query);
		return this.transfers.filter((transfer) => {
			const createdDate = transfer.creeLe ? transfer.creeLe.slice(0, 10) : '';
			const matchesDate = this.filters.date ? createdDate === this.filters.date : true;
			const matchesStatus = this.filters.status ? this.normalizeStatus(transfer.statut) === this.filters.status : true;
			const matchesQuery = !query
				|| this.normalize(transfer.nomExpediteur).includes(query)
				|| this.normalize(transfer.nomBeneficiaire).includes(query)
				|| this.normalize(transfer.codeRetrait).includes(query)
				|| this.normalize(transfer.codeReference).includes(query);
			return matchesDate && matchesStatus && matchesQuery;
		});
	}

	public statusBadgeClass(status: StatutTransfert): string {
		switch (this.normalizeStatus(status)) {
			case 'PENDING':
				return 'bg-amber-100 text-amber-800';
			case 'PAID':
				return 'bg-emerald-100 text-emerald-800';
			case 'CANCELLED':
				return 'bg-rose-100 text-rose-800';
			case 'EXPIRED':
			default:
				return 'bg-slate-200 text-slate-700';
		}
	}

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatStatut(status: StatutTransfert): string {
		switch (this.normalizeStatus(status)) {
			case 'PENDING':
				return 'EN_ATTENTE';
			case 'PAID':
				return 'PAYE';
			case 'CANCELLED':
				return 'ANNULE';
			case 'EXPIRED':
			default:
				return 'EXPIRE';
		}
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}

	public openDetails(transfer: Transfert): void {
		this.selectedTransfer = transfer;
	}

	public closeDetails(): void {
		this.selectedTransfer = null;
	}

	public printTransfer(): void {
		window.print();
	}

	public canPrint(transfer: Transfert): boolean {
		return this.normalizeStatus(transfer.statut) === 'PAID';
	}

	public resolveSourceCountry(_transfer: Transfert): string {
		return 'Non disponible';
	}

	public resolveExchangeRate(_transfer: Transfert): string {
		return 'Non disponible';
	}

	public resolvePaidAt(_transfer: Transfert): string {
		return 'Non disponible';
	}

	public resolveCreatedBy(_transfer: Transfert): string {
		return 'Non disponible';
	}

	public resolvePaidBy(_transfer: Transfert): string {
		return 'Non disponible';
	}

	private loadTransfers(): void {
		this.loading = true;
		this.errorMessage = '';
		this._service.getTransferHistory().subscribe({
			next: (transfers) => {
				this.transfers = transfers;
				this.loading = false;
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.transfers = [];
				this.loading = false;
				this.errorMessage = error?.error?.message ?? 'Impossible de charger les transferts.';
				this._cdr.markForCheck();
			},
		});
	}

	private normalize(value: string | null | undefined): string {
		return (value ?? '').trim().toLowerCase();
	}

	private normalizeStatus(status: StatutTransfert | string): 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' {
		switch ((status ?? '').toUpperCase()) {
			case 'EN_ATTENTE':
				return 'PENDING';
			case 'PAYE':
			case 'PAYÃ‰':
				return 'PAID';
			case 'ANNULE':
			case 'ANNULÃ‰':
				return 'CANCELLED';
			case 'EXPIRE':
			case 'EXPIRÃ‰':
				return 'EXPIRED';
			case 'PENDING':
			case 'PAID':
			case 'CANCELLED':
			case 'EXPIRED':
				return (status ?? 'PENDING').toUpperCase() as 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
			default:
				return 'PENDING';
		}
	}
}
