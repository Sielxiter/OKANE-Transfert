import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArchive,
	lucideArrowRightLeft,
	lucideBadgeCheck,
	lucideBarChart3,
	lucideBuilding2,
	lucideClipboardList,
	lucideCoins,
	lucideDownload,
	lucideEye,
	lucideFileText,
	lucideLandmark,
	lucidePieChart,
	lucideShare2,
	lucideTrendingDown,
	lucideTrendingUp,
	lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	REPORT_AGENCIES,
	REPORT_COUNTRIES,
	REPORT_KPIS,
	REPORT_PERIOD_LABELS,
	REPORT_STATUS_LABELS,
	REPORT_STATUS_VARIANTS,
	REPORT_TYPE_LABELS,
	type ReportPeriod,
	type ReportStatus,
	type ReportType,
} from './reports.mock';
import {
	AdminReportsApiService,
	type ApiAgencyPerformance,
	type ApiReportAnalytics,
	type ApiReportRow,
	type ApiReportSummary,
	type ApiRevenueTrendPoint,
	type ApiStatusDistribution,
	type ApiTrendPoint,
} from './admin-reports.api';

/** Internal row shape used by the template (maps from ApiReportRow). */
interface ReportRow {
	id: string;
	name: string;
	type: ReportType;
	period: ReportPeriod;
	periodRange: string;
	agency: { code: string; name: string } | null;
	countryCode: string;
	country: string;
	currency: string;
	status: ReportStatus;
	generatedAt: string;
	owner: string;
}

@Component({
	selector: 'okane-admin-reports-page',
	standalone: true,
	imports: [
		NgClass,
		NgIcon,
		HlmButtonImports,
		UsersPageHeaderComponent,
		UsersFiltersComponent,
		UserStatusBadgeComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersPlaceholderDialogComponent,
	],
	providers: [
		provideIcons({
			lucideArchive,
			lucideArrowRightLeft,
			lucideBadgeCheck,
			lucideBarChart3,
			lucideBuilding2,
			lucideClipboardList,
			lucideCoins,
			lucideDownload,
			lucideEye,
			lucideFileText,
			lucideLandmark,
			lucidePieChart,
			lucideShare2,
			lucideTrendingDown,
			lucideTrendingUp,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Reporting"
				title="Rapports"
				description="Consulter les rapports financiers, volumes de transferts, commissions, agences et performances globales."
				addLabel="Exporter PDF"
				actionIcon="lucideFileText"
				actionVariant="default"
				(addClicked)="openPdfExport()"
			>
				<button
					okaneHeaderActions
					hlmBtn
					size="sm"
					variant="outline"
					type="button"
					(click)="openCsvExport()"
				>
					<ng-icon name="lucideDownload" />
					Exporter CSV
				</button>
			</okane-users-page-header>

			@if (error()) {
				<div
					class="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive transition-colors"
				>
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Données partielles</p>
						<p class="mt-0.5 text-xs opacity-80">{{ error() }} — affichage avec valeurs par défaut.</p>
					</div>
				</div>
			}

			<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				@for (kpi of kpiCards(); track kpi.key) {
					<article
						class="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md"
					>
						<div class="flex items-start justify-between gap-2">
							<span
								class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-border/60"
								[ngClass]="kpi.accent"
							>
								<ng-icon [name]="kpi.icon" />
							</span>
							@if (kpi.trend) {
								<span
									class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
									[ngClass]="
										kpi.trend === 'up'
											? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
											: 'bg-destructive/10 text-destructive'
									"
								>
									<ng-icon [name]="kpi.trend === 'up' ? 'lucideTrendingUp' : 'lucideTrendingDown'" class="text-xs" />
									{{ kpi.change }}
								</span>
							}
						</div>
						<p class="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ kpi.label }}</p>
						<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">{{ kpi.value }}</p>
					</article>
				}
			</section>

			<section class="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
				<article
					class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<h2 class="text-base font-semibold text-foreground">Volume des transferts</h2>
							<p class="text-xs text-muted-foreground">Sur les 7 derniers jours.</p>
						</div>
						<span
							class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
						>
							<ng-icon name="lucideBarChart3" class="text-xs" />
							API
						</span>
					</div>

					<div class="mt-5 flex h-44 items-end gap-3">
						@for (b of volumeTrend(); track b.label) {
							<div class="flex flex-1 flex-col items-center gap-2">
								<div class="flex h-full w-full items-end">
									<div
										class="w-full rounded-t-xl bg-primary/70 transition-all duration-300 dark:bg-primary"
										[style.height.%]="b.value"
									></div>
								</div>
								<span class="text-xs text-muted-foreground">{{ b.label }}</span>
							</div>
						}
						@if (volumeTrend().length === 0) {
							<div class="flex flex-1 items-center justify-center text-xs text-muted-foreground">
								Aucune donnée disponible.
							</div>
						}
					</div>
				</article>

				<article
					class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<h2 class="text-base font-semibold text-foreground">Distribution par statut</h2>
							<p class="text-xs text-muted-foreground">Répartition des transferts (mock).</p>
						</div>
						<span
							class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
						>
							<ng-icon name="lucidePieChart" class="text-xs" />
							API
						</span>
					</div>

					<div class="mt-5 space-y-3">
						@for (item of statusDistribution(); track item.status) {
							<div>
								<div class="flex items-center justify-between text-xs">
									<span class="font-medium text-foreground">{{ item.status }}</span>
									<span class="text-muted-foreground">{{ item.count }} • {{ item.share }}%</span>
								</div>
								<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
									<div class="h-full rounded-full bg-primary/70 transition-all duration-300 dark:bg-primary" [style.width.%]="item.share"></div>
								</div>
							</div>
						}
						@if (statusDistribution().length === 0) {
							<p class="text-xs text-muted-foreground">Aucune donnée disponible.</p>
						}
					</div>
				</article>
			</section>

			<section class="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
				<article
					class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<h2 class="text-base font-semibold text-foreground">Revenus & commissions</h2>
							<p class="text-xs text-muted-foreground">Tendance sur 5 mois.</p>
						</div>
						<div class="flex items-center gap-3 text-xs">
							<span class="inline-flex items-center gap-1.5 text-muted-foreground">
								<span class="h-2.5 w-2.5 rounded-sm bg-primary/70 dark:bg-primary"></span>
								Revenus
							</span>
							<span class="inline-flex items-center gap-1.5 text-muted-foreground">
								<span class="h-2.5 w-2.5 rounded-sm bg-emerald-500/70 dark:bg-emerald-400/80"></span>
								Commissions
							</span>
						</div>
					</div>

					<div class="mt-5 flex h-44 items-end gap-4">
						@for (b of revenueTrend(); track b.label) {
							<div class="flex flex-1 flex-col items-center gap-2">
								<div class="flex h-full w-full items-end justify-center gap-1">
									<div class="w-3 rounded-t-md bg-primary/70 transition-all duration-300 dark:bg-primary" [style.height.%]="b.revenue"></div>
									<div class="w-3 rounded-t-md bg-emerald-500/70 transition-all duration-300 dark:bg-emerald-400/80" [style.height.%]="b.commission"></div>
								</div>
								<span class="text-xs text-muted-foreground">{{ b.label }}</span>
							</div>
						}
						@if (revenueTrend().length === 0) {
							<div class="flex flex-1 items-center justify-center text-xs text-muted-foreground">
								Aucune donnée disponible.
							</div>
						}
					</div>
				</article>

				<article
					class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<h2 class="text-base font-semibold text-foreground">Performance agences</h2>
							<p class="text-xs text-muted-foreground">Top agences par volume.</p>
						</div>
						<span
							class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
						>
							<ng-icon name="lucideBuilding2" class="text-xs" />
							{{ agencyPerformance().length }}
						</span>
					</div>

					<div class="mt-5 space-y-3">
						@for (row of agencyPerformance(); track row.agencyCode) {
							<div>
								<div class="flex items-center justify-between text-xs">
									<div class="leading-tight">
										<p class="font-medium text-foreground">{{ row.agencyName ?? '—' }}</p>
										<p class="font-mono text-muted-foreground">{{ row.agencyCode ?? '—' }}</p>
									</div>
									<div class="text-right leading-tight">
										<p class="font-mono text-foreground">{{ formatAmount(row.volume) }} {{ row.currency ?? '' }}</p>
										<p class="text-muted-foreground">{{ row.transferCount }} transferts</p>
									</div>
								</div>
								<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-primary/70 transition-all duration-300 dark:bg-primary"
										[style.width.%]="row.share"
									></div>
								</div>
							</div>
						}
						@if (agencyPerformance().length === 0) {
							<p class="text-xs text-muted-foreground">Aucune donnée disponible.</p>
						}
					</div>
				</article>
			</section>

			<okane-users-filters
				searchPlaceholder="Rechercher un rapport par nom, agence ou propriétaire..."
				[searchValue]="search()"
				[filters]="filterDefs()"
				(searchChange)="search.set($event)"
				(filterChange)="onFilterChange($event)"
			/>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div
					class="flex flex-col gap-1 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between"
				>
					<div>
						<h2 class="text-base font-semibold text-foreground">Catalogue des rapports</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total() }} rapport{{ total() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
					<okane-users-empty-state
						icon="lucideFileText"
						title="Aucun rapport ne correspond"
						description="Modifiez la recherche ou les filtres pour afficher des résultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Nom</th>
									<th class="px-5 py-3 text-left font-medium">Type</th>
									<th class="px-5 py-3 text-left font-medium">Période</th>
									<th class="px-5 py-3 text-left font-medium">Agence</th>
									<th class="px-5 py-3 text-left font-medium">Pays</th>
									<th class="px-5 py-3 text-left font-medium">Devise</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-left font-medium">Génération</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (report of filtered(); track report.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="font-medium text-foreground">{{ report.name }}</p>
												<p class="font-mono text-xs text-muted-foreground">{{ report.id }} • {{ report.owner }}</p>
											</div>
										</td>
										<td class="px-5 py-3">
											<span
												class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
											>{{ typeLabel(report.type) }}</span>
										</td>
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="text-foreground">{{ periodLabel(report.period) }}</p>
												<p class="font-mono text-xs text-muted-foreground">{{ report.periodRange }}</p>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">
											{{ report.agency ? report.agency.name : 'Toutes' }}
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ report.country }}</td>
										<td class="px-5 py-3">
											<span
												class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground"
											>{{ report.currency }}</span>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="statusLabel(report.status)"
												[variant]="statusVariant(report.status)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ report.generatedAt }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="reportActions(report)" />
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>
				}
			</section>
		</div>

		<okane-users-placeholder-dialog
			[open]="pdfDialog()"
			title="Exporter en PDF"
			(close)="pdfDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="csvDialog()"
			title="Exporter en CSV"
			(close)="csvDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="shareDialog()"
			title="Partager le rapport"
			(close)="shareDialog.set(false)"
		/>
	`,
})
export class AdminReportsPageComponent implements OnInit {
	private readonly _api = inject(AdminReportsApiService);

	// ─── API state ──────────────────────────────────────────────────────────────
	protected readonly reports = signal<ReportRow[]>([]);
	protected readonly summary = signal<ApiReportSummary | null>(null);
	protected readonly analytics = signal<ApiReportAnalytics | null>(null);
	protected readonly error = signal<string | null>(null);

	// ─── Analytics display signals ──────────────────────────────────────────────
	protected readonly volumeTrend = computed<ApiTrendPoint[]>(() =>
		this.analytics()?.transferVolume ?? [],
	);
	protected readonly revenueTrend = computed<ApiRevenueTrendPoint[]>(() =>
		this.analytics()?.revenueCommissions ?? [],
	);
	protected readonly agencyPerformance = computed<ApiAgencyPerformance[]>(() =>
		this.analytics()?.agencyPerformance ?? [],
	);
	protected readonly statusDistribution = computed<ApiStatusDistribution[]>(() =>
		this.analytics()?.statusDistribution ?? [],
	);

	// ─── Filters ────────────────────────────────────────────────────────────────
	protected readonly search = signal<string>('');
	protected readonly type = signal<string>('all');
	protected readonly period = signal<string>('all');
	protected readonly agency = signal<string>('all');
	protected readonly country = signal<string>('all');
	protected readonly currency = signal<string>('all');
	protected readonly status = signal<string>('all');

	// ─── Dialogs ────────────────────────────────────────────────────────────────
	protected readonly pdfDialog = signal<boolean>(false);
	protected readonly csvDialog = signal<boolean>(false);
	protected readonly shareDialog = signal<boolean>(false);

	// ─── Computed ───────────────────────────────────────────────────────────────
	protected readonly total = computed(() => this.reports().length);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'type',
			label: 'Type',
			value: this.type(),
			options: [
				{ value: 'all', label: 'Tous types' },
				{ value: 'FINANCIAL', label: 'Financier' },
				{ value: 'TRANSFERS', label: 'Transferts' },
				{ value: 'COMMISSIONS', label: 'Commissions' },
				{ value: 'AGENCIES', label: 'Agences' },
				{ value: 'COMPLIANCE', label: 'Conformité' },
				{ value: 'USERS', label: 'Utilisateurs' },
			],
		},
		{
			key: 'period',
			label: 'Période',
			value: this.period(),
			options: [
				{ value: 'all', label: 'Toutes périodes' },
				{ value: 'DAILY', label: "Aujourd'hui" },
				{ value: 'WEEKLY', label: 'Cette semaine' },
				{ value: 'MONTHLY', label: 'Ce mois' },
				{ value: 'YEARLY', label: 'Cette année' },
				{ value: 'CUSTOM', label: 'Personnalisée' },
			],
		},
		{
			key: 'agency',
			label: 'Agence',
			value: this.agency(),
			options: [
				{ value: 'all', label: 'Toutes agences' },
				...REPORT_AGENCIES.map((a) => ({ value: a.code, label: a.name })),
			],
		},
		{
			key: 'country',
			label: 'Pays',
			value: this.country(),
			options: [
				{ value: 'all', label: 'Tous pays' },
				...REPORT_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
			],
		},
		{
			key: 'currency',
			label: 'Devise',
			value: this.currency(),
			options: [
				{ value: 'all', label: 'Toutes devises' },
				{ value: 'MAD', label: 'MAD' },
				{ value: 'EUR', label: 'EUR' },
				{ value: 'USD', label: 'USD' },
				{ value: 'XOF', label: 'XOF' },
				{ value: 'MULTI', label: 'Multi-devises' },
			],
		},
		{
			key: 'status',
			label: 'Statut',
			value: this.status(),
			options: [
				{ value: 'all', label: 'Tous statuts' },
				{ value: 'AVAILABLE', label: 'Disponible' },
				{ value: 'PREPARING', label: 'En préparation' },
				{ value: 'ARCHIVED', label: 'Archivé' },
			],
		},
	]);

	protected readonly filtered = computed<ReportRow[]>(() => {
		const term = this.search().trim().toLowerCase();
		const type = this.type();
		const period = this.period();
		const agency = this.agency();
		const country = this.country();
		const currency = this.currency();
		const status = this.status();

		return this.reports().filter((r) => {
			if (type !== 'all' && r.type !== type) return false;
			if (period !== 'all' && r.period !== period) return false;
			if (agency !== 'all' && r.agency?.code !== agency) return false;
			if (country !== 'all' && r.countryCode !== country) return false;
			if (currency !== 'all' && r.currency !== currency) return false;
			if (status !== 'all' && r.status !== status) return false;
			if (!term) return true;
			return (
				r.name.toLowerCase().includes(term) ||
				r.id.toLowerCase().includes(term) ||
				r.owner.toLowerCase().includes(term) ||
				(r.agency?.name.toLowerCase().includes(term) ?? false)
			);
		});
	});

	protected readonly kpiCards = computed(() => {
		const s = this.summary();
		const valueByKey: Record<string, { value: string; change: string }> = {
			DAILY_VOLUME: { value: s ? String(s.dailyVolume) : '—', change: '' },
			MONTHLY_VOLUME: { value: s ? this.formatAmount(s.monthlyVolume) + ' MAD' : '—', change: '' },
			REVENUE: { value: s ? this.formatAmount(s.revenue) + ' MAD' : '—', change: '' },
			COMMISSIONS: { value: s ? this.formatAmount(s.totalCommissions) + ' MAD' : '—', change: '' },
			SUCCESS: { value: s ? String(s.successfulTransfers) : '—', change: '' },
			FAILURE_RATE: { value: s ? s.failureRate.toFixed(1) + '%' : '—', change: '' },
		};
		return REPORT_KPIS.map((kpi) => ({
			...kpi,
			value: valueByKey[kpi.key]?.value ?? '—',
			change: valueByKey[kpi.key]?.change ?? '',
		}));
	});

	// ─── Lifecycle ──────────────────────────────────────────────────────────────
	public ngOnInit(): void {
		this.loadAll();
	}

	private loadAll(): void {
		this.error.set(null);

		this._api.listReports().subscribe({
			next: (rows) => this.reports.set(rows.map((r) => this.toRow(r))),
			error: (err) => this.error.set(this.extractMessage(err)),
		});

		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => this.summary.set(null),
		});

		this._api.getAnalytics().subscribe({
			next: (data) => this.analytics.set(data),
			error: () => this.analytics.set(null),
		});
	}

	// ─── Mapping ────────────────────────────────────────────────────────────────
	private toRow(api: ApiReportRow): ReportRow {
		return {
			id: String(api.id),
			name: api.name ?? '—',
			type: (api.type as ReportType) ?? 'FINANCIAL',
			period: (api.period as ReportPeriod) ?? 'CUSTOM',
			periodRange: api.periodRange ?? '—',
			agency: api.agencyCode
				? { code: api.agencyCode, name: api.agencyName ?? api.agencyCode }
				: null,
			countryCode: api.country ?? 'ALL',
			country: api.country ?? 'Tous',
			currency: api.currency ?? 'MULTI',
			status: (api.status as ReportStatus) ?? 'PREPARING',
			generatedAt: api.generatedAt ?? '—',
			owner: api.generatedBy ?? 'Système',
		};
	}

	// ─── Filter handler ─────────────────────────────────────────────────────────
	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'type': this.type.set(change.value); break;
			case 'period': this.period.set(change.value); break;
			case 'agency': this.agency.set(change.value); break;
			case 'country': this.country.set(change.value); break;
			case 'currency': this.currency.set(change.value); break;
			case 'status': this.status.set(change.value); break;
		}
	}

	// ─── Export actions ─────────────────────────────────────────────────────────
	protected openPdfExport(): void {
		this.pdfDialog.set(true);
	}

	protected openCsvExport(): void {
		this.csvDialog.set(true);
	}

	// ─── Label helpers ───────────────────────────────────────────────────────────
	protected typeLabel(type: ReportType): string {
		return REPORT_TYPE_LABELS[type];
	}

	protected periodLabel(period: ReportPeriod): string {
		return REPORT_PERIOD_LABELS[period];
	}

	protected statusLabel(status: ReportStatus): string {
		return REPORT_STATUS_LABELS[status];
	}

	protected statusVariant(status: ReportStatus) {
		return REPORT_STATUS_VARIANTS[status];
	}

	protected formatAmount(value: number): string {
		const safe = Number.isFinite(value) ? value : 0;
		return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(safe);
	}

	// ─── Row actions ─────────────────────────────────────────────────────────────
	protected reportActions(report: ReportRow): UserActionItem[] {
		const isAvailable = report.status === 'AVAILABLE';
		const isArchived = report.status === 'ARCHIVED';
		const numId = Number(report.id);
		return [
			{
				label: 'Voir détails',
				icon: 'lucideEye',
				action: () => this._api.getReport(numId).subscribe({
					next: () => this.logAction('view', report.id),
					error: () => this.logAction('view-error', report.id),
				}),
			},
			...(isAvailable || isArchived
				? [
						{
							label: 'Télécharger PDF',
							icon: 'lucideFileText',
							action: () => this._api.exportPdf(numId).subscribe({
								next: () => this.pdfDialog.set(true),
								error: () => this.pdfDialog.set(true),
							}),
						},
						{
							label: 'Télécharger CSV',
							icon: 'lucideDownload',
							action: () => this._api.exportCsv(numId).subscribe({
								next: () => this.csvDialog.set(true),
								error: () => this.csvDialog.set(true),
							}),
						},
					]
				: []),
			{ label: 'Partager', icon: 'lucideShare2', action: () => this.shareDialog.set(true) },
			...(isArchived
				? []
				: [
						{
							label: 'Archiver',
							icon: 'lucideArchive',
							action: () => this.logAction('archive', report.id),
						},
					]),
		];
	}

	private logAction(action: string, ref: string): void {
		// eslint-disable-next-line no-console
		console.info(`[Reports] ${action}`, ref);
	}

	private extractMessage(err: unknown): string {
		const fallback = 'Erreur réseau. Vérifiez votre connexion ou votre session.';
		if (typeof err === 'object' && err !== null) {
			const e = err as { error?: { message?: string }; message?: string };
			return e.error?.message ?? e.message ?? fallback;
		}
		return fallback;
	}
}
