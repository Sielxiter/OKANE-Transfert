import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
	lucideEye,
	lucidePencil,
	lucidePower,
	lucidePowerOff,
	lucideTriangleAlert,
	lucideUserPlus,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../shared/users-filters.component';
import { UsersFormDialogComponent } from '../shared/users-form-dialog.component';
import { UsersLoadingStateComponent } from '../shared/users-loading-state.component';
import { UsersPageHeaderComponent } from '../shared/users-page-header.component';
import { UserCreateFormComponent } from '../shared/user-create-form.component';
import { UserEditFormComponent } from '../shared/user-edit-form.component';
import { ActionDetailModalComponent, type DetailField } from '../shared/action-detail-modal.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import {
	ACCOUNT_LABELS,
	ACCOUNT_VARIANTS,
	KYC_LABELS,
	KYC_VARIANTS,
	type AccountStatus,
	type KycStatus,
	type UserActionItem,
} from '../shared/user-status.types';
import { AdminUsersApiService, type ApiUser } from '../shared/admin-users.api';

@Component({
	selector: 'okane-admin-users-clients-page',
	standalone: true,
	imports: [
		UsersPageHeaderComponent,
		UsersFiltersComponent,
		UserStatusBadgeComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersLoadingStateComponent,
		UsersFormDialogComponent,
		UserCreateFormComponent,
		UserEditFormComponent,
		ActionDetailModalComponent,
		ConfirmDialogComponent,
	],
	providers: [provideIcons({ lucideEye, lucidePencil, lucidePower, lucidePowerOff, lucideUserPlus, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Utilisateurs"
				title="Gestion des clients"
				description="Suivi des clients particuliers, KYC et statut de compte. Données live depuis le backend Okane."
				addLabel="Ajouter un client"
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
						<h2 class="text-base font-semibold text-foreground">Clients</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total() }} client{{ total() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (loading() || error()) {
					<okane-users-loading-state [error]="error()" />
				} @else if (filtered().length === 0) {
					<okane-users-empty-state
						title="Aucun client ne correspond"
						description="Essayez d'élargir votre recherche ou de réinitialiser les filtres."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Nom complet</th>
									<th class="px-5 py-3 text-left font-medium">Email</th>
									<th class="px-5 py-3 text-left font-medium">Téléphone</th>
									<th class="px-5 py-3 text-left font-medium">Pays</th>
									<th class="px-5 py-3 text-left font-medium">Statut KYC</th>
									<th class="px-5 py-3 text-left font-medium">Statut compte</th>
									<th class="px-5 py-3 text-left font-medium">Inscription</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (client of filtered(); track client.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div
													class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border"
												>
													{{ initials(client.fullName) }}
												</div>
												<div>
													<p class="font-medium text-foreground">{{ client.fullName }}</p>
													<p class="text-xs text-muted-foreground">CL-{{ client.id }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ client.email }}</td>
										<td class="px-5 py-3 text-muted-foreground">{{ client.phone || '—' }}</td>
										<td class="px-5 py-3 text-muted-foreground">{{ client.country || '—' }}</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="kycLabel(client.kycStatus)"
												[variant]="kycVariant(client.kycStatus)"
											/>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="accountLabel(client.accountStatus)"
												[variant]="accountVariant(client.accountStatus)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ formatDate(client.createdAt) }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="actionsFor(client)" />
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
			title="Ajouter un client"
			subtitle="Créer un nouveau compte ROLE_CLIENT et déclencher le KYC initial."
			icon="lucideUserPlus"
			(close)="dialogOpen.set(false)"
		>
			<okane-user-create-form
				variant="CLIENT"
				(created)="onUserCreated($event)"
				(cancelled)="dialogOpen.set(false)"
			/>
		</okane-users-form-dialog>

		<okane-action-detail-modal
			[open]="detailOpen()"
			[title]="detailTitle()"
			subtitle="Informations du compte client"
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

		@if (editingUser()) {
			<okane-users-form-dialog
				[open]="editOpen()"
				[title]="'Modifier — ' + editingUser()!.fullName"
				subtitle="Modifier les informations du compte."
				icon="lucidePencil"
				(close)="editOpen.set(false)"
			>
				<okane-user-edit-form
					[user]="editingUser()!"
					(saved)="onUserEdited($event)"
					(cancelled)="editOpen.set(false)"
				/>
			</okane-users-form-dialog>
		}
	`,
})
export class AdminUsersClientsPageComponent implements OnInit {
	private readonly _api = inject(AdminUsersApiService);

	protected readonly clients = signal<ApiUser[]>([]);
	protected readonly loading = signal<boolean>(true);
	protected readonly error = signal<string | null>(null);

	protected readonly search = signal<string>('');
	protected readonly country = signal<string>('all');
	protected readonly kyc = signal<string>('all');
	protected readonly account = signal<string>('all');
	protected readonly dialogOpen = signal<boolean>(false);
	protected readonly editOpen = signal<boolean>(false);
	protected readonly editingUser = signal<ApiUser | null>(null);

	// ─── Detail modal ────────────────────────────────────────────────────────────
	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Détails client');
	protected readonly detailFields = signal<DetailField[]>([]);

	// ─── Confirm dialog ──────────────────────────────────────────────────────────
	protected readonly confirmOpen = signal<boolean>(false);
	protected readonly confirmTitle = signal<string>('Confirmer');
	protected readonly confirmMessage = signal<string>('');
	protected readonly confirmLabel = signal<string>('Confirmer');
	private _pendingConfirm: (() => void) | null = null;

	protected readonly total = computed(() => this.clients().length);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => {
		const countries = Array.from(
			new Set(this.clients().map((c) => c.country).filter((c): c is string => !!c)),
		).sort();

		return [
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
				key: 'kyc',
				label: 'KYC',
				value: this.kyc(),
				options: [
					{ value: 'all', label: 'Tous les KYC' },
					{ value: 'VERIFIED', label: 'Vérifié' },
					{ value: 'PENDING', label: 'En attente' },
					{ value: 'REJECTED', label: 'Rejeté' },
					{ value: 'REVIEW_REQUIRED', label: 'À revoir' },
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
		const country = this.country();
		const kyc = this.kyc();
		const account = this.account();

		return this.clients().filter((c) => {
			if (country !== 'all' && c.country !== country) return false;
			if (kyc !== 'all' && c.kycStatus !== kyc) return false;
			if (account !== 'all' && c.accountStatus !== account) return false;
			if (!term) return true;
			return (
				c.fullName.toLowerCase().includes(term) ||
				c.email.toLowerCase().includes(term) ||
				(c.phone ?? '').toLowerCase().includes(term)
			);
		});
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.loading.set(true);
		this.error.set(null);
		this._api.getClients().subscribe({
			next: (data) => {
				this.clients.set(data);
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
			case 'country':
				this.country.set(change.value);
				break;
			case 'kyc':
				this.kyc.set(change.value);
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
		this.clients.update((items) => [user, ...items]);
		this.dialogOpen.set(false);
	}

	protected onUserEdited(user: ApiUser): void {
		this.clients.update((items) => items.map((c) => (c.id === user.id ? user : c)));
		this.editOpen.set(false);
		this.editingUser.set(null);
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
		if (value == null) return '—';
		try {
			const d = value instanceof Date ? value : new Date(value);
			if (isNaN(d.getTime())) return '—';
			return d.toISOString().replace('T', ' ').slice(0, 16);
		} catch {
			return '—';
		}
	}

	protected kycLabel(status: KycStatus | null): string {
		return status ? KYC_LABELS[status] : 'En attente';
	}

	protected kycVariant(status: KycStatus | null) {
		return status ? KYC_VARIANTS[status] : KYC_VARIANTS.PENDING;
	}

	protected accountLabel(status: AccountStatus): string {
		return ACCOUNT_LABELS[status];
	}

	protected accountVariant(status: AccountStatus) {
		return ACCOUNT_VARIANTS[status];
	}

	protected actionsFor(client: ApiUser): UserActionItem[] {
		const isActive = client.accountStatus === 'ACTIVE';
		return [
			{
				label: 'Voir détails',
				icon: 'lucideEye',
				action: () => this.openDetail(client),
			},
			{
				label: 'Modifier',
				icon: 'lucidePencil',
				action: () => this.openEdit(client),
			},
			isActive
				? {
						label: 'Suspendre',
						icon: 'lucidePowerOff',
						action: () => this.requestStatusChange(client, 'SUSPENDED'),
						variant: 'destructive' as const,
					}
				: {
						label: 'Activer',
						icon: 'lucidePower',
						action: () => this.requestStatusChange(client, 'ACTIVE'),
					},
		];
	}

	private openDetail(client: ApiUser): void {
		this.detailTitle.set(`${client.fullName}`);
		this.detailFields.set([
			{ label: 'ID', value: String(client.id), mono: true },
			{ label: 'Nom complet', value: client.fullName },
			{ label: 'Email', value: client.email },
			{ label: 'Téléphone', value: client.phone ?? '—' },
			{ label: 'Pays', value: client.country ?? '—' },
			{ label: 'Statut compte', value: ACCOUNT_LABELS[client.accountStatus] },
			{ label: 'KYC', value: client.kycStatus ? KYC_LABELS[client.kycStatus as KycStatus] ?? client.kycStatus : '—' },
			{ label: 'Créé le', value: this.formatDate(client.createdAt) },
			{ label: 'Dernière connexion', value: this.formatDate(client.lastLoginAt) },
		]);
		this.detailOpen.set(true);
	}

	private openEdit(client: ApiUser): void {
		this.editingUser.set(client);
		this.editOpen.set(true);
	}

	private requestStatusChange(client: ApiUser, status: AccountStatus): void {
		const label = status === 'SUSPENDED' ? 'Suspendre' : 'Activer';
		this.confirmTitle.set(`${label} le compte`);
		this.confirmMessage.set(
			`Voulez-vous ${label.toLowerCase()} le compte de ${client.fullName} (${client.email}) ?`,
		);
		this.confirmLabel.set(label);
		this._pendingConfirm = () => this.changeStatus(client, status);
		this.confirmOpen.set(true);
	}

	protected onConfirm(): void {
		this.confirmOpen.set(false);
		this._pendingConfirm?.();
		this._pendingConfirm = null;
	}

	private changeStatus(client: ApiUser, status: AccountStatus): void {
		this._api.changeStatus(client.id, status).subscribe({
			next: (updated) => {
				this.clients.update((items) => items.map((c) => (c.id === updated.id ? updated : c)));
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
			},
		});
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
