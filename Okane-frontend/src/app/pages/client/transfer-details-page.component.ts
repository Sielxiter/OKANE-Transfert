import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideDownload } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { ClientTransfersApiService } from './services/client-transfers.api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
	selector: 'okane-client-transfer-details-page',
	standalone: true,
	imports: [CommonModule, RouterLink, NgIcon, HlmButtonImports, DatePipe, AgentPageIntroComponent, AgentSectionCardComponent],
	providers: [provideIcons({ lucideArrowLeft, lucideDownload })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro eyebrow="Espace Client" [title]="referenceTitle()" subtitle="Consultez les détails complets du transfert."></okane-agent-page-intro>

				@if (transfer(); as current) {
					<div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
						<okane-agent-section-card title="Montants" subtitle="Synthèse financière du transfert.">
							<div class="grid gap-3 md:grid-cols-2">
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Montant envoyé</p>
									<p class="mt-2 text-lg font-semibold text-foreground">{{ current.sendAmount }} {{ current.sendCurrency }}</p>
								</div>
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Montant reçu</p>
									<p class="mt-2 text-lg font-semibold text-foreground">{{ current.receiveAmount }} {{ current.receiveCurrency }}</p>
								</div>
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Frais</p>
									<p class="mt-2 text-lg font-semibold text-foreground">{{ current.fees }} {{ current.sendCurrency }}</p>
								</div>
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Taux de change</p>
									<p class="mt-2 text-lg font-semibold text-foreground">1 {{ current.sendCurrency }} = {{ current.exchangeRate }} {{ current.receiveCurrency }}</p>
								</div>
							</div>
						</okane-agent-section-card>

						<okane-agent-section-card title="Participants" subtitle="Informations liées à l'envoi et au retrait.">
							<div class="space-y-3 text-sm">
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<p class="text-muted-foreground">Expéditeur</p>
									<p class="mt-1 font-medium text-foreground">{{ current.senderFullName }}</p>
									<p class="text-muted-foreground">{{ current.senderPhone || '-' }}</p>
								</div>
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<p class="text-muted-foreground">Bénéficiaire</p>
									<p class="mt-1 font-medium text-foreground">{{ current.beneficiaryFullName }}</p>
									<p class="text-muted-foreground">{{ current.beneficiaryPhone || '-' }}</p>
								</div>
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<p class="text-muted-foreground">Agence</p>
									<p class="mt-1 font-medium text-foreground">{{ current.agencyName || '-' }}</p>
									<p class="text-muted-foreground">{{ current.payoutAgencyName || '-' }}</p>
								</div>
							</div>
						</okane-agent-section-card>
					</div>

					<okane-agent-section-card title="Timeline" subtitle="Historique du statut du transfert.">
						<div class="space-y-3">
							@for (step of current.statusHistory; track step.createdAt) {
								<div class="rounded-2xl border border-border bg-background/80 p-4">
									<p class="text-sm font-medium text-foreground">{{ step.label }}</p>
									<p class="mt-1 text-sm text-muted-foreground">{{ step.description }}</p>
									<p class="mt-2 text-xs text-muted-foreground">{{ step.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
								</div>
							}
						</div>
					</okane-agent-section-card>

					<div class="flex flex-wrap gap-3">
						<button hlmBtn variant="outline" routerLink="/client/transfers">
							<ng-icon name="lucideArrowLeft" />
							Retour
						</button>
						<button hlmBtn type="button" (click)="downloadReceipt(current.reference)">
							<ng-icon name="lucideDownload" />
							Télécharger reçu
						</button>
					</div>
				} @else {
					<okane-agent-section-card title="Transfert introuvable" subtitle="Le transfert demandé n'existe pas ou ne vous appartient pas.">
						<a hlmBtn routerLink="/client/transfers">Retour à mes transferts</a>
					</okane-agent-section-card>
				}
			</div>
	`,
})
export class ClientTransferDetailsPageComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _api = inject(ClientTransfersApiService);
	protected readonly reference = this._route.snapshot.paramMap.get('reference') ?? '';
	protected readonly referenceTitle = () => `Transfert ${this.reference || ''}`;
	protected readonly transfer = toSignal(this._api.get(this.reference), { initialValue: null });

	public downloadReceipt(reference: string): void {
		this._api.receipt(reference).subscribe(() => void 0);
	}
}

