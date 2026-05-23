import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideBadgeCheck,
	lucideBan,
	lucideClipboardList,
	lucideClock,
	lucideEye,
	lucideHourglass,
	lucideReceipt,
	lucideShieldAlert,
	lucideXCircle,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	TRANSFER_AGENTS,
	TRANSFER_COUNTRIES,
	TRANSFER_KPIS,
	TRANSFERS_MOCK,
	TRANSFER_STATUS_LABELS,
	TRANSFER_STATUS_VARIANTS,
	type Transfer,
	type TransferStatus,
} from './transfers.mock';

@Component({
	selector: 'okane-admin-transfers-page',
	standalone: true,
	imports: [
		NgClass,
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
			lucideArrowRightLeft,
			lucideBadgeCheck,
			lucideBan,
			lucideClipboardList,
			lucideClock,
			lucideEye,
			lucideHourglass,
			lucideReceipt,
			lucideShieldAlert,
			lucideXCircle,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Supervision"
				title="Supervision des transferts"
				description="Suivre les transferts, statuts, corridors, montants, frais et alertes."
				addLabel="Exporter"
				actionIcon="lucideClipboardList"
				actionVariant="outline"
				(addClicked)="openExportDialog()"
			/>

			<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				@for (kpi of kpiCards(); track kpi.key) {
					<article
						class="group rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md"
					>
						<div class="flex items-center justify-between gap-2">
							<span
								class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-border/60"
								[ngClass]="kpi.accent"
							>
								<ng-icon [name]="kpi.icon" />
							</span>
							<span class="font-mono text-xs text-muted-foreground">{{ kpi.share }}</span>
						</div>
						<p class="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
							{{ kpi.label }}
						</p>
						<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">{{ kpi.value }}</p>
					</article>
				}
			</section>

			<okane-users-filters
				searchPlaceholder="Rechercher par référence, code, expéditeur, bénéficiaire..."
				[searchValue]="search()"
				[filters]="filterDefs()"
				(searchChange)="search.set($event)"
				(filterChange)="onFilterChange($event)"
			/>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div
					class="flex flex-col gap-1 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between"
				>
					<div>
						<h2 class="text-base font-semibold text-foreground">Transferts</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total }} transfert{{ total > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
					<okane-users-empty-state
						icon="lucideArrowRightLeft"
						title="Aucun transfert ne correspond"
						description="Modifiez la recherche ou les filtres pour afficher des résultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Référence</th>
									<th class="px-5 py-3 text-left font-medium">Expéditeur</th>
									<th class="px-5 py-3 text-left font-medium">Bénéficiaire</th>
									<th class="px-5 py-3 text-right font-medium">Montant</th>
									<th class="px-5 py-3 text-left font-medium">Corridor</th>
									<th class="px-5 py-3 text-right font-medium">Frais</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-left font-medium">Création</th>
									<th class="px-5 py-3 text-left font-medium">Agent</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (transfer of filtered(); track transfer.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex flex-col leading-tight">
												<span class="font-mono text-sm font-medium text-foreground">{{ transfer.reference }}</span>
												<span class="font-mono text-xs text-muted-foreground">Code {{ transfer.withdrawalCode }}</span>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ transfer.senderName }}</td>
										<td class="px-5 py-3 text-foreground">{{ transfer.beneficiaryName }}</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm font-medium text-foreground">
												{{ formatAmount(transfer.amount) }}
											</span>
											<span class="ml-1 text-xs text-muted-foreground">{{ transfer.currency }}</span>
										</td>
										<td class="px-5 py-3">
											<div class="flex items-center gap-2 text-foreground">
												<span class="font-mono text-xs uppercase">{{ transfer.sourceCountry.code }}</span>
												<ng-icon name="lucideArrowRightLeft" class="text-xs text-muted-foreground" />
												<span class="font-mono text-xs uppercase">{{ transfer.destinationCountry.code }}</span>
											</div>
											<p class="mt-0.5 text-xs text-muted-foreground">
												{{ transfer.sourceCountry.label }} → {{ transfer.destinationCountry.label }}
											</p>
										</td>
										<td class="px-5 py-3 text-right font-mono text-xs text-muted-foreground">
											{{ formatAmount(transfer.fees) }} {{ transfer.currency }}
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="statusLabel(transfer.status)"
												[variant]="statusVariant(transfer.status)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ transfer.createdAt }}</td>
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="text-foreground">{{ transfer.agentName }}</p>
												<p class="font-mono text-xs text-muted-foreground">{{ transfer.agentId }}</p>
											</div>
										</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="actionsFor(transfer)" />
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
			[open]="exportDialog()"
			title="Exporter les transferts"
			(close)="exportDialog.set(false)"
		/>

		<okane-users-placeholder-dialog
			[open]="cancelDialog()"
			title="Annuler le transfert"
			(close)="cancelDialog.set(false)"
		/>
	`,
})
export class AdminTransfersPageComponent {
	protected readonly total = TRANSFERS_MOCK.length;

	protected readonly search = signal<string>('');
	protected readonly status = signal<string>('all');
	protected readonly source = signal<string>('all');
	protected readonly destination = signal<string>('all');
	protected readonly currency = signal<string>('all');
	protected readonly date = signal<string>('all');
	protected readonly agent = signal<string>('all');

	protected readonly exportDialog = signal<boolean>(false);
	protected readonly cancelDialog = signal<boolean>(false);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'status',
			label: 'Statut',
			value: this.status(),
			options: [
				{ value: 'all', label: 'Tous statuts' },
				{ value: 'EN_ATTENTE', label: 'En attente' },
				{ value: 'PAYE', label: 'Payé' },
				{ value: 'ANNULE', label: 'Annulé' },
				{ value: 'EXPIRE', label: 'Expiré' },
				{ value: 'SUSPECT', label: 'Suspect' },
			],
		},
		{
			key: 'source',
			label: 'Source',
			value: this.source(),
			options: [
				{ value: 'all', label: 'Tous pays source' },
				...TRANSFER_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
			],
		},
		{
			key: 'destination',
			label: 'Destination',
			value: this.destination(),
			options: [
				{ value: 'all', label: 'Tous pays dest.' },
				...TRANSFER_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
			],
		},
		{
			key: 'currency',
			label: 'Devise',
			value: this.currency(),
			options: [
				{ value: 'all', label: 'Toutes devises' },
				{ value: 'MAD', label: 'MAD' },
				{ value: 'EUR', label: 'EUR' },
				{ value: 'USD', label: 'USD' },
				{ value: 'XOF', label: 'XOF' },
			],
		},
		{
			key: 'date',
			label: 'Date',
			value: this.date(),
			options: [
				{ value: 'all', label: 'Toutes dates' },
				{ value: 'today', label: "Aujourd'hui" },
				{ value: 'week', label: '7 derniers jours' },
				{ value: 'month', label: '30 derniers jours' },
			],
		},
		{
			key: 'agent',
			label: 'Agent',
			value: this.agent(),
			options: [
				{ value: 'all', label: 'Tous agents' },
				...TRANSFER_AGENTS.map((a) => ({ value: a.id, label: a.name })),
			],
		},
	]);

	protected readonly filtered = computed<Transfer[]>(() => {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const source = this.source();
		const dest = this.destination();
		const currency = this.currency();
		const date = this.date();
		const agent = this.agent();
		const now = new Date('2026-05-22T23:59:59');

		return TRANSFERS_MOCK.filter((t) => {
			if (status !== 'all' && t.status !== status) return false;
			if (source !== 'all' && t.sourceCountry.code !== source) return false;
			if (dest !== 'all' && t.destinationCountry.code !== dest) return false;
			if (currency !== 'all' && t.currency !== currency) return false;
			if (agent !== 'all' && t.agentId !== agent) return false;
			if (date !== 'all') {
				const created = new Date(t.createdAt.replace(' ', 'T'));
				const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
				if (date === 'today' && diffDays > 1) return false;
				if (date === 'week' && diffDays > 7) return false;
				if (date === 'month' && diffDays > 30) return false;
			}
			if (!term) return true;
			return (
				t.reference.toLowerCase().includes(term) ||
				t.withdrawalCode.toLowerCase().includes(term) ||
				t.senderName.toLowerCase().includes(term) ||
				t.beneficiaryName.toLowerCase().includes(term) ||
				t.agentName.toLowerCase().includes(term)
			);
		});
	});

	protected readonly kpiCards = computed(() => {
		const counts: Record<TransferStatus, number> = {
			EN_ATTENTE: 0,
			PAYE: 0,
			ANNULE: 0,
			EXPIRE: 0,
			SUSPECT: 0,
		};
		for (const t of TRANSFERS_MOCK) counts[t.status]++;
		const total = TRANSFERS_MOCK.length;
		const pct = (n: number) => (total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`);

		return TRANSFER_KPIS.map((kpi) => ({
			...kpi,
			value: kpi.key === 'TOTAL' ? String(total) : String(counts[kpi.key]),
			share: kpi.key === 'TOTAL' ? '100%' : pct(counts[kpi.key]),
		}));
	});

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
			case 'currency':
				this.currency.set(change.value);
				break;
			case 'date':
				this.date.set(change.value);
				break;
			case 'agent':
				this.agent.set(change.value);
				break;
		}
	}

	protected openExportDialog(): void {
		this.exportDialog.set(true);
	}

	protected statusLabel(status: TransferStatus): string {
		return TRANSFER_STATUS_LABELS[status];
	}

	protected statusVariant(status: TransferStatus) {
		return TRANSFER_STATUS_VARIANTS[status];
	}

	protected formatAmount(value: number): string {
		return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
	}

	protected actionsFor(transfer: Transfer): UserActionItem[] {
		const canCancel = transfer.status === 'EN_ATTENTE' || transfer.status === 'SUSPECT';
		const isSuspect = transfer.status === 'SUSPECT';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', transfer) },
			{ label: 'Voir reçu', icon: 'lucideReceipt', action: () => this.logAction('receipt', transfer) },
			...(isSuspect
				? []
				: [
						{
							label: 'Marquer suspect',
							icon: 'lucideShieldAlert',
							action: () => this.logAction('flag', transfer),
						},
					]),
			{ label: 'Voir audit', icon: 'lucideClipboardList', action: () => this.logAction('audit', transfer) },
			...(canCancel
				? [
						{
							label: 'Annuler',
							icon: 'lucideXCircle',
							action: () => this.cancelDialog.set(true),
							variant: 'destructive' as const,
						},
					]
				: []),
		];
	}

	private logAction(action: string, transfer: Transfer): void {
		// eslint-disable-next-line no-console
		console.info(`[Transfers] ${action}`, transfer.reference);
	}
}
