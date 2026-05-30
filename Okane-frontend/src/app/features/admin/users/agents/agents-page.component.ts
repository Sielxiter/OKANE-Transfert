import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBuilding2,
	lucideEye,
	lucidePencil,
	lucidePower,
	lucidePowerOff,
	lucideTriangleAlert,
	lucideWallet,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../shared/users-filters.component';
import { UsersFormDialogComponent } from '../shared/users-form-dialog.component';
import { UsersLoadingStateComponent } from '../shared/users-loading-state.component';
import { UsersPageHeaderComponent } from '../shared/users-page-header.component';
import { UserCreateFormComponent } from '../shared/user-create-form.component';
import { ActionDetailModalComponent, type DetailField } from '../shared/action-detail-modal.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import {
	ACCOUNT_LABELS,
	ACCOUNT_VARIANTS,
	type AccountStatus,
	type UserActionItem,
} from '../shared/user-status.types';
import { AdminUsersApiService, type ApiUser } from '../shared/admin-users.api';

@Component({
	selector: 'okane-admin-users-agents-page',
	standalone: true,
	imports: [
		NgIcon,
		UsersPageHeaderComponent,
		UsersFiltersComponent,
		UserStatusBadgeComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersLoadingStateComponent,
		UsersFormDialogComponent,
		UserCreateFormComponent,
		ActionDetailModalComponent,
		ConfirmDialogComponent,
	],
	providers: [
		provideIcons({
			lucideBuilding2,
			lucideEye,
			lucidePencil,
			lucidePower,
			lucidePowerOff,
			lucideTriangleAlert,
			lucideWallet,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Utilisateurs"
				title="Gestion des agents"
				description="Agents ROLE_AGENT en agence. Le solde de caisse sera affiché lorsque le module Caisse sera connecté."
				addLabel="Ajouter un agent"
				(addClicked)="openDialog()"
			/>

			<okane-users-filters
				searchPlaceholder="Rechercher par nom, email, téléphone..."
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
						<h2 class="text-base font-semibold text-foreground">Agents</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total() }} agent{{ total() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (loading() || error()) {
					<okane-users-loading-state [error]="error()" />
				} @else if (filtered().length === 0) {
					<okane-users-empty-state
						title="Aucun agent ne correspond"
						description="Modifiez les filtres pour voir d'autres agents."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Nom complet</th>
									<th class="px-5 py-3 text-left font-medium">Email</th>
									<th class="px-5 py-3 text-left font-medium">Téléphone</th>
									<th class="px-5 py-3 text-left font-medium">Agence</th>
									<th class="px-5 py-3 text-left font-medium">Statut compte</th>
									<th class="px-5 py-3 text-left font-medium">Dernière connexion</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (agent of filtered(); track agent.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div
													class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border"
												>
													{{ initials(agent.fullName) }}
												</div>
												<div>
													<p class="font-medium text-foreground">{{ agent.fullName }}</p>
													<p class="text-xs text-muted-foreground">AG-{{ agent.id }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ agent.email }}</td>
										<td class="px-5 py-3 text-muted-foreground">{{ agent.phone || '—' }}</td>
										<td class="px-5 py-3">
											@if (agent.agencyName) {
												<div class="flex items-center gap-2 text-foreground">
													<span
														class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border"
													>
														<ng-icon name="lucideBuilding2" class="text-sm" />
													</span>
													<div class="leading-tight">
														<p class="font-medium">{{ agent.agencyName }}</p>
														<p class="font-mono text-xs text-muted-foreground">{{ agent.agencyCode }}</p>
													</div>
												</div>
											} @else {
												<span class="text-xs text-muted-foreground">Non assignée</span>
											}
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="accountLabel(agent.accountStatus)"
												[variant]="accountVariant(agent.accountStatus)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ formatDate(agent.lastLoginAt) }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="actionsFor(agent)" />
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
			title="Ajouter un agent"
			subtitle="Créer un nouveau compte ROLE_AGENT. L'agence peut être assignée plus tard."
			icon="lucideUserCheck"
			(close)="dialogOpen.set(false)"
		>
			<okane-user-create-form
				variant="AGENT"
				(created)="onUserCreated($event)"
				(cancelled)="dialogOpen.set(false)"
			/>
		</okane-users-form-dialog>

		<okane-action-detail-modal
			[open]="detailOpen()"
			[title]="detailTitle()"
			subtitle="Informations du compte agent"
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
export class AdminUsersAgentsPageComponent implements OnInit {
	private readonly _api = inject(AdminUsersApiService);

	protected readonly agents = signal<ApiUser[]>([]);
	protected readonly loading = signal<boolean>(true);
	protected readonly error = signal<string | null>(null);

	protected readonly search = signal<string>('');
	protected readonly agency = signal<string>('all');
	protected readonly account = signal<string>('all');
	protected readonly dialogOpen = signal<boolean>(false);

	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Détails agent');
	protected readonly detailFields = signal<DetailField[]>([]);

	protected readonly confirmOpen = signal<boolean>(false);
	protected readonly confirmTitle = signal<string>('Confirmer');
	protected readonly confirmMessage = signal<string>('');
	protected readonly confirmLabel = signal<string>('Confirmer');
	private _pendingConfirm: (() => void) | null = null;

	protected readonly total = computed(() => this.agents().length);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => {
		const agencies = Array.from(
			new Map(
				this.agents()
					.filter((a) => a.agencyCode && a.agencyName)
					.map((a) => [a.agencyCode!, { code: a.agencyCode!, name: a.agencyName! }]),
			).values(),
		);

		return [
			{
				key: 'agency',
				label: 'Agence',
				value: this.agency(),
				options: [
					{ value: 'all', label: 'Toutes les agences' },
					...agencies.map((a) => ({ value: a.code, label: a.name })),
				],
			},
			{
				key: 'account',
				label: 'Compte',
				value: this.account(),
				options: [
					{ value: 'all', label: 'Tous les statuts' },
					{ value: 'ACTIVE', label: 'Actif' },
					{ value: 'SUSPENDED', label: 'Suspendu' },
					{ value: 'LOCKED', label: 'Verrouillé' },
				],
			},
		];
	});

	protected readonly filtered = computed<ApiUser[]>(() => {
		const term = this.search().trim().toLowerCase();
		const agency = this.agency();
		const account = this.account();

		return this.agents().filter((a) => {
			if (agency !== 'all' && a.agencyCode !== agency) return false;
			if (account !== 'all' && a.accountStatus !== account) return false;
			if (!term) return true;
			return (
				a.fullName.toLowerCase().includes(term) ||
				a.email.toLowerCase().includes(term) ||
				(a.phone ?? '').toLowerCase().includes(term) ||
				(a.agencyName ?? '').toLowerCase().includes(term)
			);
		});
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.loading.set(true);
		this.error.set(null);
		this._api.getAgents().subscribe({
			next: (data) => {
				this.agents.set(data);
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
			case 'agency':
				this.agency.set(change.value);
				break;
			case 'account':
				this.account.set(change.value);
				break;
		}
	}

	protected openDialog(): void {
		this.dialogOpen.set(true);
	}

	protected onUserCreated(user: ApiUser): void {
		this.agents.update((items) => [user, ...items]);
		this.dialogOpen.set(false);
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

	protected formatDate(value: string | Date | number | null | undefined): string {
		if (value == null) return 'Jamais';
		try {
			const d = value instanceof Date ? value : new Date(value);
			if (isNaN(d.getTime())) return 'Jamais';
			return d.toISOString().replace('T', ' ').slice(0, 16);
		} catch {
			return 'Jamais';
		}
	}

	protected accountLabel(status: AccountStatus): string {
		return ACCOUNT_LABELS[status];
	}

	protected accountVariant(status: AccountStatus) {
		return ACCOUNT_VARIANTS[status];
	}

	protected actionsFor(agent: ApiUser): UserActionItem[] {
		const isActive = agent.accountStatus === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.openDetail(agent) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.openEdit(agent) },
			{ label: 'Voir caisse', icon: 'lucideWallet', action: () => this.openCashDetail(agent) },
			isActive
				? { label: 'Suspendre', icon: 'lucidePowerOff', action: () => this.requestStatusChange(agent, 'SUSPENDED'), variant: 'destructive' as const }
				: { label: 'Activer', icon: 'lucidePower', action: () => this.requestStatusChange(agent, 'ACTIVE') },
		];
	}

	private openDetail(agent: ApiUser): void {
		this.detailTitle.set(agent.fullName);
		this.detailFields.set([
			{ label: 'ID', value: String(agent.id), mono: true },
			{ label: 'Nom complet', value: agent.fullName },
			{ label: 'Email', value: agent.email },
			{ label: 'Téléphone', value: agent.phone ?? '—' },
			{ label: 'Agence', value: agent.agencyName ?? 'Non assignée' },
			{ label: 'Code agence', value: agent.agencyCode ?? '—', mono: true },
			{ label: 'Statut compte', value: ACCOUNT_LABELS[agent.accountStatus] },
			{ label: 'Dernière connexion', value: this.formatDate(agent.lastLoginAt) },
		]);
		this.detailOpen.set(true);
	}

	private openEdit(agent: ApiUser): void {
		this.detailTitle.set(`Modifier — ${agent.fullName}`);
		this.detailFields.set([{ label: 'Info', value: 'Le formulaire de modification sera disponible dans une prochaine phase.' }]);
		this.detailOpen.set(true);
	}

	private openCashDetail(agent: ApiUser): void {
		this.detailTitle.set(`Caisse — ${agent.fullName}`);
		this.detailFields.set([
			{ label: 'Agent', value: agent.fullName },
			{ label: 'Agence', value: agent.agencyName ?? '—' },
			{ label: 'Info', value: 'La gestion des sessions de caisse sera disponible dans une prochaine phase.' },
		]);
		this.detailOpen.set(true);
	}

	private requestStatusChange(agent: ApiUser, status: AccountStatus): void {
		const label = status === 'SUSPENDED' ? 'Suspendre' : 'Activer';
		this.confirmTitle.set(`${label} le compte`);
		this.confirmMessage.set(`Voulez-vous ${label.toLowerCase()} le compte de ${agent.fullName} (${agent.email}) ?`);
		this.confirmLabel.set(label);
		this._pendingConfirm = () => this.changeStatus(agent, status);
		this.confirmOpen.set(true);
	}

	protected onConfirm(): void {
		this.confirmOpen.set(false);
		this._pendingConfirm?.();
		this._pendingConfirm = null;
	}

	private changeStatus(agent: ApiUser, status: AccountStatus): void {
		this._api.changeStatus(agent.id, status).subscribe({
			next: (updated) => {
				this.agents.update((items) => items.map((a) => (a.id === updated.id ? updated : a)));
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
			},
		});
	}

	private logAction(_action: string, _agent: ApiUser): void { /* replaced */ }

	private extractMessage(err: unknown): string {
		const fallback = 'Erreur réseau. Vérifiez votre connexion ou votre session.';
		if (typeof err === 'object' && err !== null) {
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
