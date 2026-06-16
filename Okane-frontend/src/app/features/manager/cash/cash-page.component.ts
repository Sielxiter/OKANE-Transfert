import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBanknote, lucideCheck } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ManagerCashApiService, type ApiCashClosure } from './manager-cash.api';

@Component({
	selector: 'okane-manager-cash-page',
	standalone: true,
	imports: [NgClass, DatePipe, NgIcon, HlmButtonImports, HlmSkeletonImports],
	providers: [
		provideIcons({
			lucideBanknote,
			lucideCheck,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Caisse</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Supervision Caisse</h1>
					<p class="mt-1 text-sm text-muted-foreground">
						Contrôle des sessions fermées présentant des écarts de caisse.
					</p>
				</div>
			</header>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Écarts détectés</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ discrepancyCount() }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">En revue</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ pendingCount() }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Validées</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ validatedCount() }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Total observé</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ closures().length }}</p>
				</div>
			</div>

			@if (loading()) {
				<div class="rounded-2xl border border-border bg-muted/20 p-4">
					@for (_ of [1,2,3]; track $index) {
						<div class="flex items-center gap-4 py-3">
							<div hlmSkeleton class="h-10 w-10 rounded-full"></div>
							<div class="flex-1 space-y-2">
								<div hlmSkeleton class="h-4 w-48 rounded-full"></div>
								<div hlmSkeleton class="h-3 w-32 rounded-full"></div>
							</div>
						</div>
					}
				</div>
			} @else if (error()) {
				<div class="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<p class="text-sm font-semibold">Erreur de chargement</p>
					<p class="mt-1 text-xs">{{ error() }}</p>
				</div>
			} @else {
				<div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-4 py-3 text-left">Agence</th>
									<th class="px-4 py-3 text-left">Agent</th>
									<th class="px-4 py-3 text-right">Ouverture</th>
									<th class="px-4 py-3 text-right">Courant</th>
									<th class="px-4 py-3 text-right">Déclaré</th>
									<th class="px-4 py-3 text-right">Écart</th>
									<th class="px-4 py-3 text-left">Date</th>
									<th class="px-4 py-3 text-left">Statut</th>
									<th class="px-4 py-3 text-left">Action</th>
								</tr>
							</thead>
							<tbody>
								@for (closure of closures(); track closure.id) {
									<tr class="border-t border-border transition-colors hover:bg-accent/10">
										<td class="px-4 py-3">
											<p class="font-medium text-foreground">{{ closure.agencyName }}</p>
											<p class="text-xs text-muted-foreground">{{ closure.agencyCode }}</p>
										</td>
										<td class="px-4 py-3">
											<p class="font-medium text-foreground">{{ closure.agentName }}</p>
											<p class="text-xs text-muted-foreground">{{ closure.agentEmail }}</p>
										</td>
										<td class="px-4 py-3 text-right text-foreground">{{ formatMoney(closure.openingBalance) }}</td>
										<td class="px-4 py-3 text-right text-foreground">{{ formatMoney(closure.expectedBalance) }}</td>
										<td class="px-4 py-3 text-right text-foreground">{{ formatMoney(closure.actualBalance) }}</td>
										<td class="px-4 py-3 text-right font-semibold" [ngClass]="differenceClass(closure.differenceAmount)">
											{{ formatMoney(closure.differenceAmount) }}
										</td>
										<td class="px-4 py-3 text-muted-foreground">{{ closure.closedAt | date:'short' }}</td>
										<td class="px-4 py-3">
											<span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" [ngClass]="statusClass(closure.status)">
												{{ statusLabel(closure.status) }}
											</span>
										</td>
										<td class="px-4 py-3">
											<button
												hlmBtn
												variant="ghost"
												size="sm"
												type="button"
												(click)="validateClosure(closure.id)"
												[disabled]="closure.status !== 'PENDING'"
											>
												<ng-icon name="lucideCheck" />
												Valider
											</button>
										</td>
									</tr>
								}
								@if (closures().length === 0) {
									<tr>
										<td colspan="9" class="px-4 py-8">
											<div class="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
												<ng-icon name="lucideBanknote" class="mx-auto text-3xl text-muted-foreground" />
												<p class="mt-3 text-sm font-medium text-foreground">Aucun écart de caisse</p>
												<p class="mt-1 text-xs text-muted-foreground">Les sessions clôturées avec anomalie apparaîtront ici.</p>
											</div>
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>
				</div>
			}
		</div>
	`,
})
export class ManagerCashPageComponent implements OnInit {
	private readonly _api = inject(ManagerCashApiService);

	protected readonly closures = signal<ApiCashClosure[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal('');

	protected readonly pendingCount = () => this.closures().filter(c => c.status === 'PENDING').length;
	protected readonly validatedCount = () => this.closures().filter(c => c.status === 'VALIDATED').length;
	protected readonly discrepancyCount = () => this.closures().filter(c => this.isDifferent(c.differenceAmount)).length;

	public ngOnInit(): void {
		this.loading.set(true);
		this._api.getDiscrepancies().subscribe({
			next: (data) => {
				this.closures.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger les écarts de caisse.');
				this.loading.set(false);
			},
		});
	}

	protected validateClosure(id: number): void {
		this._api.validateClosure(id).subscribe({
			next: () => this.ngOnInit(),
			error: () => this.error.set('Erreur lors de la validation'),
		});
	}

	protected statusLabel(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'En attente';
			case 'VALIDATED':
				return 'Validée';
			case 'REJECTED':
				return 'Rejetée';
			default:
				return status;
		}
	}

	protected statusClass(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
			case 'VALIDATED':
				return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
			case 'REJECTED':
				return 'bg-destructive/10 text-destructive';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}

	protected differenceClass(value: string): string {
		return this.isDifferent(value) ? 'text-destructive' : 'text-foreground';
	}

	protected formatMoney(value: string | number | null | undefined): string {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'MAD',
			maximumFractionDigits: 2,
		}).format(Number(value ?? 0));
	}

	private isDifferent(value: string | number | null | undefined): boolean {
		return Number(value ?? 0) !== 0;
	}
}
