import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucidePencil, lucidePower, lucidePowerOff, lucideShield } from '@ng-icons/lucide';
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
import { ADMINS_MOCK, type AdminUser } from './admins.mock';

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
		UsersPlaceholderDialogComponent,
	],
	providers: [provideIcons({ lucideEye, lucidePencil, lucidePower, lucidePowerOff, lucideShield })],
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
							{{ filtered().length }} sur {{ total }} administrateur{{ total > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
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
													<p class="text-xs text-muted-foreground">{{ admin.id }}</p>
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
												[label]="accountLabel(admin.account)"
												[variant]="accountVariant(admin.account)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ admin.lastLogin }}</td>
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

		<okane-users-placeholder-dialog
			[open]="dialogOpen()"
			title="Ajouter un administrateur"
			(close)="dialogOpen.set(false)"
		/>
	`,
})
export class AdminUsersAdminsPageComponent {
	protected readonly total = ADMINS_MOCK.length;

	protected readonly search = signal<string>('');
	protected readonly account = signal<string>('all');
	protected readonly dialogOpen = signal<boolean>(false);

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

	protected readonly filtered = computed<AdminUser[]>(() => {
		const term = this.search().trim().toLowerCase();
		const account = this.account();

		return ADMINS_MOCK.filter((a) => {
			if (account !== 'all' && a.account !== account) return false;
			if (!term) return true;
			return (
				a.fullName.toLowerCase().includes(term) ||
				a.email.toLowerCase().includes(term) ||
				a.id.toLowerCase().includes(term)
			);
		});
	});

	protected onFilterChange(change: { key: string; value: string }): void {
		if (change.key === 'account') {
			this.account.set(change.value);
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

	protected accountLabel(status: AdminUser['account']): string {
		return ACCOUNT_LABELS[status];
	}

	protected accountVariant(status: AdminUser['account']) {
		return ACCOUNT_VARIANTS[status];
	}

	protected actionsFor(admin: AdminUser): UserActionItem[] {
		const isActive = admin.account === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', admin) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit', admin) },
			isActive
				? { label: 'Suspendre', icon: 'lucidePowerOff', action: () => this.logAction('suspend', admin), variant: 'destructive' as const }
				: { label: 'Activer', icon: 'lucidePower', action: () => this.logAction('activate', admin) },
		];
	}

	private logAction(action: string, admin: AdminUser): void {
		// eslint-disable-next-line no-console
		console.info(`[Admins] ${action}`, admin.id, admin.fullName);
	}
}
