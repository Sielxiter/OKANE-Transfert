import { NgClass, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowDownLeft,
	lucideArrowUpRight,
	lucideBanknote,
	lucideBuilding2,
	lucideCheck,
	lucideEye,
	lucideLandmark,
	lucidePencil,
	lucidePlus,
	lucideTrendingDown,
	lucideTrendingUp,
	lucideTriangleAlert,
	lucideWallet,
	lucideX,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { ActionDetailModalComponent, type DetailField } from '../users/shared/action-detail-modal.component';
import { ConfirmDialogComponent } from '../users/shared/confirm-dialog.component';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersFormDialogComponent } from '../users/shared/users-form-dialog.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	AdminAgencyBalanceApiService,
	type ApiAgencyBalance,
	type ApiCashMovement,
} from './admin-agency-balance.api';
import type { StatusVariant } from '../users/shared/user-status.types';

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
	TRANSFER_IN: 'Transfert entrant',
	PAYOUT_OUT: 'Paiement sortant',
	FUNDING: 'Alimentation',
	WITHDRAWAL: 'Retrait',
	COMMISSION_AGENCY: 'Commission agence',
	COMMISSION_CENTRAL: 'Commission centrale',
};

const MOVEMENT_TYPE_VARIANTS: Record<string, StatusVariant> = {
	TRANSFER_IN: 'success',
	PAYOUT_OUT: 'destructive',
	FUNDING: 'success',
	WITHDRAWAL: 'warning',
	COMMISSION_AGENCY: 'success',
	COMMISSION_CENTRAL: 'success',
};

@Component({
	selector: 'okane-admin-agency-balance-page',
	standalone: true,
	imports: [
		NgClass,
		NgIcon,
		CurrencyPipe,
		HlmButtonImports,
		HlmInputImports,
		HlmLabelImports,
		UsersPageHeaderComponent,
		UsersFiltersComponent,
		UserStatusBadgeComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersFormDialogComponent,
		ActionDetailModalComponent,
		ConfirmDialogComponent,
	],
	providers: [
		provideIcons({
			lucideArrowDownLeft,
			lucideArrowUpRight,
			lucideBanknote,
			lucideBuilding2,
			lucideCheck,
			lucideEye,
			lucideLandmark,
			lucidePencil,
			lucidePlus,
			lucideTrendingDown,
			lucideTrendingUp,
			lucideTriangleAlert,
			lucideWallet,
			lucideX,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6">
			<okane-users-page-header
				eyebrow="Gestion financière"
				title="Soldes agences"
				description="Surveiller et gérer les soldes de toutes les agences. Alimenter ou retirer des fonds."
				addLabel="Alimenter une agence"
				(addClicked)="openFundDialog()"
			/>

			@if (error()) {
				<div class="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Données partielles</p>
						<p class="mt-0.5 text-xs opacity-80">{{ error() }} - affichage avec valeurs par défaut.</p>
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
				searchPlaceholder="Rechercher par nom ou code..."
				[searchValue]="search()"
				[filters]="filterDefs()"
				(searchChange)="search.set($event)"
				(filterChange)="onFilterChange($event)"
			/>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div class="flex flex-col gap-2 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="text-base font-semibold text-foreground">Soldes des agences</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total() }} élément{{ total() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
					<okane-users-empty-state
						icon="lucideBanknote"
						title="Aucune agence ne correspond"
						description="Ajustez la recherche ou les filtres pour afficher des résultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Agence</th>
									<th class="px-5 py-3 text-left font-medium">Type</th>
									<th class="px-5 py-3 text-left font-medium">Agence centrale</th>
									<th class="px-5 py-3 text-right font-medium">Solde actuel</th>
									<th class="px-5 py-3 text-right font-medium">Plafond</th>
									<th class="px-5 py-3 text-center font-medium">Sessions</th>
									<th class="px-5 py-3 text-center font-medium">Clôtures</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (agency of filtered(); track agency.agencyId) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border">
													<ng-icon name="lucideBuilding2" class="text-base" />
												</div>
												<div class="leading-tight">
													<p class="font-medium text-foreground">{{ agency.agencyName }}</p>
													<p class="font-mono text-xs text-muted-foreground">{{ agency.agencyCode }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="agency.agencyType === 'CENTRAL' ? 'Centrale' : 'Sous-agence'"
												[variant]="agency.agencyType === 'CENTRAL' ? 'info' : 'muted'"
											/>
										</td>
										<td class="px-5 py-3">
											@if (agency.centralAgencyName) {
												<div class="leading-tight">
													<p class="font-medium text-foreground">{{ agency.centralAgencyName }}</p>
													<p class="font-mono text-xs text-muted-foreground">CA-{{ agency.centralAgencyId }}</p>
												</div>
											} @else {
												<span class="text-xs text-muted-foreground">—</span>
											}
										</td>
										<td class="px-5 py-3 text-right">
											<p class="font-mono font-semibold" [ngClass]="balanceColorClass(agency.currentBalance)">
												{{ agency.currentBalance | currency: 'MAD' : 'symbol' : '1.2-2' }}
											</p>
										</td>
										<td class="px-5 py-3 text-right font-mono text-muted-foreground">
											{{ agency.dailyLimit | currency: 'MAD' : 'symbol' : '1.2-2' }}
										</td>
										<td class="px-5 py-3 text-center">
											<span class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
												{{ agency.activeSessions }}
											</span>
										</td>
										<td class="px-5 py-3 text-center">
											@if (agency.pendingClosures > 0) {
												<span class="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-600 dark:text-amber-300">
													{{ agency.pendingClosures }}
												</span>
											} @else {
												<span class="text-xs text-muted-foreground">—</span>
											}
										</td>
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

		<!-- Fund Dialog -->
		<okane-users-form-dialog
			[open]="fundDialogOpen()"
			title="Alimenter une agence"
			subtitle="Ajouter des fonds au solde de l'agence sélectionnée."
			icon="lucideBanknote"
			(close)="fundDialogOpen.set(false)"
		>
			<div class="flex flex-col gap-4 p-1">
				<div>
					<label hlmLabel>Agence</label>
					<select
						hlmInput
						class="mt-1 w-full"
						[value]="selectedAgencyId()"
						(change)="selectedAgencyId.set(+$any($event.target).value)"
					>
						@for (agency of items(); track agency.agencyId) {
							<option [value]="agency.agencyId">{{ agency.agencyName }} ({{ agency.agencyCode }}) — {{ agency.currentBalance | currency: 'MAD' : 'symbol' : '1.2-2' }}</option>
						}
					</select>
				</div>
				<div>
					<label hlmLabel>Montant (MAD)</label>
					<input
						hlmInput
						type="number"
						class="mt-1 w-full"
						placeholder="0.00"
						min="0.01"
						step="0.01"
						[value]="fundAmount()"
						(input)="fundAmount.set(+$any($event.target).value)"
					/>
				</div>
				<div>
					<label hlmLabel>Description</label>
					<textarea
						hlmInput
						class="mt-1 w-full min-h-[80px]"
						placeholder="Motif de l'alimentation..."
						[value]="fundDescription()"
						(input)="fundDescription.set($any($event.target).value)"
					></textarea>
				</div>
				<div class="flex justify-end gap-2">
					<button hlmBtn type="button" variant="ghost" size="sm" (click)="fundDialogOpen.set(false)">Annuler</button>
					<button
						hlmBtn
						type="button"
						size="sm"
						(click)="confirmFund()"
						[disabled]="fundAmount() <= 0 || !selectedAgencyId()"
					>
						Confirmer
					</button>
				</div>
			</div>
		</okane-users-form-dialog>

		<!-- Withdraw Dialog -->
		<okane-users-form-dialog
			[open]="withdrawDialogOpen()"
			title="Retirer des fonds"
			subtitle="Retirer des fonds du solde de l'agence sélectionnée."
			icon="lucideTrendingDown"
			(close)="withdrawDialogOpen.set(false)"
		>
			<div class="flex flex-col gap-4 p-1">
				<div>
					<label hlmLabel>Agence</label>
					<select
						hlmInput
						class="mt-1 w-full"
						[value]="selectedAgencyId()"
						(change)="selectedAgencyId.set(+$any($event.target).value)"
					>
						@for (agency of items(); track agency.agencyId) {
							<option [value]="agency.agencyId">{{ agency.agencyName }} ({{ agency.agencyCode }}) — {{ agency.currentBalance | currency: 'MAD' : 'symbol' : '1.2-2' }}</option>
						}
					</select>
				</div>
				<div>
					<label hlmLabel>Montant (MAD)</label>
					<input
						hlmInput
						type="number"
						class="mt-1 w-full"
						placeholder="0.00"
						min="0.01"
						step="0.01"
						[max]="selectedAgencyBalance()"
						[value]="withdrawAmount()"
						(input)="withdrawAmount.set(+$any($event.target).value)"
					/>
					@if (withdrawAmount() > selectedAgencyBalance()) {
						<p class="mt-1 text-xs text-destructive">Le montant dépasse le solde disponible.</p>
					}
				</div>
				<div>
					<label hlmLabel>Description</label>
					<textarea
						hlmInput
						class="mt-1 w-full min-h-[80px]"
						placeholder="Motif du retrait..."
						[value]="withdrawDescription()"
						(input)="withdrawDescription.set($any($event.target).value)"
					></textarea>
				</div>
				<div class="flex justify-end gap-2">
					<button hlmBtn type="button" variant="ghost" size="sm" (click)="withdrawDialogOpen.set(false)">Annuler</button>
					<button
						hlmBtn
						type="button"
						size="sm"
						variant="destructive"
						(click)="confirmWithdraw()"
						[disabled]="withdrawAmount() <= 0 || withdrawAmount() > selectedAgencyBalance() || !selectedAgencyId()"
					>
						Confirmer
					</button>
				</div>
			</div>
		</okane-users-form-dialog>

		<!-- Detail Modal -->
		<okane-action-detail-modal
			[open]="detailOpen()"
			[title]="detailTitle()"
			subtitle="Informations de solde"
			[fields]="detailFields()"
			(close)="detailOpen.set(false)"
		/>

		<!-- Confirm Dialog -->
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
export class AdminAgencyBalancePageComponent implements OnInit {
	private readonly _api = inject(AdminAgencyBalanceApiService);

	protected readonly items = signal<ApiAgencyBalance[]>([]);
	protected readonly loading = signal<boolean>(true);
	protected readonly error = signal<string | null>(null);
	protected readonly search = signal<string>('');
	protected readonly status = signal<string>('all');
	protected readonly type = signal<string>('all');

	protected readonly fundDialogOpen = signal<boolean>(false);
	protected readonly withdrawDialogOpen = signal<boolean>(false);
	protected readonly selectedAgencyId = signal<number | null>(null);
	protected readonly fundAmount = signal<number>(0);
	protected readonly fundDescription = signal<string>('');
	protected readonly withdrawAmount = signal<number>(0);
	protected readonly withdrawDescription = signal<string>('');

	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Détails');
	protected readonly detailFields = signal<DetailField[]>([]);

	protected readonly confirmOpen = signal<boolean>(false);
	protected readonly confirmTitle = signal<string>('Confirmer');
	protected readonly confirmMessage = signal<string>('');
	protected readonly confirmLabel = signal<string>('Confirmer');
	private _pendingConfirm: (() => void) | null = null;

	protected readonly total = computed(() => this.items().length);

	protected readonly selectedAgencyBalance = computed(() => {
		const id = this.selectedAgencyId();
		if (!id) return 0;
		const agency = this.items().find((a) => a.agencyId === id);
		return agency?.currentBalance ?? 0;
	});

	protected readonly filtered = computed(() => {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const type = this.type();
		return this.items().filter((agency) => {
			if (status !== 'all' && agency.status !== status) return false;
			if (type !== 'all' && agency.agencyType !== type) return false;
			if (!term) return true;
			return (
				agency.agencyName.toLowerCase().includes(term) ||
				agency.agencyCode.toLowerCase().includes(term) ||
				(agency.centralAgencyName ?? '').toLowerCase().includes(term)
			);
		});
	});

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
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
		{
			key: 'type',
			label: 'Type',
			value: this.type(),
			options: [
				{ value: 'all', label: 'Tous types' },
				{ value: 'CENTRAL', label: 'Centrale' },
				{ value: 'SUB', label: 'Sous-agence' },
			],
		},
	]);

	protected readonly kpiCards = computed(() => {
		const list = this.items();
		const totalBalance = list.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
		const activeSessions = list.reduce((sum, a) => sum + (a.activeSessions ?? 0), 0);
		const pendingClosures = list.reduce((sum, a) => sum + (a.pendingClosures ?? 0), 0);
		const totalInflow = list.reduce((sum, a) => sum + (a.todayInflow ?? 0), 0);
		const totalOutflow = list.reduce((sum, a) => sum + (a.todayOutflow ?? 0), 0);

		return [
			{
				key: 'TOTAL_BALANCE',
				label: 'Solde total',
				value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(totalBalance),
				suffix: 'toutes agences',
				icon: 'lucideLandmark',
				accent: 'bg-primary/10 text-primary',
			},
			{
				key: 'ACTIVE_SESSIONS',
				label: 'Sessions actives',
				value: String(activeSessions),
				suffix: 'aujourd\'hui',
				icon: 'lucideWallet',
				accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
			},
			{
				key: 'PENDING_CLOSURES',
				label: 'Clôtures en attente',
				value: String(pendingClosures),
				suffix: 'à valider',
				icon: 'lucideTriangleAlert',
				accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
			},
			{
				key: 'TODAY_FLOW',
				label: 'Flux du jour',
				value: '+' + new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(totalInflow),
				suffix: '-' + new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(totalOutflow),
				icon: 'lucideTrendingUp',
				accent: 'bg-secondary/50 text-secondary-foreground',
			},
		];
	});

	public ngOnInit(): void {
		this.refresh();
	}

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.status.set(change.value);
				break;
			case 'type':
				this.type.set(change.value);
				break;
		}
	}

	protected balanceColorClass(balance: number): string {
		if (balance > 0) return 'text-emerald-600 dark:text-emerald-300';
		if (balance < 0) return 'text-destructive';
		return 'text-muted-foreground';
	}

	protected actionsFor(agency: ApiAgencyBalance): UserActionItem[] {
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.openDetail(agency) },
			{ label: 'Alimenter', icon: 'lucideArrowUpRight', action: () => this.openFundDialogFor(agency) },
			{ label: 'Retirer', icon: 'lucideArrowDownLeft', action: () => this.openWithdrawDialogFor(agency) },
		];
	}

	protected openFundDialog(): void {
		this.selectedAgencyId.set(this.items()[0]?.agencyId ?? null);
		this.fundAmount.set(0);
		this.fundDescription.set('');
		this.fundDialogOpen.set(true);
	}

	protected openFundDialogFor(agency: ApiAgencyBalance): void {
		this.selectedAgencyId.set(agency.agencyId);
		this.fundAmount.set(0);
		this.fundDescription.set('');
		this.fundDialogOpen.set(true);
	}

	protected openWithdrawDialogFor(agency: ApiAgencyBalance): void {
		this.selectedAgencyId.set(agency.agencyId);
		this.withdrawAmount.set(0);
		this.withdrawDescription.set('');
		this.withdrawDialogOpen.set(true);
	}

	protected confirmFund(): void {
		const id = this.selectedAgencyId();
		const amount = this.fundAmount();
		const desc = this.fundDescription();
		if (!id || amount <= 0) return;

		this.confirmTitle.set('Confirmer l\'alimentation');
		this.confirmMessage.set(`Alimenter l'agence avec ${amount.toFixed(2)} MAD ?`);
		this.confirmLabel.set('Alimenter');
		this._pendingConfirm = () => this.executeFund(id, amount, desc);
		this.confirmOpen.set(true);
		this.fundDialogOpen.set(false);
	}

	protected confirmWithdraw(): void {
		const id = this.selectedAgencyId();
		const amount = this.withdrawAmount();
		const desc = this.withdrawDescription();
		if (!id || amount <= 0) return;

		this.confirmTitle.set('Confirmer le retrait');
		this.confirmMessage.set(`Retirer ${amount.toFixed(2)} MAD de l'agence ?`);
		this.confirmLabel.set('Retirer');
		this._pendingConfirm = () => this.executeWithdraw(id, amount, desc);
		this.confirmOpen.set(true);
		this.withdrawDialogOpen.set(false);
	}

	protected onConfirm(): void {
		this.confirmOpen.set(false);
		this._pendingConfirm?.();
		this._pendingConfirm = null;
	}

	private executeFund(id: number, amount: number, description: string): void {
		this._api.fund(id, amount, description).subscribe({
			next: () => this.refresh(),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private executeWithdraw(id: number, amount: number, description: string): void {
		this._api.withdraw(id, amount, description).subscribe({
			next: () => this.refresh(),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private openDetail(agency: ApiAgencyBalance): void {
		this.detailTitle.set(agency.agencyName);
		const fields: DetailField[] = [
			{ label: 'ID', value: String(agency.agencyId), mono: true },
			{ label: 'Nom', value: agency.agencyName },
			{ label: 'Code', value: agency.agencyCode, mono: true },
			{ label: 'Type', value: agency.agencyType === 'CENTRAL' ? 'Centrale' : 'Sous-agence' },
			{ label: 'Solde actuel', value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(agency.currentBalance) },
			{ label: 'Plafond journalier', value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(agency.dailyLimit) },
			{ label: 'Sessions actives', value: String(agency.activeSessions) },
			{ label: 'Clôtures en attente', value: String(agency.pendingClosures) },
		];
		if (agency.centralAgencyName) {
			fields.push({ label: 'Agence centrale', value: agency.centralAgencyName });
		}
		if (agency.status) {
			fields.push({ label: 'Statut', value: agency.status });
		}
		this.detailFields.set(fields);
		this.detailOpen.set(true);
	}

	private refresh(): void {
		this.loading.set(true);
		this.error.set(null);
		this._api.list().subscribe({
			next: (rows) => {
				this.items.set(rows);
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.loading.set(false);
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
