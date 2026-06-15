import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBanknote,
	lucideCheck,
	lucideTriangleAlert,
	lucideEye,
	lucideClock,
	lucideAlertTriangle,
} from '@ng-icons/lucide';
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
			lucideTriangleAlert,
			lucideEye,
			lucideClock,
			lucideAlertTriangle,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Caisse</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Supervision Caisse</h1>
					<p class="mt-1 text-sm text-muted-foreground">Surveillez les clotures de caisse de vos agents.</p>
				</div>
			</header>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Sessions aujourd'hui</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ closures().length }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">En attente de validation</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ pendingCount() }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Ecarts detectes</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ discrepancyCount() }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Validees</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ validatedCount() }}</p>
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
				<div class="space-y-3">
					@for (closure of closures(); track closure.id) {
						<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
							<div class="flex items-start justify-between">
								<div class="flex items-start gap-3">
									<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" [ngClass]="closureStatusClass(closure.status)">
										<ng-icon [name]="closure.status === 'PENDING' ? 'lucideAlertTriangle' : closure.status === 'VALIDATED' ? 'lucideCheck' : 'lucideTriangleAlert'" />
									</div>
									<div>
										<p class="font-medium text-foreground">{{ closure.agentName }}</p>
										<p class="text-xs text-muted-foreground">{{ closure.agencyName }} — {{ closure.sessionDate | date:'shortDate' }}</p>
										<p class="mt-1 text-xs text-muted-foreground">
											Solde attendu: {{ closure.expectedBalance }} MAD | Reel: {{ closure.actualBalance }} MAD
										</p>
										@if (closure.differenceAmount !== '0.00') {
											<p class="mt-1 text-xs font-medium" [ngClass]="+closure.differenceAmount > 0 ? 'text-emerald-600' : 'text-destructive'">
												Ecart: {{ closure.differenceAmount }} MAD
											</p>
										}
									</div>
								</div>
								<div class="flex items-center gap-2">
									@if (closure.status === 'PENDING') {
										<button hlmBtn size="sm" (click)="validateClosure(closure.id)">
											<ng-icon name="lucideCheck" class="text-xs" />
											Valider
										</button>
									}
								</div>
							</div>
						</div>
					}
					@if (closures().length === 0) {
						<div class="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
							<ng-icon name="lucideBanknote" class="mx-auto text-3xl text-muted-foreground" />
							<p class="mt-3 text-sm font-medium text-foreground">Aucune cloture de caisse</p>
							<p class="mt-1 text-xs text-muted-foreground">Les clotures apparaitront ici.</p>
						</div>
					}
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
	protected readonly discrepancyCount = () => this.closures().filter(c => +c.differenceAmount !== 0).length;

	public ngOnInit(): void {
		this._api.getClosures().subscribe({
			next: (data) => {
				this.closures.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger les clotures.');
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

	protected closureStatusClass(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'bg-amber-500/10 text-amber-600';
			case 'VALIDATED':
				return 'bg-emerald-500/10 text-emerald-600';
			case 'REJECTED':
				return 'bg-destructive/10 text-destructive';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}
}
