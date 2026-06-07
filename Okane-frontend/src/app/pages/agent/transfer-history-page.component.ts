import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { Transfert } from '../../agent/models/agent-dashboard.models';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { AgentEmptyStateComponent } from '../../agent/ui/agent-empty-state.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentStatusBadgeComponent } from '../../agent/ui/agent-status-badge.component';
import { AgentTableShellComponent } from '../../agent/ui/agent-table-shell.component';

@Component({
	selector: 'okane-agent-transfer-history-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		HlmInputImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentStatusBadgeComponent,
		AgentEmptyStateComponent,
		AgentTableShellComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Historique des transferts">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Historique des transferts"
					subtitle="Filtrer et consulter les transactions recentes de l'agence."
				/>

				<okane-agent-section-card title="Filtres">
					<div class="grid gap-3 md:gap-4 md:grid-cols-4">
						<label class="text-sm">
							<span class="text-muted-foreground">Date</span>
							<input hlmInput class="mt-1 w-full" type="date" [(ngModel)]="filters.date" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Statut</span>
							<select
								class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
								[(ngModel)]="filters.status"
							>
								<option value="">Tous</option>
								<option value="PENDING">EN_ATTENTE</option>
								<option value="PAID">PAYE</option>
								<option value="CANCELLED">ANNULE</option>
								<option value="EXPIRED">EXPIRE</option>
							</select>
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Code de reference</span>
							<input hlmInput class="mt-1 w-full" [(ngModel)]="filters.reference" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Expediteur / Beneficiaire</span>
							<input hlmInput class="mt-1 w-full" [(ngModel)]="filters.search" />
						</label>
					</div>
				</okane-agent-section-card>

				<okane-agent-section-card title="Transferts">
					<okane-agent-table-shell>
						<table class="w-full text-sm">
							<thead class="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-4 py-3 text-left">Reference</th>
									<th class="px-4 py-3 text-left">Expediteur</th>
									<th class="px-4 py-3 text-left">Beneficiaire</th>
									<th class="px-4 py-3 text-right">Montant</th>
									<th class="px-4 py-3 text-left">Statut</th>
									<th class="px-4 py-3 text-left">Date</th>
									<th class="px-4 py-3 text-left">Action</th>
								</tr>
							</thead>
							<tbody>
								@for (transfer of filteredTransfers; track transfer.id) {
									<tr class="border-t border-border transition-colors hover:bg-accent/10">
										<td class="px-4 py-3 font-medium text-foreground">{{ transfer.codeReference }}</td>
										<td class="px-4 py-3 text-foreground">{{ transfer.nomExpediteur }}</td>
										<td class="px-4 py-3 text-foreground">{{ transfer.nomBeneficiaire }}</td>
										<td class="px-4 py-3 text-right text-foreground">{{ formatMoney(transfer.montant, transfer.devise) }}</td>
										<td class="px-4 py-3">
											<okane-agent-status-badge kind="transfer" [status]="transfer.statut" />
										</td>
										<td class="px-4 py-3 text-muted-foreground">{{ formatDate(transfer.creeLe) }}</td>
										<td class="px-4 py-3 text-primary">Voir</td>
									</tr>
								}
								@if (filteredTransfers.length === 0) {
									<tr>
										<td class="px-4 py-4" colspan="7">
											<okane-agent-empty-state
												title="Aucun transfert"
												description="Aucun resultat pour les filtres selectionnes."
											/>
										</td>
									</tr>
								}
							</tbody>
						</table>
					</okane-agent-table-shell>
				</okane-agent-section-card>
			</div>
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
			const matchesDate = this.filters.date ? transfer.creeLe.startsWith(this.filters.date) : true;
			const matchesStatus = this.filters.status ? transfer.statut === this.filters.status : true;
			const matchesReference = this.filters.reference
				? transfer.codeReference.toLowerCase().includes(this.filters.reference.toLowerCase())
				: true;
			const searchValue = this.filters.search.toLowerCase();
			const matchesSearch = searchValue
				? transfer.nomExpediteur.toLowerCase().includes(searchValue) ||
					transfer.nomBeneficiaire.toLowerCase().includes(searchValue)
				: true;

			return matchesDate && matchesStatus && matchesReference && matchesSearch;
		});
	}

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}
}
