import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideBuilding2,
	lucideCalculator,
	lucideClipboardList,
	lucideCopy,
	lucideEye,
	lucideHistory,
	lucideLandmark,
	lucideLayers,
	lucidePencil,
	lucidePercent,
	lucidePower,
	lucidePowerOff,
	lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersFormDialogComponent } from '../users/shared/users-form-dialog.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	FEE_DEST_COUNTRIES,
	FEE_GRID_STATUS_LABELS,
	FEE_GRID_STATUS_VARIANTS,
	FEE_KPIS,
	FEE_SOURCE_COUNTRIES,
	type FeeCurrency,
	type FeeGridStatus,
} from './fees.mock';
import {
	AdminFeesApiService,
	type ApiCommissionRow,
	type ApiFeeGrid,
	type ApiFeeGridStatus,
	type ApiFeeSimulation,
	type ApiFeeSummary,
} from './admin-fees.api';
import { FeeGridCreateFormComponent } from './fee-grid-create-form.component';

interface FeeGridRow {
	id: number;
	name: string;
	corridor: {
		sourceCountry: string;
		sourceCountryCode: string;
		destCountry: string;
		destCountryCode: string;
	};
	currency: string;
	minAmount: number;
	maxAmount: number;
	fixedFee: number;
	percentageFee: number;
	agencyCommissionPct: number;
	centralCommissionPct: number;
	status: FeeGridStatus;
}

interface CommissionRow {
	agencyCode: string;
	agencyName: string;
	corridor: string;
	volume: number;
	currency: string;
	commissionEarned: number;
	centralShare: number;
}

@Component({
	selector: 'okane-admin-fees-page',
	standalone: true,
	imports: [
		NgClass,
		NgIcon,
		FormsModule,
		HlmButtonImports,
		HlmInputImports,
		UsersPageHeaderComponent,
		UsersFiltersComponent,
		UserStatusBadgeComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersFormDialogComponent,
		UsersPlaceholderDialogComponent,
		FeeGridCreateFormComponent,
	],
	providers: [
		provideIcons({
			lucideArrowRightLeft,
			lucideBuilding2,
			lucideCalculator,
			lucideClipboardList,
			lucideCopy,
			lucideEye,
			lucideHistory,
			lucideLandmark,
			lucideLayers,
			lucidePencil,
			lucidePercent,
			lucidePower,
			lucidePowerOff,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Tarification"
				title="Frais & Commissions"
				description="Gérer les grilles tarifaires, commissions agence, commissions centrale et simulations de frais."
				addLabel="Ajouter une grille"
				(addClicked)="openAddGrid()"
			>
				<button okaneHeaderActions hlmBtn size="sm" variant="outline" type="button" (click)="openExport()">
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
						<span
							class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-border/60"
							[ngClass]="kpi.accent"
						>
							<ng-icon [name]="kpi.icon" />
						</span>
						<p class="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ kpi.label }}</p>
						<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">{{ kpi.value }}</p>
						@if (kpi.suffix) {
							<p class="mt-0.5 text-xs text-muted-foreground">{{ kpi.suffix }}</p>
						}
					</article>
				}
			</section>

			<okane-users-filters
				searchPlaceholder="Rechercher par grille, corridor ou pays..."
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
						<h2 class="text-base font-semibold text-foreground">Grilles tarifaires</h2>
						<p class="text-xs text-muted-foreground">
							{{ filteredGrids().length }} sur {{ totalGrids() }} grille{{ totalGrids() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filteredGrids().length === 0) {
					<okane-users-empty-state
						icon="lucideLayers"
						title="Aucune grille ne correspond"
						description="Modifiez la recherche ou les filtres pour afficher des résultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Nom</th>
									<th class="px-5 py-3 text-left font-medium">Corridor</th>
									<th class="px-5 py-3 text-left font-medium">Devise</th>
									<th class="px-5 py-3 text-right font-medium">Min</th>
									<th class="px-5 py-3 text-right font-medium">Max</th>
									<th class="px-5 py-3 text-right font-medium">Frais fixes</th>
									<th class="px-5 py-3 text-right font-medium">%</th>
									<th class="px-5 py-3 text-right font-medium">Comm. agence</th>
									<th class="px-5 py-3 text-right font-medium">Comm. centrale</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (grid of filteredGrids(); track grid.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="font-medium text-foreground">{{ grid.name }}</p>
												<p class="font-mono text-xs text-muted-foreground">#{{ grid.id }}</p>
											</div>
										</td>
										<td class="px-5 py-3">
											<div class="flex items-center gap-2 text-foreground">
												<span class="font-mono text-xs uppercase">{{ grid.corridor.sourceCountryCode }}</span>
												<ng-icon name="lucideArrowRightLeft" class="text-xs text-muted-foreground" />
												<span class="font-mono text-xs uppercase">{{ grid.corridor.destCountryCode }}</span>
											</div>
											<p class="mt-0.5 text-xs text-muted-foreground">
												{{ grid.corridor.sourceCountry }} → {{ grid.corridor.destCountry }}
											</p>
										</td>
										<td class="px-5 py-3">
											<span
												class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground"
											>{{ grid.currency }}</span>
										</td>
										<td class="px-5 py-3 text-right font-mono text-foreground">{{ formatAmount(grid.minAmount) }}</td>
										<td class="px-5 py-3 text-right font-mono text-foreground">{{ formatAmount(grid.maxAmount) }}</td>
										<td class="px-5 py-3 text-right font-mono text-foreground">
											{{ formatAmount(grid.fixedFee) }} {{ grid.currency }}
										</td>
										<td class="px-5 py-3 text-right font-mono text-foreground">{{ formatPct(grid.percentageFee) }}</td>
										<td class="px-5 py-3 text-right font-mono text-muted-foreground">
											{{ formatPct(grid.agencyCommissionPct) }}
										</td>
										<td class="px-5 py-3 text-right font-mono text-muted-foreground">
											{{ formatPct(grid.centralCommissionPct) }}
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="gridStatusLabel(grid.status)"
												[variant]="gridStatusVariant(grid.status)"
											/>
										</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="gridActions(grid)" />
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>
				}
			</section>

			<section
				class="grid gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors xl:grid-cols-[0.95fr_1.05fr]"
			>
				<div class="flex flex-col gap-4">
					<div>
						<h2 class="text-base font-semibold text-foreground">Simulation des frais</h2>
						<p class="text-xs text-muted-foreground">
							Estimation indicative à partir des grilles actives. Calcul réel à venir avec le backend.
						</p>
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
							Montant
							<input
								hlmInput
								type="number"
								min="0"
								[ngModel]="simAmount()"
								(ngModelChange)="onSimulationInputChange('amount', $event)"
							/>
						</label>
						<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
							Devise
							<select
								class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
								[ngModel]="simCurrency()"
								(ngModelChange)="onSimulationInputChange('currency', $event)"
							>
								<option value="MAD">MAD</option>
								<option value="EUR">EUR</option>
								<option value="USD">USD</option>
								<option value="XOF">XOF</option>
							</select>
						</label>
						<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
							Pays source
							<select
								class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
								[ngModel]="simSource()"
								(ngModelChange)="onSimulationInputChange('source', $event)"
							>
								@for (c of sourceOptions; track c.code) {
									<option [value]="c.code">{{ c.label }}</option>
								}
							</select>
						</label>
						<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
							Pays destination
							<select
								class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
								[ngModel]="simDest()"
								(ngModelChange)="onSimulationInputChange('dest', $event)"
							>
								@for (c of destOptions; track c.code) {
									<option [value]="c.code">{{ c.label }}</option>
								}
							</select>
						</label>
					</div>

					<p class="text-xs text-muted-foreground">
						Le calcul est exécuté côté backend en utilisant les grilles actives correspondant au corridor / devise.
					</p>
				</div>

				<div class="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition-colors">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-foreground">Résultat</p>
							@if (simulationResult()) {
								<p class="text-xs text-muted-foreground">
									Grille appliquée : {{ simulationResult()!.gridName ?? '—' }}
								</p>
							} @else if (simulationError()) {
								<p class="text-xs text-destructive">{{ simulationError() }}</p>
							} @else {
								<p class="text-xs text-muted-foreground">Lancez une simulation pour voir le résultat.</p>
							}
						</div>
						<span
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border"
						>
							<ng-icon name="lucideCalculator" />
						</span>
					</div>

					<dl class="grid grid-cols-2 gap-3 text-sm">
						<div class="rounded-xl bg-card p-3 ring-1 ring-border">
							<dt class="text-xs uppercase tracking-wide text-muted-foreground">Frais estimés</dt>
							<dd class="mt-1 font-mono text-foreground">
								{{ formatAmount(simulationFees()) }} {{ simCurrency() }}
							</dd>
						</div>
						<div class="rounded-xl bg-card p-3 ring-1 ring-border">
							<dt class="text-xs uppercase tracking-wide text-muted-foreground">Montant net</dt>
							<dd class="mt-1 font-mono text-foreground">
								{{ formatAmount(simulationNet()) }} {{ simCurrency() }}
							</dd>
						</div>
						<div class="rounded-xl bg-card p-3 ring-1 ring-border">
							<dt class="text-xs uppercase tracking-wide text-muted-foreground">Comm. agence</dt>
							<dd class="mt-1 font-mono text-foreground">
								{{ formatAmount(simulationAgencyShare()) }} {{ simCurrency() }}
							</dd>
						</div>
						<div class="rounded-xl bg-card p-3 ring-1 ring-border">
							<dt class="text-xs uppercase tracking-wide text-muted-foreground">Comm. centrale</dt>
							<dd class="mt-1 font-mono text-foreground">
								{{ formatAmount(simulationCentralShare()) }} {{ simCurrency() }}
							</dd>
						</div>
					</dl>
				</div>
			</section>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
					<div>
						<h2 class="text-base font-semibold text-foreground">Répartition des commissions</h2>
						<p class="text-xs text-muted-foreground">Volumes et parts par agence.</p>
					</div>
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
					>
						<ng-icon name="lucideBuilding2" class="text-xs" />
						{{ commissions().length }} agence{{ commissions().length > 1 ? 's' : '' }}
					</span>
				</div>

				@if (commissions().length === 0) {
					<okane-users-empty-state
						icon="lucideBuilding2"
						title="Aucune commission à afficher"
						description="Les volumes et commissions s'afficheront dès que des transferts seront enregistrés."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Agence</th>
									<th class="px-5 py-3 text-left font-medium">Corridor</th>
									<th class="px-5 py-3 text-right font-medium">Volume</th>
									<th class="px-5 py-3 text-right font-medium">Comm. gagnée</th>
									<th class="px-5 py-3 text-right font-medium">Part centrale</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (row of commissions(); track row.agencyCode) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="font-medium text-foreground">{{ row.agencyName }}</p>
												<p class="font-mono text-xs text-muted-foreground">{{ row.agencyCode }}</p>
											</div>
										</td>
										<td class="px-5 py-3 font-mono text-xs text-foreground">{{ row.corridor }}</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm text-foreground">{{ formatAmount(row.volume) }}</span>
											<span class="ml-1 text-xs text-muted-foreground">{{ row.currency }}</span>
										</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm font-medium text-emerald-600 dark:text-emerald-300">
												+{{ formatAmount(row.commissionEarned) }}
											</span>
											<span class="ml-1 text-xs text-muted-foreground">{{ row.currency }}</span>
										</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm text-foreground">{{ formatAmount(row.centralShare) }}</span>
											<span class="ml-1 text-xs text-muted-foreground">{{ row.currency }}</span>
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>
				}
			</section>
		</div>

		<okane-users-form-dialog
			[open]="addGridDialog()"
			title="Ajouter une grille"
			subtitle="Définir un nouveau barème pour un corridor donné."
			icon="lucideLayers"
			(close)="addGridDialog.set(false)"
		>
			<okane-fee-grid-create-form
				(created)="onGridCreated($event)"
				(cancelled)="addGridDialog.set(false)"
			/>
		</okane-users-form-dialog>

		<okane-users-placeholder-dialog
			[open]="exportDialog()"
			title="Exporter les grilles tarifaires"
			(close)="exportDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="duplicateDialog()"
			title="Dupliquer la grille"
			(close)="duplicateDialog.set(false)"
		/>
	`,
})
export class AdminFeesPageComponent implements OnInit {
	private readonly _api = inject(AdminFeesApiService);

	protected readonly grids = signal<FeeGridRow[]>([]);
	protected readonly summary = signal<ApiFeeSummary | null>(null);
	protected readonly commissions = signal<CommissionRow[]>([]);
	protected readonly simulationResult = signal<ApiFeeSimulation | null>(null);
	protected readonly simulationError = signal<string | null>(null);
	protected readonly error = signal<string | null>(null);

	protected readonly sourceOptions = FEE_SOURCE_COUNTRIES;
	protected readonly destOptions = FEE_DEST_COUNTRIES;

	protected readonly search = signal<string>('');
	protected readonly status = signal<string>('all');
	protected readonly currency = signal<string>('all');
	protected readonly sourceCountry = signal<string>('all');
	protected readonly destCountry = signal<string>('all');

	protected readonly addGridDialog = signal<boolean>(false);
	protected readonly exportDialog = signal<boolean>(false);
	protected readonly duplicateDialog = signal<boolean>(false);

	protected readonly simAmount = signal<number>(2000);
	protected readonly simCurrency = signal<FeeCurrency>('MAD');
	protected readonly simSource = signal<string>('MA');
	protected readonly simDest = signal<string>('SN');

	protected readonly totalGrids = computed(() => this.grids().length);

	private simulationDebounce: ReturnType<typeof setTimeout> | null = null;

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'status',
			label: 'Statut',
			value: this.status(),
			options: [
				{ value: 'all', label: 'Tous statuts' },
				{ value: 'ACTIVE', label: 'Active' },
				{ value: 'SUSPENDED', label: 'Suspendue' },
				{ value: 'DRAFT', label: 'Brouillon' },
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
			],
		},
		{
			key: 'source',
			label: 'Source',
			value: this.sourceCountry(),
			options: [
				{ value: 'all', label: 'Tous pays source' },
				...FEE_SOURCE_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
			],
		},
		{
			key: 'dest',
			label: 'Destination',
			value: this.destCountry(),
			options: [
				{ value: 'all', label: 'Tous pays dest.' },
				...FEE_DEST_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
			],
		},
	]);

	protected readonly filteredGrids = computed<FeeGridRow[]>(() => {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const currency = this.currency();
		const source = this.sourceCountry();
		const dest = this.destCountry();

		return this.grids().filter((g) => {
			if (status !== 'all' && g.status !== status) return false;
			if (currency !== 'all' && g.currency !== currency) return false;
			if (source !== 'all' && g.corridor.sourceCountryCode !== source) return false;
			if (dest !== 'all' && g.corridor.destCountryCode !== dest) return false;
			if (!term) return true;
			return (
				g.name.toLowerCase().includes(term) ||
				String(g.id).includes(term) ||
				(g.corridor.sourceCountry ?? '').toLowerCase().includes(term) ||
				(g.corridor.destCountry ?? '').toLowerCase().includes(term)
			);
		});
	});

	protected readonly kpiCards = computed(() => {
		const summary = this.summary();
		const grids = this.grids();
		const fallbackActive = grids.filter((g) => g.status === 'ACTIVE').length;
		const fallbackAvgFee = grids.length === 0
			? 0
			: grids.reduce((sum, g) => sum + g.fixedFee, 0) / grids.length;
		const fallbackAvgPct = grids.length === 0
			? 0
			: grids.reduce((sum, g) => sum + g.percentageFee, 0) / grids.length;
		const fallbackAvgAgency = grids.length === 0
			? 0
			: grids.reduce((sum, g) => sum + g.agencyCommissionPct, 0) / grids.length;
		const fallbackAvgCentral = grids.length === 0
			? 0
			: grids.reduce((sum, g) => sum + g.centralCommissionPct, 0) / grids.length;

		const activeGrids = summary?.activeFeeGrids ?? fallbackActive;
		const averageFee = summary?.averageFee ?? fallbackAvgFee;
		const centralCommission = summary?.centralCommission ?? fallbackAvgCentral;
		const agencyCommission = summary?.agencyCommission ?? fallbackAvgAgency;
		const simulations = summary?.simulationsToday ?? 0;

		const valueByKey: Record<string, { value: string; suffix: string }> = {
			ACTIVE_GRIDS: {
				value: String(activeGrids),
				suffix: `sur ${grids.length}`,
			},
			AVG_FEES: {
				value: `${this.formatAmount(averageFee)} + ${this.formatPct(fallbackAvgPct)}`,
				suffix: 'sur grilles actives',
			},
			CENTRAL_COM: { value: this.formatPct(centralCommission), suffix: 'part moyenne' },
			AGENCY_COM: { value: this.formatPct(agencyCommission), suffix: 'part moyenne' },
			SIMULATIONS: { value: String(simulations), suffix: 'aujourd\u2019hui' },
		};
		return FEE_KPIS.map((kpi) => ({ ...kpi, ...valueByKey[kpi.key] }));
	});

	public ngOnInit(): void {
		this.refreshAll();
		this.runSimulation();
	}

	private refreshAll(): void {
		this.error.set(null);
		this._api.listGrids().subscribe({
			next: (rows) => this.grids.set(rows.map((row) => this.toGridRow(row))),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => this.summary.set(null),
		});
		this._api.listCommissions().subscribe({
			next: (rows) => this.commissions.set(rows.map((row) => this.toCommissionRow(row))),
			error: () => this.commissions.set([]),
		});
	}

	private toGridRow(api: ApiFeeGrid): FeeGridRow {
		return {
			id: api.id,
			name: api.name,
			corridor: {
				sourceCountry: api.sourceCountry ?? '—',
				sourceCountryCode: api.sourceCountryCode ?? '',
				destCountry: api.destinationCountry ?? '—',
				destCountryCode: api.destinationCountryCode ?? '',
			},
			currency: api.currency ?? '—',
			minAmount: Number(api.minAmount ?? 0),
			maxAmount: Number(api.maxAmount ?? 0),
			fixedFee: Number(api.fixedFee ?? 0),
			percentageFee: Number(api.percentageFee ?? 0),
			agencyCommissionPct: Number(api.agencyCommissionRate ?? 0),
			centralCommissionPct: Number(api.centralCommissionRate ?? 0),
			status: api.status,
		};
	}

	private toCommissionRow(api: ApiCommissionRow): CommissionRow {
		return {
			agencyCode: api.agencyCode ?? '—',
			agencyName: api.agencyName ?? '—',
			corridor: api.corridor ?? '—',
			volume: Number(api.volume ?? 0),
			currency: api.currency ?? '—',
			commissionEarned: Number(api.agencyCommission ?? 0),
			centralShare: Number(api.centralCommission ?? 0),
		};
	}

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.status.set(change.value);
				break;
			case 'currency':
				this.currency.set(change.value);
				break;
			case 'source':
				this.sourceCountry.set(change.value);
				break;
			case 'dest':
				this.destCountry.set(change.value);
				break;
		}
	}

	protected onSimulationInputChange(field: 'amount' | 'currency' | 'source' | 'dest', value: unknown): void {
		switch (field) {
			case 'amount': {
				const n = Number(value);
				this.simAmount.set(Number.isFinite(n) ? n : 0);
				break;
			}
			case 'currency':
				this.simCurrency.set((value as FeeCurrency) ?? 'MAD');
				break;
			case 'source':
				this.simSource.set(String(value ?? 'MA'));
				break;
			case 'dest':
				this.simDest.set(String(value ?? 'SN'));
				break;
		}
		if (this.simulationDebounce) clearTimeout(this.simulationDebounce);
		this.simulationDebounce = setTimeout(() => this.runSimulation(), 350);
	}

	private runSimulation(): void {
		const amount = this.simAmount();
		if (!Number.isFinite(amount) || amount <= 0) {
			this.simulationResult.set(null);
			this.simulationError.set('Le montant doit être positif.');
			return;
		}
		this.simulationError.set(null);
		this._api
			.simulate({
				amount,
				currency: this.simCurrency(),
				sourceCountry: this.simSource(),
				destinationCountry: this.simDest(),
			})
			.subscribe({
				next: (result) => {
					this.simulationResult.set(result);
					this.simulationError.set(null);
					// Refresh summary so the "Simulations aujourd'hui" KPI ticks up.
					this._api.getSummary().subscribe({
						next: (data) => this.summary.set(data),
						error: () => {},
					});
				},
				error: (err) => {
					this.simulationResult.set(null);
					this.simulationError.set(this.extractMessage(err));
				},
			});
	}

	protected simulationFees(): number {
		return this.simulationResult()?.estimatedFees ?? 0;
	}

	protected simulationNet(): number {
		const result = this.simulationResult();
		return result ? result.netAmount : this.simAmount();
	}

	protected simulationAgencyShare(): number {
		return this.simulationResult()?.agencyCommission ?? 0;
	}

	protected simulationCentralShare(): number {
		return this.simulationResult()?.centralCommission ?? 0;
	}

	protected openAddGrid(): void {
		this.addGridDialog.set(true);
	}

	protected openExport(): void {
		this.exportDialog.set(true);
	}

	protected onGridCreated(grid: ApiFeeGrid): void {
		const row = this.toGridRow(grid);
		this.grids.update((items) => [row, ...items.filter((g) => g.id !== row.id)]);
		this.addGridDialog.set(false);
		// Refresh summary KPIs to reflect the new grid.
		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => {},
		});
	}

	protected gridStatusLabel(status: FeeGridStatus): string {
		return FEE_GRID_STATUS_LABELS[status];
	}

	protected gridStatusVariant(status: FeeGridStatus) {
		return FEE_GRID_STATUS_VARIANTS[status];
	}

	protected formatAmount(value: number): string {
		const safe = Number.isFinite(value) ? value : 0;
		const fractionDigits = Math.abs(safe) < 100 && safe % 1 !== 0 ? 2 : 0;
		return new Intl.NumberFormat('fr-FR', {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: 2,
		}).format(safe);
	}

	protected formatPct(value: number): string {
		const safe = Number.isFinite(value) ? value : 0;
		return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(safe)}%`;
	}

	protected gridActions(grid: FeeGridRow): UserActionItem[] {
		const isActive = grid.status === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', grid.id) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit', grid.id) },
			{ label: 'Dupliquer', icon: 'lucideCopy', action: () => this.duplicateGrid(grid) },
			{ label: 'Voir historique', icon: 'lucideHistory', action: () => this.logAction('history', grid.id) },
			isActive
				? {
						label: 'Suspendre',
						icon: 'lucidePowerOff',
						action: () => this.changeStatus(grid, 'SUSPENDED'),
						variant: 'destructive' as const,
					}
				: {
						label: 'Activer',
						icon: 'lucidePower',
						action: () => this.changeStatus(grid, 'ACTIVE'),
					},
		];
	}

	private duplicateGrid(grid: FeeGridRow): void {
		this.duplicateDialog.set(true);
		this._api.duplicate(grid.id).subscribe({
			next: (created) => {
				const row = this.toGridRow(created);
				this.grids.update((items) => [row, ...items]);
				this.duplicateDialog.set(false);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.duplicateDialog.set(false);
			},
		});
	}

	private changeStatus(grid: FeeGridRow, status: ApiFeeGridStatus): void {
		this._api.changeStatus(grid.id, status).subscribe({
			next: (updated) => {
				const row = this.toGridRow(updated);
				this.grids.update((items) => items.map((g) => (g.id === row.id ? row : g)));
				this._api.getSummary().subscribe({
					next: (data) => this.summary.set(data),
					error: () => {},
				});
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private logAction(action: string, ref: string | number): void {
		// eslint-disable-next-line no-console
		console.info(`[Fees] ${action}`, ref);
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
