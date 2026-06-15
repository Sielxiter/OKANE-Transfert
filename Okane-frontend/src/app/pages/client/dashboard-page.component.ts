import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideCheckCircle2, lucideClock3, lucideCoins, lucideReceiptText, lucideSend, lucideArrowRightLeft } from '@ng-icons/lucide';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { ClientDashboardApiService } from './services/client-dashboard.api';
import { ClientLayoutComponent } from './client-layout.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'okane-client-dashboard-page',
	standalone: true,
	imports: [
		CommonModule,
		RouterLink,
		NgIcon,
		HlmButtonImports,
		ClientLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
	],
	providers: [provideIcons({ lucideSend, lucideClock3, lucideCheckCircle2, lucideCoins, lucideReceiptText, lucideBell, lucideArrowRightLeft })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-client-layout>
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					eyebrow="Espace Client"
					title="Tableau de bord"
					subtitle="Vue d'ensemble de vos transferts, alertes et notifications."
				/>

				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					@for (card of stats(); track card.title) {
						<div class="rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5">
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-sm text-muted-foreground">{{ card.title }}</p>
									<p class="mt-2 text-2xl font-semibold text-foreground">{{ card.value }}</p>
								</div>
								<div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<ng-icon [name]="card.icon" />
								</div>
							</div>
							<p class="mt-3 text-xs text-muted-foreground">{{ card.helper }}</p>
						</div>
					}
				</div>

				<div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
					<okane-agent-section-card title="Derniers transferts" subtitle="Les 5 transferts les plus récents.">
						<div class="overflow-x-auto">
							<table class="min-w-full text-left text-sm">
								<thead class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
									<tr>
										<th class="py-3 pr-4">Référence</th>
										<th class="py-3 pr-4">Bénéficiaire</th>
										<th class="py-3 pr-4">Montant</th>
										<th class="py-3 pr-4">Statut</th>
										<th class="py-3 pr-0">Action</th>
									</tr>
								</thead>
								<tbody>
									@for (transfer of recentTransfers(); track transfer.reference) {
										<tr class="border-t border-border/60">
											<td class="py-3 pr-4 font-medium text-foreground">{{ transfer.reference }}</td>
											<td class="py-3 pr-4 text-muted-foreground">{{ transfer.beneficiaryFullName }}</td>
											<td class="py-3 pr-4 text-muted-foreground">{{ transfer.sendAmount }} {{ transfer.sendCurrency }}</td>
											<td class="py-3 pr-4 text-muted-foreground">{{ transfer.status }}</td>
											<td class="py-3 pr-0">
												<a hlmBtn variant="outline" size="sm" [routerLink]="['/client/transfers', transfer.reference]">Voir</a>
											</td>
										</tr>
									}
								</tbody>
							</table>
						</div>
					</okane-agent-section-card>

					<okane-agent-section-card title="Notifications récentes" subtitle="Dernières alertes liées à votre compte.">
						<div class="space-y-3">
							@for (notification of recentNotifications(); track notification.id) {
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<div class="flex items-start justify-between gap-4">
										<div>
											<p class="font-medium text-foreground">{{ notification.title }}</p>
											<p class="mt-1 text-sm text-muted-foreground">{{ notification.message }}</p>
										</div>
										@if (!notification.read) {
											<span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Nouveau</span>
										}
									</div>
								</div>
							}
						</div>
					</okane-agent-section-card>
				</div>
			</div>
		</okane-client-layout>
	`,
})
export class ClientDashboardPageComponent {
	private readonly _api = inject(ClientDashboardApiService);
	protected readonly summary = toSignal(this._api.summary(), {
		initialValue: {
			totalTransfers: 0,
			pendingTransfers: 0,
			paidTransfers: 0,
			cancelledTransfers: 0,
			expiredTransfers: 0,
			totalSentAmount: 0,
			totalReceivedAmount: 0,
			totalFeesPaid: 0,
			defaultCurrency: 'MAD',
		},
	});
	protected readonly recentTransfersPage = toSignal(this._api.recentTransfers(5), { initialValue: { content: [] } as { content: any[] } });
	protected readonly recentNotificationsPage = toSignal(this._api.recentNotifications(5), { initialValue: { content: [] } as { content: any[] } });
	protected readonly recentTransfers = computed(() => this.recentTransfersPage().content ?? []);
	protected readonly recentNotifications = computed(() => this.recentNotificationsPage().content ?? []);

	protected readonly stats = computed(() => {
		const summary = this.summary();
		return [
			{ title: 'Total transferts', value: summary.totalTransfers, helper: 'Historique complet', icon: 'lucideArrowRightLeft' },
			{ title: 'En attente', value: summary.pendingTransfers, helper: 'À traiter ou valider', icon: 'lucideClock3' },
			{ title: 'Payés', value: summary.paidTransfers, helper: 'Déjà remis au bénéficiaire', icon: 'lucideCheckCircle2' },
			{ title: 'Total envoyé', value: `${summary.totalSentAmount} ${summary.defaultCurrency}`, helper: 'Montant brut transféré', icon: 'lucideSend' },
			{ title: 'Frais payés', value: `${summary.totalFeesPaid} ${summary.defaultCurrency}`, helper: 'Total des frais collectés', icon: 'lucideCoins' },
		];
	});
}
