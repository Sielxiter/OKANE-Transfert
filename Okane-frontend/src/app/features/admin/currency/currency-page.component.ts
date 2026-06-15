import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideChevronLeft,
	lucideChevronRight,
	lucideClipboardList,
	lucideCoins,
	lucideEye,
	lucidePencil,
	lucideRefreshCw,
	lucidePower,
	lucidePowerOff,
	lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ActionDetailModalComponent, type DetailField } from '../users/shared/action-detail-modal.component';
import { ConfirmDialogComponent } from '../users/shared/confirm-dialog.component';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersFormDialogComponent } from '../users/shared/users-form-dialog.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import { CurrencyCreateFormComponent } from './currency-create-form.component';
import {
	CURRENCY_KPIS,
	CURRENCY_STATUS_LABELS,
	CURRENCY_STATUS_VARIANTS,
	type CurrencyStatus,
} from './currency.mock';
import {
	AdminCurrencyApiService,
	type ApiCurrency,
	type ApiCurrencyStatus,
	type ApiCurrencySummary,
} from './admin-currency.api';

const PAGE_SIZE = 8;

interface CurrencyRow {
	id: number;
	name: string;
	symbol: string;
	mainCountry: string;
	mainCountryCode: string;
	rateToMad: number | null;
	status: CurrencyStatus;
	updatedAt: string;
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
		ActionDetailModalComponent,
		ConfirmDialogComponent,
		CurrencyCreateFormComponent,
	],
	providers: [
		provideIcons({
			lucideChevronLeft,
			lucideChevronRight,
			lucideClipboardList,
			lucideCoins,
			lucideEye,
			lucidePencil,
			lucideRefreshCw,
			lucidePower,
			lucidePowerOff,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6">
			<okane-users-page-header
				eyebrow="Marches & devises"
				title="Currency & FX"
				description="Gerer les devises et les taux de change de la plateforme."
				addLabel="Ajouter une devise"
				(addClicked)="openAddCurrency()"
			>
				<button
					okaneHeaderActions
					hlmBtn
					size="sm"
					variant="outline"
					type="button"
					[disabled]="syncLoading()"
					(click)="runSync()"
				>
					<ng-icon name="lucideRefreshCw" [class.animate-spin]="syncLoading()" />
					{{ syncLoading() ? 'Synchronisation...' : 'Mettre à jour maintenant' }}
				</button>
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
				<div class="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Donnees partielles</p>
						<p class="mt-0.5 text-xs opacity-80">{{ error() }} - affichage avec valeurs par defaut.</p>
					</div>
				</div>
			}

			@if (syncSuccess()) {
				<div class="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-emerald-700 dark:text-emerald-300">
					<ng-icon name="lucideCoins" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Synchronisation terminee</p>
						<p class="mt-0.5 text-xs opacity-80">{{ syncSuccess() }}</p>
					</div>
				</div>
			}

			@if (syncError()) {
				<div class="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Synchronisation echouee</p>
						<p class="mt-0.5 text-xs opacity-80">{{ syncError() }}</p>
					</div>
				</div>
			}

			<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				@for (kpi of kpiCards(); track kpi.key) {
					<article
						class="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md"
					>
						<div class="flex items-center justify-between gap-2">
							<span class="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-border/60" [ngClass]="kpi.accent">
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
				searchPlaceholder="Rechercher une devise par symbole, nom ou pays..."
				[searchValue]="ccySearch()"
				[filters]="ccyFilterDefs()"
				(searchChange)="onSearchChange($event)"
				(filterChange)="onFilterChange($event)"
			/>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div class="flex flex-col gap-2 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="text-base font-semibold text-foreground">Devises</h2>
						<p class="text-xs text-muted-foreground">
							{{ filteredCurrencies().length }} sur {{ totalCurrencies() }} devise{{ totalCurrencies() > 1 ? 's' : '' }}
						</p>
					</div>
					<div class="text-xs text-muted-foreground">
						Page {{ currentPageIndex() + 1 }} / {{ totalPages() }}
					</div>
				</div>

				@if (filteredCurrencies().length === 0) {
					<okane-users-empty-state
						icon="lucideCoins"
						title="Aucune devise ne correspond"
						description="Modifiez la recherche ou les filtres pour afficher des resultats."
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
									<th class="px-5 py-3 text-left font-medium">Derniere MAJ</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (currency of pagedCurrencies(); track currency.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div class="flex h-9 min-w-9 items-center justify-center rounded-xl bg-primary/10 px-2 font-mono text-xs font-semibold text-primary ring-1 ring-border">
													{{ currency.symbol || '—' }}
												</div>
												<div class="leading-tight">
													<p class="font-medium text-foreground">{{ currency.name }}</p>
													<p class="font-mono text-xs text-muted-foreground">ID {{ currency.id }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ currency.mainCountry }}</td>
										<td class="px-5 py-3 font-mono text-foreground">{{ currency.symbol || '—' }}</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm text-foreground">
												1 {{ currency.symbol || currency.name }} = {{ formatRate(currency.rateToMad) }} MAD
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

					<div class="flex flex-col gap-3 border-t border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
						<p class="text-xs text-muted-foreground">
							Affichage de {{ pageStart() + 1 }} a {{ pageEnd() }} sur {{ filteredCurrencies().length }} resultats.
						</p>
						<div class="flex items-center gap-2">
							<button
								hlmBtn
								type="button"
								size="sm"
								variant="outline"
								[disabled]="currentPageIndex() === 0"
								(click)="previousPage()"
							>
								<ng-icon name="lucideChevronLeft" />
								Precedent
							</button>
							<button
								hlmBtn
								type="button"
								size="sm"
								variant="outline"
								[disabled]="currentPageIndex() >= totalPages() - 1"
								(click)="nextPage()"
							>
								Suivant
								<ng-icon name="lucideChevronRight" />
							</button>
						</div>
					</div>
				}
			</section>
		</div>

		<okane-users-form-dialog
			[open]="addCurrencyDialog()"
			title="Ajouter une devise"
			subtitle="Definir une nouvelle devise et son taux initial vers le MAD."
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
			title="Exporter les devises"
			(close)="exportDialog.set(false)"
		/>

		<okane-action-detail-modal
			[open]="detailOpen()"
			[title]="detailTitle()"
			[subtitle]="detailSubtitle()"
			[fields]="detailFields()"
			(close)="detailOpen.set(false)"
		/>

		<okane-confirm-dialog
			[open]="confirmOpen()"
			[title]="confirmTitle()"
			[message]="confirmMessage()"
			[confirmLabel]="confirmLabel()"
			(confirm)="onConfirm()"
			(cancel)="confirmOpen.set(false)"
		/>
	`,
})
export class AdminCurrencyPageComponent implements OnInit {
	private readonly _api = inject(AdminCurrencyApiService);

	protected readonly currencies = signal<CurrencyRow[]>([]);
	protected readonly summary = signal<ApiCurrencySummary | null>(null);
	protected readonly error = signal<string | null>(null);
	protected readonly syncLoading = signal<boolean>(false);
	protected readonly syncSuccess = signal<string | null>(null);
	protected readonly syncError = signal<string | null>(null);

	protected readonly ccySearch = signal<string>('');
	protected readonly ccyStatus = signal<string>('all');
	protected readonly ccyCountry = signal<string>('all');
	protected readonly pageIndex = signal<number>(0);

	protected readonly addCurrencyDialog = signal<boolean>(false);
	protected readonly exportDialog = signal<boolean>(false);

	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Details');
	protected readonly detailSubtitle = signal<string>('');
	protected readonly detailFields = signal<DetailField[]>([]);

	protected readonly confirmOpen = signal<boolean>(false);
	protected readonly confirmTitle = signal<string>('Confirmer');
	protected readonly confirmMessage = signal<string>('');
	protected readonly confirmLabel = signal<string>('Confirmer');
	private _pendingConfirm: (() => void) | null = null;

	protected readonly totalCurrencies = computed(() => this.currencies().length);

	protected readonly currencyCountryOptions = computed(() =>
		Array.from(
			new Map(
				this.currencies()
					.filter((currency) => currency.mainCountryCode && currency.mainCountry)
					.map((currency) => [currency.mainCountryCode, { code: currency.mainCountryCode, label: currency.mainCountry }]),
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
				...this.currencyCountryOptions().map((country) => ({ value: country.code, label: country.label })),
			],
		},
	]);

	protected readonly filteredCurrencies = computed<CurrencyRow[]>(() => {
		const term = this.ccySearch().trim().toLowerCase();
		const status = this.ccyStatus();
		const country = this.ccyCountry();

		return this.currencies().filter((currency) => {
			if (status !== 'all' && currency.status !== status) return false;
			if (country !== 'all' && currency.mainCountryCode !== country) return false;
			if (!term) return true;
			return (
				currency.symbol.toLowerCase().includes(term) ||
				currency.name.toLowerCase().includes(term) ||
				currency.mainCountry.toLowerCase().includes(term) ||
				currency.mainCountryCode.toLowerCase().includes(term)
			);
		});
	});

	protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredCurrencies().length / PAGE_SIZE)));

	protected readonly currentPageIndex = computed(() => Math.min(this.pageIndex(), this.totalPages() - 1));

	protected readonly pagedCurrencies = computed(() => {
		const start = this.currentPageIndex() * PAGE_SIZE;
		return this.filteredCurrencies().slice(start, start + PAGE_SIZE);
	});

	protected readonly pageStart = computed(() =>
		this.filteredCurrencies().length === 0 ? 0 : this.currentPageIndex() * PAGE_SIZE,
	);

	protected readonly pageEnd = computed(() =>
		Math.min(this.pageStart() + this.pagedCurrencies().length, this.filteredCurrencies().length),
	);

	protected readonly kpiCards = computed(() => {
		const summary = this.summary();
		const fallbackActive = this.currencies().filter((currency) => currency.status === 'ACTIVE').length;
		const fallbackSuspended = this.currencies().filter((currency) => currency.status === 'SUSPENDED').length;
		const lastSyncDisplay = this.formatTimestamp(summary?.lastSyncAt);

		const valueByKey: Record<string, { value: string; suffix: string }> = {
			ACTIVE_CCY: {
				value: String(summary?.activeCurrencies ?? fallbackActive),
				suffix: `sur ${this.currencies().length}`,
			},
			TODAY_RATES: {
				value: String(summary?.ratesUpdatedToday ?? 0),
				suffix: "aujourd'hui",
			},
			SUSPENDED_CCY: {
				value: String(summary?.suspendedCurrencies ?? fallbackSuspended),
				suffix: 'devise(s)',
			},
			LAST_SYNC: {
				value: lastSyncDisplay,
				suffix: 'derniere MAJ',
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
			next: (rows) => {
				this.currencies.set(rows.map((row) => this.toCurrencyRow(row)));
				if (this.pageIndex() > 0 && this.currentPageIndex() >= this.totalPages()) {
					this.pageIndex.set(0);
				}
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => this.summary.set(null),
		});
	}

	protected runSync(): void {
		if (this.syncLoading()) {
			return;
		}
		this.syncLoading.set(true);
		this.syncSuccess.set(null);
		this.syncError.set(null);
		this._api.syncExchangeRates().subscribe({
			next: (result) => {
				this.syncSuccess.set(result.message || 'Synchronisation effectuee.');
				this.refresh();
				this.syncLoading.set(false);
			},
			error: (err) => {
				this.syncError.set(this.extractMessage(err));
				this.syncLoading.set(false);
			},
		});
	}

	private toCurrencyRow(api: ApiCurrency): CurrencyRow {
		return {
			id: api.id,
			name: api.name,
			symbol: api.symbol ?? '—',
			mainCountry: api.mainCountry ?? '—',
			mainCountryCode: api.mainCountryCode ?? '—',
			rateToMad: api.rateToMad == null ? null : Number(api.rateToMad),
			status: api.status,
			updatedAt: this.formatTimestamp(api.lastUpdatedAt),
		};
	}

	protected onSearchChange(value: string): void {
		this.ccySearch.set(value);
		this.pageIndex.set(0);
	}

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.ccyStatus.set(change.value);
				break;
			case 'country':
				this.ccyCountry.set(change.value);
				break;
		}
		this.pageIndex.set(0);
	}

	protected previousPage(): void {
		this.pageIndex.update((current) => Math.max(current - 1, 0));
	}

	protected nextPage(): void {
		this.pageIndex.update((current) => Math.min(current + 1, this.totalPages() - 1));
	}

	protected openAddCurrency(): void {
		this.addCurrencyDialog.set(true);
	}

	protected onCurrencyCreated(currency: ApiCurrency): void {
		const row = this.toCurrencyRow(currency);
		this.currencies.update((items) => [row, ...items.filter((entry) => entry.id !== row.id)]);
		this.addCurrencyDialog.set(false);
		this.pageIndex.set(0);
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

	protected currencyActions(currency: CurrencyRow): UserActionItem[] {
		const isActive = currency.status === 'ACTIVE';
		return [
			{ label: 'Voir details', icon: 'lucideEye', action: () => this.viewDetails(currency) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.openEditCurrency(currency) },
			isActive
				? {
						label: 'Suspendre',
						icon: 'lucidePowerOff',
						action: () => this.requestStatusChange(currency, 'SUSPENDED'),
						variant: 'destructive' as const,
					}
				: { label: 'Activer', icon: 'lucidePower', action: () => this.requestStatusChange(currency, 'ACTIVE') },
		];
	}

	private viewDetails(currency: CurrencyRow): void {
		this._api.getCurrency(currency.id).subscribe({
			next: (detail) => {
				this.detailTitle.set(`${detail.symbol ?? detail.name} - ${detail.name}`);
				this.detailSubtitle.set('Informations de la devise');
				this.detailFields.set([
					{ label: 'Symbole', value: detail.symbol ?? '—', mono: true },
					{ label: 'Nom', value: detail.name },
					{ label: 'Pays principal', value: detail.mainCountry ?? '—' },
					{ label: 'Code pays principal', value: detail.mainCountryCode ?? '—', mono: true },
					{ label: 'Taux vers MAD', value: this.formatRate(Number(detail.rateToMad ?? 0)) },
					{ label: 'Statut', value: CURRENCY_STATUS_LABELS[detail.status] },
					{ label: 'Derniere MAJ', value: this.formatTimestamp(detail.lastUpdatedAt) },
				]);
				this.detailOpen.set(true);
			},
			error: () => {
				this.detailTitle.set(`${currency.symbol} - ${currency.name}`);
				this.detailSubtitle.set('');
				this.detailFields.set([
					{ label: 'Symbole', value: currency.symbol, mono: true },
					{ label: 'Taux vers MAD', value: this.formatRate(currency.rateToMad) },
					{ label: 'Statut', value: CURRENCY_STATUS_LABELS[currency.status] },
				]);
				this.detailOpen.set(true);
			},
		});
	}

	private openEditCurrency(currency: CurrencyRow): void {
		this.detailTitle.set(`Modifier - ${currency.symbol}`);
		this.detailSubtitle.set('');
		this.detailFields.set([{ label: 'Info', value: 'Le formulaire de modification sera disponible dans une prochaine phase.' }]);
		this.detailOpen.set(true);
	}

	private requestStatusChange(currency: CurrencyRow, status: ApiCurrencyStatus): void {
		const label = status === 'SUSPENDED' ? 'Suspendre' : 'Activer';
		this.confirmTitle.set(`${label} la devise`);
		this.confirmMessage.set(`Voulez-vous ${label.toLowerCase()} la devise ${currency.symbol} (${currency.name}) ?`);
		this.confirmLabel.set(label);
		this._pendingConfirm = () => this.changeStatus(currency, status);
		this.confirmOpen.set(true);
	}

	protected onConfirm(): void {
		this.confirmOpen.set(false);
		this._pendingConfirm?.();
		this._pendingConfirm = null;
	}

	private changeStatus(currency: CurrencyRow, status: ApiCurrencyStatus): void {
		this._api.changeCurrencyStatus(currency.id, status).subscribe({
			next: (updated) => {
				const row = this.toCurrencyRow(updated);
				this.currencies.update((items) => items.map((entry) => (entry.id === row.id ? row : entry)));
				this._api.getSummary().subscribe({
					next: (data) => this.summary.set(data),
					error: () => {},
				});
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	protected formatRate(value: number | null | undefined): string {
		if (value == null || Number.isNaN(value)) {
			return '—';
		}
		const fractionDigits = value < 1 ? 4 : 2;
		return new Intl.NumberFormat('fr-FR', {
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}).format(value);
	}

	private formatTimestamp(value: string | Date | number | null | undefined): string {
		if (value == null) return '—';
		try {
			const date = value instanceof Date ? value : new Date(value);
			if (Number.isNaN(date.getTime())) return '—';
			return date.toISOString().replace('T', ' ').slice(0, 16);
		} catch {
			return '—';
		}
	}

	private extractMessage(err: unknown): string {
		const fallback = 'Erreur reseau. Verifiez votre connexion ou votre session.';
		if (typeof err === 'object' && err !== null) {
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
