import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { MouvementCaisse, SessionCaisse } from '../../agent/models/agent-dashboard.models';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentStatusBadgeComponent } from '../../agent/ui/agent-status-badge.component';

@Component({
	selector: 'okane-agent-cash-register-page',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		HlmButtonImports,
		HlmInputImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentStatusBadgeComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Gestion de caisse">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Gestion de caisse"
					subtitle="Suivi local de session, mouvements et declaration d'ecart."
				/>

				<div class="grid gap-4 md:gap-6 lg:grid-cols-3">
					<okane-agent-section-card title="Session de caisse" class="lg:col-span-2">
						@if (session) {
							<div class="grid gap-3 md:gap-4 md:grid-cols-2">
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Solde d'ouverture</p>
									<p class="text-sm font-semibold text-foreground">{{ formatMoney(session.soldeOuverture, session.devise) }}</p>
								</div>
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Solde actuel</p>
									<p class="text-sm font-semibold text-foreground">{{ formatMoney(session.soldeActuel, session.devise) }}</p>
								</div>
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Total entrees</p>
									<p class="text-sm font-semibold text-foreground">{{ formatMoney(session.totalEntrees, session.devise) }}</p>
								</div>
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Total sorties</p>
									<p class="text-sm font-semibold text-foreground">{{ formatMoney(session.totalSorties, session.devise) }}</p>
								</div>
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Ecart</p>
									<p class="text-sm font-semibold text-foreground">{{ formatMoney(session.ecart, session.devise) }}</p>
								</div>
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Statut de session</p>
									<okane-agent-status-badge kind="session" [status]="session.statut" />
								</div>
							</div>
						}
					</okane-agent-section-card>

					<okane-agent-section-card title="Ouvrir / Fermer">
						<form class="grid gap-3 md:gap-4" [formGroup]="openForm">
							<label class="text-sm">
								<span class="text-muted-foreground">Solde d'ouverture</span>
								<input hlmInput class="mt-1 w-full" type="number" formControlName="openingBalance" />
							</label>
							<button hlmBtn type="button" (click)="openSession()">Ouvrir la session de caisse</button>
							<button hlmBtn variant="outline" type="button" (click)="closeSession()">Fermer la session de caisse</button>
						</form>
						@if (statusMessage) {
							<p class="mt-3 text-sm text-muted-foreground">{{ statusMessage }}</p>
						}
					</okane-agent-section-card>
				</div>

				<div class="grid gap-4 md:gap-6 lg:grid-cols-3">
					<okane-agent-section-card title="Mouvements de caisse" class="lg:col-span-2">
						<div class="space-y-3">
							@for (movement of movements; track movement.id) {
								<div class="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-accent/10">
									<div>
										<p class="text-sm font-semibold text-foreground">{{ movement.motif }}</p>
										<p class="text-xs text-muted-foreground">{{ movement.creeLe }}</p>
									</div>
									<span class="text-sm font-semibold text-foreground">
										{{ formatTypeMouvement(movement.typeMouvement) }} |
										{{ formatMoney(movement.montant, session?.devise ?? 'MAD') }}
									</span>
								</div>
							}
						</div>
					</okane-agent-section-card>

					<okane-agent-section-card title="Signaler un ecart">
						<form class="grid gap-3 md:gap-4" [formGroup]="discrepancyForm">
							<label class="text-sm">
								<span class="text-muted-foreground">Montant attendu</span>
								<input hlmInput class="mt-1 w-full" type="number" formControlName="expectedAmount" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Montant reel</span>
								<input hlmInput class="mt-1 w-full" type="number" formControlName="actualAmount" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Ecart</span>
								<input hlmInput class="mt-1 w-full" type="number" formControlName="difference" readonly />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Motif / commentaire</span>
								<textarea
									class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
									rows="3"
									formControlName="reason"
								></textarea>
							</label>
							<button hlmBtn variant="outline" type="button" (click)="submitDiscrepancy()">Envoyer le signalement</button>
						</form>
						@if (discrepancyMessage) {
							<p class="mt-3 text-sm text-muted-foreground">{{ discrepancyMessage }}</p>
						}
					</okane-agent-section-card>
				</div>
			</div>
		</okane-agent-layout>
	`,
})
export class AgentCashRegisterPageComponent {
	private readonly _service = inject(AgentDashboardService);
	private readonly _fb = inject(FormBuilder);

	public session: SessionCaisse | null = null;
	public movements: MouvementCaisse[] = [];
	public statusMessage = '';
	public discrepancyMessage = '';

	public readonly openForm = this._fb.group({
		openingBalance: 10000,
	});

	public readonly discrepancyForm = this._fb.group({
		expectedAmount: 15420,
		actualAmount: 15400,
		difference: -20,
		reason: 'Petit ecart de caisse constate.',
	});

	constructor() {
		this._service.getCashSession().subscribe((session) => (this.session = { ...session }));
		this._service.getCashMovements().subscribe((movements) => (this.movements = movements));
	}

	public openSession(): void {
		if (!this.session) {
			return;
		}

		const openingBalance = Number(this.openForm.get('openingBalance')?.value ?? 0);
		this.session = {
			...this.session,
			soldeOuverture: openingBalance,
			soldeActuel: openingBalance,
			statut: 'OPEN',
		};
		this.statusMessage = 'Session de caisse ouverte localement.';
	}

	public closeSession(): void {
		if (!this.session) {
			return;
		}

		this.session = { ...this.session, statut: 'CLOSED' };
		this.statusMessage = 'Session de caisse fermee localement.';
	}

	public submitDiscrepancy(): void {
		const expected = Number(this.discrepancyForm.get('expectedAmount')?.value ?? 0);
		const actual = Number(this.discrepancyForm.get('actualAmount')?.value ?? 0);
		this.discrepancyForm.patchValue({ difference: this.round(actual - expected) });
		this.discrepancyMessage = 'Signalement enregistre localement.';
	}

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatTypeMouvement(type: MouvementCaisse['typeMouvement']): string {
		return type === 'IN' ? 'ENTREE' : 'SORTIE';
	}

	private round(value: number): number {
		return Math.round(value * 100) / 100;
	}
}
