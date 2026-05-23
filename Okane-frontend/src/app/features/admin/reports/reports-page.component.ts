import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
	AGENCY_PERFORMANCE_MOCK,
	REPORT_AGENCIES,
	REPORT_COUNTRIES,
	REPORT_KPIS,
	REPORT_KPI_VALUES,
	REPORT_PERIOD_LABELS,
	REPORT_STATUS_LABELS,
	REPORT_STATUS_VARIANTS,
	REPORT_TYPE_LABELS,
	REPORTS_MOCK,
	REVENUE_TREND_MOCK,
	STATUS_DISTRIBUTION_MOCK,
	VOLUME_TREND_MOCK,
	type ReportPeriod,
	type ReportRow,
	type ReportStatus,
	type ReportType,
} from './reports.mock';

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
							Mock
						</span>
					</div>

					<div class="mt-5 flex h-44 items-end gap-3">
						@for (b of volumeTrend; track b.label) {
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
							Mock
						</span>
					</div>

					<div class="mt-5 space-y-3">
						@for (item of statusDistribution; track item.label) {
							<div>
								<div class="flex items-center justify-between text-xs">
									<span class="font-medium text-foreground">{{ item.label }}</span>
									<span class="text-muted-foreground">{{ item.count }} • {{ item.share }}%</span>
								</div>
								<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
									<div class="h-full rounded-full transition-all duration-300" [ngClass]="item.accent" [style.width.%]="item.share"></div>
								</div>
							</div>
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
							<p class="text-xs text-muted-foreground">Tendance sur 5 mois (mock).</p>
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
						@for (b of revenueTrend; track b.label) {
							<div class="flex flex-1 flex-col items-center gap-2">
								<div class="flex h-full w-full items-end justify-center gap-1">
									<div class="w-3 rounded-t-md bg-primary/70 transition-all duration-300 dark:bg-primary" [style.height.%]="b.revenue"></div>
									<div class="w-3 rounded-t-md bg-emerald-500/70 transition-all duration-300 dark:bg-emerald-400/80" [style.height.%]="b.commission"></div>
								</div>
								<span class="text-xs text-muted-foreground">{{ b.label }}</span>
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
							<p class="text-xs text-muted-foreground">Top 5 agences par volume (mock).</p>
						</div>
						<span
							class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
						>
							<ng-icon name="lucideBuilding2" class="text-xs" />
							{{ agencyPerformance.length }}
						</span>
					</div>

					<div class="mt-5 space-y-3">
						@for (row of agencyPerformance; track row.agency.code) {
							<div>
								<div class="flex items-center justify-between text-xs">
									<div class="leading-tight">
										<p class="font-medium text-foreground">{{ row.agency.name }}</p>
										<p class="font-mono text-muted-foreground">{{ row.agency.code }}</p>
									</div>
									<div class="text-right leading-tight">
										<p class="font-mono text-foreground">{{ formatAmount(row.volume) }} {{ row.currency }}</p>
										<p class="text-muted-foreground">{{ row.transfers }} transferts</p>
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
							{{ filtered().length }} sur {{ total }} rapport{{ total > 1 ? 's' : '' }}
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
export class AdminReportsPageComponent {
	protected readonly total = REPORTS_MOCK.length;
	protected readonly volumeTrend = VOLUME_TREND_MOCK;
	protected readonly revenueTrend = REVENUE_TREND_MOCK;
	protected readonly agencyPerformance = AGENCY_PERFORMANCE_MOCK;
	protected readonly statusDistribution = STATUS_DISTRIBUTION_MOCK;

	protected readonly search = signal<string>('');
	protected readonly type = signal<string>('all');
	protected readonly period = signal<string>('all');
	protected readonly agency = signal<string>('all');
	protected readonly country = signal<string>('all');
	protected readonly currency = signal<string>('all');
	protected readonly status = signal<string>('all');

	protected readonly pdfDialog = signal<boolean>(false);
	protected readonly csvDialog = signal<boolean>(false);
	protected readonly shareDialog = signal<boolean>(false);

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

		return REPORTS_MOCK.filter((r) => {
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

	protected readonly kpiCards = computed(() =>
		REPORT_KPIS.map((kpi) => ({
			...kpi,
			value: REPORT_KPI_VALUES[kpi.key]?.value ?? '—',
			change: REPORT_KPI_VALUES[kpi.key]?.change ?? '',
		})),
	);

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'type':
				this.type.set(change.value);
				break;
			case 'period':
				this.period.set(change.value);
				break;
			case 'agency':
				this.agency.set(change.value);
				break;
			case 'country':
				this.country.set(change.value);
				break;
			case 'currency':
				this.currency.set(change.value);
				break;
			case 'status':
				this.status.set(change.value);
				break;
		}
	}

	protected openPdfExport(): void {
		this.pdfDialog.set(true);
	}

	protected openCsvExport(): void {
		this.csvDialog.set(true);
	}

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
		return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
	}

	protected reportActions(report: ReportRow): UserActionItem[] {
		const isAvailable = report.status === 'AVAILABLE';
		const isArchived = report.status === 'ARCHIVED';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', report.id) },
			...(isAvailable || isArchived
				? [
						{
							label: 'Télécharger PDF',
							icon: 'lucideFileText',
							action: () => this.pdfDialog.set(true),
						},
						{
							label: 'Télécharger CSV',
							icon: 'lucideDownload',
							action: () => this.csvDialog.set(true),
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
}
