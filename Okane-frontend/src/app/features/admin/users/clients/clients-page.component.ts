import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
	lucideEye,
	lucidePencil,
	lucidePower,
	lucidePowerOff,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../shared/users-filters.component';
import { UsersPageHeaderComponent } from '../shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../shared/users-placeholder-dialog.component';
import {
	ACCOUNT_LABELS,
	ACCOUNT_VARIANTS,
	KYC_LABELS,
	KYC_VARIANTS,
	type UserActionItem,
} from '../shared/user-status.types';
import { CLIENTS_MOCK, CLIENT_COUNTRIES, type ClientUser } from './clients.mock';

@Component({
	selector: 'okane-admin-users-clients-page',
	standalone: true,
	imports: [
		UsersPageHeaderComponent,
		UsersFiltersComponent,
		UserStatusBadgeComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersPlaceholderDialogComponent,
	],
	providers: [provideIcons({ lucideEye, lucidePencil, lucidePower, lucidePowerOff })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Utilisateurs"
				title="Gestion des clients"
				description="Suivi des clients particuliers, KYC et statut de compte. Données mock en attente d'intégration API."
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
							{{ filtered().length }} sur {{ total }} client{{ total > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
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
													<p class="text-xs text-muted-foreground">{{ client.id }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ client.email }}</td>
										<td class="px-5 py-3 text-muted-foreground">{{ client.phone }}</td>
										<td class="px-5 py-3 text-muted-foreground">{{ client.country }}</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="kycLabel(client.kyc)"
												[variant]="kycVariant(client.kyc)"
											/>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="accountLabel(client.account)"
												[variant]="accountVariant(client.account)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ client.registeredAt }}</td>
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

		<okane-users-placeholder-dialog
			[open]="dialogOpen()"
			title="Ajouter un client"
			(close)="dialogOpen.set(false)"
		/>
	`,
})
export class AdminUsersClientsPageComponent {
	protected readonly total = CLIENTS_MOCK.length;

	protected readonly search = signal<string>('');
	protected readonly country = signal<string>('all');
	protected readonly kyc = signal<string>('all');
	protected readonly account = signal<string>('all');
	protected readonly dialogOpen = signal<boolean>(false);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'country',
			label: 'Pays',
			value: this.country(),
			options: [
				{ value: 'all', label: 'Tous les pays' },
				...CLIENT_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
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
	]);

	protected readonly filtered = computed<ClientUser[]>(() => {
		const term = this.search().trim().toLowerCase();
		const country = this.country();
		const kyc = this.kyc();
		const account = this.account();

		return CLIENTS_MOCK.filter((c) => {
			if (country !== 'all' && c.countryCode !== country) return false;
			if (kyc !== 'all' && c.kyc !== kyc) return false;
			if (account !== 'all' && c.account !== account) return false;
			if (!term) return true;
			return (
				c.fullName.toLowerCase().includes(term) ||
				c.email.toLowerCase().includes(term) ||
				c.phone.toLowerCase().includes(term) ||
				c.id.toLowerCase().includes(term)
			);
		});
	});

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

	protected initials(name: string): string {
		return name
			.split(' ')
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	protected kycLabel(status: ClientUser['kyc']): string {
		return KYC_LABELS[status];
	}

	protected kycVariant(status: ClientUser['kyc']) {
		return KYC_VARIANTS[status];
	}

	protected accountLabel(status: ClientUser['account']): string {
		return ACCOUNT_LABELS[status];
	}

	protected accountVariant(status: ClientUser['account']) {
		return ACCOUNT_VARIANTS[status];
	}

	protected actionsFor(client: ClientUser): UserActionItem[] {
		const isActive = client.account === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', client) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit', client) },
			isActive
				? { label: 'Suspendre', icon: 'lucidePowerOff', action: () => this.logAction('suspend', client), variant: 'destructive' as const }
				: { label: 'Activer', icon: 'lucidePower', action: () => this.logAction('activate', client) },
		];
	}

	private logAction(action: string, client: ClientUser): void {
		// eslint-disable-next-line no-console
		console.info(`[Clients] ${action}`, client.id, client.fullName);
	}
}
