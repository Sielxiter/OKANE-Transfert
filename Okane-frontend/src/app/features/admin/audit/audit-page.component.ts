import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	AUDIT_KPIS,
	AUDIT_LOGS_MOCK,
	AUDIT_MODULE_LABELS,
	AUDIT_RISK_LABELS,
	AUDIT_RISK_VARIANTS,
	AUDIT_ROLE_LABELS,
	AUDIT_STATUS_LABELS,
	AUDIT_STATUS_VARIANTS,
	type AuditLog,
	type AuditModule,
	type AuditRiskLevel,
	type AuditStatus,
	type AuditUserRole,
} from './audit.mock';

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
							{{ filtered().length }} sur {{ total }} entrée{{ total > 1 ? 's' : '' }}
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
		<okane-users-placeholder-dialog
			[open]="copyDialog()"
			title="Copier l'identifiant du log"
			(close)="copyDialog.set(false)"
		/>
	`,
})
export class AdminAuditPageComponent {
	protected readonly total = AUDIT_LOGS_MOCK.length;

	protected readonly search = signal<string>('');
	protected readonly role = signal<string>('all');
	protected readonly module = signal<string>('all');
	protected readonly status = signal<string>('all');
	protected readonly risk = signal<string>('all');
	protected readonly date = signal<string>('all');

	protected readonly exportDialog = signal<boolean>(false);
	protected readonly copyDialog = signal<boolean>(false);

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

	protected readonly filtered = computed<AuditLog[]>(() => {
		const term = this.search().trim().toLowerCase();
		const role = this.role();
		const module = this.module();
		const status = this.status();
		const risk = this.risk();
		const date = this.date();
		const now = new Date('2026-05-23T23:59:59');

		return AUDIT_LOGS_MOCK.filter((l) => {
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
		const today = '2026-05-23';
		const todayCount = AUDIT_LOGS_MOCK.filter((l) => l.timestamp.startsWith(today)).length;
		const loginFailed = AUDIT_LOGS_MOCK.filter(
			(l) => l.module === 'AUTH' && (l.action === 'LOGIN_FAILED' || l.status !== 'SUCCESS'),
		).length;
		const sensitive = AUDIT_LOGS_MOCK.filter((l) =>
			['USERS', 'AGENCIES', 'CURRENCY', 'FEES', 'SETTINGS'].includes(l.module),
		).length;
		const securityAlerts = AUDIT_LOGS_MOCK.filter(
			(l) => l.status === 'BLOCKED' || l.status === 'FAILURE' || l.risk === 'CRITICAL',
		).length;
		const adminActions = AUDIT_LOGS_MOCK.filter((l) => l.user.role === 'ROLE_ADMIN').length;
		const critical = AUDIT_LOGS_MOCK.filter((l) => l.risk === 'CRITICAL').length;

		const valueByKey: Record<string, { value: string; suffix: string }> = {
			TODAY: { value: String(todayCount), suffix: 'événements' },
			LOGIN_FAILED: { value: String(loginFailed), suffix: 'tentatives' },
			SENSITIVE: { value: String(sensitive), suffix: 'modules sensibles' },
			SECURITY_ALERTS: { value: String(securityAlerts), suffix: 'à analyser' },
			ADMIN_ACTIONS: { value: String(adminActions), suffix: 'par les admins' },
			CRITICAL: { value: String(critical), suffix: 'risque critique' },
		};
		return AUDIT_KPIS.map((kpi) => ({ ...kpi, ...valueByKey[kpi.key] }));
	});

	protected onFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'role':
				this.role.set(change.value);
				break;
			case 'module':
				this.module.set(change.value);
				break;
			case 'status':
				this.status.set(change.value);
				break;
			case 'risk':
				this.risk.set(change.value);
				break;
			case 'date':
				this.date.set(change.value);
				break;
		}
	}

	protected openExport(): void {
		this.exportDialog.set(true);
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

	protected logActions(log: AuditLog): UserActionItem[] {
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view', log.id) },
			{
				label: 'Copier ID log',
				icon: 'lucideClipboardCopy',
				action: () => this.copyDialog.set(true),
			},
			...(log.user.role === 'SYSTEM'
				? []
				: [
						{
							label: 'Voir utilisateur',
							icon: 'lucideUserCheck',
							action: () => this.logAction('view-user', log.user.id),
						},
					]),
			{
				label: 'Voir module',
				icon: 'lucideExternalLink',
				action: () => this.logAction('view-module', log.module),
			},
		];
	}

	private logAction(action: string, ref: string): void {
		// eslint-disable-next-line no-console
		console.info(`[Audit] ${action}`, ref);
	}
}
