import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBanknote, lucideLoaderCircle, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentCashSessionApiService } from '../../agent/services/agent-cash-session.api';
import { AgentEmptyStateComponent } from '../../agent/ui/agent-empty-state.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentStatusBadgeComponent } from '../../agent/ui/agent-status-badge.component';

type CashMovement = {
	id: number;
	movementType: string;
	amount: number;
	description: string | null;
	createdAt: string | null;
};

@Component({
	selector: 'okane-agent-cash-register-page',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		NgIcon,
		HlmButtonImports,
		HlmInputImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentStatusBadgeComponent,
		AgentEmptyStateComponent,
	],
	providers: [
		provideIcons({
			lucideBanknote,
			lucideLoaderCircle,
			lucideX,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Gestion de caisse">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Gestion de caisse"
					subtitle="Session, mouvements et fermeture de caisse. Le solde d'ouverture est automatique."
				>
					<button hlmBtn size="sm" type="button" (click)="openSession()" [disabled]="loading() || session()?.hasActiveSession">
						@if (loading()) {
							<ng-icon name="lucideLoaderCircle" class="animate-spin" />
						}
						Ouvrir la session
					</button>
					<button hlmBtn variant="outline" size="sm" type="button" (click)="openCloseModal()" [disabled]="!session()?.hasActiveSession">
						Fermer la session
					</button>
				</okane-agent-page-intro>

				@if (error()) {
					<div class="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
						{{ error() }}
					</div>
				}

				@if (closeMessage()) {
					<div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">
						{{ closeMessage() }}
					</div>
				}

				<div class="grid gap-4 md:gap-6 lg:grid-cols-3">
					<okane-agent-section-card title="Session de caisse" class="lg:col-span-2">
						@if (session()) {
							<div class="grid gap-3 md:grid-cols-2">
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Solde d'ouverture</p>
									<p class="text-sm font-semibold text-foreground">{{ formatMoney(session()!.openingBalance) }}</p>
								</div>
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Solde actuel</p>
									<p class="text-sm font-semibold text-foreground">{{ formatMoney(session()!.currentBalance) }}</p>
								</div>
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Statut</p>
									<okane-agent-status-badge kind="session" [status]="session()!.status ?? 'CLOSED'" />
								</div>
								<div class="rounded-xl border border-border bg-muted/40 p-3">
									<p class="text-xs text-muted-foreground">Ouverte le</p>
									<p class="text-sm font-semibold text-foreground">{{ formatDate(session()!.openedAt) }}</p>
								</div>
							</div>
						} @else {
							<okane-agent-empty-state
								title="Aucune session active"
								description="Ouvrez une session pour déverrouiller les opérations de caisse."
							/>
						}
					</okane-agent-section-card>

					<okane-agent-section-card title="Récapitulatif">
						<div class="space-y-3">
							<div class="rounded-xl border border-border bg-background/80 px-3 py-2">
								<p class="text-xs text-muted-foreground">Current Balance</p>
								<p class="text-base font-semibold text-foreground">
									{{ session() ? formatMoney(session()!.currentBalance) : '—' }}
								</p>
							</div>
							<div class="rounded-xl border border-border bg-background/80 px-3 py-2">
								<p class="text-xs text-muted-foreground">Mouvements</p>
								<p class="text-base font-semibold text-foreground">{{ movements().length }}</p>
							</div>
							<div class="rounded-xl border border-border bg-background/80 px-3 py-2">
								<p class="text-xs text-muted-foreground">Solde d'ouverture</p>
								<p class="text-base font-semibold text-foreground">
									{{ session() ? formatMoney(session()!.openingBalance) : '—' }}
								</p>
							</div>
						</div>
					</okane-agent-section-card>
				</div>

				<div class="grid gap-4 md:gap-6 lg:grid-cols-3">
					<okane-agent-section-card title="Mouvements de caisse" class="lg:col-span-2">
						<div class="space-y-3">
							@if (movements().length > 0) {
								@for (movement of movements(); track movement.id) {
									<div class="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-accent/10">
										<div>
											<p class="text-sm font-semibold text-foreground">{{ movement.description ?? 'Mouvement caisse' }}</p>
											<p class="text-xs text-muted-foreground">{{ formatDate(movement.createdAt) }}</p>
										</div>
										<div class="text-right">
											<p class="text-sm font-semibold text-foreground">
												{{ movement.movementType === 'IN' ? '+' : '-' }}{{ formatMoney(movement.amount) }}
											</p>
											<p class="text-xs text-muted-foreground">{{ movement.movementType }}</p>
										</div>
									</div>
								}
							} @else {
								<okane-agent-empty-state
									title="Aucun mouvement"
									description="Les entrées et sorties de caisse apparaîtront ici."
								/>
							}
						</div>
					</okane-agent-section-card>

					<okane-agent-section-card title="Règles">
						<div class="space-y-3 text-sm text-muted-foreground">
							<div class="rounded-xl border border-border bg-muted/30 p-3">
								Le solde d'ouverture est calculé automatiquement à l'ouverture de session.
							</div>
							<div class="rounded-xl border border-border bg-muted/30 p-3">
								La fermeture compare le solde courant et le montant physiquement compté.
							</div>
							<div class="rounded-xl border border-border bg-muted/30 p-3">
								Un écart génère automatiquement un signalement pour le manager.
							</div>
						</div>
					</okane-agent-section-card>
				</div>
			</div>

			@if (showCloseModal()) {
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
					<div class="w-full max-w-lg rounded-3xl border border-border bg-background p-5 shadow-2xl">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Fermer session</p>
								<h2 class="mt-1 text-xl font-semibold text-foreground">Confirmation de clôture</h2>
							</div>
							<button hlmBtn variant="ghost" size="icon" type="button" (click)="showCloseModal.set(false)">
								<ng-icon name="lucideX" />
							</button>
						</div>

						<div class="mt-5 space-y-4">
							<div class="rounded-2xl border border-border bg-muted/30 p-4">
								<p class="text-xs text-muted-foreground">Current Balance</p>
								<p class="text-2xl font-semibold text-foreground">
									{{ session() ? formatMoney(session()!.currentBalance) : '—' }}
								</p>
							</div>

							<form class="grid gap-4" [formGroup]="closeForm">
								<label class="flex flex-col gap-1 text-sm">
									<span class="text-muted-foreground">Montant attendu</span>
									<input hlmInput type="number" min="0" step="0.01" formControlName="actualBalance" />
								</label>
							</form>

							<div class="flex items-center justify-end gap-2">
								<button hlmBtn variant="outline" type="button" (click)="showCloseModal.set(false)">Annuler</button>
								<button hlmBtn type="button" (click)="confirmClose()" [disabled]="closing() || closeForm.invalid">
									@if (closing()) {
										<ng-icon name="lucideLoaderCircle" class="animate-spin" />
									}
									Confirmer la clôture
								</button>
							</div>
						</div>
					</div>
				</div>
			}
		</okane-agent-layout>
	`,
})
export class AgentCashRegisterPageComponent implements OnInit {
	private readonly _api = inject(AgentCashSessionApiService);
	private readonly _fb = inject(FormBuilder);

	protected readonly session = signal<{
		hasActiveSession: boolean;
		sessionId: number | null;
		sessionDate: string | null;
		openingBalance: number;
		currentBalance: number;
		status: string | null;
		openedAt: string | null;
	} | null>(null);
	protected readonly movements = signal<CashMovement[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal('');
	protected readonly closing = signal(false);
	protected readonly showCloseModal = signal(false);
	protected readonly closeMessage = signal('');

	protected readonly closeForm = this._fb.group({
		actualBalance: [0, [Validators.required, Validators.min(0)]],
	});

	public ngOnInit(): void {
		this.refresh();
	}

	protected openSession(): void {
		this.error.set('');
		this._api.openSession().subscribe({
			next: (status) => {
				this.session.set(status);
				this.showCloseModal.set(false);
				this.loading.set(false);
				this.refreshMovements();
			},
			error: () => this.error.set('Impossible d’ouvrir la session de caisse.'),
		});
	}

	protected openCloseModal(): void {
		this.closeMessage.set('');
		this.closeForm.patchValue({ actualBalance: this.session()?.currentBalance ?? 0 });
		this.showCloseModal.set(true);
	}

	protected confirmClose(): void {
		this.closeForm.markAllAsTouched();
		if (this.closeForm.invalid) {
			return;
		}

		const actual = Number(this.closeForm.controls.actualBalance.value ?? 0);
		this.closing.set(true);
		this.closeMessage.set('');
		this._api.closeSession(actual).subscribe({
			next: (result) => {
				this.closing.set(false);
				this.closeMessage.set(result.message);
				this.showCloseModal.set(false);
				this.refresh();
			},
			error: () => {
				this.closing.set(false);
				this.closeMessage.set('Impossible de clôturer la session.');
			},
		});
	}

	protected formatMoney(amount: number | null | undefined): string {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'MAD',
			maximumFractionDigits: 2,
		}).format(amount ?? 0);
	}

	protected formatDate(value: string | null | undefined): string {
		if (!value) return '—';
		const date = new Date(value);
		return isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR');
	}

	private refresh(): void {
		this.loading.set(true);
		this._api.getStatus().subscribe({
			next: (status) => {
				this.session.set(status);
				this.closeForm.patchValue({ actualBalance: status.currentBalance ?? 0 });
				this.loading.set(false);
				this.refreshMovements();
			},
			error: () => {
				this.error.set('Impossible de charger la session de caisse.');
				this.loading.set(false);
			},
		});
	}

	private refreshMovements(): void {
		this._api.getMovements().subscribe({
			next: (movements) => this.movements.set(movements),
			error: () => this.movements.set([]),
		});
	}
}
