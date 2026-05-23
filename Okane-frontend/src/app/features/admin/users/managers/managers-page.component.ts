import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBuilding2,
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
	type UserActionItem,
} from '../shared/user-status.types';
import { MANAGER_AGENCIES, MANAGERS_MOCK, type ManagerUser } from './managers.mock';

@Component({
	selector: 'okane-admin-users-managers-page',
	standalone: true,
	imports: [
		NgIcon,
		UsersPageHeaderComponent,
		UsersFiltersComponent,
		UserStatusBadgeComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersPlaceholderDialogComponent,
	],
	providers: [
		provideIcons({ lucideBuilding2, lucideEye, lucidePencil, lucidePower, lucidePowerOff }),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Utilisateurs"
				title="Gestion des managers"
				description="Managers d'agence ROLE_MANAGER. Chaque manager pilote une agence du réseau."
				addLabel="Ajouter un manager"
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
						<h2 class="text-base font-semibold text-foreground">Managers</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total }} manager{{ total > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
					<okane-users-empty-state
						title="Aucun manager ne correspond"
						description="Modifiez les filtres pour voir d'autres managers."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Nom complet</th>
									<th class="px-5 py-3 text-left font-medium">Email</th>
									<th class="px-5 py-3 text-left font-medium">Téléphone</th>
									<th class="px-5 py-3 text-left font-medium">Agence assignée</th>
									<th class="px-5 py-3 text-left font-medium">Statut compte</th>
									<th class="px-5 py-3 text-left font-medium">Dernière connexion</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (manager of filtered(); track manager.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div
													class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border"
												>
													{{ initials(manager.fullName) }}
												</div>
												<div>
													<p class="font-medium text-foreground">{{ manager.fullName }}</p>
													<p class="text-xs text-muted-foreground">{{ manager.id }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ manager.email }}</td>
										<td class="px-5 py-3 text-muted-foreground">{{ manager.phone }}</td>
										<td class="px-5 py-3">
											<div class="flex items-center gap-2 text-foreground">
												<span
													class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border"
												>
													<ng-icon name="lucideBuilding2" class="text-sm" />
												</span>
												<div class="leading-tight">
													<p class="font-medium">{{ manager.agency.name }}</p>
													<p class="font-mono text-xs text-muted-foreground">{{ manager.agency.code }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="accountLabel(manager.account)"
												[variant]="accountVariant(manager.account)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ manager.lastLogin }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="actionsFor(manager)" />
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
			title="Ajouter un manager"
			(close)="dialogOpen.set(false)"
		/>
	`,
})
export class AdminUsersManagersPageComponent {
	protected readonly total = MANAGERS_MOCK.length;

	protected readonly search = signal<string>('');
	protected readonly agency = signal<string>('all');
	protected readonly account = signal<string>('all');
	protected readonly dialogOpen = signal<boolean>(false);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'agency',
			label: 'Agence',
			value: this.agency(),
			options: [
				{ value: 'all', label: 'Toutes les agences' },
				...MANAGER_AGENCIES.map((a) => ({ value: a.code, label: a.name })),
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

	protected readonly filtered = computed<ManagerUser[]>(() => {
		const term = this.search().trim().toLowerCase();
		const agency = this.agency();
		const account = this.account();

		return MANAGERS_MOCK.filter((m) => {
			if (agency !== 'all' && m.agency.code !== agency) return false;
			if (account !== 'all' && m.account !== account) return false;
			if (!term) return true;
			return (
				m.fullName.toLowerCase().includes(term) ||
				m.email.toLowerCase().includes(term) ||
				m.phone.toLowerCase().includes(term) ||
				m.agency.name.toLowerCase().includes(term) ||
				m.id.toLowerCase().includes(term)
			);
		});
	});

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

	protected initials(name: string): string {
		return name
			.split(' ')
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	protected accountLabel(status: ManagerUser['account']): string {
		return ACCOUNT_LABELS[status];
	}

	protected accountVariant(status: ManagerUser['account']) {
		return ACCOUNT_VARIANTS[status];
	}

	protected actionsFor(manager: ManagerUser): UserActionItem[] {
		const isActive = manager.account === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', manager) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit', manager) },
			{ label: 'Voir agence', icon: 'lucideBuilding2', action: () => this.logAction('agency', manager) },
			isActive
				? { label: 'Suspendre', icon: 'lucidePowerOff', action: () => this.logAction('suspend', manager), variant: 'destructive' as const }
				: { label: 'Activer', icon: 'lucidePower', action: () => this.logAction('activate', manager) },
		];
	}

	private logAction(action: string, manager: ManagerUser): void {
		// eslint-disable-next-line no-console
		console.info(`[Managers] ${action}`, manager.id, manager.fullName);
	}
}
