import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideCoins,
	lucideEye,
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
import type { UserActionItem } from '../users/shared/user-status.types';
import { CorridorCreateFormComponent } from '../currency/corridor-create-form.component';
import {
	CORRIDOR_STATUS_LABELS,
	CORRIDOR_STATUS_VARIANTS,
	type CorridorStatus,
} from '../currency/currency.mock';
import {
	AdminCurrencyApiService,
	type ApiCorridor,
	type ApiCorridorStatus,
} from '../currency/admin-currency.api';

interface CorridorRow {
	id: number;
	sourceCountry: string;
	sourceCountryCode: string;
	destCountry: string;
	destCountryCode: string;
	sourceCurrency: string;
	destCurrency: string;
	estimatedFee: string;
	status: CorridorStatus;
}

interface CorridorKpi {
	key: string;
	label: string;
	value: string;
	suffix: string;
	icon: string;
	accent: string;
}

@Component({
	selector: 'okane-admin-corridors-page',
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
		ActionDetailModalComponent,
		ConfirmDialogComponent,
		CorridorCreateFormComponent,
	],
	providers: [
		provideIcons({
			lucideArrowRightLeft,
			lucideCoins,
			lucideEye,
			lucidePower,
			lucidePowerOff,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6">
			<okane-users-page-header
				eyebrow="Marches & corridors"
				title="Corridors de transfert"
				description="Gerer les corridors entre pays et leurs frais estimes."
				addLabel="Ajouter un corridor"
				(addClicked)="openAddCorridor()"
			/>

			@if (error()) {
				<div class="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Donnees partielles</p>
						<p class="mt-0.5 text-xs opacity-80">{{ error() }} - affichage avec valeurs par defaut.</p>
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
				searchPlaceholder="Rechercher un pays, une devise ou un code..."
				[searchValue]="search()"
				[filters]="filterDefs()"
				(searchChange)="onSearchChange($event)"
				(filterChange)="onFilterChange($event)"
			/>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div class="flex flex-col gap-2 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="text-base font-semibold text-foreground">Liste des corridors</h2>
						<p class="text-xs text-muted-foreground">
							{{ filteredCorridors().length }} sur {{ totalCorridors() }} corridor{{ totalCorridors() > 1 ? 's' : '' }}
						</p>
					</div>
					<div class="text-xs text-muted-foreground">
						Corridors actifs: {{ activeCorridors() }}
					</div>
				</div>

				@if (filteredCorridors().length === 0) {
					<okane-users-empty-state
						icon="lucideArrowRightLeft"
						title="Aucun corridor ne correspond"
						description="Modifiez les filtres pour afficher des resultats."
					/>
				} @else {
					<div class="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
						@for (corridor of filteredCorridors(); track corridor.id) {
							<article class="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-accent/20">
								<div class="flex items-start justify-between gap-3">
									<div class="leading-tight">
										<p class="text-sm font-semibold text-foreground">
											{{ corridor.sourceCountry }} -> {{ corridor.destCountry }}
										</p>
										<p class="font-mono text-xs text-muted-foreground">
											{{ corridor.sourceCountryCode }} -> {{ corridor.destCountryCode }}
										</p>
									</div>
									<okane-user-status-badge
										[label]="corridorStatusLabel(corridor.status)"
										[variant]="corridorStatusVariant(corridor.status)"
									/>
								</div>

								<div class="flex items-center gap-2 rounded-xl bg-card p-3 text-sm ring-1 ring-border">
									<span class="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">{{ corridor.sourceCurrency }}</span>
									<ng-icon name="lucideArrowRightLeft" class="text-xs text-muted-foreground" />
									<span class="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">{{ corridor.destCurrency }}</span>
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
		</div>

		<okane-users-form-dialog
			[open]="corridorDialog()"
			title="Ajouter un corridor"
			subtitle="Definir un nouveau corridor de transfert entre deux pays."
			icon="lucideArrowRightLeft"
			(close)="corridorDialog.set(false)"
		>
			<okane-corridor-create-form
				(created)="onCorridorCreated($event)"
				(cancelled)="corridorDialog.set(false)"
			/>
		</okane-users-form-dialog>

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
export class AdminCorridorsPageComponent implements OnInit {
	private readonly _api = inject(AdminCurrencyApiService);

	protected readonly corridors = signal<CorridorRow[]>([]);
	protected readonly error = signal<string | null>(null);

	protected readonly search = signal<string>('');
	protected readonly status = signal<string>('all');
	protected readonly source = signal<string>('all');
	protected readonly destination = signal<string>('all');
	protected readonly corridorDialog = signal<boolean>(false);

	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Details');
	protected readonly detailSubtitle = signal<string>('');
	protected readonly detailFields = signal<DetailField[]>([]);

	protected readonly confirmOpen = signal<boolean>(false);
	protected readonly confirmTitle = signal<string>('Confirmer');
	protected readonly confirmMessage = signal<string>('');
	protected readonly confirmLabel = signal<string>('Confirmer');
	private _pendingConfirm: (() => void) | null = null;

	protected readonly totalCorridors = computed(() => this.corridors().length);
	protected readonly activeCorridors = computed(() => this.corridors().filter((corridor) => corridor.status === 'ACTIVE').length);

	protected readonly sourceOptions = computed(() =>
		Array.from(
			new Map(
				this.corridors()
					.filter((corridor) => corridor.sourceCountryCode && corridor.sourceCountry)
					.map((corridor) => [corridor.sourceCountryCode, { code: corridor.sourceCountryCode, label: corridor.sourceCountry }]),
			).values(),
		),
	);

	protected readonly destinationOptions = computed(() =>
		Array.from(
			new Map(
				this.corridors()
					.filter((corridor) => corridor.destCountryCode && corridor.destCountry)
					.map((corridor) => [corridor.destCountryCode, { code: corridor.destCountryCode, label: corridor.destCountry }]),
			).values(),
		),
	);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'status',
			label: 'Statut',
			value: this.status(),
			options: [
				{ value: 'all', label: 'Tous statuts' },
				{ value: 'ACTIVE', label: 'Actif' },
				{ value: 'DISABLED', label: 'Desactive' },
				{ value: 'IN_REVIEW', label: 'En revision' },
			],
		},
		{
			key: 'source',
			label: 'Pays source',
			value: this.source(),
			options: [
				{ value: 'all', label: 'Tous pays' },
				...this.sourceOptions().map((country) => ({ value: country.code, label: country.label })),
			],
		},
		{
			key: 'destination',
			label: 'Pays destination',
			value: this.destination(),
			options: [
				{ value: 'all', label: 'Tous pays' },
				...this.destinationOptions().map((country) => ({ value: country.code, label: country.label })),
			],
		},
	]);

	protected readonly filteredCorridors = computed<CorridorRow[]>(() => {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const source = this.source();
		const destination = this.destination();

		return this.corridors().filter((corridor) => {
			if (status !== 'all' && corridor.status !== status) return false;
			if (source !== 'all' && corridor.sourceCountryCode !== source) return false;
			if (destination !== 'all' && corridor.destCountryCode !== destination) return false;
			if (!term) return true;
			return (
				corridor.sourceCountry.toLowerCase().includes(term) ||
				corridor.destCountry.toLowerCase().includes(term) ||
				corridor.sourceCountryCode.toLowerCase().includes(term) ||
				corridor.destCountryCode.toLowerCase().includes(term) ||
				corridor.sourceCurrency.toLowerCase().includes(term) ||
				corridor.destCurrency.toLowerCase().includes(term)
			);
		});
	});

	protected readonly kpiCards = computed<CorridorKpi[]>(() => [
		{
			key: 'TOTAL',
			label: 'Corridors total',
			value: String(this.totalCorridors()),
			suffix: 'enregistres',
			icon: 'lucideArrowRightLeft',
			accent: 'bg-primary/10 text-primary',
		},
		{
			key: 'ACTIVE',
			label: 'Actifs',
			value: String(this.activeCorridors()),
			suffix: 'corridors',
			icon: 'lucideCoins',
			accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
		},
		{
			key: 'REVIEW',
			label: 'En revision',
			value: String(this.corridors().filter((corridor) => corridor.status === 'IN_REVIEW').length),
			suffix: 'corridors',
			icon: 'lucideTriangleAlert',
			accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
		},
		{
			key: 'DISABLED',
			label: 'Desactives',
			value: String(this.corridors().filter((corridor) => corridor.status === 'DISABLED').length),
			suffix: 'corridors',
			icon: 'lucidePowerOff',
			accent: 'bg-destructive/10 text-destructive',
		},
	]);

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.error.set(null);
		this._api.listCorridors().subscribe({
			next: (rows) => this.corridors.set(rows.map((row) => this.toCorridorRow(row))),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private toCorridorRow(api: ApiCorridor): CorridorRow {
		return {
			id: api.id,
			sourceCountry: api.sourceCountry ?? '—',
			sourceCountryCode: api.sourceCountryCode ?? '—',
			destCountry: api.destinationCountry ?? '—',
			destCountryCode: api.destinationCountryCode ?? '—',
			sourceCurrency: api.sourceCurrency ?? '—',
			destCurrency: api.destinationCurrency ?? '—',
			estimatedFee: this.formatPercent(api.estimatedFees),
			status: this.toCorridorStatus(api.status),
		};
	}

	protected onSearchChange(value: string): void {
		this.search.set(value);
	}

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.status.set(change.value);
				break;
			case 'source':
				this.source.set(change.value);
				break;
			case 'destination':
				this.destination.set(change.value);
				break;
		}
	}

	protected openAddCorridor(): void {
		this.corridorDialog.set(true);
	}

	protected onCorridorCreated(corridor: ApiCorridor): void {
		const row = this.toCorridorRow(corridor);
		this.corridors.update((items) => [row, ...items.filter((entry) => entry.id !== row.id)]);
		this.corridorDialog.set(false);
	}

	protected corridorStatusLabel(status: CorridorStatus): string {
		return CORRIDOR_STATUS_LABELS[status];
	}

	protected corridorStatusVariant(status: CorridorStatus) {
		return CORRIDOR_STATUS_VARIANTS[status];
	}

	protected corridorActions(corridor: CorridorRow): UserActionItem[] {
		const isActive = corridor.status === 'ACTIVE';
		return [
			{ label: 'Voir details', icon: 'lucideEye', action: () => this.viewDetails(corridor) },
			isActive
				? {
						label: 'Desactiver',
						icon: 'lucidePowerOff',
						action: () => this.requestStatusChange(corridor, 'DISABLED'),
						variant: 'destructive' as const,
					}
				: { label: 'Activer', icon: 'lucidePower', action: () => this.requestStatusChange(corridor, 'ACTIVE') },
		];
	}

	private viewDetails(corridor: CorridorRow): void {
		this.detailTitle.set(`Corridor ${corridor.sourceCountryCode} -> ${corridor.destCountryCode}`);
		this.detailSubtitle.set('Informations du corridor de transfert');
		this.detailFields.set([
			{ label: 'Source', value: `${corridor.sourceCountry} (${corridor.sourceCountryCode})` },
			{ label: 'Destination', value: `${corridor.destCountry} (${corridor.destCountryCode})` },
			{ label: 'Devise source', value: corridor.sourceCurrency },
			{ label: 'Devise destination', value: corridor.destCurrency },
			{ label: 'Frais estimes', value: corridor.estimatedFee },
			{ label: 'Statut', value: CORRIDOR_STATUS_LABELS[corridor.status] },
		]);
		this.detailOpen.set(true);
	}

	private requestStatusChange(corridor: CorridorRow, status: ApiCorridorStatus): void {
		const label = status === 'DISABLED' ? 'Desactiver' : 'Activer';
		this.confirmTitle.set(`${label} le corridor`);
		this.confirmMessage.set(`Voulez-vous ${label.toLowerCase()} le corridor ${corridor.sourceCountryCode} -> ${corridor.destCountryCode} ?`);
		this.confirmLabel.set(label);
		this._pendingConfirm = () => this.changeStatus(corridor, status);
		this.confirmOpen.set(true);
	}

	protected onConfirm(): void {
		this.confirmOpen.set(false);
		this._pendingConfirm?.();
		this._pendingConfirm = null;
	}

	private changeStatus(corridor: CorridorRow, status: ApiCorridorStatus): void {
		this._api.changeCorridorStatus(corridor.id, status).subscribe({
			next: (updated) => {
				const row = this.toCorridorRow(updated);
				this.corridors.update((items) => items.map((entry) => (entry.id === row.id ? row : entry)));
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
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

	private formatPercent(value: number | null | undefined): string {
		if (value == null || Number.isNaN(value)) return '—';
		return new Intl.NumberFormat('fr-FR', {
			minimumFractionDigits: 1,
			maximumFractionDigits: 2,
		}).format(value) + '%';
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
