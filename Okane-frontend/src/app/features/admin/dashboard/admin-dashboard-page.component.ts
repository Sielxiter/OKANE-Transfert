import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideActivity,
	lucideArrowRightLeft,
	lucideArrowUpDown,
	lucideBadgeCheck,
	lucideBan,
	lucideBarChart3,
	lucideBuilding2,
	lucideClock,
	lucideCoins,
	lucideDownload,
	lucideFileText,
	lucideSend,
	lucideShield,
	lucideShieldAlert,
	lucideShieldCheck,
	lucideTrendingUp,
	lucideTriangleAlert,
	lucideUserCheck,
	lucideUserPlus,
	lucideUserRound,
	lucideUsers,
	lucideWallet,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import {
	AdminDashboardApiService,
	type AlertSeverity,
	type ApiAdminDashboard,
	type ApiRecentActivity,
	type ApiSystemAlert,
	type ApiTrendPoint,
} from './admin-dashboard.api';

interface KpiCard {
	title: string;
	value: string;
	icon: string;
	accent: string;
	note: string;
}

interface QuickAction {
	label: string;
	link: string;
	icon: string;
	accent: string;
}

interface AnalyticsTile {
	title: string;
	description: string;
	accent: string;
	preview: number[];
}

@Component({
	selector: 'okane-admin-dashboard-page',
	standalone: true,
	imports: [NgClass, RouterLink, NgIcon, HlmButtonImports, HlmSkeletonImports],
	providers: [
		provideIcons({
			lucideActivity,
			lucideArrowRightLeft,
			lucideArrowUpDown,
			lucideBadgeCheck,
			lucideBan,
			lucideBarChart3,
			lucideBuilding2,
			lucideClock,
			lucideCoins,
			lucideDownload,
			lucideFileText,
			lucideSend,
			lucideShield,
			lucideShieldAlert,
			lucideShieldCheck,
			lucideTrendingUp,
			lucideTriangleAlert,
			lucideUserCheck,
			lucideUserPlus,
			lucideUserRound,
			lucideUsers,
			lucideWallet,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div
			class="relative overflow-hidden rounded-3xl border border-border bg-background p-5 text-foreground shadow-sm transition-colors md:p-6"
		>
			<div class="pointer-events-none absolute -right-16 top-0 size-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute left-0 top-20 size-36 rounded-full bg-muted/60 blur-3xl"></div>

			<header class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Okane Transfer</p>
					<h1 class="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
						Admin Dashboard
					</h1>
					<p class="mt-2 text-sm text-muted-foreground md:text-base">
						Vue globale de la plateforme Okane Transfer
					</p>
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

			@if (error()) {
				<div
					class="relative mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive transition-colors"
				>
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Données partielles</p>
						<p class="mt-0.5 text-xs opacity-80">{{ error() }} — affichage avec valeurs par défaut.</p>
					</div>
				</div>
			}

			<section class="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				@for (kpi of kpis(); track kpi.title) {
					<article
						class="group rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md"
					>
						<div class="flex items-start justify-between gap-3">
							<div
								class="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-border/60 transition-colors"
								[ngClass]="kpi.accent"
							>
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
					<section
						class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
					>
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-semibold text-foreground">Activités récentes</h2>
								<p class="mt-1 text-sm text-muted-foreground">
									Flux de la plateforme sur les dernières minutes.
								</p>
							</div>
							<span
								class="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
							>
								<ng-icon name="lucideActivity" class="text-sm" />
								En direct
							</span>
						</div>

						<div class="mt-5 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
							@for (activity of activities(); track activity.id) {
								<div
									class="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-accent/10"
								>
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-border/50"
										[ngClass]="activityAccent(activity.module)"
									>
										<ng-icon [name]="activityIcon(activity.type, activity.module)" />
									</div>
									<div class="min-w-0 flex-1">
										<p class="font-medium text-foreground">{{ activity.title }}</p>
										<p class="mt-1 text-xs text-muted-foreground">{{ formatTimestamp(activity.createdAt) }}</p>
									</div>
								</div>
							}
							@if (activities().length === 0) {
								<div class="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
									<p class="text-sm font-medium text-foreground">Aucune activité récente</p>
									<p class="mt-1 text-xs text-muted-foreground">
										Le journal se remplira au fil des opérations admin.
									</p>
								</div>
							}
						</div>
					</section>

					<section
						class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
					>
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-semibold text-foreground">Mini analytics</h2>
								<p class="mt-1 text-sm text-muted-foreground">Structure prête pour la phase suivante.</p>
							</div>
						</div>

						<div class="mt-5 grid gap-4 md:grid-cols-3">
							@for (item of analytics(); track item.title) {
								<div
									class="rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
								>
									<p class="text-sm font-semibold text-foreground">{{ item.title }}</p>
									<p class="mt-1 text-xs text-muted-foreground">{{ item.description }}</p>
									<div class="mt-3 h-1 rounded-full" [ngClass]="item.accent"></div>
									<div class="mt-4 rounded-2xl border border-dashed border-border bg-background p-4">
										<div class="flex items-center justify-between">
											<span class="text-xs font-medium text-muted-foreground">Prévisualisation</span>
											<span
												class="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"
											>{{ item.preview.length > 0 ? 'Live' : 'Mock' }}</span>
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
					<section
						class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
					>
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-semibold text-foreground">Alertes système</h2>
								<p class="mt-1 text-sm text-muted-foreground">Points nécessitant un suivi prioritaire.</p>
							</div>
						</div>

						<div class="mt-5 space-y-3">
							@for (alert of alerts(); track alert.id) {
								<div
									class="rounded-2xl border p-4 shadow-sm transition-colors"
									[ngClass]="alertAccent(alert.severity)"
								>
									<div class="flex items-start justify-between gap-3">
										<div>
											<p class="font-semibold">{{ alert.title }}</p>
											<p class="mt-2 text-sm opacity-80">{{ alert.message }}</p>
										</div>
										<span
											class="rounded-full border border-current/20 px-2.5 py-1 text-xs font-semibold"
										>
											{{ severityLabel(alert.severity) }}
										</span>
									</div>
								</div>
							}
							@if (alerts().length === 0) {
								<div
									class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-emerald-700 shadow-sm transition-colors dark:text-emerald-300"
								>
									<p class="text-sm font-semibold">Aucune alerte critique</p>
									<p class="mt-1 text-xs opacity-80">
										Tous les modules connectés tournent dans les seuils attendus.
									</p>
								</div>
							}
						</div>
					</section>

					<section
						class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
					>
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
									<span
										class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground shadow-sm ring-1 ring-border/50"
									>
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
export class AdminDashboardPageComponent implements OnInit {
	private readonly _api = inject(AdminDashboardApiService);

	protected readonly summary = signal<ApiAdminDashboard | null>(null);
	protected readonly loading = signal<boolean>(true);
	protected readonly error = signal<string | null>(null);

	protected readonly quickActions: QuickAction[] = [
		{ label: 'Ajouter un utilisateur', link: '/admin/users/admins', icon: 'lucideUserPlus', accent: 'text-primary' },
		{ label: 'Créer une agence', link: '/admin/agencies', icon: 'lucideBuilding2', accent: 'text-secondary-foreground' },
		{ label: 'Voir transferts', link: '/admin/transfers', icon: 'lucideArrowRightLeft', accent: 'text-accent-foreground' },
		{ label: 'Vérifier conformité', link: '/admin/compliance', icon: 'lucideShieldCheck', accent: 'text-destructive' },
		{ label: 'Générer rapport', link: '/admin/reports', icon: 'lucideFileText', accent: 'text-primary' },
	];

	/**
	 * The 8 KPI cards are ALWAYS rendered, in their original order, with their
	 * original wording, icons and accents. When the API has not responded yet
	 * (or returned an error) the values fall back to "0" / "0 MAD" — the cards
	 * never disappear.
	 */
	protected readonly kpis = computed<KpiCard[]>(() => {
		const k = this.summary()?.kpis;
		const numberFr = (value: number | undefined) =>
			new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value ?? 0);
		const moneyFr = (value: number | undefined) =>
			new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value ?? 0) + ' MAD';

		return [
			{
				title: 'Total Utilisateurs',
				value: numberFr(k?.totalUsers),
				icon: 'lucideUsers',
				accent: 'bg-primary/10 text-primary',
				note: 'Depuis le mois dernier',
			},
			{
				title: 'Agences Actives',
				value: numberFr(k?.activeAgencies),
				icon: 'lucideBuilding2',
				accent: 'bg-secondary/50 text-secondary-foreground',
				note: 'Réseau opérationnel',
			},
			{
				title: "Transferts Aujourd'hui",
				value: numberFr(k?.transfersToday),
				icon: 'lucideArrowRightLeft',
				accent: 'bg-accent/50 text-accent-foreground',
				note: 'Flux en temps réel',
			},
			{
				title: 'Paiements en attente',
				value: numberFr(k?.pendingPayments),
				icon: 'lucideWallet',
				accent: 'bg-muted text-muted-foreground',
				note: "À traiter aujourd'hui",
			},
			{
				title: 'Revenus Totaux',
				value: moneyFr(k?.totalRevenue),
				icon: 'lucideCoins',
				accent: 'bg-primary/10 text-primary',
				note: 'Cumul de période',
			},
			{
				title: 'Agents Actifs',
				value: numberFr(k?.activeAgents),
				icon: 'lucideUserCheck',
				accent: 'bg-secondary/50 text-secondary-foreground',
				note: "Connectés aujourd'hui",
			},
			{
				title: 'Transactions Suspectes',
				value: numberFr(k?.suspiciousTransactions),
				icon: 'lucideShieldAlert',
				accent: 'bg-destructive/10 text-destructive',
				note: 'Sous revue KYC',
			},
			{
				title: 'Volume Mensuel',
				value: moneyFr(k?.monthlyVolume),
				icon: 'lucideBarChart3',
				accent: 'bg-primary/10 text-primary',
				note: 'Sur 30 jours',
			},
		];
	});

	protected readonly activities = computed<ApiRecentActivity[]>(() => this.summary()?.recentActivities ?? []);
	protected readonly alerts = computed<ApiSystemAlert[]>(() => this.summary()?.systemAlerts ?? []);

	protected readonly analytics = computed<AnalyticsTile[]>(() => {
		const summary = this.summary()?.analytics;
		const previewOf = (points: ApiTrendPoint[] | undefined): number[] =>
			points?.map((p) => Number(p.value) || 0) ?? [];

		return [
			{
				title: 'Transfer Trend',
				description: this.trendDescription(
					summary?.transferTrend,
					'Préparation des volumes de transferts pour la phase suivante.',
				),
				accent: 'bg-primary/10',
				preview: previewOf(summary?.transferTrend),
			},
			{
				title: 'Revenue Trend',
				description: this.trendDescription(
					summary?.revenueTrend,
					'Emplacement réservé pour les courbes de revenus.',
				),
				accent: 'bg-secondary/50',
				preview: previewOf(summary?.revenueTrend),
			},
			{
				title: 'User Growth',
				description: this.trendDescription(
					summary?.userGrowth,
					"Structure prête pour les futures analyses d'acquisition.",
				),
				accent: 'bg-accent/50',
				preview: previewOf(summary?.userGrowth),
			},
		];
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.loading.set(true);
		this.error.set(null);
		this._api.getSummary().subscribe({
			next: (data) => {
				this.summary.set(data);
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.loading.set(false);
			},
		});
	}

	protected formatTimestamp(value: string | Date | number | null | undefined): string {
		if (value == null) return '—';
		try {
			const d = value instanceof Date ? value : new Date(value);
			if (isNaN(d.getTime())) return '—';
			return d.toISOString().replace('T', ' ').slice(0, 16);
		} catch {
			return '—';
		}
	}

	protected severityLabel(severity: AlertSeverity): string {
		switch (severity) {
			case 'CRITICAL':
				return 'Critique';
			case 'HIGH':
				return 'Élevée';
			case 'MEDIUM':
				return 'Surveillance';
			case 'LOW':
			default:
				return 'Information';
		}
	}

	protected alertAccent(severity: AlertSeverity): string {
		switch (severity) {
			case 'CRITICAL':
				return 'border-destructive/30 bg-destructive/5 text-destructive';
			case 'HIGH':
				return 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300';
			case 'MEDIUM':
				return 'border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300';
			case 'LOW':
			default:
				return 'border-border bg-muted/30 text-foreground';
		}
	}

	/**
	 * Returns the 6 bar heights (in tenths of a rem) that drive the analytics
	 * preview block. When no live data is available we keep the original mock
	 * heights so the UI stays visually identical to the validated design.
	 */
	protected barsFor(preview: number[]): number[] {
		const fallback = [36, 58, 44, 72, 50, 64];
		if (!preview || preview.length === 0) return fallback;
		const max = Math.max(...preview, 0);
		if (max <= 0) return fallback;
		const points = preview.slice(-6);
		while (points.length < 6) points.unshift(0);
		return points.map((value) => {
			const ratio = value / max;
			const minHeight = 18;
			const maxHeight = 80;
			return Math.round(minHeight + ratio * (maxHeight - minHeight));
		});
	}

	private trendDescription(points: ApiTrendPoint[] | undefined, fallback: string): string {
		if (!points || points.length === 0) return fallback;
		const total = points.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
		const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(total);
		return `${formatted} sur ${points.length} dernier(s) point(s).`;
	}

	protected activityIcon(type: string, module: string): string {
		const upper = type?.toUpperCase() ?? '';
		if (upper.startsWith('AUTH_LOGIN_SUCCESS')) return 'lucideShieldCheck';
		if (upper.startsWith('AUTH_LOGIN_FAILURE')) return 'lucideShieldAlert';
		if (upper.startsWith('AUTH_PASSWORD')) return 'lucideShield';
		if (upper.startsWith('AUTH_')) return 'lucideShield';
		if (upper.includes('USER_CREATED')) return 'lucideUserPlus';
		if (upper.includes('USER_UPDATED')) return 'lucideUserCheck';
		if (upper.includes('USER_STATUS_CHANGED') || upper.includes('USER_DISABLED')) return 'lucideBan';
		if (upper.includes('AGENCY_AGENT_')) return 'lucideUsers';
		if (upper.includes('AGENCY_MANAGER_')) return 'lucideUserCheck';
		if (upper.startsWith('AGENCY_')) return 'lucideBuilding2';
		if (upper.startsWith('TRANSFER_')) return 'lucideSend';
		if (upper.startsWith('PAYMENT_')) return 'lucideBadgeCheck';
		if (upper.startsWith('FX_') || upper.startsWith('CURRENCY_')) return 'lucideArrowUpDown';
		if (upper.startsWith('FEE_')) return 'lucideCoins';
		if (upper.startsWith('KYC_') || upper.startsWith('COMPLIANCE_')) return 'lucideShieldAlert';
		if (upper.startsWith('REPORT_')) return 'lucideFileText';

		switch (module) {
			case 'AUTH':
				return 'lucideShield';
			case 'USERS':
				return 'lucideUserRound';
			case 'AGENCIES':
				return 'lucideBuilding2';
			case 'TRANSFERS':
				return 'lucideSend';
			case 'PAYMENTS':
				return 'lucideWallet';
			case 'CURRENCY':
				return 'lucideCoins';
			case 'COMPLIANCE':
				return 'lucideShieldAlert';
			case 'REPORTS':
				return 'lucideFileText';
			default:
				return 'lucideActivity';
		}
	}

	protected activityAccent(module: string): string {
		switch (module) {
			case 'AUTH':
				return 'bg-primary/10 text-primary';
			case 'USERS':
				return 'bg-primary/10 text-primary';
			case 'AGENCIES':
				return 'bg-secondary/50 text-secondary-foreground';
			case 'TRANSFERS':
				return 'bg-accent/50 text-accent-foreground';
			case 'PAYMENTS':
				return 'bg-secondary/50 text-secondary-foreground';
			case 'CURRENCY':
				return 'bg-muted text-muted-foreground';
			case 'COMPLIANCE':
				return 'bg-destructive/10 text-destructive';
			case 'REPORTS':
				return 'bg-primary/10 text-primary';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}

	private extractMessage(err: unknown): string {
		const fallback = 'Erreur réseau. Vérifiez votre connexion ou votre session.';
		if (typeof err === 'object' && err !== null) {
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
