import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import {
	CloseCashSessionRequest,
	MouvementCaisse,
	OpenCashSessionRequest,
	SessionCaisse,
	StatutSessionCaisse,
} from '../../agent/models/agent-dashboard.models';
import { AgentCashSessionStoreService } from '../../agent/services/agent-cash-session-store.service';

@Component({
	selector: 'okane-agent-cash-register-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
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
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="openingBalance" [readonly]="!canEditOpeningBalance" />
						</label>
						<button
							class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
							type="button"
							(click)="openSession()"
							[disabled]="!canOpenSession"
						>
							{{ openSessionLabel }}
						</button>
						<button
							class="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-50"
							type="button"
							(click)="closeSession()"
							[disabled]="!isSessionOpen"
						>
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
									@if (movement.reference) {
										<p class="text-[11px] text-muted-foreground">Réf : {{ movement.reference }}</p>
									}
									<p class="text-xs text-muted-foreground">{{ movement.creeLe }}</p>
								</div>
								<span class="text-right text-sm font-semibold">
									<span>{{ formatTypeMouvement(movement.typeMouvement) }} | {{ formatMoney(movement.amountMad ?? movement.montant, 'MAD') }}</span>
									@if (hasOriginalAmount(movement)) {
										<span class="block text-[11px] font-normal text-muted-foreground">
											(original : {{ formatMoney(movement.amountOriginal ?? 0, movement.currencyOriginal ?? 'MAD') }})
										</span>
									}
								</span>
							</div>
						}
					</div>
				</div>

				<div class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Clôture de caisse</h2>
					<form class="mt-4 grid gap-3" [formGroup]="closingForm">
						<label class="text-sm">
							<span class="text-muted-foreground">Montant attendu</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" [value]="expectedAmount" readonly />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Montant réel</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="actualAmount" [readonly]="!isSessionOpen" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Écart</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="difference" readonly />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Motif / commentaire</span>
							<textarea class="mt-1 w-full rounded-md border px-3 py-2" rows="3" formControlName="reason" [readonly]="!isSessionOpen"></textarea>
						</label>
						<button
							class="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-50"
							type="button"
							(click)="closeSession()"
							[disabled]="!isSessionOpen"
						>
							Clôturer la caisse
						</button>
					</form>
					@if (closureMessage) {
						<p class="mt-3 text-sm text-muted-foreground">{{ closureMessage }}</p>
					}
				</div>
		</section>
	`,
})
export class AgentCashRegisterPageComponent implements OnInit {
	private readonly _service = inject(AgentDashboardService);
	private readonly _cashSessionStore = inject(AgentCashSessionStoreService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);
	private readonly _destroyRef = inject(DestroyRef);

	public session: SessionCaisse | null = null;
	public movements: MouvementCaisse[] = [];
	public statusMessage = '';
	public closureMessage = '';

	public readonly openForm = this._fb.group({
		openingBalance: 10000,
	});

	public readonly closingForm = this._fb.group({
		actualAmount: 0,
		difference: 0,
		reason: '',
	});

	constructor() {}

	public ngOnInit(): void {
		this._cashSessionStore.ensureLoaded();
		this._cashSessionStore.session$
			.pipe(takeUntilDestroyed(this._destroyRef))
			.subscribe((session) => {
				this.session = { ...session };
				this.syncOpeningBalance();
				this.syncClosingForm();
				this.updateDifference();
				this.loadMovements();
				this._cdr.markForCheck();
			});
		this.loadMovements();
		this.closingForm.get('actualAmount')?.valueChanges.subscribe(() => this.updateDifference());
	}

	public get expectedAmount(): number {
		return this.session?.montantAttendu ?? 0;
	}

	public get isSessionOpen(): boolean {
		return this.session?.statut === 'OPEN';
	}

	public get canOpenSession(): boolean {
		return this.session?.statut !== 'OPEN';
	}

	public get hasExistingSession(): boolean {
		return !!this.session?.id;
	}

	public get canEditOpeningBalance(): boolean {
		return !this.hasExistingSession;
	}

	public get openSessionLabel(): string {
		return this.hasExistingSession ? 'Rouvrir la session de caisse' : 'Ouvrir la session de caisse';
	}

	public openSession(): void {
		if (!this.canOpenSession) {
			this.statusMessage = this.isSessionOpen
				? 'Une session de caisse est déjà ouverte.'
				: 'La session de caisse du jour est fermée.';
			this._cdr.markForCheck();
			return;
		}
		const openingBalance = this.hasExistingSession
			? Number(this.session?.soldeOuverture ?? 0)
			: Number(this.openForm.get('openingBalance')?.value ?? 0);
		const payload: OpenCashSessionRequest = { soldeOuverture: openingBalance };
		this.statusMessage = '';
		this._cashSessionStore.openSession(payload).subscribe({
			next: (session) => {
				this.session = { ...session };
				this.statusMessage = 'Session de caisse ouverte.';
				this.loadMovements();
				this.syncOpeningBalance();
				this.syncClosingForm();
				this.updateDifference();
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.statusMessage = error?.error?.message ?? 'Impossible d\'ouvrir la session.';
				this._cdr.markForCheck();
			},
		});
	}

	public closeSession(): void {
		if (!this.session) {
			return;
		}
		const actual = Number(this.closingForm.get('actualAmount')?.value ?? 0);
		const difference = this.round(actual - this.expectedAmount);
		const reason = (this.closingForm.get('reason')?.value ?? '').toString().trim();

		if (difference !== 0 && !reason) {
			this.closureMessage = 'Le commentaire est obligatoire si l\'écart n\'est pas nul.';
			this._cdr.markForCheck();
			return;
		}

		const payload: CloseCashSessionRequest = {
			montantReel: actual,
			commentaire: reason || null,
		};
		this.closureMessage = '';
		this._cashSessionStore.closeSession(payload).subscribe({
			next: (session) => {
				this.session = { ...session };
				this.closureMessage = 'Session de caisse clôturée.';
				this.loadMovements();
				this.syncClosingForm();
				this.updateDifference();
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.closureMessage = error?.error?.message ?? 'Impossible de clôturer la session.';
				this._cdr.markForCheck();
			},
		});
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

	public hasOriginalAmount(movement: MouvementCaisse): boolean {
		const currency = movement.currencyOriginal ?? 'MAD';
		const original = movement.amountOriginal ?? movement.montant;
		const amountMad = movement.amountMad ?? movement.montant;
		return currency !== 'MAD' || this.round(original) !== this.round(amountMad);
	}

	private loadMovements(): void {
		this._service.getCashMovements().subscribe({
			next: (movements) => {
				this.movements = movements;
				this.applyMovementTotals();
				this._cdr.markForCheck();
			},
			error: () => {
				this._cdr.markForCheck();
			},
		});
	}

	private applyMovementTotals(): void {
		if (!this.session || this.session.statut !== 'OPEN') {
			return;
		}
		const totals = this.movements.reduce(
			(acc, movement) => {
				const amount = movement.amountMad ?? movement.montant;
				if (movement.typeMouvement === 'IN') {
					acc.entries += amount;
				} else if (movement.typeMouvement === 'OUT') {
					acc.exits += amount;
				}
				return acc;
			},
			{ entries: 0, exits: 0 }
		);
		const opening = this.session.soldeOuverture ?? 0;
		const expected = this.round(opening + totals.entries - totals.exits);
		this.session = {
			...this.session,
			totalEntrees: this.round(totals.entries),
			totalSorties: this.round(totals.exits),
			soldeActuel: expected,
			montantAttendu: expected,
		};
		this.syncClosingForm();
		this.updateDifference();
	}

	private updateDifference(): void {
		const actual = Number(this.closingForm.get('actualAmount')?.value ?? 0);
		const difference = this.round(actual - this.expectedAmount);
		this.closingForm.patchValue({ difference }, { emitEvent: false });
	}

	private syncOpeningBalance(): void {
		if (!this.session) {
			return;
		}
		this.openForm.patchValue({ openingBalance: this.session.soldeOuverture }, { emitEvent: false });
	}

	private syncClosingForm(): void {
		if (!this.session) {
			return;
		}
		this.closingForm.patchValue(
			{
				actualAmount: this.session.montantReel ?? this.session.montantAttendu ?? 0,
				reason: this.session.commentaireCloture ?? '',
			},
			{ emitEvent: false }
		);
	}

	private round(value: number): number {
		return Math.round(value * 100) / 100;
	}
}
