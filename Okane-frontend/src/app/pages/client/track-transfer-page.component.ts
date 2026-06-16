import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideSearch } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { ClientTransfersApiService } from './services/client-transfers.api';
import type { ClientTrackTransfer } from './client.models';

@Component({
	selector: 'okane-client-track-transfer-page',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterLink, NgIcon, HlmButtonImports, HlmInputImports, AgentPageIntroComponent, AgentSectionCardComponent],
	providers: [provideIcons({ lucideSearch, lucideArrowRight })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro eyebrow="Espace Client" title="Suivi transfert" subtitle="Recherchez un transfert par référence."></okane-agent-page-intro>

				<okane-agent-section-card title="Recherche" subtitle="Entrez la référence du transfert.">
					<div class="flex flex-col gap-3 md:flex-row">
						<input hlmInput class="flex-1" [(ngModel)]="reference" placeholder="TRX-2026-0001" />
						<button hlmBtn type="button" (click)="search()"><ng-icon name="lucideSearch" /> Rechercher</button>
					</div>
					@if (error()) {
						<div class="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{{ error() }}</div>
					}
				</okane-agent-section-card>

				@if (result(); as transfer) {
					<okane-agent-section-card title="Résultat" subtitle="Résumé du transfert recherché.">
						<div class="grid gap-3 md:grid-cols-2">
							<div class="rounded-2xl border border-border bg-background/80 p-4">
								<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Référence</p>
								<p class="mt-1 font-medium text-foreground">{{ transfer.reference }}</p>
							</div>
							<div class="rounded-2xl border border-border bg-background/80 p-4">
								<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bénéficiaire</p>
								<p class="mt-1 font-medium text-foreground">{{ transfer.beneficiaryFullName }}</p>
							</div>
							<div class="rounded-2xl border border-border bg-background/80 p-4">
								<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Montant envoyé</p>
								<p class="mt-1 font-medium text-foreground">{{ transfer.sendAmount }} {{ transfer.sendCurrency }}</p>
							</div>
							<div class="rounded-2xl border border-border bg-background/80 p-4">
								<p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Montant reçu</p>
								<p class="mt-1 font-medium text-foreground">{{ transfer.receiveAmount }} {{ transfer.receiveCurrency }}</p>
							</div>
						</div>
						<div class="mt-4 flex flex-wrap gap-3">
							<a hlmBtn [routerLink]="['/client/transfers', transfer.reference]">Voir détails <ng-icon name="lucideArrowRight" /></a>
						</div>
					</okane-agent-section-card>
				}
			</div>
	`,
})
export class ClientTrackTransferPageComponent {
	private readonly _api = inject(ClientTransfersApiService);
	protected reference = '';
	protected readonly result = signal<ClientTrackTransfer | null>(null);
	protected readonly error = signal('');

	public search(): void {
		const ref = this.reference.trim();
		if (!ref) {
			this.error.set('Entrer le numéro de référence');
			this.result.set(null);
			return;
		}

		this.error.set('');
		this._api.track(ref).subscribe({
			next: (transfer) => this.result.set(transfer),
			error: () => {
				this.result.set(null);
				this.error.set("Aucun transfert trouvé avec cette référence.");
			},
		});
	}
}

