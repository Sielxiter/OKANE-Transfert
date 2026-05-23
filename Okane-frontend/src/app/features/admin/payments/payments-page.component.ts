import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideBadgeCheck,
	lucideBuilding2,
	lucideCalendar,
	lucideClipboardList,
	lucideCoins,
	lucideEye,
	lucideHourglass,
	lucideReceipt,
	lucideShieldAlert,
	lucideTriangleAlert,
	lucideWallet,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	PAYMENT_KPIS,
	PAYMENT_STATUS_LABELS,
	PAYMENT_STATUS_VARIANTS,
	type AgencyRef,
	type AgentRef,
	type PaymentStatus,
} from './payments.mock';
import {
	AdminPaymentsApiService,
	type ApiPayment,
	type ApiPaymentSummary,
} from './admin-payments.api';

interface PaymentRow {
	id: number;
	paymentReference: string;
	transferReference: string;
	withdrawalCode: string;
	beneficiaryName: string;
	amount: number;
	currency: string;
	agency: AgencyRef;
	agent: AgentRef;
	status: PaymentStatus;
	paidAt: string;
	paidAtRaw: string | null;
	agencyId: number | null;
	agentNumericId: number | null;
}

@Component({
	selector: 'okane-admin-payments-page',
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
			lucideBuilding2,
			lucideCalendar,
			lucideClipboardList,
			lucideCoins,
			lucideEye,
			lucideHourglass,
			lucideReceipt,
			lucideShieldAlert,
			lucideTriangleAlert,
			lucideWallet,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Caisse & retraits"
				title="Gestion des paiements"
				description="Superviser les retraits, validations de paiement, agences, agents et statuts de paiement."
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
							@if (kpi.share !== null) {
								<span class="font-mono text-xs text-muted-foreground">{{ kpi.share }}</span>
							}
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
				searchPlaceholder="Rechercher par référence paiement, transfert ou code retrait..."
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
						<h2 class="text-base font-semibold text-foreground">Paiements</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total() }} paiement{{ total() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
					<okane-users-empty-state
						icon="lucideWallet"
						title="Aucun paiement ne correspond"
						description="Modifiez la recherche ou les filtres pour afficher des résultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Réf. paiement</th>
									<th class="px-5 py-3 text-left font-medium">Transfert</th>
									<th class="px-5 py-3 text-left font-medium">Bénéficiaire</th>
									<th class="px-5 py-3 text-right font-medium">Montant</th>
									<th class="px-5 py-3 text-left font-medium">Agence</th>
									<th class="px-5 py-3 text-left font-medium">Agent</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-left font-medium">Date</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (payment of filtered(); track payment.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<span class="font-mono text-sm font-medium text-foreground">
												{{ payment.paymentReference }}
											</span>
										</td>
										<td class="px-5 py-3">
											<div class="flex flex-col leading-tight">
												<span class="font-mono text-sm text-foreground">{{ payment.transferReference }}</span>
												<span class="font-mono text-xs text-muted-foreground">Code {{ payment.withdrawalCode }}</span>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ payment.beneficiaryName }}</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm font-medium text-foreground">
												{{ formatAmount(payment.amount) }}
											</span>
											<span class="ml-1 text-xs text-muted-foreground">{{ payment.currency }}</span>
										</td>
										<td class="px-5 py-3">
											<div class="flex items-center gap-2 text-foreground">
												<span
													class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border"
												>
													<ng-icon name="lucideBuilding2" class="text-sm" />
												</span>
												<div class="leading-tight">
													<p class="font-medium">{{ payment.agency.name }}</p>
													<p class="font-mono text-xs text-muted-foreground">{{ payment.agency.code }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="text-foreground">{{ payment.agent.name }}</p>
												<p class="font-mono text-xs text-muted-foreground">{{ payment.agent.id }}</p>
											</div>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="statusLabel(payment.status)"
												[variant]="statusVariant(payment.status)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ payment.paidAt }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="actionsFor(payment)" />
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
			title="Exporter les paiements"
			(close)="exportDialog.set(false)"
		/>

		<okane-users-placeholder-dialog
			[open]="blockDialog()"
			title="Marquer le paiement comme bloqué"
			(close)="blockDialog.set(false)"
		/>
	`,
})
export class AdminPaymentsPageComponent implements OnInit {
	private readonly _api = inject(AdminPaymentsApiService);

	protected readonly payments = signal<PaymentRow[]>([]);
	protected readonly summary = signal<ApiPaymentSummary | null>(null);
	protected readonly loading = signal<boolean>(true);
	protected readonly error = signal<string | null>(null);

	protected readonly search = signal<string>('');
	protected readonly status = signal<string>('all');
	protected readonly currency = signal<string>('all');
	protected readonly agency = signal<string>('all');
	protected readonly agent = signal<string>('all');
	protected readonly date = signal<string>('all');

	protected readonly exportDialog = signal<boolean>(false);
	protected readonly blockDialog = signal<boolean>(false);
	protected readonly pendingBlock = signal<PaymentRow | null>(null);

	protected readonly total = computed(() => this.payments().length);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => {
		const agencies = Array.from(
			new Map(
				this.payments()
					.filter((p) => p.agency.code !== '—')
					.map((p) => [p.agency.code, p.agency]),
			).values(),
		);
		const agents = Array.from(
			new Map(
				this.payments()
					.filter((p) => p.agentNumericId != null)
					.map((p) => [p.agent.id, p.agent]),
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
					{ value: 'VALIDE', label: 'Validé' },
					{ value: 'ECHOUE', label: 'Échoué' },
					{ value: 'ANNULE', label: 'Annulé' },
					{ value: 'BLOQUE', label: 'Bloqué' },
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
				key: 'agency',
				label: 'Agence',
				value: this.agency(),
				options: [
					{ value: 'all', label: 'Toutes agences' },
					...agencies.map((a) => ({ value: a.code, label: a.name })),
				],
			},
			{
				key: 'agent',
				label: 'Agent',
				value: this.agent(),
				options: [
					{ value: 'all', label: 'Tous agents' },
					...agents.map((a) => ({ value: a.id, label: a.name })),
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
		];
	});

	protected readonly filtered = computed<PaymentRow[]>(() => {
		const term = this.search().trim().toLowerCase();
		const status = this.status();
		const currency = this.currency();
		const agency = this.agency();
		const agent = this.agent();
		const date = this.date();
		const now = Date.now();

		return this.payments().filter((p) => {
			if (status !== 'all' && p.status !== status) return false;
			if (currency !== 'all' && p.currency !== currency) return false;
			if (agency !== 'all' && p.agency.code !== agency) return false;
			if (agent !== 'all' && p.agent.id !== agent) return false;
			if (date !== 'all' && p.paidAtRaw) {
				const created = new Date(p.paidAtRaw).getTime();
				if (Number.isFinite(created)) {
					const diffDays = (now - created) / (1000 * 60 * 60 * 24);
					if (date === 'today' && diffDays > 1) return false;
					if (date === 'week' && diffDays > 7) return false;
					if (date === 'month' && diffDays > 30) return false;
				}
			}
			if (!term) return true;
			return (
				p.paymentReference.toLowerCase().includes(term) ||
				p.transferReference.toLowerCase().includes(term) ||
				p.withdrawalCode.toLowerCase().includes(term) ||
				p.beneficiaryName.toLowerCase().includes(term)
			);
		});
	});

	protected readonly kpiCards = computed(() => {
		const summary = this.summary();
		const fallbackCounts = this.computeCountsFromRows();
		const totalPayments = summary?.totalPayments ?? this.payments().length;
		const todayCount = summary?.paymentsToday ?? 0;
		const pending = summary?.pendingPayments ?? fallbackCounts.EN_ATTENTE;
		const validated = summary?.validatedPayments ?? fallbackCounts.VALIDE;
		const failed = summary?.failedPayments ?? (fallbackCounts.ECHOUE + fallbackCounts.ANNULE + fallbackCounts.BLOQUE);
		const totalPaid = summary?.totalPaidAmount ?? 0;

		const pct = (n: number) =>
			totalPayments === 0 ? '0%' : `${Math.round((n / totalPayments) * 100)}%`;

		return PAYMENT_KPIS.map((kpi) => {
			if (kpi.key === 'TOTAL') {
				return { ...kpi, value: String(totalPayments), share: '100%', suffix: '' };
			}
			if (kpi.key === 'TODAY') {
				return {
					...kpi,
					value: String(todayCount),
					share: pct(todayCount),
					suffix: '',
				};
			}
			if (kpi.key === 'AMOUNT') {
				return {
					...kpi,
					value: `${this.formatAmount(totalPaid)} MAD`,
					share: null as string | null,
					suffix: 'Cumul des paiements validés',
				};
			}
			if (kpi.key === 'EN_ATTENTE') {
				return { ...kpi, value: String(pending), share: pct(pending), suffix: '' };
			}
			if (kpi.key === 'VALIDE') {
				return { ...kpi, value: String(validated), share: pct(validated), suffix: '' };
			}
			if (kpi.key === 'ECHOUE') {
				return { ...kpi, value: String(failed), share: pct(failed), suffix: '' };
			}
			return { ...kpi, value: '0', share: '0%', suffix: '' };
		});
	});

	public ngOnInit(): void {
		this.refresh();
	}

	private refresh(): void {
		this.loading.set(true);
		this.error.set(null);
		this._api.list().subscribe({
			next: (rows) => {
				this.payments.set(rows.map((row) => this.toRow(row)));
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.loading.set(false);
			},
		});
		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => {
				// Summary errors are non-fatal: KPIs fall back to client-side
				// computation from the loaded rows.
				this.summary.set(null);
			},
		});
	}

	private toRow(api: ApiPayment): PaymentRow {
		const agencyCode = api.agencyCode ?? '—';
		const agencyName = api.agencyName ?? 'Non assignée';
		const agentNumeric = api.agentId;
		const agentDisplayId = agentNumeric != null ? `AG-${agentNumeric}` : '—';
		return {
			id: api.id,
			paymentReference: api.paymentReference ?? `PMT-${api.id}`,
			transferReference: api.transferReference ?? '—',
			withdrawalCode: api.withdrawalCode ?? '—',
			beneficiaryName: api.beneficiaryName ?? '—',
			amount: Number(api.amountPaid ?? 0),
			currency: api.currency ?? '—',
			agency: { code: agencyCode, name: agencyName },
			agent: {
				id: agentDisplayId,
				name: api.agentName ?? 'Système',
			},
			status: api.status,
			paidAt: this.formatTimestamp(api.paymentDate),
			paidAtRaw: api.paymentDate,
			agencyId: api.agencyId,
			agentNumericId: agentNumeric,
		};
	}

	private computeCountsFromRows(): Record<PaymentStatus, number> {
		const counts: Record<PaymentStatus, number> = {
			EN_ATTENTE: 0,
			VALIDE: 0,
			ECHOUE: 0,
			ANNULE: 0,
			BLOQUE: 0,
		};
		for (const row of this.payments()) counts[row.status]++;
		return counts;
	}

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.status.set(change.value);
				break;
			case 'currency':
				this.currency.set(change.value);
				break;
			case 'agency':
				this.agency.set(change.value);
				break;
			case 'agent':
				this.agent.set(change.value);
				break;
			case 'date':
				this.date.set(change.value);
				break;
		}
	}

	protected openExportDialog(): void {
		this.exportDialog.set(true);
	}

	protected statusLabel(status: PaymentStatus): string {
		return PAYMENT_STATUS_LABELS[status];
	}

	protected statusVariant(status: PaymentStatus) {
		return PAYMENT_STATUS_VARIANTS[status];
	}

	protected formatAmount(value: number): string {
		return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
	}

	protected actionsFor(payment: PaymentRow): UserActionItem[] {
		const isBlocked = payment.status === 'BLOQUE';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.viewDetails(payment) },
			{ label: 'Voir transfert', icon: 'lucideArrowRightLeft', action: () => this.logAction('transfer', payment) },
			{ label: 'Voir reçu', icon: 'lucideReceipt', action: () => this.viewReceipt(payment) },
			{ label: 'Voir audit', icon: 'lucideClipboardList', action: () => this.viewAudit(payment) },
			...(isBlocked
				? []
				: [
						{
							label: 'Marquer bloqué',
							icon: 'lucideShieldAlert',
							action: () => this.requestBlock(payment),
							variant: 'destructive' as const,
						},
					]),
		];
	}

	private requestBlock(payment: PaymentRow): void {
		this.pendingBlock.set(payment);
		this.blockDialog.set(true);
		this._api.block(payment.id).subscribe({
			next: (updated) => {
				const row = this.toRow(updated);
				this.payments.update((items) => items.map((p) => (p.id === row.id ? row : p)));
				this.pendingBlock.set(null);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.pendingBlock.set(null);
			},
		});
	}

	private viewDetails(payment: PaymentRow): void {
		this._api.getById(payment.id).subscribe({
			next: (detail) => this.logAction('view', this.toRow(detail)),
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private viewReceipt(payment: PaymentRow): void {
		this._api.getReceipt(payment.id).subscribe({
			next: (receipt) => {
				// eslint-disable-next-line no-console
				console.info('[Payments] receipt', receipt);
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private viewAudit(payment: PaymentRow): void {
		this._api.getAuditTrail(payment.id).subscribe({
			next: (entries) => {
				// eslint-disable-next-line no-console
				console.info('[Payments] audit', payment.paymentReference, entries);
			},
			error: (err) => this.error.set(this.extractMessage(err)),
		});
	}

	private logAction(action: string, payment: PaymentRow): void {
		// eslint-disable-next-line no-console
		console.info(`[Payments] ${action}`, payment.paymentReference);
	}

	private formatTimestamp(value: string | null): string {
		if (!value) return '—';
		return value.replace('T', ' ').slice(0, 16);
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
