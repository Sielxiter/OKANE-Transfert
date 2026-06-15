import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBell,
	lucideCheck,
	lucideShieldAlert,
	lucideTriangleAlert,
	lucideClock,
	lucideAlertTriangle,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ManagerAlertsApiService, type ApiAlert } from './manager-alerts.api';

@Component({
	selector: 'okane-manager-alerts-page',
	standalone: true,
	imports: [NgClass, DatePipe, NgIcon, HlmButtonImports, HlmSkeletonImports],
	providers: [
		provideIcons({
			lucideBell,
			lucideCheck,
			lucideShieldAlert,
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
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Notifications</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Alertes</h1>
					<p class="mt-1 text-sm text-muted-foreground">Gerez les alertes de vos sous-agences.</p>
				</div>
			</header>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Total alertes</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ alerts().length }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Non resolues</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ unresolvedCount() }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Haute severite</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ highSeverityCount() }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
					<p class="text-sm text-muted-foreground">Resolues aujourd'hui</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ resolvedTodayCount() }}</p>
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
					@for (alert of alerts(); track alert.id) {
						<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
							<div class="flex items-start justify-between">
								<div class="flex items-start gap-3">
									<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" [ngClass]="severityClass(alert.severity)">
										<ng-icon [name]="alert.severity === 'HIGH' ? 'lucideShieldAlert' : alert.severity === 'MEDIUM' ? 'lucideTriangleAlert' : 'lucideClock'" />
									</div>
									<div>
										<p class="font-medium text-foreground">{{ alert.title }}</p>
										<p class="mt-1 text-sm text-muted-foreground">{{ alert.description }}</p>
										<p class="mt-1 text-xs text-muted-foreground">
											Type: {{ alert.type }} | {{ alert.createdAt | date:'short' }}
										</p>
									</div>
								</div>
								<div class="flex items-center gap-2">
									@if (alert.status !== 'RESOLVED') {
										<button hlmBtn size="sm" (click)="resolveAlert(alert.id)">
											<ng-icon name="lucideCheck" class="text-xs" />
											Resoudre
										</button>
									} @else {
										<span class="rounded-full px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600">Resolu</span>
									}
								</div>
							</div>
						</div>
					}
					@if (alerts().length === 0) {
						<div class="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
							<ng-icon name="lucideBell" class="mx-auto text-3xl text-muted-foreground" />
							<p class="mt-3 text-sm font-medium text-foreground">Aucune alerte</p>
							<p class="mt-1 text-xs text-muted-foreground">Tout est sous controle.</p>
						</div>
					}
				</div>
			}
		</div>
	`,
})
export class ManagerAlertsPageComponent implements OnInit {
	private readonly _api = inject(ManagerAlertsApiService);

	protected readonly alerts = signal<ApiAlert[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal('');

	protected readonly unresolvedCount = () => this.alerts().filter(a => a.status !== 'RESOLVED').length;
	protected readonly highSeverityCount = () => this.alerts().filter(a => a.severity === 'HIGH' && a.status !== 'RESOLVED').length;
	protected readonly resolvedTodayCount = () => 0;

	public ngOnInit(): void {
		this._api.getAlerts().subscribe({
			next: (data) => {
				this.alerts.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger les alertes.');
				this.loading.set(false);
			},
		});
	}

	protected resolveAlert(id: number): void {
		this._api.resolveAlert(id).subscribe({
			next: () => this.ngOnInit(),
			error: () => this.error.set('Erreur lors de la resolution'),
		});
	}

	protected severityClass(severity: string): string {
		switch (severity) {
			case 'HIGH':
				return 'bg-destructive/10 text-destructive';
			case 'MEDIUM':
				return 'bg-amber-500/10 text-amber-600';
			case 'LOW':
				return 'bg-blue-500/10 text-blue-600';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}
}
