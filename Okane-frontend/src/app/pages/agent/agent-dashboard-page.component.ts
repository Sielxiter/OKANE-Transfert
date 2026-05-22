import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { StatutSessionCaisse, StatutTransfert, Transfert } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-dashboard-page',
	standalone: true,
	imports: [CommonModule, RouterLink, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Tableau de bord">
			<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				@if (stats$ | async; as stats) {
					<div class="rounded-xl border bg-background p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Solde caisse</p>
						<p class="mt-2 text-2xl font-semibold">{{ formatMoney(stats.soldeCaisse, stats.devise) }}</p>
						<p class="mt-1 text-xs text-muted-foreground">Mis à jour</p>
					</div>
					<div class="rounded-xl border bg-background p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Transferts du jour</p>
						<p class="mt-2 text-2xl font-semibold">{{ stats.transfertsJour }}</p>
						<p class="mt-1 text-xs text-muted-foreground">Activité agent</p>
					</div>
					<div class="rounded-xl border bg-background p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Paiements du jour</p>
						<p class="mt-2 text-2xl font-semibold">{{ stats.paiementsJour }}</p>
						<p class="mt-1 text-xs text-muted-foreground">Paiements terminés</p>
					</div>
					<div class="rounded-xl border bg-background p-4 shadow-sm">
						<p class="text-sm text-muted-foreground">Transferts en attente</p>
						<p class="mt-2 text-2xl font-semibold">{{ stats.transfertsEnAttente }}</p>
						<p class="mt-1 text-xs text-muted-foreground">À suivre</p>
					</div>
				}
			</section>

			<section class="grid gap-4 lg:grid-cols-3">
				<div class="rounded-xl border bg-background p-4 shadow-sm lg:col-span-2">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold">Actions rapides</h2>
						<span class="text-xs text-muted-foreground">Raccourcis</span>
					</div>
					<div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						@for (action of quickActions; track action.label) {
							<a
								class="rounded-lg border bg-muted/40 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
								[routerLink]="action.link"
							>
								{{ action.label }}
							</a>
						}
					</div>
				</div>

				<div class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Alertes</h2>
					<ul class="mt-4 space-y-2 text-sm text-muted-foreground">
						@if (alerts$ | async; as alerts) {
							@for (alert of alerts; track $index) {
								<li class="flex items-start gap-2">
									<span class="mt-1 size-2 rounded-full bg-amber-500"></span>
									<span>{{ alert }}</span>
								</li>
							}
						}
					</ul>
				</div>
			</section>

			<section class="grid gap-4 lg:grid-cols-3">
				<div class="rounded-xl border bg-background p-4 shadow-sm lg:col-span-2">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold">Transactions récentes</h2>
						<a class="text-xs text-primary" routerLink="/agent/transfer-history">Voir tout</a>
					</div>
					<div class="mt-4 overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="text-xs uppercase text-muted-foreground">
								<tr>
									<th class="px-3 py-2 text-left">Code de référence</th>
									<th class="px-3 py-2 text-left">Expéditeur</th>
									<th class="px-3 py-2 text-left">Bénéficiaire</th>
									<th class="px-3 py-2 text-right">Montant</th>
									<th class="px-3 py-2 text-right">Frais</th>
									<th class="px-3 py-2 text-left">Statut</th>
									<th class="px-3 py-2 text-left">Date</th>
									<th class="px-3 py-2 text-left">Action</th>
								</tr>
							</thead>
							<tbody>
								@if (transfers$ | async; as transfers) {
									@for (transfer of transfers; track transfer.id) {
										<tr class="border-t">
											<td class="px-3 py-3 text-left font-medium">{{ transfer.codeReference }}</td>
											<td class="px-3 py-3 text-left">{{ transfer.nomExpediteur }}</td>
											<td class="px-3 py-3 text-left">{{ transfer.nomBeneficiaire }}</td>
											<td class="px-3 py-3 text-right">{{ formatMoney(transfer.montant, transfer.devise) }}</td>
											<td class="px-3 py-3 text-right">{{ formatMoney(transfer.montantFrais, transfer.devise) }}</td>
											<td class="px-3 py-3 text-left">
												<span class="rounded-full px-2 py-1 text-xs font-semibold" [class]="statusBadgeClass(transfer.statut)">
													{{ formatStatutTransfert(transfer.statut) }}
												</span>
											</td>
											<td class="px-3 py-3 text-left">{{ formatDate(transfer.creeLe) }}</td>
											<td class="px-3 py-3 text-left">
												<a class="text-xs text-primary" routerLink="/agent/payout-transfer">Ouvrir</a>
											</td>
										</tr>
									}
								}
							</tbody>
						</table>
					</div>
				</div>

				<div class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Résumé de caisse</h2>
					@if (cashSession$ | async; as session) {
						<div class="mt-4 space-y-2 text-sm">
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Solde ouverture</span>
								<span class="font-medium">{{ formatMoney(session.soldeOuverture, session.devise) }}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Solde actuel</span>
								<span class="font-medium">{{ formatMoney(session.soldeActuel, session.devise) }}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Total entrées</span>
								<span class="font-medium">{{ formatMoney(session.totalEntrees, session.devise) }}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Total sorties</span>
								<span class="font-medium">{{ formatMoney(session.totalSorties, session.devise) }}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Écart</span>
								<span class="font-medium">{{ formatMoney(session.ecart, session.devise) }}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Statut de session</span>
								<span class="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
									{{ formatStatutSession(session.statut) }}
								</span>
							</div>
						</div>
					}
				</div>
			</section>
		</okane-agent-layout>
	`,
})
export class AgentDashboardPageComponent {
	private readonly _service = inject(AgentDashboardService);

	public readonly stats$ = this._service.getDashboardStats();
	public readonly transfers$ = this._service.getRecentTransfers();
	public readonly alerts$ = this._service.getAlerts();
	public readonly cashSession$ = this._service.getCashSession();

	public readonly quickActions = [
		{ label: 'Nouvel envoi', link: '/agent/new-transfer' },
		{ label: "Paiement d'un transfert", link: '/agent/payout-transfer' },
		{ label: 'Ouvrir session de caisse', link: '/agent/cash-register' },
		{ label: 'Fermer session de caisse', link: '/agent/cash-register' },
		{ label: 'Signaler un écart de caisse', link: '/agent/cash-register' },
	];

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

	public formatStatutTransfert(status: StatutTransfert): string {
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

	public formatStatutSession(status: StatutSessionCaisse): string {
		return status === 'OPEN' ? 'OUVERTE' : 'FERMÉE';
	}

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}
}
