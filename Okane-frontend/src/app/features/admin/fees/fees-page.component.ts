import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideCalculator,
	lucideChevronLeft,
	lucideChevronRight,
	lucideLandmark,
	lucideLayers,
	lucidePercent,
	lucidePencil,
	lucideTrash2,
	lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ConfirmDialogComponent } from '../users/shared/confirm-dialog.component';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFormDialogComponent } from '../users/shared/users-form-dialog.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	AdminFeesApiService,
	type ApiTariffLine,
	type ApiTariffSummary,
	type TariffValueType,
} from './admin-fees.api';
import { TariffLineFormComponent } from './tariff-line-form.component';
import { TariffSimulationFormComponent } from './tariff-simulation-form.component';

const PAGE_SIZE = 10;

interface TariffRow {
	id: number;
	minAmount: number;
	maxAmount: number;
	transferFeeType: TariffValueType;
	transferFeeValue: number;
	agencyCommissionType: TariffValueType;
	agencyCommissionValue: number;
	centralCommissionType: TariffValueType;
	centralCommissionValue: number;
	createdAt: string;
	updatedAt: string;
}

interface FeeKpi {
	key: string;
	label: string;
	icon: string;
	accent: string;
	value: string;
	suffix: string;
}

@Component({
	selector: 'okane-admin-fees-page',
	standalone: true,
	imports: [
		NgClass,
		NgIcon,
		HlmButtonImports,
		UsersPageHeaderComponent,
		UserActionsDropdownComponent,
		UsersEmptyStateComponent,
		UsersFormDialogComponent,
		ConfirmDialogComponent,
		TariffLineFormComponent,
		TariffSimulationFormComponent,
	],
	providers: [
		provideIcons({
			lucideCalculator,
			lucideChevronLeft,
			lucideChevronRight,
			lucideLandmark,
			lucideLayers,
			lucidePercent,
			lucidePencil,
			lucideTrash2,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6">
			<okane-users-page-header
				eyebrow="Tarification"
				title="Frais & Commissions"
				description="Définir les grilles tarifaires globales par tranche de montant. Le corridor est choisi uniquement dans la simulation."
				addLabel="Ajouter une grille"
				(addClicked)="openCreateLine()"
			>
				<button okaneHeaderActions hlmBtn size="sm" variant="outline" type="button" (click)="openSimulation()">
					<ng-icon name="lucideCalculator" />
					Simulation
				</button>
			</okane-users-page-header>

			@if (error()) {
				<div class="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Données partielles</p>
						<p class="mt-0.5 text-xs opacity-80">{{ error() }}</p>
					</div>
				</div>
			}

			<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				@for (kpi of kpiCards(); track kpi.key) {
					<article class="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md">
						<span class="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-border/60" [ngClass]="kpi.accent">
							<ng-icon [name]="kpi.icon" />
						</span>
						<p class="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ kpi.label }}</p>
						<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">{{ kpi.value }}</p>
						<p class="mt-0.5 text-xs text-muted-foreground">{{ kpi.suffix }}</p>
					</article>
				}
			</section>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
				<div class="flex flex-col gap-2 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="text-base font-semibold text-foreground">Grilles tarifaires</h2>
						<p class="text-xs text-muted-foreground">
							{{ totalTariffs() }} grille{{ totalTariffs() > 1 ? 's' : '' }} au total
						</p>
					</div>
					<div class="text-xs text-muted-foreground">
						Page {{ currentPageIndex() + 1 }} / {{ totalPages() }}
					</div>
				</div>

				@if (pagedTariffs().length === 0) {
					<okane-users-empty-state
						icon="lucideLayers"
						title="Aucune grille ne correspond"
						description="Ajoutez une grille tarifaire pour commencer."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Min Amount</th>
									<th class="px-5 py-3 text-left font-medium">Max Amount</th>
									<th class="px-5 py-3 text-left font-medium">Transfer Fee</th>
									<th class="px-5 py-3 text-left font-medium">Agency Commission</th>
									<th class="px-5 py-3 text-left font-medium">Central Commission</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (line of pagedTariffs(); track line.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3 font-mono text-foreground">{{ formatMoney(line.minAmount) }} MAD</td>
										<td class="px-5 py-3 font-mono text-foreground">{{ formatMoney(line.maxAmount) }} MAD</td>
										<td class="px-5 py-3 font-mono text-foreground">
											{{ formatTariff(line.transferFeeType, line.transferFeeValue) }}
										</td>
										<td class="px-5 py-3 font-mono text-foreground">
											{{ formatTariff(line.agencyCommissionType, line.agencyCommissionValue) }}
										</td>
										<td class="px-5 py-3 font-mono text-foreground">
											{{ formatTariff(line.centralCommissionType, line.centralCommissionValue) }}
										</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="tariffActions(line)" />
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>

					<div class="flex flex-col gap-3 border-t border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
						<p class="text-xs text-muted-foreground">
							Affichage de {{ pageStart() + 1 }} à {{ pageEnd() }} sur {{ totalTariffs() }} résultat{{ totalTariffs() > 1 ? 's' : '' }}.
						</p>
						<div class="flex items-center gap-2">
							<button hlmBtn type="button" size="sm" variant="outline" [disabled]="currentPageIndex() === 0" (click)="previousPage()">
								<ng-icon name="lucideChevronLeft" />
								Précédent
							</button>
							<button
								hlmBtn
								type="button"
								size="sm"
								variant="outline"
								[disabled]="currentPageIndex() >= totalPages() - 1"
								(click)="nextPage()"
							>
								Suivant
								<ng-icon name="lucideChevronRight" />
							</button>
						</div>
					</div>
				}
			</section>
		</div>

		<okane-users-form-dialog
			[open]="lineDialog()"
			[title]="selectedLine() ? 'Modifier la grille' : 'Ajouter une grille'"
			subtitle="Configurer une tranche de montant et la répartition du frais de transfert."
			icon="lucideLandmark"
			(close)="closeLineDialog()"
		>
			<okane-tariff-line-form [line]="selectedLine()" (saved)="onLineSaved($event)" (cancelled)="closeLineDialog()" />
		</okane-users-form-dialog>

		<okane-users-form-dialog
			[open]="simulationDialog()"
			title="Simulation des frais de transfert"
			subtitle="Choisir un montant et un corridor."
			icon="lucideCalculator"
			(close)="simulationDialog.set(false)"
		>
			<okane-tariff-simulation-form (cancelled)="simulationDialog.set(false)" />
		</okane-users-form-dialog>

		<okane-confirm-dialog
			[open]="deleteDialog()"
			title="Supprimer la grille"
			[message]="deleteMessage()"
			confirmLabel="Supprimer"
			(confirm)="confirmDelete()"
			(cancel)="deleteDialog.set(false)"
		/>
	`,
})
export class AdminFeesPageComponent implements OnInit {
	private readonly _api = inject(AdminFeesApiService);

	protected readonly tariffs = signal<ApiTariffLine[]>([]);
	protected readonly summary = signal<ApiTariffSummary | null>(null);
	protected readonly error = signal<string | null>(null);

	protected readonly selectedLine = signal<ApiTariffLine | null>(null);
	protected readonly lineDialog = signal(false);
	protected readonly simulationDialog = signal(false);
	protected readonly deleteDialog = signal(false);
	protected readonly deleteMessage = signal('Voulez-vous supprimer cette grille tarifaire ?');
	private _pendingDeleteId: number | null = null;

	protected readonly pageIndex = signal(0);

	protected readonly totalTariffs = computed(() => this.filteredTariffs().length);

	protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredTariffs().length / PAGE_SIZE)));
	protected readonly currentPageIndex = computed(() => Math.min(this.pageIndex(), this.totalPages() - 1));
	protected readonly pageStart = computed(() => (this.filteredTariffs().length === 0 ? 0 : this.currentPageIndex() * PAGE_SIZE));
	protected readonly pageEnd = computed(() => Math.min(this.pageStart() + this.pagedTariffs().length, this.filteredTariffs().length));

	protected readonly filteredTariffs = computed(() =>
		this.tariffs().slice().sort((a, b) => Number(a.minAmount) - Number(b.minAmount)),
	);

	protected readonly pagedTariffs = computed(() => {
		const start = this.currentPageIndex() * PAGE_SIZE;
		return this.filteredTariffs().slice(start, start + PAGE_SIZE);
	});

	protected readonly kpiCards = computed<FeeKpi[]>(() => {
		const summary = this.summary();
		const total = summary?.totalLines ?? this.tariffs().length;
		return [
			{
				key: 'TOTAL',
				label: 'Grilles totales',
				value: String(total),
				suffix: 'lignes',
				icon: 'lucideLayers',
				accent: 'bg-primary/10 text-primary',
			},
			{
				key: 'FIXED',
				label: 'Lignes montant',
				value: String(summary?.fixedLines ?? this.tariffs().filter((line) => line.transferFeeType === 'FIXED').length),
				suffix: 'transfer fee fixe',
				icon: 'lucideLandmark',
				accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
			},
			{
				key: 'PERCENT',
				label: 'Lignes %',
				value: String(summary?.percentageLines ?? this.tariffs().filter((line) => line.transferFeeType === 'PERCENT').length),
				suffix: 'transfer fee en %',
				icon: 'lucidePercent',
				accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
			},
			{
				key: 'SIM',
				label: 'Simulations',
				value: String(summary?.simulationsToday ?? 0),
				suffix: "aujourd'hui",
				icon: 'lucideCalculator',
				accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
			},
		];
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.error.set(null);
		this._api.listTariffs().subscribe({
			next: (rows) => {
				this.tariffs.set(rows);
				if (this.pageIndex() > 0 && this.currentPageIndex() >= this.totalPages()) {
					this.pageIndex.set(0);
				}
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => this.summary.set(null),
		});
	}

	protected openCreateLine(): void {
		this.selectedLine.set(null);
		this.lineDialog.set(true);
	}

	protected openSimulation(): void {
		this.simulationDialog.set(true);
	}

	protected closeLineDialog(): void {
		this.lineDialog.set(false);
		this.selectedLine.set(null);
	}

	protected onLineSaved(_: ApiTariffLine): void {
		this.lineDialog.set(false);
		this.selectedLine.set(null);
		this.refresh();
	}

	protected previousPage(): void {
		this.pageIndex.update((current) => Math.max(current - 1, 0));
	}

	protected nextPage(): void {
		this.pageIndex.update((current) => Math.min(current + 1, this.totalPages() - 1));
	}

	protected tariffActions(line: ApiTariffLine): UserActionItem[] {
		return [
			{ label: 'Modifier', icon: 'lucidePencil', action: () => this.editLine(line) },
			{
				label: 'Supprimer',
				icon: 'lucideTrash2',
				action: () => this.requestDelete(line),
				variant: 'destructive' as const,
			},
		];
	}

	protected formatMoney(value: number): string {
		return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value ?? 0);
	}

	protected formatTariff(type: TariffValueType, value: number): string {
		if (type === 'PERCENT') {
			return `${this.formatMoney(value)}%`;
		}
		return `${this.formatMoney(value)} MAD`;
	}

	protected editLine(line: ApiTariffLine): void {
		this.selectedLine.set(line);
		this.lineDialog.set(true);
	}

	protected requestDelete(line: ApiTariffLine): void {
		this._pendingDeleteId = line.id;
		this.deleteMessage.set(
			`Voulez-vous supprimer la grille ${this.formatMoney(line.minAmount)} - ${this.formatMoney(line.maxAmount)} MAD ?`,
		);
		this.deleteDialog.set(true);
	}

	protected confirmDelete(): void {
		if (this._pendingDeleteId == null) {
			this.deleteDialog.set(false);
			return;
		}
		const id = this._pendingDeleteId;
		this._api.deleteTariff(id).subscribe({
			next: () => {
				this.deleteDialog.set(false);
				this._pendingDeleteId = null;
				this.refresh();
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.deleteDialog.set(false);
				this._pendingDeleteId = null;
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
