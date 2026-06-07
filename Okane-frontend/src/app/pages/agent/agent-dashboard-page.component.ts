import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideAlertTriangle,
	lucideArrowRightLeft,
	lucideBanknote,
	lucideClock3,
	lucideHistory,
	lucideReceiptText,
	lucideScanFace,
	lucideSend,
	lucideWallet,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { AgentEmptyStateComponent } from '../../agent/ui/agent-empty-state.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentStatCardComponent } from '../../agent/ui/agent-stat-card.component';
import { AgentStatusBadgeComponent } from '../../agent/ui/agent-status-badge.component';
import { AgentTableShellComponent } from '../../agent/ui/agent-table-shell.component';

@Component({
	selector: 'okane-agent-dashboard-page',
	standalone: true,
	imports: [
		CommonModule,
		RouterLink,
		NgIcon,
		HlmButtonImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentStatCardComponent,
		AgentStatusBadgeComponent,
		AgentEmptyStateComponent,
		AgentTableShellComponent,
	],
	providers: [
		provideIcons({
			lucideWallet,
			lucideSend,
			lucideReceiptText,
			lucideClock3,
			lucideArrowRightLeft,
			lucideHistory,
			lucideAlertTriangle,
			lucideBanknote,
			lucideScanFace,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Tableau de bord">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Dashboard Agent"
					subtitle="Vue operationnelle des transferts, paiements et activite de caisse."
				>
					<a hlmBtn variant="outline" size="sm" routerLink="/agent/new-transfer" agentIntroActions>
						<ng-icon name="lucideSend" />
						Nouvel envoi
					</a>
					<a hlmBtn size="sm" routerLink="/agent/payout-transfer" agentIntroActions>
						<ng-icon name="lucideArrowRightLeft" />
						Paiement
					</a>
				</okane-agent-page-intro>

				<section class="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-4">
					@if (stats$ | async; as stats) {
						<okane-agent-stat-card
							title="Solde caisse"
							[value]="formatMoney(stats.soldeCaisse, stats.devise)"
							note="Mis a jour"
							iconTone="bg-primary/10 text-primary"
						>
							<ng-icon statIcon name="lucideWallet" class="text-base" />
						</okane-agent-stat-card>
						<okane-agent-stat-card
							title="Transferts du jour"
							[value]="stats.transfertsJour + ''"
							note="Activite agent"
							iconTone="bg-secondary/50 text-secondary-foreground"
						>
							<ng-icon statIcon name="lucideSend" class="text-base" />
						</okane-agent-stat-card>
						<okane-agent-stat-card
							title="Paiements du jour"
							[value]="stats.paiementsJour + ''"
							note="Paiements termines"
							iconTone="bg-accent/50 text-accent-foreground"
						>
							<ng-icon statIcon name="lucideReceiptText" class="text-base" />
						</okane-agent-stat-card>
						<okane-agent-stat-card
							title="Transferts en attente"
							[value]="stats.transfertsEnAttente + ''"
							note="A traiter"
							iconTone="bg-muted text-muted-foreground"
						>
							<ng-icon statIcon name="lucideClock3" class="text-base" />
						</okane-agent-stat-card>
					}
				</section>

				<div class="grid gap-4 md:gap-6 xl:grid-cols-[1.35fr_0.85fr]">
					<div class="flex flex-col gap-6 md:gap-8">
						<okane-agent-section-card title="Actions rapides" subtitle="Raccourcis vers les operations courantes.">
							<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
								@for (action of quickActions; track action.label) {
									<a
										hlmBtn
										variant="outline"
										size="default"
										[routerLink]="action.link"
										class="justify-start border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
									>
										<ng-icon [name]="action.icon" class="text-sm" />
										{{ action.label }}
									</a>
								}
							</div>
						</okane-agent-section-card>

						<okane-agent-section-card title="Transactions recentes" subtitle="Dernieres operations enregistrees.">
							<a hlmBtn variant="ghost" size="sm" routerLink="/agent/transfer-history" agentSectionActions>
								<ng-icon name="lucideHistory" />
								Voir tout
							</a>

							<okane-agent-table-shell>
								<table class="w-full text-sm">
									<thead class="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
										<tr>
											<th class="px-4 py-3 text-left">Reference</th>
											<th class="px-4 py-3 text-left">Expediteur</th>
											<th class="px-4 py-3 text-left">Beneficiaire</th>
											<th class="px-4 py-3 text-right">Montant</th>
											<th class="px-4 py-3 text-right">Frais</th>
											<th class="px-4 py-3 text-left">Statut</th>
											<th class="px-4 py-3 text-left">Date</th>
											<th class="px-4 py-3 text-left">Action</th>
										</tr>
									</thead>
									<tbody>
										@if (transfers$ | async; as transfers) {
											@for (transfer of transfers; track transfer.id) {
												<tr class="border-t border-border transition-colors hover:bg-accent/10">
													<td class="px-4 py-3 font-medium text-foreground">{{ transfer.codeReference }}</td>
													<td class="px-4 py-3 text-foreground">{{ transfer.nomExpediteur }}</td>
													<td class="px-4 py-3 text-foreground">{{ transfer.nomBeneficiaire }}</td>
													<td class="px-4 py-3 text-right text-foreground">{{ formatMoney(transfer.montant, transfer.devise) }}</td>
													<td class="px-4 py-3 text-right text-muted-foreground">{{ formatMoney(transfer.montantFrais, transfer.devise) }}</td>
													<td class="px-4 py-3">
														<okane-agent-status-badge kind="transfer" [status]="transfer.statut" />
													</td>
													<td class="px-4 py-3 text-muted-foreground">{{ formatDate(transfer.creeLe) }}</td>
													<td class="px-4 py-3">
														<a hlmBtn variant="ghost" size="sm" routerLink="/agent/payout-transfer">Ouvrir</a>
													</td>
												</tr>
											}
											@if (transfers.length === 0) {
												<tr>
													<td colspan="8" class="px-4 py-4">
														<okane-agent-empty-state
															title="Aucune transaction recente"
															description="Les nouvelles operations apparaitront ici."
														/>
													</td>
												</tr>
											}
										}
									</tbody>
								</table>
							</okane-agent-table-shell>
						</okane-agent-section-card>
					</div>

					<div class="flex flex-col gap-6 md:gap-8">
						<okane-agent-section-card title="Alertes" subtitle="Elements qui demandent une attention immediate.">
							<div class="space-y-2">
								@if (alerts$ | async; as alerts) {
									@for (alert of alerts; track $index) {
										<div class="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-accent/10">
											<ng-icon name="lucideAlertTriangle" class="mt-0.5 text-destructive" />
											<p class="text-sm text-foreground">{{ alert }}</p>
										</div>
									}
								}
							</div>
						</okane-agent-section-card>

						<okane-agent-section-card title="Resume de caisse" subtitle="Synthese de la session courante.">
							@if (cashSession$ | async; as session) {
								<div class="space-y-2 text-sm">
									<div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/80 px-3 py-2">
										<span class="text-muted-foreground">Solde ouverture</span>
										<span class="font-medium text-foreground">{{ formatMoney(session.soldeOuverture, session.devise) }}</span>
									</div>
									<div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/80 px-3 py-2">
										<span class="text-muted-foreground">Solde actuel</span>
										<span class="font-medium text-foreground">{{ formatMoney(session.soldeActuel, session.devise) }}</span>
									</div>
									<div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/80 px-3 py-2">
										<span class="text-muted-foreground">Total entrees</span>
										<span class="font-medium text-foreground">{{ formatMoney(session.totalEntrees, session.devise) }}</span>
									</div>
									<div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/80 px-3 py-2">
										<span class="text-muted-foreground">Total sorties</span>
										<span class="font-medium text-foreground">{{ formatMoney(session.totalSorties, session.devise) }}</span>
									</div>
									<div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/80 px-3 py-2">
										<span class="text-muted-foreground">Ecart</span>
										<span class="font-medium text-foreground">{{ formatMoney(session.ecart, session.devise) }}</span>
									</div>
									<div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/80 px-3 py-2">
										<span class="text-muted-foreground">Statut de session</span>
										<okane-agent-status-badge kind="session" [status]="session.statut" />
									</div>
								</div>
							}
						</okane-agent-section-card>
					</div>
				</div>
			</div>
		</okane-agent-layout>
	`,
})
export class AgentDashboardPageComponent {
	private readonly _service = inject(AgentDashboardService);

	public readonly stats$ = this._service.getDashboardStats();
	public readonly transfers$ = this._service.getRecentTransfers();
	public readonly alerts$ = this._service.getAlerts();
	public readonly cashSession$ = this._service.getCashSession();

	public readonly quickActions: { label: string; link: string; icon: string }[] = [
		{ label: 'Nouvel envoi', link: '/agent/new-transfer', icon: 'lucideSend' },
		{ label: "Paiement d'un transfert", link: '/agent/payout-transfer', icon: 'lucideArrowRightLeft' },
		{ label: 'Gestion de caisse', link: '/agent/cash-register', icon: 'lucideBanknote' },
		{ label: 'Historique', link: '/agent/transfer-history', icon: 'lucideHistory' },
		{ label: 'Verification KYC', link: '/agent/kyc-verification', icon: 'lucideScanFace' },
	];

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}
}
