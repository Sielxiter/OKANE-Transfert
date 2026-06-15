import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideClipboardCheck,
	lucideCheck,
	lucideX,
	lucideTriangleAlert,
	lucideClock,
	lucideAlertTriangle,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ManagerValidationsApiService, type ApiValidation } from './manager-validations.api';

@Component({
	selector: 'okane-manager-validations-page',
	standalone: true,
	imports: [DatePipe, NgIcon, HlmButtonImports, HlmSkeletonImports],
	providers: [
		provideIcons({
			lucideClipboardCheck,
			lucideCheck,
			lucideX,
			lucideTriangleAlert,
			lucideClock,
			lucideAlertTriangle,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Approbations</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Validations en attente</h1>
					<p class="mt-1 text-sm text-muted-foreground">Approuvez ou rejetez les demandes de validation.</p>
				</div>
			</header>

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
					@for (validation of validations(); track validation.id) {
						<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
							<div class="flex items-start justify-between">
								<div class="flex items-start gap-3">
									<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
										<ng-icon name="lucideAlertTriangle" />
									</div>
									<div>
										<p class="font-medium text-foreground">{{ validation.description }}</p>
										<p class="mt-1 text-xs text-muted-foreground">
											Reference: {{ validation.reference }} | Type: {{ validation.type }} | Par: {{ validation.requesterName }}
										</p>
										<p class="mt-1 text-xs text-muted-foreground">
											<ng-icon name="lucideClock" class="inline text-xs" />
											{{ validation.requestedAt | date:'short' }}
										</p>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<button hlmBtn variant="outline" size="sm" class="gap-1 text-destructive hover:bg-destructive/10" (click)="reject(validation.id)">
										<ng-icon name="lucideX" class="text-xs" />
										Rejeter
									</button>
									<button hlmBtn size="sm" class="gap-1" (click)="approve(validation.id)">
										<ng-icon name="lucideCheck" class="text-xs" />
										Approuver
									</button>
								</div>
							</div>
						</div>
					}
					@if (validations().length === 0) {
						<div class="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
							<ng-icon name="lucideClipboardCheck" class="mx-auto text-3xl text-muted-foreground" />
							<p class="mt-3 text-sm font-medium text-foreground">Aucune validation en attente</p>
							<p class="mt-1 text-xs text-muted-foreground">Toutes les demandes ont ete traitees.</p>
						</div>
					}
				</div>
			}
		</div>
	`,
})
export class ManagerValidationsPageComponent implements OnInit {
	private readonly _api = inject(ManagerValidationsApiService);

	protected readonly validations = signal<ApiValidation[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal('');

	public ngOnInit(): void {
		this._api.getValidations().subscribe({
			next: (data) => {
				this.validations.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger les validations.');
				this.loading.set(false);
			},
		});
	}

	protected approve(id: number): void {
		this._api.approveValidation(id).subscribe({
			next: () => this.ngOnInit(),
			error: () => this.error.set('Erreur lors de l\'approbation'),
		});
	}

	protected reject(id: number): void {
		this._api.rejectValidation(id).subscribe({
			next: () => this.ngOnInit(),
			error: () => this.error.set('Erreur lors du rejet'),
		});
	}
}
