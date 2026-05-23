import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBuilding2,
	lucideChartLine,
	lucideEye,
	lucideMapPin,
	lucidePencil,
	lucidePower,
	lucidePowerOff,
	lucideUsers,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersLoadingStateComponent } from '../users/shared/users-loading-state.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import type { StatusVariant, UserActionItem } from '../users/shared/user-status.types';
import {
	AdminAgenciesApiService,
	type ApiAgency,
	type ApiAgencyStatus,
} from './admin-agencies.api';

const AGENCY_STATUS_LABELS: Record<ApiAgencyStatus, string> = {
	ACTIVE: 'Active',
	SUSPENDED: 'Suspendue',
	PENDING: 'En attente',
};

const AGENCY_STATUS_VARIANTS: Record<ApiAgencyStatus, StatusVariant> = {
	ACTIVE: 'success',
	SUSPENDED: 'destructive',
	PENDING: 'warning',
};

@Component({
	selector: 'okane-admin-agencies-page',
	standalone: true,
	imports: [
		NgIcon,
		UsersPageHeaderComponent,
		UsersFiltersComponent,
		UserStatusBadgeComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersLoadingStateComponent,
		UsersPlaceholderDialogComponent,
	],
	providers: [
		provideIcons({
			lucideBuilding2,
			lucideChartLine,
			lucideEye,
			lucideMapPin,
			lucidePencil,
			lucidePower,
			lucidePowerOff,
			lucideUsers,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Réseau Okane"
				title="Gestion des agences"
				description="Superviser les agences, managers, agents, plafonds et statuts opérationnels."
				addLabel="Ajouter une agence"
				(addClicked)="openDialog()"
			/>

			<okane-users-filters
				searchPlaceholder="Rechercher par nom, code ou ville..."
				[searchValue]="search()"
				[filters]="filterDefs()"
				(searchChange)="search.set($event)"
				(filterChange)="onFilterChange($event)"
			/>

			<section
				class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors"
			>
				<div class="flex flex-col gap-1 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="text-base font-semibold text-foreground">Agences</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total() }} agence{{ total() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (loading() || error()) {
					<okane-users-loading-state [error]="error()" />
				} @else if (filtered().length === 0) {
					<okane-users-empty-state
						icon="lucideBuilding2"
						title="Aucune agence ne correspond"
						description="Ajustez vos filtres ou élargissez votre recherche."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Agence</th>
									<th class="px-5 py-3 text-left font-medium">Ville / Pays</th>
									<th class="px-5 py-3 text-left font-medium">Manager</th>
									<th class="px-5 py-3 text-right font-medium">Agents</th>
									<th class="px-5 py-3 text-right font-medium">Plafond journalier</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-left font-medium">Création</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (agency of filtered(); track agency.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div
													class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border"
												>
													<ng-icon name="lucideBuilding2" class="text-base" />
												</div>
												<div class="leading-tight">
													<p class="font-medium text-foreground">{{ agency.name }}</p>
													<p class="font-mono text-xs text-muted-foreground">{{ agency.code }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3">
											<div class="flex items-center gap-2 text-foreground">
												<ng-icon name="lucideMapPin" class="text-sm text-muted-foreground" />
												<div class="leading-tight">
													<p class="font-medium">{{ agency.city }}</p>
													<p class="text-xs text-muted-foreground">{{ agency.country }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3">
											@if (agency.managerName) {
												<div class="flex items-center gap-2">
													<div
														class="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border"
													>
														{{ initials(agency.managerName) }}
													</div>
													<div class="leading-tight">
														<p class="font-medium text-foreground">{{ agency.managerName }}</p>
														<p class="font-mono text-xs text-muted-foreground">MG-{{ agency.managerId }}</p>
													</div>
												</div>
											} @else {
												<span class="text-xs text-muted-foreground">Non assigné</span>
											}
										</td>
										<td class="px-5 py-3 text-right">
											<span
												class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground"
											>
												<ng-icon name="lucideUsers" class="text-xs text-muted-foreground" />
												{{ agency.agentsCount }}
											</span>
										</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm font-medium text-foreground">
												{{ formatAmount(agency.dailyLimit) }} MAD
											</span>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="statusLabel(agency.status)"
												[variant]="statusVariant(agency.status)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ formatDate(agency.createdAt) }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="actionsFor(agency)" />
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
			[open]="dialogOpen()"
			title="Ajouter une agence"
			(close)="dialogOpen.set(false)"
		/>
	`,
})
export class AdminAgenciesPageComponent implements OnInit {
	private readonly _api = inject(AdminAgenciesApiService);

	protected readonly agencies = signal<ApiAgency[]>([]);
	protected readonly loading = signal<boolean>(true);
	protected readonly error = signal<string | null>(null);

	protected readonly search = signal<string>('');
	protected readonly status = signal<string>('all');
	protected readonly country = signal<string>('all');
	protected readonly city = signal<string>('all');
	protected readonly dialogOpen = signal<boolean>(false);

	protected readonly total = computed(() => this.agencies().length);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => {
		const countries = Array.from(new Set(this.agencies().map((a) => a.country))).sort();
		const cities = Array.from(new Set(this.agencies().map((a) => a.city))).sort();

		return [
			{
				key: 'status',
				label: 'Statut',
				value: this.status(),
				options: [
					{ value: 'all', label: 'Tous les statuts' },
					{ value: 'ACTIVE', label: 'Active' },
					{ value: 'SUSPENDED', label: 'Suspendue' },
					{ value: 'PENDING', label: 'En attente' },
				],
			},
			{
				key: 'country',
				label: 'Pays',
				value: this.country(),
				options: [
					{ value: 'all', label: 'Tous les pays' },
					...countries.map((c) => ({ value: c, label: c })),
				],
			},
			{
				key: 'city',
				label: 'Ville',
				value: this.city(),
				options: [
					{ value: 'all', label: 'Toutes les villes' },
					...cities.map((c) => ({ value: c, label: c })),
				],
			},
		];
	});

	protected readonly filtered = computed<ApiAgency[]>(() => {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const country = this.country();
		const city = this.city();

		return this.agencies().filter((a) => {
			if (status !== 'all' && a.status !== status) return false;
			if (country !== 'all' && a.country !== country) return false;
			if (city !== 'all' && a.city !== city) return false;
			if (!term) return true;
			return (
				a.name.toLowerCase().includes(term) ||
				a.code.toLowerCase().includes(term) ||
				a.city.toLowerCase().includes(term) ||
				a.country.toLowerCase().includes(term) ||
				(a.managerName ?? '').toLowerCase().includes(term)
			);
		});
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.loading.set(true);
		this.error.set(null);
		this._api.list().subscribe({
			next: (data) => {
				this.agencies.set(data);
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.loading.set(false);
			},
		});
	}

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.status.set(change.value);
				break;
			case 'country':
				this.country.set(change.value);
				break;
			case 'city':
				this.city.set(change.value);
				break;
		}
	}

	protected openDialog(): void {
		this.dialogOpen.set(true);
	}

	protected initials(name: string): string {
		return name
			.split(' ')
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	protected statusLabel(status: ApiAgencyStatus): string {
		return AGENCY_STATUS_LABELS[status];
	}

	protected statusVariant(status: ApiAgencyStatus) {
		return AGENCY_STATUS_VARIANTS[status];
	}

	protected formatAmount(value: number | null | undefined): string {
		if (value == null) return '—';
		return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
	}

	protected formatDate(value: string | null): string {
		if (!value) return '—';
		return value.replace('T', ' ').slice(0, 10);
	}

	protected actionsFor(agency: ApiAgency): UserActionItem[] {
		const isActive = agency.status === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', agency) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit', agency) },
			{ label: 'Voir agents', icon: 'lucideUsers', action: () => this.logAction('agents', agency) },
			{
				label: 'Voir performance',
				icon: 'lucideChartLine',
				action: () => this.logAction('performance', agency),
			},
			isActive
				? {
						label: 'Suspendre',
						icon: 'lucidePowerOff',
						action: () => this.changeStatus(agency, 'SUSPENDED'),
						variant: 'destructive' as const,
					}
				: {
						label: 'Activer',
						icon: 'lucidePower',
						action: () => this.changeStatus(agency, 'ACTIVE'),
					},
		];
	}

	private changeStatus(agency: ApiAgency, status: ApiAgencyStatus): void {
		this._api.changeStatus(agency.id, status).subscribe({
			next: (updated) => {
				this.agencies.update((items) => items.map((a) => (a.id === updated.id ? updated : a)));
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
			},
		});
	}

	private logAction(action: string, agency: ApiAgency): void {
		// eslint-disable-next-line no-console
		console.info(`[Agencies] ${action}`, agency.code, agency.name);
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
