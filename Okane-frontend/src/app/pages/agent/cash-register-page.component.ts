import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { MouvementCaisse, SessionCaisse, StatutSessionCaisse } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-cash-register-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Gestion de caisse">
			<section class="grid gap-4 lg:grid-cols-3">
				<div class="rounded-xl border bg-background p-4 shadow-sm lg:col-span-2">
					<h2 class="text-base font-semibold">Session de caisse</h2>
					@if (session) {
						<div class="mt-4 grid gap-3 md:grid-cols-2">
							<div class="rounded-lg border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Solde d'ouverture</p>
								<p class="text-sm font-semibold">{{ formatMoney(session.soldeOuverture, session.devise) }}</p>
							</div>
							<div class="rounded-lg border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Solde actuel</p>
								<p class="text-sm font-semibold">{{ formatMoney(session.soldeActuel, session.devise) }}</p>
							</div>
							<div class="rounded-lg border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Total entrées</p>
								<p class="text-sm font-semibold">{{ formatMoney(session.totalEntrees, session.devise) }}</p>
							</div>
							<div class="rounded-lg border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Total sorties</p>
								<p class="text-sm font-semibold">{{ formatMoney(session.totalSorties, session.devise) }}</p>
							</div>
							<div class="rounded-lg border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Écart</p>
								<p class="text-sm font-semibold">{{ formatMoney(session.ecart, session.devise) }}</p>
							</div>
							<div class="rounded-lg border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Statut de session</p>
								<p class="text-sm font-semibold">{{ formatStatutSession(session.statut) }}</p>
							</div>
						</div>
					}
				</div>

				<div class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Ouvrir / Fermer</h2>
					<form class="mt-4 grid gap-3" [formGroup]="openForm">
						<label class="text-sm">
							<span class="text-muted-foreground">Solde d'ouverture</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="openingBalance" />
						</label>
						<button class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="button" (click)="openSession()">
							Ouvrir la session de caisse
						</button>
						<button class="rounded-md border px-4 py-2 text-sm font-semibold" type="button" (click)="closeSession()">
							Fermer la session de caisse
						</button>
					</form>
					@if (statusMessage) {
						<p class="mt-3 text-sm text-muted-foreground">{{ statusMessage }}</p>
					}
				</div>
			</section>

			<section class="grid gap-4 lg:grid-cols-3">
				<div class="rounded-xl border bg-background p-4 shadow-sm lg:col-span-2">
					<h2 class="text-base font-semibold">Mouvements de caisse</h2>
					<div class="mt-4 space-y-3">
						@for (movement of movements; track movement.id) {
							<div class="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
								<div>
									<p class="text-sm font-semibold">{{ movement.motif }}</p>
									<p class="text-xs text-muted-foreground">{{ movement.creeLe }}</p>
								</div>
								<span class="text-sm font-semibold">
									{{ formatTypeMouvement(movement.typeMouvement) }} | {{ formatMoney(movement.montant, session?.devise ?? 'MAD') }}
								</span>
							</div>
						}
					</div>
				</div>

				<div class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Signaler un écart</h2>
					<form class="mt-4 grid gap-3" [formGroup]="discrepancyForm">
						<label class="text-sm">
							<span class="text-muted-foreground">Montant attendu</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="expectedAmount" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Montant réel</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="actualAmount" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Écart</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="difference" readonly />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Motif / commentaire</span>
							<textarea class="mt-1 w-full rounded-md border px-3 py-2" rows="3" formControlName="reason"></textarea>
						</label>
						<button class="rounded-md border px-4 py-2 text-sm font-semibold" type="button" (click)="submitDiscrepancy()">
							Envoyer le signalement
						</button>
					</form>
					@if (discrepancyMessage) {
						<p class="mt-3 text-sm text-muted-foreground">{{ discrepancyMessage }}</p>
					}
				</div>
			</section>
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
		reason: 'Petit écart de caisse constaté.',
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
		this.statusMessage = 'Session de caisse fermée localement.';
	}

	public submitDiscrepancy(): void {
		const expected = Number(this.discrepancyForm.get('expectedAmount')?.value ?? 0);
		const actual = Number(this.discrepancyForm.get('actualAmount')?.value ?? 0);
		this.discrepancyForm.patchValue({ difference: this.round(actual - expected) });
		this.discrepancyMessage = 'Signalement enregistré localement.';
	}

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatTypeMouvement(type: MouvementCaisse['typeMouvement']): string {
		return type === 'IN' ? 'ENTRÉE' : 'SORTIE';
	}

	public formatStatutSession(status: StatutSessionCaisse): string {
		return status === 'OPEN' ? 'OUVERTE' : 'FERMÉE';
	}

	private round(value: number): number {
		return Math.round(value * 100) / 100;
	}
}
