import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { StatutTransfert, Transfert } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-transfer-history-page',
	standalone: true,
	imports: [CommonModule, FormsModule, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Historique des transferts">
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
							<option value="PAID">PAYÉ</option>
							<option value="CANCELLED">ANNULÉ</option>
							<option value="EXPIRED">EXPIRÉ</option>
						</select>
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Code de référence</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="filters.reference" />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Expéditeur / Bénéficiaire</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="filters.search" />
					</label>
				</div>
			</section>

			<section class="rounded-xl border bg-background p-4 shadow-sm">
				<h2 class="text-base font-semibold">Transferts</h2>
				<div class="mt-4 overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="text-xs uppercase text-muted-foreground">
							<tr>
								<th class="px-3 py-2 text-left">Référence</th>
								<th class="px-3 py-2 text-left">Expéditeur</th>
								<th class="px-3 py-2 text-left">Bénéficiaire</th>
								<th class="px-3 py-2 text-right">Montant</th>
								<th class="px-3 py-2 text-left">Statut</th>
								<th class="px-3 py-2 text-left">Date</th>
								<th class="px-3 py-2 text-left">Action</th>
							</tr>
						</thead>
						<tbody>
							@for (transfer of filteredTransfers; track transfer.id) {
								<tr class="border-t">
									<td class="px-3 py-3 font-medium">{{ transfer.codeReference }}</td>
									<td class="px-3 py-3">{{ transfer.nomExpediteur }}</td>
									<td class="px-3 py-3">{{ transfer.nomBeneficiaire }}</td>
									<td class="px-3 py-3 text-right">{{ formatMoney(transfer.montant, transfer.devise) }}</td>
									<td class="px-3 py-3">
										<span class="rounded-full px-2 py-1 text-xs font-semibold" [class]="statusBadgeClass(transfer.statut)">
											{{ formatStatut(transfer.statut) }}
										</span>
									</td>
									<td class="px-3 py-3">{{ formatDate(transfer.creeLe) }}</td>
									<td class="px-3 py-3 text-sm text-primary">Voir</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			</section>
		</okane-agent-layout>
	`,
})
export class AgentTransferHistoryPageComponent {
	private readonly _service = inject(AgentDashboardService);

	public transfers: Transfert[] = [];
	public filters = {
		date: '',
		status: '',
		reference: '',
		search: '',
	};

	constructor() {
		this._service.getTransferHistory().subscribe((transfers) => (this.transfers = transfers));
	}

	public get filteredTransfers(): Transfert[] {
		return this.transfers.filter((transfer) => {
			const matchesDate = this.filters.date
				? transfer.creeLe.startsWith(this.filters.date)
				: true;
			const matchesStatus = this.filters.status ? transfer.statut === this.filters.status : true;
			const matchesReference = this.filters.reference
				? transfer.codeReference.toLowerCase().includes(this.filters.reference.toLowerCase())
				: true;
			const searchValue = this.filters.search.toLowerCase();
			const matchesSearch = searchValue
				? transfer.nomExpediteur.toLowerCase().includes(searchValue) || transfer.nomBeneficiaire.toLowerCase().includes(searchValue)
				: true;

			return matchesDate && matchesStatus && matchesReference && matchesSearch;
		});
	}

	public statusBadgeClass(status: Transfert['statut']): string {
		switch (status) {
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
		switch (status) {
			case 'PENDING':
				return 'EN_ATTENTE';
			case 'PAID':
				return 'PAYÉ';
			case 'CANCELLED':
				return 'ANNULÉ';
			case 'EXPIRED':
			default:
				return 'EXPIRÉ';
		}
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}
}
