import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	AGENCY_COMMISSIONS_MOCK,
	FEE_DEST_COUNTRIES,
	FEE_GRIDS_MOCK,
	FEE_GRID_STATUS_LABELS,
	FEE_GRID_STATUS_VARIANTS,
	FEE_KPIS,
	FEE_SOURCE_COUNTRIES,
	type FeeCurrency,
	type FeeGrid,
	type FeeGridStatus,
} from './fees.mock';

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
		UsersPlaceholderDialogComponent,
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
							{{ filteredGrids().length }} sur {{ totalGrids }} grille{{ totalGrids > 1 ? 's' : '' }}
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
												<p class="font-mono text-xs text-muted-foreground">{{ grid.id }}</p>
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
								(ngModelChange)="simAmount.set(asNumber($event))"
							/>
						</label>
						<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
							Devise
							<select
								class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
								[ngModel]="simCurrency()"
								(ngModelChange)="simCurrency.set($event)"
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
								(ngModelChange)="simSource.set($event)"
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
								(ngModelChange)="simDest.set($event)"
							>
								@for (c of destOptions; track c.code) {
									<option [value]="c.code">{{ c.label }}</option>
								}
							</select>
						</label>
					</div>

					<p class="text-xs text-muted-foreground">
						Cette simulation est indicative et utilise un calcul mock côté front. Le vrai moteur de frais sera
						branché lors de l'intégration backend.
					</p>
				</div>

				<div class="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition-colors">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-foreground">Résultat</p>
							@if (simulation().matched) {
								<p class="text-xs text-muted-foreground">Grille appliquée : {{ simulation().gridName }}</p>
							} @else {
								<p class="text-xs text-muted-foreground">Aucune grille active ne couvre ce corridor.</p>
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
								{{ formatAmount(simulation().fees) }} {{ simCurrency() }}
							</dd>
						</div>
						<div class="rounded-xl bg-card p-3 ring-1 ring-border">
							<dt class="text-xs uppercase tracking-wide text-muted-foreground">Montant net</dt>
							<dd class="mt-1 font-mono text-foreground">
								{{ formatAmount(simulation().net) }} {{ simCurrency() }}
							</dd>
						</div>
						<div class="rounded-xl bg-card p-3 ring-1 ring-border">
							<dt class="text-xs uppercase tracking-wide text-muted-foreground">Comm. agence</dt>
							<dd class="mt-1 font-mono text-foreground">
								{{ formatAmount(simulation().agencyShare) }} {{ simCurrency() }}
							</dd>
						</div>
						<div class="rounded-xl bg-card p-3 ring-1 ring-border">
							<dt class="text-xs uppercase tracking-wide text-muted-foreground">Comm. centrale</dt>
							<dd class="mt-1 font-mono text-foreground">
								{{ formatAmount(simulation().centralShare) }} {{ simCurrency() }}
							</dd>
						</div>
					</dl>
				</div>
			</section>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
					<div>
						<h2 class="text-base font-semibold text-foreground">Répartition des commissions</h2>
						<p class="text-xs text-muted-foreground">Volumes et parts par agence (mock).</p>
					</div>
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
					>
						<ng-icon name="lucideBuilding2" class="text-xs" />
						{{ commissions.length }} agence{{ commissions.length > 1 ? 's' : '' }}
					</span>
				</div>

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
							@for (row of commissions; track row.agencyCode) {
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
			</section>
		</div>

		<okane-users-placeholder-dialog
			[open]="addGridDialog()"
			title="Ajouter une grille"
			(close)="addGridDialog.set(false)"
		/>
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
export class AdminFeesPageComponent {
	protected readonly totalGrids = FEE_GRIDS_MOCK.length;
	protected readonly commissions = AGENCY_COMMISSIONS_MOCK;
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

	// Simulation
	protected readonly simAmount = signal<number>(2000);
	protected readonly simCurrency = signal<FeeCurrency>('MAD');
	protected readonly simSource = signal<string>('MA');
	protected readonly simDest = signal<string>('SN');

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

	protected readonly filteredGrids = computed<FeeGrid[]>(() => {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const currency = this.currency();
		const source = this.sourceCountry();
		const dest = this.destCountry();

		return FEE_GRIDS_MOCK.filter((g) => {
			if (status !== 'all' && g.status !== status) return false;
			if (currency !== 'all' && g.currency !== currency) return false;
			if (source !== 'all' && g.corridor.sourceCountryCode !== source) return false;
			if (dest !== 'all' && g.corridor.destCountryCode !== dest) return false;
			if (!term) return true;
			return (
				g.name.toLowerCase().includes(term) ||
				g.id.toLowerCase().includes(term) ||
				g.corridor.sourceCountry.toLowerCase().includes(term) ||
				g.corridor.destCountry.toLowerCase().includes(term)
			);
		});
	});

	protected readonly simulation = computed(() => {
		const amount = Math.max(0, this.simAmount() || 0);
		const currency = this.simCurrency();
		const source = this.simSource();
		const dest = this.simDest();

		const matchedGrid = FEE_GRIDS_MOCK.find(
			(g) =>
				g.status === 'ACTIVE' &&
				g.currency === currency &&
				g.corridor.sourceCountryCode === source &&
				g.corridor.destCountryCode === dest &&
				amount >= g.minAmount &&
				amount <= g.maxAmount,
		);

		if (!matchedGrid) {
			return {
				matched: false,
				gridName: '—',
				fees: 0,
				net: amount,
				agencyShare: 0,
				centralShare: 0,
			};
		}

		const fees = matchedGrid.fixedFee + (amount * matchedGrid.percentageFee) / 100;
		const agencyShare = (fees * matchedGrid.agencyCommissionPct) / 100;
		const centralShare = (fees * matchedGrid.centralCommissionPct) / 100;
		return {
			matched: true,
			gridName: matchedGrid.name,
			fees,
			net: amount - fees,
			agencyShare,
			centralShare,
		};
	});

	protected readonly kpiCards = computed(() => {
		const activeGrids = FEE_GRIDS_MOCK.filter((g) => g.status === 'ACTIVE');
		const avgFixed =
			activeGrids.length === 0
				? 0
				: activeGrids.reduce((sum, g) => sum + g.fixedFee, 0) / activeGrids.length;
		const avgPct =
			activeGrids.length === 0
				? 0
				: activeGrids.reduce((sum, g) => sum + g.percentageFee, 0) / activeGrids.length;
		const avgAgency =
			activeGrids.length === 0
				? 0
				: activeGrids.reduce((sum, g) => sum + g.agencyCommissionPct, 0) / activeGrids.length;
		const avgCentral =
			activeGrids.length === 0
				? 0
				: activeGrids.reduce((sum, g) => sum + g.centralCommissionPct, 0) / activeGrids.length;

		const valueByKey: Record<string, { value: string; suffix: string }> = {
			ACTIVE_GRIDS: { value: String(activeGrids.length), suffix: `sur ${FEE_GRIDS_MOCK.length}` },
			AVG_FEES: {
				value: `${this.formatAmount(avgFixed)} + ${this.formatPct(avgPct)}`,
				suffix: 'sur grilles actives',
			},
			CENTRAL_COM: { value: this.formatPct(avgCentral), suffix: 'part moyenne' },
			AGENCY_COM: { value: this.formatPct(avgAgency), suffix: 'part moyenne' },
			SIMULATIONS: { value: '128', suffix: 'aujourd\u2019hui' },
		};
		return FEE_KPIS.map((kpi) => ({ ...kpi, ...valueByKey[kpi.key] }));
	});

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

	protected asNumber(value: string | number): number {
		const n = typeof value === 'number' ? value : Number(value);
		return Number.isFinite(n) ? n : 0;
	}

	protected openAddGrid(): void {
		this.addGridDialog.set(true);
	}

	protected openExport(): void {
		this.exportDialog.set(true);
	}

	protected gridStatusLabel(status: FeeGridStatus): string {
		return FEE_GRID_STATUS_LABELS[status];
	}

	protected gridStatusVariant(status: FeeGridStatus) {
		return FEE_GRID_STATUS_VARIANTS[status];
	}

	protected formatAmount(value: number): string {
		const fractionDigits = Math.abs(value) < 100 && value % 1 !== 0 ? 2 : 0;
		return new Intl.NumberFormat('fr-FR', {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: 2,
		}).format(value);
	}

	protected formatPct(value: number): string {
		return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)}%`;
	}

	protected gridActions(grid: FeeGrid): UserActionItem[] {
		const isActive = grid.status === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', grid.id) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit', grid.id) },
			{ label: 'Dupliquer', icon: 'lucideCopy', action: () => this.duplicateDialog.set(true) },
			{ label: 'Voir historique', icon: 'lucideHistory', action: () => this.logAction('history', grid.id) },
			isActive
				? {
						label: 'Suspendre',
						icon: 'lucidePowerOff',
						action: () => this.logAction('suspend', grid.id),
						variant: 'destructive' as const,
					}
				: { label: 'Activer', icon: 'lucidePower', action: () => this.logAction('activate', grid.id) },
		];
	}

	private logAction(action: string, ref: string): void {
		// eslint-disable-next-line no-console
		console.info(`[Fees] ${action}`, ref);
	}
}
