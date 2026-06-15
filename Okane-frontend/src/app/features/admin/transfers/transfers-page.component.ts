import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
	lucideTriangleAlert,
	lucideXCircle,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import { ActionDetailModalComponent, type DetailField } from '../users/shared/action-detail-modal.component';
import { ConfirmDialogComponent } from '../users/shared/confirm-dialog.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	resolveCountry,
	TRANSFER_COUNTRIES,
	TRANSFER_KPIS,
	TRANSFER_STATUS_LABELS,
	TRANSFER_STATUS_VARIANTS,
	type CountryRef,
	type TransferStatus,
} from './transfers.mock';
import {
	AdminTransfersApiService,
	type ApiTransfer,
} from './admin-transfers.api';

interface TransferRow {
	id: number;
	reference: string;
	withdrawalCode: string;
	senderName: string;
	beneficiaryName: string;
	amount: number;
	currency: string;
	sourceCountry: CountryRef;
	destinationCountry: CountryRef;
	fees: number;
	status: TransferStatus;
	createdAt: string;
	createdAtRaw: string | null;
	agentName: string;
	agentId: string;
	agentNumericId: number | null;
}

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
		ActionDetailModalComponent,
		ConfirmDialogComponent,
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
			lucideTriangleAlert,
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

			@if (error()) {
				<div
					class="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive transition-colors"
				>
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<div class="leading-tight">
						<p class="text-xs font-semibold">Données partielles</p>
						<p class="mt-0.5 text-xs opacity-80">{{ error() }} — affichage avec valeurs par défaut.</p>
					</div>
				</div>
			}

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
							{{ filtered().length }} sur {{ total() }} transfert{{ total() > 1 ? 's' : '' }}
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

		<okane-action-detail-modal
			[open]="detailOpen()"
			[title]="detailTitle()"
			[subtitle]="detailSubtitle()"
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
export class AdminTransfersPageComponent implements OnInit {
	private readonly _api = inject(AdminTransfersApiService);

	protected readonly transfers = signal<TransferRow[]>([]);
	protected readonly loading = signal<boolean>(true);
	protected readonly error = signal<string | null>(null);

	protected readonly search = signal<string>('');
	protected readonly status = signal<string>('all');
	protected readonly source = signal<string>('all');
	protected readonly destination = signal<string>('all');
	protected readonly currency = signal<string>('all');
	protected readonly date = signal<string>('all');
	protected readonly agent = signal<string>('all');

	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Détails transfert');
	protected readonly detailSubtitle = signal<string>('');
	protected readonly detailFields = signal<DetailField[]>([]);

	protected readonly confirmOpen = signal<boolean>(false);
	protected readonly confirmTitle = signal<string>('Confirmer');
	protected readonly confirmMessage = signal<string>('');
	protected readonly confirmLabel = signal<string>('Confirmer');
	private _pendingConfirm: (() => void) | null = null;

	protected readonly exportDialog = signal<boolean>(false);
	protected readonly cancelDialog = signal<boolean>(false);

	protected readonly total = computed(() => this.transfers().length);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => {
		const agents = Array.from(
			new Map(
				this.transfers()
					.filter((t) => t.agentNumericId != null)
					.map((t) => [t.agentNumericId!, { id: t.agentNumericId!, name: t.agentName }]),
			).values(),
		);

		return [
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
					...agents.map((a) => ({ value: String(a.id), label: a.name })),
				],
			},
		];
	});

	protected readonly filtered = computed<TransferRow[]>(() => {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const source = this.source();
		const dest = this.destination();
		const currency = this.currency();
		const date = this.date();
		const agent = this.agent();
		const now = Date.now();

		return this.transfers().filter((t) => {
			if (status !== 'all' && t.status !== status) return false;
			if (source !== 'all' && t.sourceCountry.code !== source) return false;
			if (dest !== 'all' && t.destinationCountry.code !== dest) return false;
			if (currency !== 'all' && t.currency !== currency) return false;
			if (agent !== 'all' && t.agentNumericId !== Number(agent)) return false;
			if (date !== 'all' && t.createdAtRaw) {
				const created = new Date(t.createdAtRaw).getTime();
				if (!Number.isFinite(created)) return true;
				const diffDays = (now - created) / (1000 * 60 * 60 * 24);
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
		for (const t of this.transfers()) counts[t.status]++;
		const total = this.transfers().length;
		const pct = (n: number) => (total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`);

		return TRANSFER_KPIS.map((kpi) => ({
			...kpi,
			value: kpi.key === 'TOTAL' ? String(total) : String(counts[kpi.key]),
			share: kpi.key === 'TOTAL' ? '100%' : pct(counts[kpi.key]),
		}));
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.loading.set(true);
		this.error.set(null);
		this._api.list().subscribe({
			next: (rows) => {
				this.transfers.set(rows.map((row) => this.toRow(row)));
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.loading.set(false);
			},
		});
	}

	private toRow(api: ApiTransfer): TransferRow {
		const agentName = api.agentName ?? 'Système';
		return {
			id: api.id,
			reference: api.reference ?? '—',
			withdrawalCode: api.withdrawalCode ?? '—',
			senderName: api.senderFullName ?? '—',
			beneficiaryName: api.beneficiaryFullName ?? '—',
			amount: Number(api.amount ?? 0),
			currency: api.currency ?? '—',
			sourceCountry: resolveCountry(api.sourceCountry),
			destinationCountry: resolveCountry(api.destinationCountry),
			fees: Number(api.fees ?? 0),
			status: api.status,
			createdAt: this.formatTimestamp(api.createdAt),
			createdAtRaw: api.createdAt,
			agentName,
			agentId: api.agentId != null ? `AG-${api.agentId}` : '—',
			agentNumericId: api.agentId,
		};
	}

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

	protected actionsFor(transfer: TransferRow): UserActionItem[] {
		const canCancel = transfer.status === 'EN_ATTENTE' || transfer.status === 'SUSPECT';
		const isSuspect = transfer.status === 'SUSPECT';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.openDetail(transfer) },
			{ label: 'Voir reçu', icon: 'lucideReceipt', action: () => this.openReceipt(transfer) },
			...(isSuspect
				? []
				: [{ label: 'Marquer suspect', icon: 'lucideShieldAlert', action: () => this.requestMarkSuspect(transfer) }]),
			{ label: 'Voir audit', icon: 'lucideClipboardList', action: () => this.openAudit(transfer) },
			...(canCancel
				? [{ label: 'Annuler', icon: 'lucideXCircle', action: () => this.requestCancel(transfer), variant: 'destructive' as const }]
				: []),
		];
	}

	private openDetail(transfer: TransferRow): void {
		this._api.getById(transfer.id).subscribe({
			next: (detail) => {
				this.detailTitle.set(`Transfert ${detail.reference ?? transfer.reference}`);
				this.detailSubtitle.set('Détails complets du transfert');
				this.detailFields.set([
					{ label: 'Référence', value: detail.reference ?? transfer.reference, mono: true },
					{ label: 'Code retrait', value: detail.withdrawalCode ?? transfer.withdrawalCode, mono: true },
					{ label: 'Expéditeur', value: detail.senderFullName ?? transfer.senderName },
					{ label: 'Bénéficiaire', value: detail.beneficiaryFullName ?? transfer.beneficiaryName },
					{ label: 'Montant', value: `${this.formatAmount(Number(detail.amount ?? transfer.amount))} ${detail.currency ?? transfer.currency}` },
					{ label: 'Frais', value: `${this.formatAmount(Number(detail.fees ?? transfer.fees))} ${detail.currency ?? transfer.currency}` },
					{ label: 'Statut', value: TRANSFER_STATUS_LABELS[detail.status ?? transfer.status] },
					{ label: 'Agent', value: detail.agentName ?? transfer.agentName },
					{ label: 'Créé le', value: this.formatTimestamp(detail.createdAt ?? transfer.createdAtRaw) },
				]);
				this.detailOpen.set(true);
			},
			error: () => {
				this.detailTitle.set(`Transfert ${transfer.reference}`);
				this.detailSubtitle.set('');
				this.detailFields.set([
					{ label: 'Référence', value: transfer.reference, mono: true },
					{ label: 'Code retrait', value: transfer.withdrawalCode, mono: true },
					{ label: 'Expéditeur', value: transfer.senderName },
					{ label: 'Bénéficiaire', value: transfer.beneficiaryName },
					{ label: 'Montant', value: `${this.formatAmount(transfer.amount)} ${transfer.currency}` },
					{ label: 'Statut', value: TRANSFER_STATUS_LABELS[transfer.status] },
					{ label: 'Agent', value: transfer.agentName },
					{ label: 'Créé le', value: transfer.createdAt },
				]);
				this.detailOpen.set(true);
			},
		});
	}

	private openReceipt(transfer: TransferRow): void {
		this.detailTitle.set(`Reçu — ${transfer.reference}`);
		this.detailSubtitle.set('Reçu de transfert');
		this.detailFields.set([
			{ label: 'Référence', value: transfer.reference, mono: true },
			{ label: 'Code retrait', value: transfer.withdrawalCode, mono: true },
			{ label: 'Expéditeur', value: transfer.senderName },
			{ label: 'Bénéficiaire', value: transfer.beneficiaryName },
			{ label: 'Montant', value: `${this.formatAmount(transfer.amount)} ${transfer.currency}` },
			{ label: 'Frais', value: `${this.formatAmount(transfer.fees)} ${transfer.currency}` },
			{ label: 'Statut', value: TRANSFER_STATUS_LABELS[transfer.status] },
			{ label: 'Date', value: transfer.createdAt },
		]);
		this.detailOpen.set(true);
	}

	private openAudit(transfer: TransferRow): void {
		this.detailTitle.set(`Audit — ${transfer.reference}`);
		this.detailSubtitle.set('Historique des actions sur ce transfert');
		this.detailFields.set([
			{ label: 'Référence', value: transfer.reference, mono: true },
			{ label: 'Info', value: 'Consultez la page Audit Logs et filtrez par référence pour voir l\'historique complet.' },
		]);
		this.detailOpen.set(true);
	}

	private requestMarkSuspect(transfer: TransferRow): void {
		this.confirmTitle.set('Marquer comme suspect');
		this.confirmMessage.set(`Voulez-vous marquer le transfert ${transfer.reference} comme suspect ? Cette action déclenchera une alerte de conformité.`);
		this.confirmLabel.set('Marquer suspect');
		this._pendingConfirm = () => this.markSuspect(transfer);
		this.confirmOpen.set(true);
	}

	private requestCancel(transfer: TransferRow): void {
		this.confirmTitle.set('Annuler le transfert');
		this.confirmMessage.set(`Voulez-vous annuler le transfert ${transfer.reference} ? Cette action est irréversible.`);
		this.confirmLabel.set('Annuler le transfert');
		this._pendingConfirm = () => this.cancelTransfer(transfer);
		this.confirmOpen.set(true);
	}

	protected onConfirm(): void {
		this.confirmOpen.set(false);
		this._pendingConfirm?.();
		this._pendingConfirm = null;
	}

	private cancelTransfer(transfer: TransferRow): void {
		this._api.cancel(transfer.id).subscribe({
			next: (updated) => {
				const row = this.toRow(updated);
				this.transfers.update((items) => items.map((t) => (t.id === row.id ? row : t)));
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private markSuspect(transfer: TransferRow): void {
		this._api.markSuspect(transfer.id).subscribe({
			next: (updated) => {
				const row = this.toRow(updated);
				this.transfers.update((items) => items.map((t) => (t.id === row.id ? row : t)));
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
			},
		});
	}

	private logAction(_action: string, _transfer: TransferRow): void { /* replaced */ }

	private formatTimestamp(value: string | Date | number | null | undefined): string {
		if (value == null) return '—';
		try {
			const d = value instanceof Date ? value : new Date(value);
			if (isNaN(d.getTime())) return '—';
			return d.toISOString().replace('T', ' ').slice(0, 16);
		} catch {
			return '—';
		}
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
