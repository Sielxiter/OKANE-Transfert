import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideActivity,
	lucideArrowRightLeft,
	lucideArrowUpDown,
	lucideBadgeCheck,
	lucideBarChart3,
	lucideBuilding2,
	lucideCoins,
	lucideDownload,
	lucideFileText,
	lucideSend,
	lucideShieldAlert,
	lucideShieldCheck,
	lucideTrendingDown,
	lucideTrendingUp,
	lucideUserCheck,
	lucideUserPlus,
	lucideUserRound,
	lucideUsers,
	lucideWallet,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import {
	adminActivities,
	adminAnalytics,
	adminAlerts,
	adminKpis,
	adminQuickActions,
	type AdminAlert,
	type AdminAnalyticsPlaceholder,
	type AdminActivity,
	type AdminKpi,
	type AdminQuickAction,
} from './admin-dashboard.mock';

@Component({
	selector: 'okane-admin-dashboard-page',
	standalone: true,
	imports: [NgClass, RouterLink, NgIcon, HlmButtonImports, HlmSkeletonImports],
	providers: [
		provideIcons({
			lucideDownload,
			lucideUsers,
			lucideBuilding2,
			lucideArrowRightLeft,
			lucideArrowUpDown,
			lucideWallet,
			lucideCoins,
			lucideUserCheck,
			lucideShieldAlert,
			lucideBarChart3,
			lucideSend,
			lucideBadgeCheck,
			lucideUserPlus,
			lucideFileText,
			lucideShieldCheck,
			lucideActivity,
			lucideUserRound,
			lucideTrendingDown,
			lucideTrendingUp,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="relative overflow-hidden rounded-3xl border border-border bg-background p-5 text-foreground shadow-sm transition-colors md:p-6">
			<div class="pointer-events-none absolute -right-16 top-0 size-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute left-0 top-20 size-36 rounded-full bg-muted/60 blur-3xl"></div>

			<header class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Okane Transfer</p>
					<h1 class="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Admin Dashboard</h1>
					<p class="mt-2 text-sm text-muted-foreground md:text-base">Vue globale de la plateforme Okane Transfer</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<button
						hlmBtn
						variant="outline"
						size="sm"
						type="button"
						class="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
					>
						<ng-icon name="lucideDownload" />
						Export
					</button>
				</div>
			</header>

			<section class="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				@for (kpi of kpis; track kpi.title) {
					<article class="group rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md">
						<div class="flex items-start justify-between gap-3">
							<div class="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-border/60 transition-colors" [ngClass]="kpi.accent">
								<ng-icon [name]="kpi.icon" class="text-lg" />
							</div>
							<span
								class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
								[ngClass]="kpi.trend === 'up' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'"
							>
								<ng-icon [name]="kpi.trend === 'up' ? 'lucideTrendingUp' : 'lucideTrendingDown'" class="text-xs" />
								{{ kpi.change }}
							</span>
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
								<h2 class="text-lg font-semibold text-foreground">Activités récentes</h2>
								<p class="mt-1 text-sm text-muted-foreground">Flux de la plateforme sur les dernières minutes.</p>
							</div>
							<span class="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
								<ng-icon name="lucideActivity" class="text-sm" />
								En direct
							</span>
						</div>

						<div class="mt-5 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
							@for (activity of activities; track activity.title) {
								<div class="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-accent/10">
									<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-border/50" [ngClass]="activity.accent">
										<ng-icon [name]="activity.icon" />
									</div>
									<div class="min-w-0 flex-1">
										<p class="font-medium text-foreground">{{ activity.title }}</p>
										<p class="mt-1 text-xs text-muted-foreground">{{ activity.time }}</p>
									</div>
								</div>
							}
						</div>
					</section>

					<section class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-semibold text-foreground">Mini analytics</h2>
								<p class="mt-1 text-sm text-muted-foreground">Structure prête pour la phase suivante.</p>
							</div>
						</div>

						<div class="mt-5 grid gap-4 md:grid-cols-3">
							@for (item of analytics; track item.title) {
								<div class="rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
									<p class="text-sm font-semibold text-foreground">{{ item.title }}</p>
									<p class="mt-1 text-xs text-muted-foreground">{{ item.description }}</p>
									<div class="mt-3 h-1 rounded-full" [ngClass]="item.accent"></div>
									<div class="mt-4 rounded-2xl border border-dashed border-border bg-background p-4">
										<div class="flex items-center justify-between">
											<span class="text-xs font-medium text-muted-foreground">Prévisualisation</span>
											<span class="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">Mock</span>
										</div>
										<div class="mt-4 grid grid-cols-6 gap-2">
											@for (bar of [36, 58, 44, 72, 50, 64]; track $index) {
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
								<h2 class="text-lg font-semibold text-foreground">Alertes système</h2>
								<p class="mt-1 text-sm text-muted-foreground">Points nécessitant un suivi prioritaire.</p>
							</div>
						</div>

						<div class="mt-5 space-y-3">
							@for (alert of alerts; track alert.title) {
								<div class="rounded-2xl border p-4 shadow-sm transition-colors" [ngClass]="alert.accent">
									<div class="flex items-start justify-between gap-3">
										<div>
											<p class="font-semibold">{{ alert.title }}</p>
											<p class="mt-2 text-sm opacity-80">{{ alert.description }}</p>
										</div>
										<span class="rounded-full border border-current/20 px-2.5 py-1 text-xs font-semibold">
											{{ alert.badge }}
										</span>
									</div>
								</div>
							}
						</div>
					</section>

					<section class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors">
						<div>
							<h2 class="text-lg font-semibold text-foreground">Actions rapides</h2>
							<p class="mt-1 text-sm text-muted-foreground">Navigation directe vers les modules admin.</p>
						</div>

						<div class="mt-5 grid gap-3">
							@for (action of quickActions; track action.label) {
								<a
									hlmBtn
									variant="outline"
									size="default"
									[routerLink]="action.link"
									class="justify-start border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
								>
									<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground shadow-sm ring-1 ring-border/50">
										<ng-icon [name]="action.icon" [ngClass]="action.accent" />
									</span>
									<span class="text-left">{{ action.label }}</span>
								</a>
							}
						</div>
					</section>
				</div>
			</div>
		</div>
	`,
})
export class AdminDashboardPageComponent {
	protected readonly kpis: AdminKpi[] = adminKpis;
	protected readonly activities: AdminActivity[] = adminActivities;
	protected readonly alerts: AdminAlert[] = adminAlerts;
	protected readonly quickActions: AdminQuickAction[] = adminQuickActions;
	protected readonly analytics: AdminAnalyticsPlaceholder[] = adminAnalytics;
}
