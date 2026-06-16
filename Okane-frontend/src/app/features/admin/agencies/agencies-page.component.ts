import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideBuilding2,
	lucideCheck,
	lucideChevronLeft,
	lucideChevronRight,
	lucideEye,
	lucideMapPin,
	lucidePencil,
	lucidePower,
	lucidePowerOff,
	lucideTriangleAlert,
	lucideUserCheck,
	lucideUsers,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { filter, map, startWith } from 'rxjs/operators';
import { ActionDetailModalComponent, type DetailField } from '../users/shared/action-detail-modal.component';
import { ConfirmDialogComponent } from '../users/shared/confirm-dialog.component';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersFormDialogComponent } from '../users/shared/users-form-dialog.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import { AgencyCreateFormComponent } from './agency-create-form.component';
import { AssignManagerDialogComponent } from './assign-manager-dialog.component';
import { AdminAgenciesApiService, type ApiAgency, type ApiAgencyStatus, type ApiAgencyType } from './admin-agencies.api';
import type { StatusVariant } from '../users/shared/user-status.types';

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

const MODE_ROUTES: Record<ApiAgencyType, string> = {
	CENTRAL: '/admin/agencies/central',
	SUB: '/admin/agencies/sub',
};

@Component({
	selector: 'okane-admin-agencies-page',
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
		AgencyCreateFormComponent,
		ActionDetailModalComponent,
		ConfirmDialogComponent,
		AssignManagerDialogComponent,
	],
	providers: [
		provideIcons({
			lucideArrowRightLeft,
			lucideBuilding2,
			lucideCheck,
			lucideChevronLeft,
			lucideChevronRight,
			lucideEye,
			lucideMapPin,
			lucidePencil,
			lucidePower,
			lucidePowerOff,
			lucideTriangleAlert,
			lucideUserCheck,
			lucideUsers,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6">
			<okane-users-page-header
				eyebrow="Reseau Okane"
				[title]="currentMode() === 'CENTRAL' ? 'Agences centrales' : 'Sous-agences'"
				[description]="currentMode() === 'CENTRAL'
					? 'Gerer les agences centrales et leurs managers responsables.'
					: 'Gerer les sous-agences rattachees aux agences centrales.'"
				[addLabel]="currentMode() === 'CENTRAL' ? 'Ajouter une centrale' : 'Ajouter une sous-agence'"
				(addClicked)="openDialog()"
			>
				<div okaneHeaderActions class="flex items-center gap-2 rounded-full border border-border bg-card p-1 shadow-sm">
					<button
						hlmBtn
						type="button"
						size="sm"
						variant="ghost"
						[class.bg-accent]="currentMode() === 'CENTRAL'"
						(click)="switchMode('CENTRAL')"
					>
						Central
					</button>
					<button
						hlmBtn
						type="button"
						size="sm"
						variant="ghost"
						[class.bg-accent]="currentMode() === 'SUB'"
						(click)="switchMode('SUB')"
					>
						Sous-agence
					</button>
				</div>
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

			<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				@for (kpi of kpiCards(); track kpi.key) {
					<article class="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md">
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
				searchPlaceholder="Rechercher par nom, code, ville ou pays..."
				[searchValue]="search()"
				[filters]="filterDefs()"
				(searchChange)="search.set($event)"
				(filterChange)="onFilterChange($event)"
			/>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div class="flex flex-col gap-2 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="text-base font-semibold text-foreground">{{ currentMode() === 'CENTRAL' ? 'Agences centrales' : 'Sous-agences' }}</h2>
						<p class="text-xs text-muted-foreground">
							{{ currentItems().length }} sur {{ currentTotal() }} element{{ currentTotal() > 1 ? 's' : '' }}
						</p>
					</div>
					<div class="text-xs text-muted-foreground">
						{{ currentMode() === 'CENTRAL' ? 'Managers lies' : 'Agents lies' }}
					</div>
				</div>

				@if (currentItems().length === 0) {
					<okane-users-empty-state
						icon="lucideBuilding2"
						[title]="currentMode() === 'CENTRAL' ? 'Aucune agence centrale ne correspond' : 'Aucune sous-agence ne correspond'"
						description="Ajustez la recherche ou les filtres pour afficher des resultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Agence</th>
									<th class="px-5 py-3 text-left font-medium">Localisation</th>
									<th class="px-5 py-3 text-left font-medium">{{ currentMode() === 'CENTRAL' ? 'Manager' : 'Agence centrale' }}</th>
									<th class="px-5 py-3 text-right font-medium">{{ currentMode() === 'CENTRAL' ? 'Sous-agences' : 'Agents' }}</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-left font-medium">Creation</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (agency of currentItems(); track agency.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border">
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
											@if (currentMode() === 'CENTRAL') {
												@if (agency.managerName) {
													<div class="leading-tight">
														<p class="font-medium text-foreground">{{ agency.managerName }}</p>
														<p class="font-mono text-xs text-muted-foreground">MG-{{ agency.managerId }}</p>
													</div>
												} @else {
													<span class="text-xs text-muted-foreground">Non assigne</span>
												}
											} @else {
												@if (agency.centralAgencyName) {
													<div class="leading-tight">
														<p class="font-medium text-foreground">{{ agency.centralAgencyName }}</p>
														<p class="font-mono text-xs text-muted-foreground">CA-{{ agency.centralAgencyId }}</p>
													</div>
												} @else {
													<span class="text-xs text-muted-foreground">Non rattachee</span>
												}
											}
										</td>
										<td class="px-5 py-3 text-right">
											<span class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
												<ng-icon name="lucideUsers" class="text-xs text-muted-foreground" />
												{{ agency.agentsCount }}
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

		<okane-users-form-dialog
			[open]="dialogOpen()"
			[title]="currentMode() === 'CENTRAL' ? 'Ajouter une agence centrale' : 'Ajouter une sous-agence'"
			[subtitle]="currentMode() === 'CENTRAL'
				? 'Creer une nouvelle centrale et lui assigner un manager.'
				: 'Creer une sous-agence reliee a une agence centrale.'"
			icon="lucideBuilding2"
			(close)="dialogOpen.set(false)"
		>
			<okane-agency-create-form
				[mode]="currentMode()"
				(created)="onAgencyCreated($event)"
				(cancelled)="dialogOpen.set(false)"
			/>
		</okane-users-form-dialog>

		<okane-action-detail-modal
			[open]="detailOpen()"
			[title]="detailTitle()"
			subtitle="Informations de l'agence"
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

		<okane-assign-manager-dialog
			[open]="assignManagerOpen()"
			[agencyId]="assignManagerAgencyId()"
			[agencyName]="assignManagerAgencyName()"
			[currentManagerName]="assignManagerCurrentName()"
			(assigned)="onManagerAssigned($event)"
			(close)="assignManagerOpen.set(false)"
		/>
	`,
})
export class AdminAgenciesPageComponent implements OnInit {
	private readonly _api = inject(AdminAgenciesApiService);
	private readonly _router = inject(Router);
	private readonly _currentUrl = toSignal(
		this._router.events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			map((event) => event.urlAfterRedirects),
			startWith(this._router.url),
		),
		{ initialValue: this._router.url },
	);

	protected readonly currentMode = computed<ApiAgencyType>(() => (this._currentUrl().includes('/sub') ? 'SUB' : 'CENTRAL'));
	protected readonly centralAgencies = signal<ApiAgency[]>([]);
	protected readonly subAgencies = signal<ApiAgency[]>([]);
	protected readonly error = signal<string | null>(null);
	protected readonly search = signal<string>('');
	protected readonly status = signal<string>('all');
	protected readonly relation = signal<string>('all');
	protected readonly dialogOpen = signal<boolean>(false);
	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Details agence');
	protected readonly detailFields = signal<DetailField[]>([]);
	protected readonly confirmOpen = signal<boolean>(false);
	protected readonly confirmTitle = signal<string>('Confirmer');
	protected readonly confirmMessage = signal<string>('');
	protected readonly confirmLabel = signal<string>('Confirmer');
	protected readonly assignManagerOpen = signal<boolean>(false);
	protected readonly assignManagerAgencyId = signal<number>(0);
	protected readonly assignManagerAgencyName = signal<string>('');
	protected readonly assignManagerCurrentName = signal<string | null>(null);
	private _pendingConfirm: (() => void) | null = null;

	protected readonly currentItems = computed(() => (this.currentMode() === 'CENTRAL' ? this.filteredCentral() : this.filteredSub()));
	protected readonly currentTotal = computed(() => (this.currentMode() === 'CENTRAL' ? this.centralAgencies().length : this.subAgencies().length));

	protected readonly filterDefs = computed<FilterDefinition[]>(() => {
		const relationOptions =
			this.currentMode() === 'CENTRAL'
				? []
				: [
						{ value: 'all', label: 'Toutes les centrales' },
						...this.centralAgencies().map((central) => ({
							value: String(central.id),
							label: `${central.name} (${central.code})`,
						})),
					];

		return [
			{
				key: 'status',
				label: 'Statut',
				value: this.status(),
				options: [
					{ value: 'all', label: 'Tous statuts' },
					{ value: 'ACTIVE', label: 'Active' },
					{ value: 'SUSPENDED', label: 'Suspendue' },
					{ value: 'PENDING', label: 'En attente' },
				],
			},
			...(relationOptions.length
				? [
						{
							key: 'relation',
							label: 'Agence centrale',
							value: this.relation(),
							options: relationOptions,
						},
					]
				: []),
		];
	});

	protected readonly kpiCards = computed(() => {
		const list = this.currentMode() === 'CENTRAL' ? this.centralAgencies() : this.subAgencies();
		const active = list.filter((agency) => agency.status === 'ACTIVE').length;
		const pending = list.filter((agency) => agency.status === 'PENDING').length;
		const related = list.reduce((sum, agency) => sum + (agency.agentsCount ?? 0), 0);

		return [
			{
				key: 'TOTAL',
				label: this.currentMode() === 'CENTRAL' ? 'Centrales' : 'Sous-agences',
				value: String(list.length),
				suffix: 'enregistrees',
				icon: 'lucideBuilding2',
				accent: 'bg-primary/10 text-primary',
			},
			{
				key: 'ACTIVE',
				label: 'Actives',
				value: String(active),
				suffix: 'elements',
				icon: 'lucideCheck',
				accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
			},
			{
				key: 'PENDING',
				label: 'En attente',
				value: String(pending),
				suffix: 'elements',
				icon: 'lucideTriangleAlert',
				accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
			},
			{
				key: 'RELATED',
				label: this.currentMode() === 'CENTRAL' ? 'Sous-agences' : 'Agents',
				value: String(related),
				suffix: this.currentMode() === 'CENTRAL' ? 'rattachees' : 'rattaches',
				icon: 'lucideUsers',
				accent: 'bg-secondary/50 text-secondary-foreground',
			},
		];
	});

	public ngOnInit(): void {
		this.refresh();
	}

	protected switchMode(mode: ApiAgencyType): void {
		if (mode === this.currentMode()) {
			return;
		}

		this.dialogOpen.set(false);
		void this._router.navigateByUrl(MODE_ROUTES[mode]);
	}

	protected openDialog(): void {
		this.dialogOpen.set(true);
	}

	protected onAgencyCreated(agency: ApiAgency): void {
		if (agency.agencyType === 'CENTRAL') {
			this.centralAgencies.update((items) => [agency, ...items.filter((item) => item.id !== agency.id)]);
		} else {
			this.subAgencies.update((items) => [agency, ...items.filter((item) => item.id !== agency.id)]);
		}
		this.dialogOpen.set(false);
	}

	protected statusLabel(status: ApiAgencyStatus): string {
		return AGENCY_STATUS_LABELS[status];
	}

	protected statusVariant(status: ApiAgencyStatus): StatusVariant {
		return AGENCY_STATUS_VARIANTS[status];
	}

	protected formatDate(value: string | Date | number | null | undefined): string {
		if (value == null) return '—';
		try {
			const d = value instanceof Date ? value : new Date(value);
			if (Number.isNaN(d.getTime())) return '—';
			return d.toISOString().slice(0, 10);
		} catch {
			return '—';
		}
	}

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.status.set(change.value);
				break;
			case 'relation':
				this.relation.set(change.value);
				break;
		}
	}

	protected actionsFor(agency: ApiAgency): UserActionItem[] {
		const isActive = agency.status === 'ACTIVE';
		const isCentral = agency.agencyType === 'CENTRAL';
		const actions: UserActionItem[] = [
			{ label: 'Voir details', icon: 'lucideEye', action: () => this.openDetail(agency) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.openDetail(agency) },
		];
		if (isCentral) {
			actions.push({
				label: agency.managerName ? 'Changer manager' : 'Affecter manager',
				icon: 'lucideUserCheck',
				action: () => this.openAssignManager(agency),
			});
		}
		actions.push(
			isActive
				? { label: 'Suspendre', icon: 'lucidePowerOff', action: () => this.requestStatusChange(agency, 'SUSPENDED'), variant: 'destructive' as const }
				: { label: 'Activer', icon: 'lucidePower', action: () => this.requestStatusChange(agency, 'ACTIVE') },
		);
		return actions;
	}

	private refresh(): void {
		this.error.set(null);
		this._api.listCentral().subscribe({
			next: (rows) => this.centralAgencies.set(rows),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
		this._api.list().subscribe({
			next: (rows) => this.subAgencies.set(rows),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private filteredCentral(): ApiAgency[] {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		return this.centralAgencies().filter((agency) => {
			if (status !== 'all' && agency.status !== status) return false;
			if (!term) return true;
			return (
				agency.name.toLowerCase().includes(term) ||
				agency.code.toLowerCase().includes(term) ||
				agency.city.toLowerCase().includes(term) ||
				agency.country.toLowerCase().includes(term) ||
				(agency.managerName ?? '').toLowerCase().includes(term)
			);
		});
	}

	private filteredSub(): ApiAgency[] {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const relation = this.relation();
		return this.subAgencies().filter((agency) => {
			if (status !== 'all' && agency.status !== status) return false;
			if (relation !== 'all' && String(agency.centralAgencyId) !== relation) return false;
			if (!term) return true;
			return (
				agency.name.toLowerCase().includes(term) ||
				agency.code.toLowerCase().includes(term) ||
				agency.city.toLowerCase().includes(term) ||
				agency.country.toLowerCase().includes(term) ||
				(agency.centralAgencyName ?? '').toLowerCase().includes(term)
			);
		});
	}

	private openDetail(agency: ApiAgency): void {
		this.detailTitle.set(agency.name);
		const fields: DetailField[] = [
			{ label: 'ID', value: String(agency.id), mono: true },
			{ label: 'Nom', value: agency.name },
			{ label: 'Code', value: agency.code, mono: true },
			{ label: 'Ville', value: agency.city },
			{ label: 'Pays', value: agency.country },
			{ label: 'Adresse', value: agency.address },
			{ label: 'Telephone', value: agency.phone ?? '—' },
			{ label: 'Email', value: agency.email ?? '—' },
			{ label: 'Statut', value: AGENCY_STATUS_LABELS[agency.status] },
		];

		if (agency.agencyType === 'CENTRAL') {
			fields.push(
				{ label: 'Manager', value: agency.managerName ?? 'Non assigne' },
				{ label: 'Sous-agences', value: String(agency.agentsCount) },
			);
		} else {
			fields.push(
				{ label: 'Agence centrale', value: agency.centralAgencyName ?? 'Non rattachee' },
				{ label: 'Agents', value: String(agency.agentsCount) },
			);
		}

		fields.push({ label: 'Creee le', value: this.formatDate(agency.createdAt) });
		this.detailFields.set(fields);
		this.detailOpen.set(true);
	}

	private requestStatusChange(agency: ApiAgency, status: ApiAgencyStatus): void {
		const label = status === 'SUSPENDED' ? 'Suspendre' : 'Activer';
		this.confirmTitle.set(`${label} l'agence`);
		this.confirmMessage.set(`Voulez-vous ${label.toLowerCase()} l'agence ${agency.name} (${agency.code}) ?`);
		this.confirmLabel.set(label);
		this._pendingConfirm = () => this.changeStatus(agency, status);
		this.confirmOpen.set(true);
	}

	protected onConfirm(): void {
		this.confirmOpen.set(false);
		this._pendingConfirm?.();
		this._pendingConfirm = null;
	}

	protected openAssignManager(agency: ApiAgency): void {
		this.assignManagerAgencyId.set(agency.id);
		this.assignManagerAgencyName.set(agency.name);
		this.assignManagerCurrentName.set(agency.managerName);
		this.assignManagerOpen.set(true);
	}

	protected onManagerAssigned(managerId: number): void {
		this._api.assignManager(this.assignManagerAgencyId(), managerId).subscribe({
			next: (updated) => {
				this.centralAgencies.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
				this.assignManagerOpen.set(false);
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private changeStatus(agency: ApiAgency, status: ApiAgencyStatus): void {
		const request$ = agency.agencyType === 'CENTRAL'
			? this._api.changeCentralStatus(agency.id, status)
			: this._api.changeStatus(agency.id, status);

		request$.subscribe({
			next: (updated) => {
				if (updated.agencyType === 'CENTRAL') {
					this.centralAgencies.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
				} else {
					this.subAgencies.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
				}
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
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
