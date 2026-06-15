import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideActivity,
	lucideArrowRightLeft,
	lucideBarChart3,
	lucideBuilding2,
	lucideClock,
	lucideCoins,
	lucideDownload,
	lucideFileText,
	lucideShieldAlert,
	lucideTrendingUp,
	lucideTriangleAlert,
	lucideUserPlus,
	lucideUsers,
	lucideWallet,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ManagerDashboardApiService, type ApiManagerDashboard, type ApiSystemAlert } from './manager-dashboard.api';

interface QuickAction {
	label: string;
	link: string;
	icon: string;
	accent: string;
}

@Component({
	selector: 'okane-manager-dashboard-page',
	standalone: true,
	imports: [NgClass, RouterLink, NgIcon, HlmButtonImports, HlmSkeletonImports],
	providers: [
		provideIcons({
			lucideActivity,
			lucideArrowRightLeft,
			lucideBarChart3,
			lucideBuilding2,
			lucideClock,
			lucideCoins,
			lucideDownload,
			lucideFileText,
			lucideShieldAlert,
			lucideTrendingUp,
			lucideTriangleAlert,
			lucideUserPlus,
			lucideUsers,
			lucideWallet,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="relative overflow-hidden rounded-3xl border border-border bg-background p-5 text-foreground shadow-sm md:p-6">
			<div class="pointer-events-none absolute -right-16 top-0 size-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute left-0 top-20 size-36 rounded-full bg-muted/60 blur-3xl"></div>

			<header class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Okane Transfer</p>
					<h1 class="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Manager Dashboard</h1>
					<p class="mt-2 text-sm text-muted-foreground md:text-base">Vue d'ensemble de vos sous-agences et operations</p>
				</div>

				<div class="flex items-center gap-2">
					<button hlmBtn variant="outline" size="sm" type="button" class="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground">
						<ng-icon name="lucideDownload" />
						Export
					</button>
				</div>
			</header>

			@if (loading()) {
				<div class="mt-6 space-y-4">
					<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						@for (_ of [1, 2, 3, 4]; track $index) {
							<div class="h-32 rounded-2xl border border-border bg-muted/20 p-4">
								<div hlmSkeleton class="h-4 w-24 rounded-full"></div>
								<div hlmSkeleton class="mt-4 h-10 w-28 rounded-full"></div>
								<div hlmSkeleton class="mt-3 h-3 w-32 rounded-full"></div>
							</div>
						}
					</div>
					<div class="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
						<div class="h-[30rem] rounded-2xl border border-border bg-muted/20 p-4"></div>
						<div class="h-[30rem] rounded-2xl border border-border bg-muted/20 p-4"></div>
					</div>
				</div>
			} @else {
				@if (error()) {
					<div class="relative mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive">
						<ng-icon name="lucideTriangleAlert" class="text-base" />
						<div class="leading-tight">
							<p class="text-xs font-semibold">Donnees partielles</p>
							<p class="mt-0.5 text-xs opacity-80">{{ error() }} - affichage avec valeurs par defaut.</p>
						</div>
					</div>
				}

				<section class="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					@for (kpi of dashboard()?.kpis ?? []; track kpi.title) {
						<article class="group rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md">
							<div class="flex items-start justify-between gap-3">
								<div class="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-border/60 transition-colors" [ngClass]="kpi.accent">
									<ng-icon [name]="kpi.icon" class="text-lg" />
								</div>
							</div>
							<div class="mt-4">
								<p class="text-sm font-medium text-muted-foreground">{{ kpi.title }}</p>
								<p class="mt-2 text-3xl font-semibold tracking-tight text-foreground">{{ kpi.value }}</p>
								<p class="mt-2 text-xs text-muted-foreground">{{ kpi.note }}</p>
							</div>
						</article>
					}
				</section>

				<div class="relative mt-8 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
					<div class="space-y-4">
						<section class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors">
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold text-foreground">Activites recentes</h2>
									<p class="mt-1 text-sm text-muted-foreground">Flux de vos sous-agences sur les dernieres minutes.</p>
								</div>
								<span class="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
									<ng-icon name="lucideActivity" class="text-sm" />
									En direct
								</span>
							</div>

							<div class="mt-5 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
								@for (activity of dashboard()?.activities ?? []; track activity.id) {
									<div class="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-accent/10">
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-border/50" [ngClass]="activityAccent(activity.module)">
											<ng-icon [name]="activityIcon(activity.type)" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="font-medium text-foreground">{{ activity.title }}</p>
											<p class="mt-1 text-xs text-muted-foreground">{{ formatTimestamp(activity.createdAt) }}</p>
										</div>
									</div>
								}
								@if ((dashboard()?.activities ?? []).length === 0) {
									<div class="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
										<p class="text-sm font-medium text-foreground">Aucune activite recente</p>
										<p class="mt-1 text-xs text-muted-foreground">Le journal se remplira au fil des operations.</p>
									</div>
								}
							</div>
						</section>

						<section class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors">
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold text-foreground">Mini analytics</h2>
									<p class="mt-1 text-sm text-muted-foreground">Structure prete pour la phase suivante.</p>
								</div>
							</div>

							<div class="mt-5 grid gap-4 md:grid-cols-3">
								@for (item of dashboard()?.analytics ?? []; track item.title) {
									<div class="rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
										<p class="text-sm font-semibold text-foreground">{{ item.title }}</p>
										<p class="mt-1 text-xs text-muted-foreground">{{ item.description }}</p>
										<div class="mt-3 h-1 rounded-full" [ngClass]="item.accent"></div>
										<div class="mt-4 rounded-2xl border border-dashed border-border bg-background p-4">
											<div class="flex items-center justify-between">
												<span class="text-xs font-medium text-muted-foreground">Previsualisation</span>
												<span class="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
													{{ item.preview.length > 0 ? 'Live' : 'Mock' }}
												</span>
											</div>
											<div class="mt-4 grid grid-cols-6 gap-2">
												@for (bar of barsFor(item.preview); track $index) {
													<div hlmSkeleton class="w-full rounded-t-xl" [style.height.rem]="bar / 10"></div>
												}
											</div>
											<div class="mt-4 space-y-2">
												<div hlmSkeleton class="h-2 w-3/4 rounded-full"></div>
												<div hlmSkeleton class="h-2 w-1/2 rounded-full"></div>
											</div>
										</div>
									</div>
								}
							</div>
						</section>
					</div>

					<div class="space-y-4">
						<section class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors">
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold text-foreground">Alertes systeme</h2>
									<p class="mt-1 text-sm text-muted-foreground">Points necessitant un suivi prioritaire.</p>
								</div>
							</div>

							<div class="mt-5 space-y-3">
								@for (alert of dashboard()?.alerts ?? []; track alert.id) {
									<div class="rounded-2xl border p-4 shadow-sm transition-colors" [ngClass]="alertAccent(alert.severity)">
										<div class="flex items-start gap-3">
											<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/70 ring-1 ring-border/60">
												<ng-icon [name]="alertIcon(alert.severity)" />
											</div>
											<div class="min-w-0">
												<p class="font-semibold text-foreground">{{ alert.title }}</p>
												<p class="mt-1 text-sm text-muted-foreground">{{ alert.description }}</p>
											</div>
										</div>
									</div>
								}
							</div>
						</section>

						<section class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors">
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="text-lg font-semibold text-foreground">Actions rapides</h2>
									<p class="mt-1 text-sm text-muted-foreground">Raccourcis operateurs pour la supervision.</p>
								</div>
							</div>

							<div class="mt-5 grid gap-3">
								@for (action of quickActions; track action.link) {
									<a
										[routerLink]="action.link"
										class="group flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3 transition-colors hover:bg-accent/10"
									>
										<div class="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-border/60" [ngClass]="action.accent">
											<ng-icon [name]="action.icon" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="font-medium text-foreground">{{ action.label }}</p>
										</div>
									</a>
								}
							</div>
						</section>
					</div>
				</div>
			}
		</div>
	`,
})
export class ManagerDashboardPageComponent implements OnInit {
	private readonly _api = inject(ManagerDashboardApiService);

	protected readonly dashboard = signal<ApiManagerDashboard | null>(null);
	protected readonly loading = signal(true);
	protected readonly error = signal('');

	protected readonly quickActions: QuickAction[] = [
		{ label: 'Creer un agent', link: '/manager/agents', icon: 'lucideUserPlus', accent: 'bg-primary/10 text-primary' },
		{ label: 'Voir les sous-agences', link: '/manager/sub-agencies', icon: 'lucideBuilding2', accent: 'bg-blue-500/10 text-blue-600' },
		{ label: 'Consulter les transferts', link: '/manager/transfers', icon: 'lucideArrowRightLeft', accent: 'bg-emerald-500/10 text-emerald-600' },
		{ label: 'Rapport journalier', link: '/manager/reports', icon: 'lucideFileText', accent: 'bg-amber-500/10 text-amber-600' },
	];

	public ngOnInit(): void {
		this._api.loadDashboard().subscribe({
			next: (dashboard) => {
				this.dashboard.set(dashboard);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger le tableau de bord manager.');
				this.loading.set(false);
			},
		});
	}

	protected formatTimestamp(value: string): string {
		const timestamp = new Date(value);
		if (Number.isNaN(timestamp.getTime())) {
			return 'A l instant';
		}
		const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp.getTime()) / 60_000));
		return diffMinutes < 60 ? `Il y a ${diffMinutes} min` : `Il y a ${Math.round(diffMinutes / 60)} h`;
	}

	protected activityAccent(module: string): string {
		switch (module) {
			case 'payments':
				return 'bg-emerald-500/10 text-emerald-600';
			case 'agents':
				return 'bg-blue-500/10 text-blue-600';
			case 'compliance':
				return 'bg-amber-500/10 text-amber-600';
			default:
				return 'bg-primary/10 text-primary';
		}
	}

	protected activityIcon(type: string): string {
		switch (type) {
			case 'TRANSFER_PAID':
				return 'lucideBadgeCheck';
			case 'AGENT_CREATED':
				return 'lucideUserPlus';
			case 'ALERT':
				return 'lucideShieldAlert';
			default:
				return 'lucideActivity';
		}
	}

	protected alertAccent(severity: ApiSystemAlert['severity']): string {
		switch (severity) {
			case 'HIGH':
				return 'border-destructive/30 bg-destructive/5';
			case 'MEDIUM':
				return 'border-amber-500/30 bg-amber-500/5';
			default:
				return 'border-border bg-muted/20';
		}
	}

	protected alertIcon(severity: ApiSystemAlert['severity']): string {
		switch (severity) {
			case 'HIGH':
				return 'lucideShieldAlert';
			case 'MEDIUM':
				return 'lucideTriangleAlert';
			default:
				return 'lucideClock';
		}
	}

	protected barsFor(values: number[]): number[] {
		return values.length > 0 ? values : [0, 0, 0, 0, 0, 0];
	}
}
