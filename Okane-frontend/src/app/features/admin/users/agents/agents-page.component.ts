import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBuilding2,
	lucideEye,
	lucidePencil,
	lucidePower,
	lucidePowerOff,
	lucideWallet,
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
import { AGENT_AGENCIES, AGENTS_MOCK, type AgentUser } from './agents.mock';

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
		UsersPlaceholderDialogComponent,
	],
	providers: [
		provideIcons({
			lucideBuilding2,
			lucideEye,
			lucidePencil,
			lucidePower,
			lucidePowerOff,
			lucideWallet,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Utilisateurs"
				title="Gestion des agents"
				description="Agents ROLE_AGENT en agence. Suivi des soldes de caisse mock et statut de compte."
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
							{{ filtered().length }} sur {{ total }} agent{{ total > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
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
									<th class="px-5 py-3 text-right font-medium">Solde caisse</th>
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
													<p class="text-xs text-muted-foreground">{{ agent.id }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ agent.email }}</td>
										<td class="px-5 py-3 text-muted-foreground">{{ agent.phone }}</td>
										<td class="px-5 py-3">
											<div class="flex items-center gap-2 text-foreground">
												<span
													class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border"
												>
													<ng-icon name="lucideBuilding2" class="text-sm" />
												</span>
												<div class="leading-tight">
													<p class="font-medium">{{ agent.agency.name }}</p>
													<p class="font-mono text-xs text-muted-foreground">{{ agent.agency.code }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm font-medium text-foreground">
												{{ formatBalance(agent.cashBalance) }} {{ agent.currency }}
											</span>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="accountLabel(agent.account)"
												[variant]="accountVariant(agent.account)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ agent.lastLogin }}</td>
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

		<okane-users-placeholder-dialog
			[open]="dialogOpen()"
			title="Ajouter un agent"
			(close)="dialogOpen.set(false)"
		/>
	`,
})
export class AdminUsersAgentsPageComponent {
	protected readonly total = AGENTS_MOCK.length;

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
				...AGENT_AGENCIES.map((a) => ({ value: a.code, label: a.name })),
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

	protected readonly filtered = computed<AgentUser[]>(() => {
		const term = this.search().trim().toLowerCase();
		const agency = this.agency();
		const account = this.account();

		return AGENTS_MOCK.filter((a) => {
			if (agency !== 'all' && a.agency.code !== agency) return false;
			if (account !== 'all' && a.account !== account) return false;
			if (!term) return true;
			return (
				a.fullName.toLowerCase().includes(term) ||
				a.email.toLowerCase().includes(term) ||
				a.phone.toLowerCase().includes(term) ||
				a.agency.name.toLowerCase().includes(term) ||
				a.id.toLowerCase().includes(term)
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

	protected accountLabel(status: AgentUser['account']): string {
		return ACCOUNT_LABELS[status];
	}

	protected accountVariant(status: AgentUser['account']) {
		return ACCOUNT_VARIANTS[status];
	}

	protected formatBalance(value: number): string {
		return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
	}

	protected actionsFor(agent: AgentUser): UserActionItem[] {
		const isActive = agent.account === 'ACTIVE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', agent) },
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.logAction('edit', agent) },
			{ label: 'Voir caisse', icon: 'lucideWallet', action: () => this.logAction('cash', agent) },
			isActive
				? { label: 'Suspendre', icon: 'lucidePowerOff', action: () => this.logAction('suspend', agent), variant: 'destructive' as const }
				: { label: 'Activer', icon: 'lucidePower', action: () => this.logAction('activate', agent) },
		];
	}

	private logAction(action: string, agent: AgentUser): void {
		// eslint-disable-next-line no-console
		console.info(`[Agents] ${action}`, agent.id, agent.fullName);
	}
}
