import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
	CORRIDOR_DEST_COUNTRIES,
	CORRIDOR_SOURCE_COUNTRIES,
	CORRIDOR_STATUS_LABELS,
	CORRIDOR_STATUS_VARIANTS,
	CORRIDORS_MOCK,
	CURRENCIES_MOCK,
	CURRENCY_COUNTRIES,
	CURRENCY_KPIS,
	CURRENCY_STATUS_LABELS,
	CURRENCY_STATUS_VARIANTS,
	FX_HISTORY_MOCK,
	type Corridor,
	type CorridorStatus,
	type Currency,
	type CurrencyStatus,
} from './currency.mock';

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
		UsersPlaceholderDialogComponent,
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
							{{ filteredCurrencies().length }} sur {{ totalCurrencies }} devise{{ totalCurrencies > 1 ? 's' : '' }}
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
							{{ filteredCorridors().length }} sur {{ totalCorridors }} corridor{{ totalCorridors > 1 ? 's' : '' }}
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
							@for (c of corridorSourceOptions; track c.code) {
								<option [value]="c.code">{{ c.label }}</option>
							}
						</select>
						<select
							class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[value]="corDest()"
							(change)="corDest.set(asValue($event))"
						>
							<option value="all">Tous pays dest.</option>
							@for (c of corridorDestOptions; track c.code) {
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
						<p class="text-xs text-muted-foreground">Dernières mises à jour FX (mock).</p>
					</div>
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
					>
						<ng-icon name="lucideHistory" class="text-xs" />
						{{ fxHistory.length }} entrée{{ fxHistory.length > 1 ? 's' : '' }}
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
							@for (entry of fxHistory; track entry.id) {
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

		<okane-users-placeholder-dialog
			[open]="addCurrencyDialog()"
			title="Ajouter une devise"
			(close)="addCurrencyDialog.set(false)"
		/>
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
export class AdminCurrencyPageComponent {
	protected readonly totalCurrencies = CURRENCIES_MOCK.length;
	protected readonly totalCorridors = CORRIDORS_MOCK.length;
	protected readonly fxHistory = FX_HISTORY_MOCK;
	protected readonly corridorSourceOptions = CORRIDOR_SOURCE_COUNTRIES;
	protected readonly corridorDestOptions = CORRIDOR_DEST_COUNTRIES;

	protected readonly ccySearch = signal<string>('');
	protected readonly ccyStatus = signal<string>('all');
	protected readonly ccyCountry = signal<string>('all');

	protected readonly corStatus = signal<string>('all');
	protected readonly corSource = signal<string>('all');
	protected readonly corDest = signal<string>('all');

	protected readonly addCurrencyDialog = signal<boolean>(false);
	protected readonly exportDialog = signal<boolean>(false);
	protected readonly corridorDialog = signal<boolean>(false);

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
				...CURRENCY_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
			],
		},
	]);

	protected readonly filteredCurrencies = computed<Currency[]>(() => {
		const term = this.ccySearch().trim().toLowerCase();
		const status = this.ccyStatus();
		const country = this.ccyCountry();

		return CURRENCIES_MOCK.filter((c) => {
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

	protected readonly filteredCorridors = computed<Corridor[]>(() => {
		const status = this.corStatus();
		const source = this.corSource();
		const dest = this.corDest();
		return CORRIDORS_MOCK.filter((c) => {
			if (status !== 'all' && c.status !== status) return false;
			if (source !== 'all' && c.sourceCountryCode !== source) return false;
			if (dest !== 'all' && c.destCountryCode !== dest) return false;
			return true;
		});
	});

	protected readonly kpiCards = computed(() => {
		const today = '2026-05-23';
		const activeCcy = CURRENCIES_MOCK.filter((c) => c.status === 'ACTIVE').length;
		const suspendedCcy = CURRENCIES_MOCK.filter((c) => c.status === 'SUSPENDED').length;
		const activeCor = CORRIDORS_MOCK.filter((c) => c.status === 'ACTIVE').length;
		const todayRates = CURRENCIES_MOCK.filter((c) => c.updatedAt.startsWith(today)).length;
		const lastSync = CURRENCIES_MOCK.map((c) => c.updatedAt).sort().reverse()[0] ?? '—';
		const valueByKey: Record<string, { value: string; suffix: string }> = {
			ACTIVE_CCY: { value: String(activeCcy), suffix: `sur ${CURRENCIES_MOCK.length}` },
			ACTIVE_COR: { value: String(activeCor), suffix: `sur ${CORRIDORS_MOCK.length}` },
			TODAY_RATES: { value: String(todayRates), suffix: 'aujourd\u2019hui' },
			SUSPENDED_CCY: { value: String(suspendedCcy), suffix: 'devise(s)' },
			LAST_SYNC: { value: lastSync, suffix: 'mock' },
		};
		return CURRENCY_KPIS.map((kpi) => ({ ...kpi, ...valueByKey[kpi.key] }));
	});

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

	protected currencyActions(currency: Currency): UserActionItem[] {
		const isActive = currency.status === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view-ccy', currency.code) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit-ccy', currency.code) },
			{ label: 'Voir historique', icon: 'lucideHistory', action: () => this.logAction('history-ccy', currency.code) },
			isActive
				? {
						label: 'Suspendre',
						icon: 'lucidePowerOff',
						action: () => this.logAction('suspend-ccy', currency.code),
						variant: 'destructive' as const,
					}
				: { label: 'Activer', icon: 'lucidePower', action: () => this.logAction('activate-ccy', currency.code) },
		];
	}

	protected corridorActions(corridor: Corridor): UserActionItem[] {
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

	private logAction(action: string, ref: string): void {
		// eslint-disable-next-line no-console
		console.info(`[Currency] ${action}`, ref);
	}
}
