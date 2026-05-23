import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideCheck,
	lucideClipboardList,
	lucideEye,
	lucideFileText,
	lucideFlag,
	lucideHistory,
	lucideHourglass,
	lucideShieldAlert,
	lucideShieldCheck,
	lucideShieldX,
	lucideTriangleAlert,
	lucideUserCheck,
	lucideUserX,
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
	AML_ALERTS_MOCK,
	AML_STATUS_LABELS,
	AML_STATUS_VARIANTS,
	AML_TYPE_LABELS,
	BLACKLIST_MOCK,
	BLACKLIST_SOURCE_LABELS,
	BLACKLIST_STATUS_LABELS,
	BLACKLIST_STATUS_VARIANTS,
	BLACKLIST_TYPE_LABELS,
	COMPLIANCE_COUNTRIES,
	COMPLIANCE_KPIS,
	COMPLIANCE_KYC_LABELS,
	COMPLIANCE_KYC_VARIANTS,
	DOCUMENT_LABELS,
	KYC_RECORDS_MOCK,
	RISK_LABELS,
	RISK_VARIANTS,
	type AmlAlert,
	type BlacklistEntry,
	type ComplianceKycStatus,
	type KycRecord,
	type RiskLevel,
} from './compliance.mock';

@Component({
	selector: 'okane-admin-compliance-page',
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
			lucideCheck,
			lucideClipboardList,
			lucideEye,
			lucideFileText,
			lucideFlag,
			lucideHistory,
			lucideHourglass,
			lucideShieldAlert,
			lucideShieldCheck,
			lucideShieldX,
			lucideTriangleAlert,
			lucideUserCheck,
			lucideUserX,
			lucideXCircle,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Conformité"
				title="Compliance / KYC"
				description="Superviser les vérifications d'identité, alertes AML, transactions suspectes et blacklist."
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
				searchPlaceholder="Rechercher par client, email, téléphone..."
				[searchValue]="kycSearch()"
				[filters]="kycFilterDefs()"
				(searchChange)="kycSearch.set($event)"
				(filterChange)="onKycFilterChange($event)"
			/>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div
					class="flex flex-col gap-1 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between"
				>
					<div>
						<h2 class="text-base font-semibold text-foreground">Dossiers KYC</h2>
						<p class="text-xs text-muted-foreground">
							{{ filteredKyc().length }} sur {{ totalKyc }} dossier{{ totalKyc > 1 ? 's' : '' }}
						</p>
					</div>
				</div>

				@if (filteredKyc().length === 0) {
					<okane-users-empty-state
						icon="lucideShieldCheck"
						title="Aucun dossier ne correspond"
						description="Modifiez la recherche ou les filtres pour afficher des résultats."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Client</th>
									<th class="px-5 py-3 text-left font-medium">Email</th>
									<th class="px-5 py-3 text-left font-medium">Téléphone</th>
									<th class="px-5 py-3 text-left font-medium">Pièce</th>
									<th class="px-5 py-3 text-left font-medium">Pays</th>
									<th class="px-5 py-3 text-left font-medium">Statut KYC</th>
									<th class="px-5 py-3 text-left font-medium">Risque</th>
									<th class="px-5 py-3 text-left font-medium">Soumission</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (record of filteredKyc(); track record.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3">
											<div class="flex items-center gap-3">
												<div
													class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border"
												>
													{{ initials(record.fullName) }}
												</div>
												<div class="leading-tight">
													<p class="font-medium text-foreground">{{ record.fullName }}</p>
													<p class="font-mono text-xs text-muted-foreground">{{ record.clientId }}</p>
												</div>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ record.email }}</td>
										<td class="px-5 py-3 text-muted-foreground">{{ record.phone }}</td>
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="text-foreground">{{ documentLabel(record.documentType) }}</p>
												<p class="font-mono text-xs text-muted-foreground">{{ record.documentNumberMasked }}</p>
											</div>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ record.country }}</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="kycStatusLabel(record.kycStatus)"
												[variant]="kycStatusVariant(record.kycStatus)"
											/>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="riskLabel(record.risk)"
												[variant]="riskVariant(record.risk)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ record.submittedAt }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="kycActions(record)" />
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>
				}
			</section>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div
					class="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-end md:justify-between"
				>
					<div>
						<h2 class="text-base font-semibold text-foreground">Alertes AML</h2>
						<p class="text-xs text-muted-foreground">
							{{ filteredAml().length }} sur {{ totalAml }} alerte{{ totalAml > 1 ? 's' : '' }}
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<select
							class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[value]="amlStatus()"
							(change)="amlStatus.set(asValue($event))"
						>
							<option value="all">Tous statuts</option>
							<option value="NEW">Nouvelle</option>
							<option value="IN_ANALYSIS">En analyse</option>
							<option value="RESOLVED">Résolue</option>
							<option value="ESCALATED">Escaladée</option>
						</select>
						<select
							class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[value]="amlRisk()"
							(change)="amlRisk.set(asValue($event))"
						>
							<option value="all">Tous risques</option>
							<option value="LOW">Faible</option>
							<option value="MEDIUM">Moyen</option>
							<option value="HIGH">Élevé</option>
							<option value="CRITICAL">Critique</option>
						</select>
					</div>
				</div>

				@if (filteredAml().length === 0) {
					<okane-users-empty-state
						icon="lucideTriangleAlert"
						title="Aucune alerte ne correspond"
						description="Réinitialisez les filtres pour afficher les alertes AML."
					/>
				} @else {
					<div class="overflow-x-auto">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-5 py-3 text-left font-medium">Référence</th>
									<th class="px-5 py-3 text-left font-medium">Client</th>
									<th class="px-5 py-3 text-left font-medium">Type alerte</th>
									<th class="px-5 py-3 text-right font-medium">Montant</th>
									<th class="px-5 py-3 text-left font-medium">Risque</th>
									<th class="px-5 py-3 text-left font-medium">Statut</th>
									<th class="px-5 py-3 text-left font-medium">Date</th>
									<th class="px-5 py-3 text-right font-medium">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								@for (alert of filteredAml(); track alert.id) {
									<tr class="transition-colors hover:bg-accent/40">
										<td class="px-5 py-3 font-mono text-sm font-medium text-foreground">
											{{ alert.reference }}
										</td>
										<td class="px-5 py-3">
											<div class="leading-tight">
												<p class="text-foreground">{{ alert.clientName }}</p>
												<p class="font-mono text-xs text-muted-foreground">{{ alert.clientId }}</p>
											</div>
										</td>
										<td class="px-5 py-3 text-foreground">{{ amlTypeLabel(alert.type) }}</td>
										<td class="px-5 py-3 text-right">
											<span class="font-mono text-sm font-medium text-foreground">
												{{ formatAmount(alert.amount) }}
											</span>
											<span class="ml-1 text-xs text-muted-foreground">{{ alert.currency }}</span>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="riskLabel(alert.risk)"
												[variant]="riskVariant(alert.risk)"
											/>
										</td>
										<td class="px-5 py-3">
											<okane-user-status-badge
												[label]="amlStatusLabel(alert.status)"
												[variant]="amlStatusVariant(alert.status)"
											/>
										</td>
										<td class="px-5 py-3 text-muted-foreground">{{ alert.createdAt }}</td>
										<td class="px-5 py-3 text-right">
											<okane-user-actions-dropdown [actions]="amlActions(alert)" />
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>
				}
			</section>

			<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
				<div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
					<div>
						<h2 class="text-base font-semibold text-foreground">Blacklist fictive</h2>
						<p class="text-xs text-muted-foreground">
							Liste de surveillance interne et OFAC fictive (mock).
						</p>
					</div>
					<span
						class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
					>
						<ng-icon name="lucideUserX" class="text-xs" />
						{{ blacklist.length }} entrée{{ blacklist.length > 1 ? 's' : '' }}
					</span>
				</div>

				<div class="overflow-x-auto">
					<table class="min-w-full text-sm">
						<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
							<tr>
								<th class="px-5 py-3 text-left font-medium">Nom</th>
								<th class="px-5 py-3 text-left font-medium">Pays</th>
								<th class="px-5 py-3 text-left font-medium">Type</th>
								<th class="px-5 py-3 text-left font-medium">Source</th>
								<th class="px-5 py-3 text-left font-medium">Statut</th>
								<th class="px-5 py-3 text-left font-medium">Date d'ajout</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							@for (entry of blacklist; track entry.id) {
								<tr class="transition-colors hover:bg-accent/40">
									<td class="px-5 py-3">
										<div class="leading-tight">
											<p class="font-medium text-foreground">{{ entry.name }}</p>
											<p class="font-mono text-xs text-muted-foreground">{{ entry.id }}</p>
										</div>
									</td>
									<td class="px-5 py-3 text-foreground">
										<div class="flex items-center gap-2">
											<span class="font-mono text-xs uppercase text-muted-foreground">{{ entry.countryCode }}</span>
											<span>{{ entry.country }}</span>
										</div>
									</td>
									<td class="px-5 py-3">
										<span
											class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
										>{{ blacklistTypeLabel(entry.type) }}</span>
									</td>
									<td class="px-5 py-3 text-muted-foreground">{{ blacklistSourceLabel(entry.source) }}</td>
									<td class="px-5 py-3">
										<okane-user-status-badge
											[label]="blacklistStatusLabel(entry.status)"
											[variant]="blacklistStatusVariant(entry.status)"
										/>
									</td>
									<td class="px-5 py-3 text-muted-foreground">{{ entry.addedAt }}</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			</section>
		</div>

		<okane-users-placeholder-dialog
			[open]="exportDialog()"
			title="Exporter les dossiers de conformité"
			(close)="exportDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="verifyDialog()"
			title="Vérifier le dossier KYC"
			(close)="verifyDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="rejectDialog()"
			title="Rejeter le dossier KYC"
			(close)="rejectDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="escalateDialog()"
			title="Escalader l'alerte AML"
			(close)="escalateDialog.set(false)"
		/>
	`,
})
export class AdminCompliancePageComponent {
	protected readonly totalKyc = KYC_RECORDS_MOCK.length;
	protected readonly totalAml = AML_ALERTS_MOCK.length;
	protected readonly blacklist = BLACKLIST_MOCK;

	protected readonly kycSearch = signal<string>('');
	protected readonly kycStatus = signal<string>('all');
	protected readonly kycRisk = signal<string>('all');
	protected readonly kycCountry = signal<string>('all');
	protected readonly kycDocument = signal<string>('all');

	protected readonly amlStatus = signal<string>('all');
	protected readonly amlRisk = signal<string>('all');

	protected readonly exportDialog = signal<boolean>(false);
	protected readonly verifyDialog = signal<boolean>(false);
	protected readonly rejectDialog = signal<boolean>(false);
	protected readonly escalateDialog = signal<boolean>(false);

	protected readonly kycFilterDefs = computed<FilterDefinition[]>(() => [
		{
			key: 'status',
			label: 'Statut KYC',
			value: this.kycStatus(),
			options: [
				{ value: 'all', label: 'Tous statuts' },
				{ value: 'VERIFIED', label: 'Vérifié' },
				{ value: 'PENDING', label: 'En attente' },
				{ value: 'REJECTED', label: 'Rejeté' },
				{ value: 'REVIEW', label: 'À revoir' },
			],
		},
		{
			key: 'risk',
			label: 'Risque',
			value: this.kycRisk(),
			options: [
				{ value: 'all', label: 'Tous risques' },
				{ value: 'LOW', label: 'Faible' },
				{ value: 'MEDIUM', label: 'Moyen' },
				{ value: 'HIGH', label: 'Élevé' },
				{ value: 'CRITICAL', label: 'Critique' },
			],
		},
		{
			key: 'country',
			label: 'Pays',
			value: this.kycCountry(),
			options: [
				{ value: 'all', label: 'Tous pays' },
				...COMPLIANCE_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
			],
		},
		{
			key: 'doc',
			label: 'Pièce',
			value: this.kycDocument(),
			options: [
				{ value: 'all', label: 'Toutes pièces' },
				{ value: 'CIN', label: 'CIN' },
				{ value: 'PASSPORT', label: 'Passeport' },
				{ value: 'RESIDENCE', label: 'Carte séjour' },
				{ value: 'DRIVING', label: 'Permis de conduire' },
			],
		},
	]);

	protected readonly filteredKyc = computed<KycRecord[]>(() => {
		const term = this.kycSearch().trim().toLowerCase();
		const status = this.kycStatus();
		const risk = this.kycRisk();
		const country = this.kycCountry();
		const doc = this.kycDocument();

		return KYC_RECORDS_MOCK.filter((r) => {
			if (status !== 'all' && r.kycStatus !== status) return false;
			if (risk !== 'all' && r.risk !== risk) return false;
			if (country !== 'all' && r.countryCode !== country) return false;
			if (doc !== 'all' && r.documentType !== doc) return false;
			if (!term) return true;
			return (
				r.fullName.toLowerCase().includes(term) ||
				r.email.toLowerCase().includes(term) ||
				r.phone.toLowerCase().includes(term) ||
				r.clientId.toLowerCase().includes(term) ||
				r.id.toLowerCase().includes(term)
			);
		});
	});

	protected readonly filteredAml = computed<AmlAlert[]>(() => {
		const status = this.amlStatus();
		const risk = this.amlRisk();
		return AML_ALERTS_MOCK.filter((a) => {
			if (status !== 'all' && a.status !== status) return false;
			if (risk !== 'all' && a.risk !== risk) return false;
			return true;
		});
	});

	protected readonly kpiCards = computed(() => {
		const kycCounts = { VERIFIED: 0, PENDING: 0, REJECTED: 0, REVIEW: 0 };
		for (const r of KYC_RECORDS_MOCK) kycCounts[r.kycStatus]++;

		const amlOpen = AML_ALERTS_MOCK.filter((a) => a.status !== 'RESOLVED').length;
		const suspiciousTx = AML_ALERTS_MOCK.filter(
			(a) => a.risk === 'HIGH' || a.risk === 'CRITICAL',
		).length;
		const blacklisted = BLACKLIST_MOCK.filter((b) => b.status === 'ACTIVE').length;

		const valueByKey: Record<string, { value: string; suffix: string }> = {
			KYC_PENDING: { value: String(kycCounts.PENDING), suffix: 'à traiter' },
			KYC_VERIFIED: { value: String(kycCounts.VERIFIED), suffix: 'cumul' },
			KYC_REJECTED: { value: String(kycCounts.REJECTED), suffix: 'cumul' },
			AML_ALERTS: { value: String(amlOpen), suffix: 'ouvertes' },
			SUSPICIOUS_TX: { value: String(suspiciousTx), suffix: 'risque élevé/critique' },
			BLACKLISTED: { value: String(blacklisted), suffix: 'actifs' },
		};

		return COMPLIANCE_KPIS.map((kpi) => ({ ...kpi, ...valueByKey[kpi.key] }));
	});

	protected onKycFilterChange(change: { key: string; value: string }): void {
		switch (change.key) {
			case 'status':
				this.kycStatus.set(change.value);
				break;
			case 'risk':
				this.kycRisk.set(change.value);
				break;
			case 'country':
				this.kycCountry.set(change.value);
				break;
			case 'doc':
				this.kycDocument.set(change.value);
				break;
		}
	}

	protected asValue(event: Event): string {
		return (event.target as HTMLSelectElement).value;
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

	protected formatAmount(value: number): string {
		return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
	}

	protected documentLabel(type: KycRecord['documentType']): string {
		return DOCUMENT_LABELS[type];
	}

	protected kycStatusLabel(status: ComplianceKycStatus): string {
		return COMPLIANCE_KYC_LABELS[status];
	}

	protected kycStatusVariant(status: ComplianceKycStatus) {
		return COMPLIANCE_KYC_VARIANTS[status];
	}

	protected riskLabel(risk: RiskLevel): string {
		return RISK_LABELS[risk];
	}

	protected riskVariant(risk: RiskLevel) {
		return RISK_VARIANTS[risk];
	}

	protected amlTypeLabel(type: AmlAlert['type']): string {
		return AML_TYPE_LABELS[type];
	}

	protected amlStatusLabel(status: AmlAlert['status']): string {
		return AML_STATUS_LABELS[status];
	}

	protected amlStatusVariant(status: AmlAlert['status']) {
		return AML_STATUS_VARIANTS[status];
	}

	protected blacklistTypeLabel(type: BlacklistEntry['type']): string {
		return BLACKLIST_TYPE_LABELS[type];
	}

	protected blacklistSourceLabel(source: BlacklistEntry['source']): string {
		return BLACKLIST_SOURCE_LABELS[source];
	}

	protected blacklistStatusLabel(status: BlacklistEntry['status']): string {
		return BLACKLIST_STATUS_LABELS[status];
	}

	protected blacklistStatusVariant(status: BlacklistEntry['status']) {
		return BLACKLIST_STATUS_VARIANTS[status];
	}

	protected kycActions(record: KycRecord): UserActionItem[] {
		const isPending = record.kycStatus === 'PENDING' || record.kycStatus === 'REVIEW';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view-kyc', record.id) },
			...(isPending
				? [
						{
							label: 'Vérifier',
							icon: 'lucideCheck',
							action: () => this.verifyDialog.set(true),
						},
						{
							label: 'Rejeter',
							icon: 'lucideXCircle',
							action: () => this.rejectDialog.set(true),
							variant: 'destructive' as const,
						},
					]
				: []),
			{ label: 'Voir documents', icon: 'lucideFileText', action: () => this.logAction('docs-kyc', record.id) },
			{ label: 'Voir historique', icon: 'lucideHistory', action: () => this.logAction('history-kyc', record.id) },
		];
	}

	protected amlActions(alert: AmlAlert): UserActionItem[] {
		const canEscalate = alert.status !== 'ESCALATED' && alert.status !== 'RESOLVED';
		const canResolve = alert.status !== 'RESOLVED';
		return [
			{ label: 'Voir détails', icon: 'lucideEye', action: () => this.logAction('view-aml', alert.reference) },
			{ label: 'Voir historique', icon: 'lucideHistory', action: () => this.logAction('history-aml', alert.reference) },
			...(canResolve
				? [
						{
							label: 'Marquer résolue',
							icon: 'lucideCheck',
							action: () => this.logAction('resolve-aml', alert.reference),
						},
					]
				: []),
			...(canEscalate
				? [
						{
							label: 'Escalader',
							icon: 'lucideFlag',
							action: () => this.escalateDialog.set(true),
							variant: 'destructive' as const,
						},
					]
				: []),
		];
	}

	private logAction(action: string, ref: string): void {
		// eslint-disable-next-line no-console
		console.info(`[Compliance] ${action}`, ref);
	}
}
