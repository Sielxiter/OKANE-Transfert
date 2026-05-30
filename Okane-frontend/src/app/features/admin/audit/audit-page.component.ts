import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideActivity,
	lucideClipboardCopy,
	lucideClipboardList,
	lucideExternalLink,
	lucideEye,
	lucideFlame,
	lucideShieldAlert,
	lucideShieldCheck,
	lucideTriangleAlert,
	lucideUserCheck,
	lucideUserX,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import { ActionDetailModalComponent, type DetailField } from '../users/shared/action-detail-modal.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	AUDIT_KPIS,
	AUDIT_MODULE_LABELS,
	AUDIT_RISK_LABELS,
	AUDIT_RISK_VARIANTS,
	AUDIT_ROLE_LABELS,
	AUDIT_STATUS_LABELS,
	AUDIT_STATUS_VARIANTS,
	type AuditModule,
	type AuditRiskLevel,
	type AuditStatus,
	type AuditUserRole,
} from './audit.mock';
import {
	AdminAuditApiService,
	type ApiAuditLog,
	type ApiAuditModule,
	type ApiAuditRisk,
	type ApiAuditStatus,
	type ApiAuditSummary,
} from './admin-audit.api';

/** Internal row shape used by the template (maps from ApiAuditLog). */
interface AuditRow {
	id: string;
	timestamp: string;
	user: {
		id: string;
		name: string;
		email: string;
		role: AuditUserRole;
	};
	action: string;
	module: AuditModule;
	target: string;
	ipAddress: string;
	status: AuditStatus;
	risk: AuditRiskLevel;
}

@Component({
	selector: 'okane-admin-audit-page',
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
	],
	providers: [
		provideIcons({
			lucideActivity,
			lucideClipboardCopy,
			lucideClipboardList,
			lucideExternalLink,
			lucideEye,
			lucideFlame,
			lucideShieldAlert,
			lucideShieldCheck,
			lucideTriangleAlert,
			lucideUserCheck,
			lucideUserX,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Sécurité & traçabilité"
				title="Audit Logs"
				description="Suivre les actions sensibles : connexions, modifications utilisateurs, transferts, paiements, conformité et configuration système."
				addLabel="Exporter"
				actionIcon="lucideClipboardList"
				actionVariant="outline"
				(addClicked)="openExport()"
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
						class="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md"
					>
						<span
							class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-border/60"
							[ngClass]="kpi.accent"
						>
							<ng-icon [name]="kpi.icon" />
						</span>
						<p class="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ kpi.label }}</p>
						<p class="mt-1 text-2xl font-semibold tracking-tight text-foreground">{{ kpi.value }}</p>
						@if (kpi.suffix) {
							<p class="mt-0.5 text-xs text-muted-foreground">{{ kpi.suffix }}</p>
						}
					</article>
				}
			</section>

			<okane-users-filters
				searchPlaceholder="Rechercher par utilisateur, action, module ou IP..."
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
						<h2 class="text-base font-semibold text-foreground">Journal d'audit</h2>
						<p class="text-xs text-muted-foreground">
							{{ filtered().length }} sur {{ total() }} entrée{{ total() > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filtered().length === 0) {
					<okane-users-empty-state
						icon="lucideActivity"
						title="Aucun log ne correspond"
						description="Modifiez la recherche ou les filtres pour afficher des résultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Date / Heure</th>
									<th class="px-5 py-3 text-left font-medium">Utilisateur</th>
									<th class="px-5 py-3 text-left font-medium">Rôle</th>
									<th class="px-5 py-3 text-left font-medium">Action</th>
									<th class="px-5 py-3 text-left font-medium">Module</th>
									<th class="px-5 py-3 text-left font-medium">Cible</th>
									<th class="px-5 py-3 text-left font-medium">IP</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-left font-medium">Risque</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (log of filtered(); track log.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="font-mono text-xs font-medium text-foreground">{{ log.timestamp }}</p>
												<p class="font-mono text-xs text-muted-foreground">{{ log.id }}</p>
											</div>
										</td>
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div
													class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border"
												>
													{{ initials(log.user.name) }}
												</div>
												<div class="leading-tight">
													<p class="font-medium text-foreground">{{ log.user.name }}</p>
													<p class="font-mono text-xs text-muted-foreground">{{ log.user.id }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3">
											<span
												class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
											>{{ roleLabel(log.user.role) }}</span>
										</td>
										<td class="px-5 py-3">
											<span class="font-mono text-xs font-medium text-foreground">{{ log.action }}</span>
										</td>
										<td class="px-5 py-3">
											<span
												class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
											>{{ moduleLabel(log.module) }}</span>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ log.target }}</td>
										<td class="px-5 py-3 font-mono text-xs text-muted-foreground">{{ log.ipAddress }}</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="statusLabel(log.status)"
												[variant]="statusVariant(log.status)"
											/>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="riskLabel(log.risk)"
												[variant]="riskVariant(log.risk)"
											/>
										</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="logActions(log)" />
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
			title="Exporter le journal d'audit"
			(close)="exportDialog.set(false)"
		/>

		<okane-action-detail-modal
			[open]="detailOpen()"
			[title]="detailTitle()"
			subtitle="Détails du log d'audit (lecture seule)"
			[fields]="detailFields()"
			(close)="detailOpen.set(false)"
		/>
	`,
})
export class AdminAuditPageComponent implements OnInit {
	private readonly _api = inject(AdminAuditApiService);

	protected readonly detailOpen = signal<boolean>(false);
	protected readonly detailTitle = signal<string>('Détails log');
	protected readonly detailFields = signal<DetailField[]>([]);

	// ─── API state ──────────────────────────────────────────────────────────────
	protected readonly logs = signal<AuditRow[]>([]);
	protected readonly summary = signal<ApiAuditSummary | null>(null);
	protected readonly error = signal<string | null>(null);

	// ─── Filters ────────────────────────────────────────────────────────────────
	protected readonly search = signal<string>('');
	protected readonly role = signal<string>('all');
	protected readonly module = signal<string>('all');
	protected readonly status = signal<string>('all');
	protected readonly risk = signal<string>('all');
	protected readonly date = signal<string>('all');

	// ─── Dialogs ────────────────────────────────────────────────────────────────
	protected readonly exportDialog = signal<boolean>(false);
	protected readonly copyDialog = signal<boolean>(false);

	// ─── Computed ───────────────────────────────────────────────────────────────
	protected readonly total = computed(() => this.logs().length);

	protected readonly filterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'role',
			label: 'Rôle',
			value: this.role(),
			options: [
				{ value: 'all', label: 'Tous rôles' },
				{ value: 'ROLE_ADMIN', label: 'Admin' },
				{ value: 'ROLE_MANAGER', label: 'Manager' },
				{ value: 'ROLE_AGENT', label: 'Agent' },
				{ value: 'ROLE_CLIENT', label: 'Client' },
				{ value: 'SYSTEM', label: 'Système' },
			],
		},
		{
			key: 'module',
			label: 'Module',
			value: this.module(),
			options: [
				{ value: 'all', label: 'Tous modules' },
				{ value: 'AUTH', label: 'Auth' },
				{ value: 'USERS', label: 'Users' },
				{ value: 'AGENCIES', label: 'Agencies' },
				{ value: 'TRANSFERS', label: 'Transfers' },
				{ value: 'PAYMENTS', label: 'Payments' },
				{ value: 'CURRENCY', label: 'Currency' },
				{ value: 'FEES', label: 'Fees' },
				{ value: 'COMPLIANCE', label: 'Compliance' },
				{ value: 'REPORTS', label: 'Reports' },
				{ value: 'SETTINGS', label: 'Settings' },
			],
		},
		{
			key: 'status',
			label: 'Statut',
			value: this.status(),
			options: [
				{ value: 'all', label: 'Tous statuts' },
				{ value: 'SUCCESS', label: 'Succès' },
				{ value: 'FAILURE', label: 'Échec' },
				{ value: 'BLOCKED', label: 'Bloqué' },
			],
		},
		{
			key: 'risk',
			label: 'Risque',
			value: this.risk(),
			options: [
				{ value: 'all', label: 'Tous risques' },
				{ value: 'LOW', label: 'Faible' },
				{ value: 'MEDIUM', label: 'Moyen' },
				{ value: 'HIGH', label: 'Élevé' },
				{ value: 'CRITICAL', label: 'Critique' },
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
	]);

	protected readonly filtered = computed<AuditRow[]>(() => {
		const term = this.search().trim().toLowerCase();
		const role = this.role();
		const module = this.module();
		const status = this.status();
		const risk = this.risk();
		const date = this.date();
		const now = new Date();

		return this.logs().filter((l) => {
			if (role !== 'all' && l.user.role !== role) return false;
			if (module !== 'all' && l.module !== module) return false;
			if (status !== 'all' && l.status !== status) return false;
			if (risk !== 'all' && l.risk !== risk) return false;
			if (date !== 'all') {
				const created = new Date(l.timestamp.replace(' ', 'T'));
				const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
				if (date === 'today' && diffDays > 1) return false;
				if (date === 'week' && diffDays > 7) return false;
				if (date === 'month' && diffDays > 30) return false;
			}
			if (!term) return true;
			return (
				l.user.name.toLowerCase().includes(term) ||
				l.user.email.toLowerCase().includes(term) ||
				l.action.toLowerCase().includes(term) ||
				l.module.toLowerCase().includes(term) ||
				l.target.toLowerCase().includes(term) ||
				l.ipAddress.toLowerCase().includes(term) ||
				l.id.toLowerCase().includes(term)
			);
		});
	});

	protected readonly kpiCards = computed(() => {
		const s = this.summary();
		const valueByKey: Record<string, { value: string; suffix: string }> = {
			TODAY: {
				value: s ? String(s.actionsToday) : '—',
				suffix: 'événements',
			},
			LOGIN_FAILED: {
				value: s ? String(s.failedLogins) : '—',
				suffix: 'tentatives',
			},
			SENSITIVE: {
				value: s ? String(s.sensitiveChanges) : '—',
				suffix: 'modules sensibles',
			},
			SECURITY_ALERTS: {
				value: s ? String(s.securityAlerts) : '—',
				suffix: 'à analyser',
			},
			ADMIN_ACTIONS: {
				value: s ? String(s.adminActions) : '—',
				suffix: 'par les admins',
			},
			CRITICAL: {
				value: s ? String(s.criticalLogs) : '—',
				suffix: 'risque critique',
			},
		};
		return AUDIT_KPIS.map((kpi) => ({ ...kpi, ...valueByKey[kpi.key] }));
	});

	// ─── Lifecycle ──────────────────────────────────────────────────────────────
	public ngOnInit(): void {
		this.loadAll();
	}

	private loadAll(): void {
		this.error.set(null);

		this._api.listLogs().subscribe({
			next: (rows) => this.logs.set(rows.map((r) => this.toRow(r))),
			error: (err) => this.error.set(this.extractMessage(err)),
		});

		this._api.getSummary().subscribe({
			next: (data) => this.summary.set(data),
			error: () => this.summary.set(null),
		});
	}

	// ─── Mapping ────────────────────────────────────────────────────────────────
	private toRow(api: ApiAuditLog): AuditRow {
		return {
			id: 'LOG-' + api.id,
			timestamp: api.createdAt ?? '—',
			user: {
				id: api.actorId ?? 'SYS',
				name: api.actorName ?? 'Système',
				email: api.actorEmail ?? 'system@okane.local',
				role: this.mapRole(api.actorRole),
			},
			action: api.action ?? '—',
			module: this.mapModule(api.module),
			target: api.target ?? '—',
			ipAddress: api.ipAddress ?? '—',
			status: this.mapStatus(api.status),
			risk: this.mapRisk(api.riskLevel),
		};
	}

	private mapRole(role: string | null | undefined): AuditUserRole {
		const valid: AuditUserRole[] = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AGENT', 'ROLE_CLIENT', 'SYSTEM'];
		return valid.includes(role as AuditUserRole) ? (role as AuditUserRole) : 'SYSTEM';
	}

	private mapModule(module: ApiAuditModule | null | undefined): AuditModule {
		const valid: AuditModule[] = [
			'AUTH', 'USERS', 'AGENCIES', 'TRANSFERS', 'PAYMENTS',
			'CURRENCY', 'FEES', 'COMPLIANCE', 'REPORTS', 'SETTINGS',
		];
		return valid.includes(module as AuditModule) ? (module as AuditModule) : 'AUTH';
	}

	private mapStatus(status: ApiAuditStatus | null | undefined): AuditStatus {
		const valid: AuditStatus[] = ['SUCCESS', 'FAILURE', 'BLOCKED'];
		return valid.includes(status as AuditStatus) ? (status as AuditStatus) : 'SUCCESS';
	}

	private mapRisk(risk: ApiAuditRisk | null | undefined): AuditRiskLevel {
		const valid: AuditRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
		return valid.includes(risk as AuditRiskLevel) ? (risk as AuditRiskLevel) : 'LOW';
	}

	// ─── Filter handler ─────────────────────────────────────────────────────────
	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'role': this.role.set(change.value); break;
			case 'module': this.module.set(change.value); break;
			case 'status': this.status.set(change.value); break;
			case 'risk': this.risk.set(change.value); break;
			case 'date': this.date.set(change.value); break;
		}
	}

	// ─── Export ─────────────────────────────────────────────────────────────────
	protected openExport(): void {
		this._api.exportLogs().subscribe({
			next: () => this.exportDialog.set(true),
			error: () => this.exportDialog.set(true),
		});
	}

	// ─── Label helpers ───────────────────────────────────────────────────────────
	protected initials(name: string): string {
		return name
			.split(' ')
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	protected roleLabel(role: AuditUserRole): string {
		return AUDIT_ROLE_LABELS[role];
	}

	protected moduleLabel(module: AuditModule): string {
		return AUDIT_MODULE_LABELS[module];
	}

	protected statusLabel(status: AuditStatus): string {
		return AUDIT_STATUS_LABELS[status];
	}

	protected statusVariant(status: AuditStatus) {
		return AUDIT_STATUS_VARIANTS[status];
	}

	protected riskLabel(risk: AuditRiskLevel): string {
		return AUDIT_RISK_LABELS[risk];
	}

	protected riskVariant(risk: AuditRiskLevel) {
		return AUDIT_RISK_VARIANTS[risk];
	}

	// ─── Row actions ─────────────────────────────────────────────────────────────
	protected logActions(log: AuditRow): UserActionItem[] {
		const numId = Number(log.id.replace('LOG-', ''));
		return [
			{
				label: 'Voir détails',
				icon: 'lucideEye',
				action: () => this.openLogDetail(log, numId),
			},
			{
				label: 'Copier ID log',
				icon: 'lucideClipboardCopy',
				action: () => this.copyLogId(log.id),
			},
			...(log.user.role === 'SYSTEM'
				? []
				: [
						{
							label: 'Voir utilisateur',
							icon: 'lucideUserCheck',
							action: () => this.openUserDetail(log),
						},
					]),
			{
				label: 'Voir module',
				icon: 'lucideExternalLink',
				action: () => this.openModuleDetail(log),
			},
		];
	}

	private openLogDetail(log: AuditRow, numId: number): void {
		this._api.getLog(numId).subscribe({
			next: (detail) => {
				this.detailTitle.set(`Log ${log.id}`);
				this.detailFields.set([
					{ label: 'ID', value: log.id, mono: true },
					{ label: 'Date / Heure', value: detail.createdAt ?? log.timestamp, mono: true },
					{ label: 'Utilisateur', value: detail.actorName ?? log.user.name },
					{ label: 'Email', value: detail.actorEmail ?? log.user.email },
					{ label: 'Rôle', value: AUDIT_ROLE_LABELS[log.user.role] },
					{ label: 'Action', value: detail.action ?? log.action, mono: true },
					{ label: 'Module', value: AUDIT_MODULE_LABELS[log.module] },
					{ label: 'Cible', value: detail.target ?? log.target },
					{ label: 'IP', value: detail.ipAddress ?? log.ipAddress, mono: true },
					{ label: 'Statut', value: AUDIT_STATUS_LABELS[log.status] },
					{ label: 'Risque', value: AUDIT_RISK_LABELS[log.risk] },
					{ label: 'Description', value: detail.description ?? '—' },
				]);
				this.detailOpen.set(true);
			},
			error: () => {
				this.detailTitle.set(`Log ${log.id}`);
				this.detailFields.set([
					{ label: 'ID', value: log.id, mono: true },
					{ label: 'Date / Heure', value: log.timestamp, mono: true },
					{ label: 'Utilisateur', value: log.user.name },
					{ label: 'Action', value: log.action, mono: true },
					{ label: 'Module', value: AUDIT_MODULE_LABELS[log.module] },
					{ label: 'Cible', value: log.target },
					{ label: 'IP', value: log.ipAddress, mono: true },
					{ label: 'Statut', value: AUDIT_STATUS_LABELS[log.status] },
					{ label: 'Risque', value: AUDIT_RISK_LABELS[log.risk] },
				]);
				this.detailOpen.set(true);
			},
		});
	}

	private copyLogId(id: string): void {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(id).then(() => {
				this.detailTitle.set('ID copié');
				this.detailFields.set([{ label: 'ID log', value: id, mono: true }]);
				this.detailOpen.set(true);
			}).catch(() => {
				this.detailTitle.set('ID log');
				this.detailFields.set([{ label: 'ID log', value: id, mono: true }]);
				this.detailOpen.set(true);
			});
		} else {
			this.detailTitle.set('ID log');
			this.detailFields.set([{ label: 'ID log', value: id, mono: true }]);
			this.detailOpen.set(true);
		}
	}

	private openUserDetail(log: AuditRow): void {
		this.detailTitle.set(`Utilisateur — ${log.user.name}`);
		this.detailFields.set([
			{ label: 'ID', value: log.user.id, mono: true },
			{ label: 'Nom', value: log.user.name },
			{ label: 'Email', value: log.user.email },
			{ label: 'Rôle', value: AUDIT_ROLE_LABELS[log.user.role] },
			{ label: 'Info', value: 'Consultez la page Utilisateurs pour voir le profil complet.' },
		]);
		this.detailOpen.set(true);
	}

	private openModuleDetail(log: AuditRow): void {
		const moduleRoutes: Record<string, string> = {
			AUTH: '/admin/settings',
			USERS: '/admin/users/clients',
			AGENCIES: '/admin/agencies',
			TRANSFERS: '/admin/transfers',
			PAYMENTS: '/admin/payments',
			CURRENCY: '/admin/currency',
			FEES: '/admin/fees',
			COMPLIANCE: '/admin/compliance',
			REPORTS: '/admin/reports',
			SETTINGS: '/admin/settings',
		};
		const route = moduleRoutes[log.module] ?? null;
		this.detailTitle.set(`Module — ${AUDIT_MODULE_LABELS[log.module]}`);
		this.detailFields.set([
			{ label: 'Module', value: AUDIT_MODULE_LABELS[log.module] },
			{ label: 'Action', value: log.action, mono: true },
			{ label: 'Page associée', value: route ?? 'Non disponible' },
		]);
		this.detailOpen.set(true);
	}

	private logAction(_action: string, _ref: string): void { /* replaced */ }

	private extractMessage(err: unknown): string {
		const fallback = 'Erreur réseau. Vérifiez votre connexion ou votre session.';
		if (typeof err === 'object' && err !== null) {
			const e = err as { error?: { message?: string }; message?: string };
			return e.error?.message ?? e.message ?? fallback;
		}
		return fallback;
	}
}
