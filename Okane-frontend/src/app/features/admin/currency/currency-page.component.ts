import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideBan,
	lucideClipboardList,
	lucideClock,
	lucideCoins,
	lucideEye,
	lucideHistory,
	lucidePencil,
	lucidePower,
	lucidePowerOff,
	lucideTrendingDown,
	lucideTrendingUp,
	lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersFormDialogComponent } from '../users/shared/users-form-dialog.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import { CurrencyCreateFormComponent } from './currency-create-form.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	CORRIDOR_STATUS_LABELS,
	CORRIDOR_STATUS_VARIANTS,
	CURRENCY_KPIS,
	CURRENCY_STATUS_LABELS,
	CURRENCY_STATUS_VARIANTS,
	type CorridorStatus,
	type CurrencyStatus,
} from './currency.mock';
import {
	AdminCurrencyApiService,
	type ApiCorridor,
	type ApiCurrency,
	type ApiCurrencyStatus,
	type ApiCurrencySummary,
	type ApiExchangeRateHistory,
} from './admin-currency.api';

interface CurrencyRow {
	id: number;
	code: string;
	name: string;
	symbol: string;
	mainCountry: string;
	mainCountryCode: string;
	rateToMad: number;
	status: CurrencyStatus;
	updatedAt: string;
}

interface CorridorRow {
	id: string;
	rawId: number;
	sourceCountry: string;
	sourceCountryCode: string;
	destCountry: string;
	destCountryCode: string;
	sourceCurrency: string;
	destCurrency: string;
	estimatedFee: string;
	status: CorridorStatus;
}

interface FxHistoryRow {
	id: string;
	currency: string;
	previousRate: number;
	newRate: number;
	changedAt: string;
	changedBy: string;
}

@Component({
	selector: 'okane-admin-currency-page',
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
		UsersFormDialogComponent,
		UsersPlaceholderDialogComponent,
		CurrencyCreateFormComponent,
	],
	providers: [
		provideIcons({
			lucideArrowRightLeft,
			lucideBan,
			lucideClipboardList,
			lucideClock,
			lucideCoins,
			lucideEye,
			lucideHistory,
			lucidePencil,
			lucidePower,
			lucidePowerOff,
			lucideTrendingDown,
			lucideTrendingUp,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Marchés & devises"
				title="Currency & FX"
				description="Gérer les devises, taux de change, corridors et historique des conversions."
				addLabel="Ajouter une devise"
				(addClicked)="openAddCurrency()"
			>
				<button
					okaneHeaderActions
					hlmBtn
					size="sm"
					variant="outline"
					type="button"
					(click)="openExport()"
				>
					<ng-icon name="lucideClipboardList" />
					Exporter
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

			<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				@for (kpi of kpiCards(); track kpi.key) {
					<article
						class="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md"
					>
						<div class="flex items-center justify-between gap-2">
							<span
								class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-border/60"
								[ngClass]="kpi.accent"
							>
								<ng-icon [name]="kpi.icon" />
							</span>
						</div>
						<p class="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ kpi.label }}</p>
						<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">{{ kpi.value }}</p>
						@if (kpi.suffix) {
							<p class="mt-0.5 text-xs text-muted-foreground">{{ kpi.suffix }}</p>
						}
					</article>
				}
			</section>

			<okane-users-filters
				searchPlaceholder="Rechercher une devise par code, nom ou pays..."
				[searchValue]="ccySearch()"
				[filters]="ccyFilterDefs()"
				(searchChange)="ccySearch.set($event)"
				(filterChange)="onCcyFilterChange($event)"
			/>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div
					class="flex flex-col gap-1 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between"
				>
					<div>
						<h2 class="text-base font-semibold text-foreground">Devises</h2>
						<p class="text-xs text-muted-foreground">
							{{ filteredCurrencies().length }} sur {{ totalCurrencies() }} devise{{ totalCurrencies() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filteredCurrencies().length === 0) {
					<okane-users-empty-state
						icon="lucideCoins"
						title="Aucune devise ne correspond"
						description="Modifiez la recherche ou les filtres pour afficher des résultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Devise</th>
									<th class="px-5 py-3 text-left font-medium">Pays principal</th>
									<th class="px-5 py-3 text-left font-medium">Symbole</th>
									<th class="px-5 py-3 text-right font-medium">Taux vers MAD</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-left font-medium">Dernière MAJ</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (currency of filteredCurrencies(); track currency.code) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div
													class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-mono text-xs font-semibold text-primary ring-1 ring-border"
												>
													{{ currency.code }}
												</div>
												<div class="leading-tight">
													<p class="font-medium text-foreground">{{ currency.name }}</p>
													<p class="font-mono text-xs text-muted-foreground">ISO {{ currency.code }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ currency.mainCountry }}</td>
										<td class="px-5 py-3 font-mono text-foreground">{{ currency.symbol }}</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm text-foreground">
												1 {{ currency.code }} = {{ formatRate(currency.rateToMad) }} MAD
											</span>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="currencyStatusLabel(currency.status)"
												[variant]="currencyStatusVariant(currency.status)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ currency.updatedAt }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="currencyActions(currency)" />
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>
				}
			</section>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div
					class="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-end md:justify-between"
				>
					<div>
						<h2 class="text-base font-semibold text-foreground">Corridors de transfert</h2>
						<p class="text-xs text-muted-foreground">
							{{ filteredCorridors().length }} sur {{ totalCorridors() }} corridor{{ totalCorridors() > 1 ? 's' : '' }}
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<select
							class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[value]="corStatus()"
							(change)="corStatus.set(asValue($event))"
						>
							<option value="all">Tous statuts</option>
							<option value="ACTIVE">Actif</option>
							<option value="DISABLED">Désactivé</option>
							<option value="IN_REVIEW">En révision</option>
						</select>
						<select
							class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[value]="corSource()"
							(change)="corSource.set(asValue($event))"
						>
							<option value="all">Tous pays source</option>
							@for (c of corridorSourceOptions(); track c.code) {
								<option [value]="c.code">{{ c.label }}</option>
							}
						</select>
						<select
							class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[value]="corDest()"
							(change)="corDest.set(asValue($event))"
						>
							<option value="all">Tous pays dest.</option>
							@for (c of corridorDestOptions(); track c.code) {
								<option [value]="c.code">{{ c.label }}</option>
							}
						</select>
					</div>
				</div>

				@if (filteredCorridors().length === 0) {
					<okane-users-empty-state
						icon="lucideArrowRightLeft"
						title="Aucun corridor ne correspond"
						description="Réinitialisez les filtres pour afficher les corridors."
					/>
				} @else {
					<div class="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
						@for (corridor of filteredCorridors(); track corridor.id) {
							<article
								class="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-accent/20"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="leading-tight">
										<p class="text-sm font-semibold text-foreground">
											{{ corridor.sourceCountry }} → {{ corridor.destCountry }}
										</p>
										<p class="font-mono text-xs text-muted-foreground">
											{{ corridor.sourceCountryCode }} → {{ corridor.destCountryCode }}
										</p>
									</div>
									<okane-user-status-badge
										[label]="corridorStatusLabel(corridor.status)"
										[variant]="corridorStatusVariant(corridor.status)"
									/>
								</div>

								<div class="flex items-center gap-2 rounded-xl bg-card p-3 text-sm ring-1 ring-border">
									<span
										class="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground"
									>{{ corridor.sourceCurrency }}</span>
									<ng-icon name="lucideArrowRightLeft" class="text-xs text-muted-foreground" />
									<span
										class="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground"
									>{{ corridor.destCurrency }}</span>
									<span class="ml-auto text-xs text-muted-foreground">
										Frais ~ <span class="font-medium text-foreground">{{ corridor.estimatedFee }}</span>
									</span>
								</div>

								<div class="mt-auto">
									<okane-user-actions-dropdown [actions]="corridorActions(corridor)" />
								</div>
							</article>
						}
					</div>
				}
			</section>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
					<div>
						<h2 class="text-base font-semibold text-foreground">Historique des taux</h2>
						<p class="text-xs text-muted-foreground">Dernières mises à jour FX.</p>
					</div>
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
					>
						<ng-icon name="lucideHistory" class="text-xs" />
						{{ fxHistory().length }} entrée{{ fxHistory().length > 1 ? 's' : '' }}
					</span>
				</div>

				<div class="overflow-x-auto">
					<table class="min-w-full text-sm">
						<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
							<tr>
								<th class="px-5 py-3 text-left font-medium">Devise</th>
								<th class="px-5 py-3 text-right font-medium">Ancien taux</th>
								<th class="px-5 py-3 text-right font-medium">Nouveau taux</th>
								<th class="px-5 py-3 text-left font-medium">Variation</th>
								<th class="px-5 py-3 text-left font-medium">Date</th>
								<th class="px-5 py-3 text-left font-medium">Modifié par</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							@for (entry of fxHistory(); track entry.id) {
								<tr class="transition-colors hover:bg-accent/40">
									<td class="px-5 py-3">
										<span
											class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground"
										>{{ entry.currency }}</span>
									</td>
									<td class="px-5 py-3 text-right font-mono text-muted-foreground">
										{{ formatRate(entry.previousRate) }}
									</td>
									<td class="px-5 py-3 text-right font-mono text-foreground">
										{{ formatRate(entry.newRate) }}
									</td>
									<td class="px-5 py-3">
										@if (entry.newRate >= entry.previousRate) {
											<span class="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
												<ng-icon name="lucideTrendingUp" class="text-xs" />
												+{{ formatVariation(entry.newRate - entry.previousRate) }}
											</span>
										} @else {
											<span class="inline-flex items-center gap-1 text-xs font-medium text-destructive">
												<ng-icon name="lucideTrendingDown" class="text-xs" />
												{{ formatVariation(entry.newRate - entry.previousRate) }}
											</span>
										}
									</td>
									<td class="px-5 py-3 text-muted-foreground">{{ entry.changedAt }}</td>
									<td class="px-5 py-3 text-foreground">{{ entry.changedBy }}</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			</section>
		</div>

		<okane-users-form-dialog
			[open]="addCurrencyDialog()"
			title="Ajouter une devise"
			subtitle="Définir une nouvelle devise et son taux de change initial vers le MAD."
			icon="lucideCoins"
			(close)="addCurrencyDialog.set(false)"
		>
			<okane-currency-create-form
				(created)="onCurrencyCreated($event)"
				(cancelled)="addCurrencyDialog.set(false)"
			/>
		</okane-users-form-dialog>
		<okane-users-placeholder-dialog
			[open]="exportDialog()"
			title="Exporter les devises et taux"
			(close)="exportDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="corridorDialog()"
			title="Modifier le corridor"
			(close)="corridorDialog.set(false)"
		/>
	`,
})
export class AdminCurrencyPageComponent implements OnInit {
	private readonly _api = inject(AdminCurrencyApiService);

	protected readonly currencies = signal<CurrencyRow[]>([]);
	protected readonly corridors = signal<CorridorRow[]>([]);
	protected readonly fxHistory = signal<FxHistoryRow[]>([]);
	protected readonly summary = signal<ApiCurrencySummary | null>(null);
	protected readonly error = signal<string | null>(null);

	protected readonly ccySearch = signal<string>('');
	protected readonly ccyStatus = signal<string>('all');
	protected readonly ccyCountry = signal<string>('all');

	protected readonly corStatus = signal<string>('all');
	protected readonly corSource = signal<string>('all');
	protected readonly corDest = signal<string>('all');

	protected readonly addCurrencyDialog = signal<boolean>(false);
	protected readonly exportDialog = signal<boolean>(false);
	protected readonly corridorDialog = signal<boolean>(false);

	protected readonly totalCurrencies = computed(() => this.currencies().length);
	protected readonly totalCorridors = computed(() => this.corridors().length);

	protected readonly currencyCountryOptions = computed(() =>
		Array.from(
			new Map(
				this.currencies()
					.filter((c) => c.mainCountryCode && c.mainCountry)
					.map((c) => [c.mainCountryCode, { code: c.mainCountryCode, label: c.mainCountry }]),
			).values(),
		),
	);

	protected readonly corridorSourceOptions = computed(() =>
		Array.from(
			new Map(
				this.corridors()
					.filter((c) => c.sourceCountryCode && c.sourceCountry)
					.map((c) => [c.sourceCountryCode, { code: c.sourceCountryCode, label: c.sourceCountry }]),
			).values(),
		),
	);

	protected readonly corridorDestOptions = computed(() =>
		Array.from(
			new Map(
				this.corridors()
					.filter((c) => c.destCountryCode && c.destCountry)
					.map((c) => [c.destCountryCode, { code: c.destCountryCode, label: c.destCountry }]),
			).values(),
		),
	);

	protected readonly ccyFilterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'status',
			label: 'Statut',
			value: this.ccyStatus(),
			options: [
				{ value: 'all', label: 'Tous statuts' },
				{ value: 'ACTIVE', label: 'Active' },
				{ value: 'SUSPENDED', label: 'Suspendue' },
			],
		},
		{
			key: 'country',
			label: 'Pays',
			value: this.ccyCountry(),
			options: [
				{ value: 'all', label: 'Tous pays' },
				...this.currencyCountryOptions().map((c) => ({ value: c.code, label: c.label })),
			],
		},
	]);

	protected readonly filteredCurrencies = computed<CurrencyRow[]>(() => {
		const term = this.ccySearch().trim().toLowerCase();
		const status = this.ccyStatus();
		const country = this.ccyCountry();

		return this.currencies().filter((c) => {
			if (status !== 'all' && c.status !== status) return false;
			if (country !== 'all' && c.mainCountryCode !== country) return false;
			if (!term) return true;
			return (
				c.code.toLowerCase().includes(term) ||
				c.name.toLowerCase().includes(term) ||
				c.mainCountry.toLowerCase().includes(term)
			);
		});
	});

	protected readonly filteredCorridors = computed<CorridorRow[]>(() => {
		const status = this.corStatus();
		const source = this.corSource();
		const dest = this.corDest();
		return this.corridors().filter((c) => {
			if (status !== 'all' && c.status !== status) return false;
			if (source !== 'all' && c.sourceCountryCode !== source) return false;
			if (dest !== 'all' && c.destCountryCode !== dest) return false;
			return true;
		});
	});

	protected readonly kpiCards = computed(() => {
		const summary = this.summary();
		const fallbackActive = this.currencies().filter((c) => c.status === 'ACTIVE').length;
		const fallbackSuspended = this.currencies().filter((c) => c.status === 'SUSPENDED').length;
		const fallbackActiveCorridors = this.corridors().filter((c) => c.status === 'ACTIVE').length;
		const lastSyncRaw = summary?.lastSyncAt ?? null;
		const lastSyncDisplay = lastSyncRaw
			? lastSyncRaw.replace('T', ' ').slice(0, 16)
			: this.fxHistory()[0]?.changedAt ?? '—';

		const valueByKey: Record<string, { value: string; suffix: string }> = {
			ACTIVE_CCY: {
				value: String(summary?.activeCurrencies ?? fallbackActive),
				suffix: `sur ${this.currencies().length}`,
			},
			ACTIVE_COR: {
				value: String(summary?.activeCorridors ?? fallbackActiveCorridors),
				suffix: `sur ${this.corridors().length}`,
			},
			TODAY_RATES: {
				value: String(summary?.ratesUpdatedToday ?? 0),
				suffix: 'aujourd\u2019hui',
			},
			SUSPENDED_CCY: {
				value: String(summary?.suspendedCurrencies ?? fallbackSuspended),
				suffix: 'devise(s)',
			},
			LAST_SYNC: {
				value: lastSyncDisplay,
				suffix: 'dernière MAJ',
			},
		};
		return CURRENCY_KPIS.map((kpi) => ({ ...kpi, ...valueByKey[kpi.key] }));
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.error.set(null);
		this._api.listCurrencies().subscribe({
			next: (rows) => this.currencies.set(rows.map((row) => this.toCurrencyRow(row))),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
		this._api.listCorridors().subscribe({
			next: (rows) => this.corridors.set(rows.map((row) => this.toCorridorRow(row))),
			error: () => {
				// non-fatal: corridors block falls back to empty list + empty state
			},
		});
		this._api.getRateHistory().subscribe({
			next: (rows) => this.fxHistory.set(rows.map((row) => this.toHistoryRow(row))),
			error: () => {
				// non-fatal: history block falls back to empty list
			},
		});
		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => this.summary.set(null),
		});
	}

	private toCurrencyRow(api: ApiCurrency): CurrencyRow {
		return {
			id: api.id,
			code: api.code,
			name: api.name,
			symbol: api.symbol ?? '—',
			mainCountry: api.mainCountry ?? '—',
			mainCountryCode: api.mainCountryCode ?? '',
			rateToMad: Number(api.rateToMad ?? 0),
			status: api.status,
			updatedAt: this.formatTimestamp(api.lastUpdatedAt),
		};
	}

	private toCorridorRow(api: ApiCorridor): CorridorRow {
		return {
			id: `COR-${api.id}`,
			rawId: api.id,
			sourceCountry: api.sourceCountry ?? '—',
			sourceCountryCode: api.sourceCountryCode ?? '',
			destCountry: api.destinationCountry ?? '—',
			destCountryCode: api.destinationCountryCode ?? '',
			sourceCurrency: api.sourceCurrency ?? '—',
			destCurrency: api.destinationCurrency ?? '—',
			estimatedFee: this.formatPercent(api.estimatedFees),
			status: this.toCorridorStatus(api.status),
		};
	}

	private toHistoryRow(api: ApiExchangeRateHistory): FxHistoryRow {
		return {
			id: `FX-${api.id}`,
			currency: api.currencyCode ?? '—',
			previousRate: Number(api.oldRate ?? 0),
			newRate: Number(api.newRate ?? 0),
			changedAt: this.formatTimestamp(api.changedAt),
			changedBy: api.changedByName ?? 'Système',
		};
	}

	private toCorridorStatus(api: ApiCorridor['status']): CorridorStatus {
		switch (api) {
			case 'ACTIVE':
				return 'ACTIVE';
			case 'UNDER_REVIEW':
				return 'IN_REVIEW';
			case 'DISABLED':
			default:
				return 'DISABLED';
		}
	}

	protected onCcyFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.ccyStatus.set(change.value);
				break;
			case 'country':
				this.ccyCountry.set(change.value);
				break;
		}
	}

	protected asValue(event: Event): string {
		return (event.target as HTMLSelectElement).value;
	}

	protected openAddCurrency(): void {
		this.addCurrencyDialog.set(true);
	}

	protected onCurrencyCreated(currency: ApiCurrency): void {
		const row = this.toCurrencyRow(currency);
		this.currencies.update((items) => [row, ...items.filter((c) => c.id !== row.id)]);
		this.addCurrencyDialog.set(false);
		// Refresh summary so the KPI card "Devises actives / suspendues" reflects the new entry.
		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => {},
		});
	}

	protected openExport(): void {
		this.exportDialog.set(true);
	}

	protected currencyStatusLabel(status: CurrencyStatus): string {
		return CURRENCY_STATUS_LABELS[status];
	}

	protected currencyStatusVariant(status: CurrencyStatus) {
		return CURRENCY_STATUS_VARIANTS[status];
	}

	protected corridorStatusLabel(status: CorridorStatus): string {
		return CORRIDOR_STATUS_LABELS[status];
	}

	protected corridorStatusVariant(status: CorridorStatus) {
		return CORRIDOR_STATUS_VARIANTS[status];
	}

	protected formatRate(value: number): string {
		const fractionDigits = value < 1 ? 4 : 2;
		return new Intl.NumberFormat('fr-FR', {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}).format(value);
	}

	protected formatVariation(delta: number): string {
		const fractionDigits = Math.abs(delta) < 0.1 ? 4 : 2;
		return new Intl.NumberFormat('fr-FR', {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}).format(delta);
	}

	protected currencyActions(currency: CurrencyRow): UserActionItem[] {
		const isActive = currency.status === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.viewDetails(currency) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit-ccy', currency.code) },
			{
				label: 'Voir historique',
				icon: 'lucideHistory',
				action: () => this.viewHistory(currency),
			},
			isActive
				? {
						label: 'Suspendre',
						icon: 'lucidePowerOff',
						action: () => this.changeStatus(currency, 'SUSPENDED'),
						variant: 'destructive' as const,
					}
				: {
						label: 'Activer',
						icon: 'lucidePower',
						action: () => this.changeStatus(currency, 'ACTIVE'),
					},
		];
	}

	protected corridorActions(corridor: CorridorRow): UserActionItem[] {
		const isActive = corridor.status === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view-cor', corridor.id) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.corridorDialog.set(true) },
			isActive
				? {
						label: 'Désactiver',
						icon: 'lucidePowerOff',
						action: () => this.logAction('disable-cor', corridor.id),
						variant: 'destructive' as const,
					}
				: { label: 'Activer', icon: 'lucidePower', action: () => this.logAction('activate-cor', corridor.id) },
		];
	}

	private changeStatus(currency: CurrencyRow, status: ApiCurrencyStatus): void {
		this._api.changeCurrencyStatus(currency.id, status).subscribe({
			next: (updated) => {
				const row = this.toCurrencyRow(updated);
				this.currencies.update((items) => items.map((c) => (c.id === row.id ? row : c)));
				this._api.getSummary().subscribe({
					next: (data) => this.summary.set(data),
					error: () => {},
				});
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private viewDetails(currency: CurrencyRow): void {
		this._api.getCurrency(currency.id).subscribe({
			next: (detail) => this.logAction('view-ccy', detail.code),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private viewHistory(currency: CurrencyRow): void {
		this._api.getCurrencyHistory(currency.id).subscribe({
			next: (entries) => {
				// eslint-disable-next-line no-console
				console.info('[Currency] history', currency.code, entries);
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private logAction(action: string, ref: string): void {
		// eslint-disable-next-line no-console
		console.info(`[Currency] ${action}`, ref);
	}

	private formatTimestamp(value: string | null): string {
		if (!value) return '—';
		return value.replace('T', ' ').slice(0, 16);
	}

	private formatPercent(value: number | null | undefined): string {
		if (value == null || Number.isNaN(value)) return '—';
		return new Intl.NumberFormat('fr-FR', {
			minimumFractionDigits: 1,
			maximumFractionDigits: 2,
		}).format(value) + '%';
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
