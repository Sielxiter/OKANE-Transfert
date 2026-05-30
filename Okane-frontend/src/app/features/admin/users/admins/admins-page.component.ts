import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucidePencil, lucidePower, lucidePowerOff, lucideShield, lucideTriangleAlert } from '@ng-icons/lucide';
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
	selector: 'okane-admin-users-admins-page',
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
	providers: [provideIcons({ lucideEye, lucidePencil, lucidePower, lucidePowerOff, lucideShield, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Utilisateurs"
				title="Gestion des administrateurs"
				description="Comptes ROLE_ADMIN ayant accès à la supervision globale de la plateforme."
				addLabel="Ajouter un admin"
				(addClicked)="openDialog()"
			/>

			<okane-users-filters
				searchPlaceholder="Rechercher par nom ou email..."
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
						<h2 class="text-base font-semibold text-foreground">Administrateurs</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total() }} administrateur{{ total() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (loading() || error()) {
					<okane-users-loading-state [error]="error()" />
				} @else if (filtered().length === 0) {
					<okane-users-empty-state
						title="Aucun administrateur ne correspond"
						description="Réinitialisez vos filtres pour afficher les administrateurs."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Nom complet</th>
									<th class="px-5 py-3 text-left font-medium">Email</th>
									<th class="px-5 py-3 text-left font-medium">Rôle</th>
									<th class="px-5 py-3 text-left font-medium">Statut compte</th>
									<th class="px-5 py-3 text-left font-medium">Dernière connexion</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (admin of filtered(); track admin.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div
													class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border"
												>
													{{ initials(admin.fullName) }}
												</div>
												<div>
													<p class="font-medium text-foreground">{{ admin.fullName }}</p>
													<p class="text-xs text-muted-foreground">AD-{{ admin.id }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ admin.email }}</td>
										<td class="px-5 py-3">
											<span
												class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
											>
												<ng-icon name="lucideShield" class="text-xs" />
												{{ admin.role }}
											</span>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="accountLabel(admin.accountStatus)"
												[variant]="accountVariant(admin.accountStatus)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ formatDate(admin.lastLoginAt) }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="actionsFor(admin)" />
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
			title="Ajouter un administrateur"
			subtitle="Créer un nouveau compte ROLE_ADMIN avec accès supervision globale."
			icon="lucideShield"
			(close)="dialogOpen.set(false)"
		>
			<okane-user-create-form
				variant="ADMIN"
				(created)="onUserCreated($event)"
				(cancelled)="dialogOpen.set(false)"
			/>
		</okane-users-form-dialog>

		<okane-action-detail-modal
			[open]="detailOpen()"
			[title]="detailTitle()"
			subtitle="Informations du compte administrateur"
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
export class AdminUsersAdminsPageComponent implements OnInit {
	private readonly _api = inject(AdminUsersApiService);

	protected readonly admins = signal<ApiUser[]>([]);
	protected readonly loading = signal<boolean>(true);
	protected readonly error = signal<string | null>(null);

	protected readonly search = signal<string>('');
	protected readonly account = signal<string>('all');
	protected readonly dialogOpen = signal<boolean>(false);

	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Détails admin');
	protected readonly detailFields = signal<DetailField[]>([]);

	protected readonly confirmOpen = signal<boolean>(false);
	protected readonly confirmTitle = signal<string>('Confirmer');
	protected readonly confirmMessage = signal<string>('');
	protected readonly confirmLabel = signal<string>('Confirmer');
	private _pendingConfirm: (() => void) | null = null;

	protected readonly total = computed(() => this.admins().length);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
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
	]);

	protected readonly filtered = computed<ApiUser[]>(() => {
		const term = this.search().trim().toLowerCase();
		const account = this.account();

		return this.admins().filter((a) => {
			if (account !== 'all' && a.accountStatus !== account) return false;
			if (!term) return true;
			return (
				a.fullName.toLowerCase().includes(term) ||
				a.email.toLowerCase().includes(term)
			);
		});
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.loading.set(true);
		this.error.set(null);
		this._api.getAdmins().subscribe({
			next: (data) => {
				this.admins.set(data);
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.loading.set(false);
			},
		});
	}

	protected onFilterChange(change: { key: string; value: string }): void {
		if (change.key === 'account') {
			this.account.set(change.value);
		}
	}

	protected openDialog(): void {
		this.dialogOpen.set(true);
	}

	protected onUserCreated(user: ApiUser): void {
		this.admins.update((items) => [user, ...items]);
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

	protected actionsFor(admin: ApiUser): UserActionItem[] {
		const isActive = admin.accountStatus === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.openDetail(admin) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.openEdit(admin) },
			isActive
				? { label: 'Suspendre', icon: 'lucidePowerOff', action: () => this.requestStatusChange(admin, 'SUSPENDED'), variant: 'destructive' as const }
				: { label: 'Activer', icon: 'lucidePower', action: () => this.requestStatusChange(admin, 'ACTIVE') },
		];
	}

	private openDetail(admin: ApiUser): void {
		this.detailTitle.set(admin.fullName);
		this.detailFields.set([
			{ label: 'ID', value: String(admin.id), mono: true },
			{ label: 'Nom complet', value: admin.fullName },
			{ label: 'Email', value: admin.email },
			{ label: 'Téléphone', value: admin.phone ?? '—' },
			{ label: 'Statut compte', value: ACCOUNT_LABELS[admin.accountStatus] },
			{ label: 'Dernière connexion', value: this.formatDate(admin.lastLoginAt) },
		]);
		this.detailOpen.set(true);
	}

	private openEdit(admin: ApiUser): void {
		this.detailTitle.set(`Modifier — ${admin.fullName}`);
		this.detailFields.set([{ label: 'Info', value: 'Le formulaire de modification sera disponible dans une prochaine phase.' }]);
		this.detailOpen.set(true);
	}

	private requestStatusChange(admin: ApiUser, status: AccountStatus): void {
		const label = status === 'SUSPENDED' ? 'Suspendre' : 'Activer';
		this.confirmTitle.set(`${label} le compte`);
		this.confirmMessage.set(`Voulez-vous ${label.toLowerCase()} le compte de ${admin.fullName} (${admin.email}) ?`);
		this.confirmLabel.set(label);
		this._pendingConfirm = () => this.changeStatus(admin, status);
		this.confirmOpen.set(true);
	}

	protected onConfirm(): void {
		this.confirmOpen.set(false);
		this._pendingConfirm?.();
		this._pendingConfirm = null;
	}

	private changeStatus(admin: ApiUser, status: AccountStatus): void {
		this._api.changeStatus(admin.id, status).subscribe({
			next: (updated) => {
				this.admins.update((items) => items.map((a) => (a.id === updated.id ? updated : a)));
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
			},
		});
	}

	private logAction(_action: string, _admin: ApiUser): void { /* replaced */ }

	private extractMessage(err: unknown): string {
		const fallback = 'Erreur réseau. Vérifiez votre connexion ou votre session.';
		if (typeof err === 'object' && err !== null) {
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
