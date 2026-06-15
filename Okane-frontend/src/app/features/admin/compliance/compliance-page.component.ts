import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideCheck, lucideClipboardList, lucideEye, lucideFileText, lucideFlag, lucideHistory,
	lucideHourglass, lucideShieldAlert, lucideShieldCheck, lucideShieldX, lucideTriangleAlert,
	lucideUserCheck, lucideUserX, lucideXCircle,
} from '@ng-icons/lucide';
import { UserActionsDropdownComponent } from '../users/shared/user-actions-dropdown.component';
import { UserStatusBadgeComponent } from '../users/shared/user-status-badge.component';
import { UsersEmptyStateComponent } from '../users/shared/users-empty-state.component';
import { UsersFiltersComponent, type FilterDefinition } from '../users/shared/users-filters.component';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import type { UserActionItem } from '../users/shared/user-status.types';
import {
	AML_STATUS_LABELS, AML_STATUS_VARIANTS, AML_TYPE_LABELS, BLACKLIST_SOURCE_LABELS,
	BLACKLIST_STATUS_LABELS, BLACKLIST_STATUS_VARIANTS, BLACKLIST_TYPE_LABELS, COMPLIANCE_COUNTRIES,
	COMPLIANCE_KPIS, COMPLIANCE_KYC_LABELS, COMPLIANCE_KYC_VARIANTS, DOCUMENT_LABELS,
	RISK_LABELS, RISK_VARIANTS,
	type AmlAlertType, type BlacklistEntityType, type BlacklistSource, type BlacklistStatus,
	type ComplianceKycStatus, type RiskLevel,
} from './compliance.mock';
import {
	AdminComplianceApiService,
	type ApiAmlAlert, type ApiAmlStatus, type ApiBlacklistEntry, type ApiComplianceSummary,
	type ApiKycRecord, type ApiKycStatus, type ApiRiskLevel,
} from './admin-compliance.api';

interface KycRow {
id: string;
clientId: string;
fullName: string;
email: string;
phone: string;
documentType: string;
documentNumberMasked: string;
country: string;
countryCode: string;
kycStatus: ComplianceKycStatus;
risk: RiskLevel;
submittedAt: string;
}

interface AmlRow {
id: string;
reference: string;
clientId: string;
clientName: string;
type: AmlAlertType;
amount: number;
currency: string;
risk: RiskLevel;
status: 'NEW' | 'IN_ANALYSIS' | 'RESOLVED' | 'ESCALATED';
createdAt: string;
}

interface BlacklistRow {
id: string;
name: string;
country: string;
countryCode: string;
type: BlacklistEntityType;
source: BlacklistSource;
status: BlacklistStatus;
addedAt: string;
}

@Component({
selector: 'okane-admin-compliance-page',
standalone: true,
imports: [
NgClass, NgIcon, UsersPageHeaderComponent, UsersFiltersComponent,
UserStatusBadgeComponent, UserActionsDropdownComponent,
UsersEmptyStateComponent, UsersPlaceholderDialogComponent,
],
providers: [
provideIcons({
lucideCheck, lucideClipboardList, lucideEye, lucideFileText, lucideFlag, lucideHistory,
lucideHourglass, lucideShieldAlert, lucideShieldCheck, lucideShieldX, lucideTriangleAlert,
lucideUserCheck, lucideUserX, lucideXCircle,
}),
],
changeDetection: ChangeDetectionStrategy.OnPush,
template: `
<div class="flex flex-col gap-4">
<okane-users-page-header
eyebrow="Conformite"
title="Compliance / KYC"
description="Superviser les verifications d'identite, alertes AML, transactions suspectes et blacklist."
addLabel="Exporter"
actionIcon="lucideClipboardList"
actionVariant="outline"
(addClicked)="openExport()"
/>

@if (error()) {
<div class="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-destructive transition-colors">
<ng-icon name="lucideTriangleAlert" class="text-base" />
<div class="leading-tight">
<p class="text-xs font-semibold">Donnees partielles</p>
<p class="mt-0.5 text-xs opacity-80">{{ error() }} - affichage avec valeurs par defaut.</p>
</div>
</div>
}

<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
@for (kpi of kpiCards(); track kpi.key) {
<article class="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md">
<span class="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-border/60" [ngClass]="kpi.accent">
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
searchPlaceholder="Rechercher par client, email, telephone..."
[searchValue]="kycSearch()"
[filters]="kycFilterDefs()"
(searchChange)="kycSearch.set($event)"
(filterChange)="onKycFilterChange($event)"
/>

<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
<div class="flex flex-col gap-1 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
<div>
<h2 class="text-base font-semibold text-foreground">Dossiers KYC</h2>
<p class="text-xs text-muted-foreground">{{ filteredKyc().length }} sur {{ totalKyc() }} dossier{{ totalKyc() > 1 ? 's' : '' }}</p>
</div>
</div>
@if (filteredKyc().length === 0) {
<okane-users-empty-state icon="lucideShieldCheck" title="Aucun dossier ne correspond" description="Modifiez la recherche ou les filtres pour afficher des resultats." />
} @else {
<div class="overflow-x-auto">
<table class="min-w-full text-sm">
<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
<tr>
<th class="px-5 py-3 text-left font-medium">Client</th>
<th class="px-5 py-3 text-left font-medium">Email</th>
<th class="px-5 py-3 text-left font-medium">Telephone</th>
<th class="px-5 py-3 text-left font-medium">Piece</th>
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
<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">{{ initials(record.fullName) }}</div>
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
<td class="px-5 py-3"><okane-user-status-badge [label]="kycStatusLabel(record.kycStatus)" [variant]="kycStatusVariant(record.kycStatus)" /></td>
<td class="px-5 py-3"><okane-user-status-badge [label]="riskLabel(record.risk)" [variant]="riskVariant(record.risk)" /></td>
<td class="px-5 py-3 text-muted-foreground">{{ record.submittedAt }}</td>
<td class="px-5 py-3 text-right"><okane-user-actions-dropdown [actions]="kycActions(record)" /></td>
</tr>
}
</tbody>
</table>
</div>
}
</section>

<section class="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-colors">
<div class="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-end md:justify-between">
<div>
<h2 class="text-base font-semibold text-foreground">Alertes AML</h2>
<p class="text-xs text-muted-foreground">{{ filteredAml().length }} sur {{ totalAml() }} alerte{{ totalAml() > 1 ? 's' : '' }}</p>
</div>
<div class="flex flex-wrap items-center gap-2">
<select class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" [value]="amlStatus()" (change)="amlStatus.set(asValue($event))">
<option value="all">Tous statuts</option>
<option value="NEW">Nouvelle</option>
<option value="IN_ANALYSIS">En analyse</option>
<option value="RESOLVED">Resolue</option>
<option value="ESCALATED">Escaladee</option>
</select>
<select class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" [value]="amlRisk()" (change)="amlRisk.set(asValue($event))">
<option value="all">Tous risques</option>
<option value="LOW">Faible</option>
<option value="MEDIUM">Moyen</option>
<option value="HIGH">Eleve</option>
<option value="CRITICAL">Critique</option>
</select>
</div>
</div>
@if (filteredAml().length === 0) {
<okane-users-empty-state icon="lucideTriangleAlert" title="Aucune alerte ne correspond" description="Reinitialisez les filtres pour afficher les alertes AML." />
} @else {
<div class="overflow-x-auto">
<table class="min-w-full text-sm">
<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
<tr>
<th class="px-5 py-3 text-left font-medium">Reference</th>
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
<td class="px-5 py-3 font-mono text-sm font-medium text-foreground">{{ alert.reference }}</td>
<td class="px-5 py-3">
<div class="leading-tight">
<p class="text-foreground">{{ alert.clientName }}</p>
<p class="font-mono text-xs text-muted-foreground">{{ alert.clientId }}</p>
</div>
</td>
<td class="px-5 py-3 text-foreground">{{ amlTypeLabel(alert.type) }}</td>
<td class="px-5 py-3 text-right">
<span class="font-mono text-sm font-medium text-foreground">{{ formatAmount(alert.amount) }}</span>
<span class="ml-1 text-xs text-muted-foreground">{{ alert.currency }}</span>
</td>
<td class="px-5 py-3"><okane-user-status-badge [label]="riskLabel(alert.risk)" [variant]="riskVariant(alert.risk)" /></td>
<td class="px-5 py-3"><okane-user-status-badge [label]="amlStatusLabel(alert.status)" [variant]="amlStatusVariant(alert.status)" /></td>
<td class="px-5 py-3 text-muted-foreground">{{ alert.createdAt }}</td>
<td class="px-5 py-3 text-right"><okane-user-actions-dropdown [actions]="amlActions(alert)" /></td>
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
<p class="text-xs text-muted-foreground">Liste de surveillance interne et OFAC fictive.</p>
</div>
<span class="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
<ng-icon name="lucideUserX" class="text-xs" />
{{ blacklist().length }} entree{{ blacklist().length > 1 ? 's' : '' }}
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
@for (entry of blacklist(); track entry.id) {
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
<td class="px-5 py-3"><span class="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">{{ blacklistTypeLabel(entry.type) }}</span></td>
<td class="px-5 py-3 text-muted-foreground">{{ blacklistSourceLabel(entry.source) }}</td>
<td class="px-5 py-3"><okane-user-status-badge [label]="blacklistStatusLabel(entry.status)" [variant]="blacklistStatusVariant(entry.status)" /></td>
<td class="px-5 py-3 text-muted-foreground">{{ entry.addedAt }}</td>
</tr>
}
</tbody>
</table>
</div>
</section>
</div>

<okane-users-placeholder-dialog [open]="exportDialog()" title="Exporter les dossiers de conformite" (close)="exportDialog.set(false)" />
<okane-users-placeholder-dialog [open]="verifyDialog()" title="Verifier le dossier KYC" (close)="verifyDialog.set(false)" />
<okane-users-placeholder-dialog [open]="rejectDialog()" title="Rejeter le dossier KYC" (close)="rejectDialog.set(false)" />
<okane-users-placeholder-dialog [open]="escalateDialog()" title="Escalader l'alerte AML" (close)="escalateDialog.set(false)" />
`,
})
export class AdminCompliancePageComponent implements OnInit {
private readonly _api = inject(AdminComplianceApiService);

protected readonly kycRecords = signal<KycRow[]>([]);
protected readonly amlAlerts = signal<AmlRow[]>([]);
protected readonly blacklistEntries = signal<BlacklistRow[]>([]);
protected readonly summary = signal<ApiComplianceSummary | null>(null);
protected readonly error = signal<string | null>(null);

protected readonly totalKyc = computed(() => this.kycRecords().length);
protected readonly totalAml = computed(() => this.amlAlerts().length);
protected readonly blacklist = computed(() => this.blacklistEntries());

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
{ key: 'status', label: 'Statut KYC', value: this.kycStatus(), options: [
{ value: 'all', label: 'Tous statuts' }, { value: 'VERIFIED', label: 'Verifie' },
{ value: 'PENDING', label: 'En attente' }, { value: 'REJECTED', label: 'Rejete' }, { value: 'REVIEW', label: 'A revoir' },
]},
{ key: 'risk', label: 'Risque', value: this.kycRisk(), options: [
{ value: 'all', label: 'Tous risques' }, { value: 'LOW', label: 'Faible' },
{ value: 'MEDIUM', label: 'Moyen' }, { value: 'HIGH', label: 'Eleve' }, { value: 'CRITICAL', label: 'Critique' },
]},
{ key: 'country', label: 'Pays', value: this.kycCountry(), options: [
{ value: 'all', label: 'Tous pays' }, ...COMPLIANCE_COUNTRIES.map((c) => ({ value: c.code, label: c.label })),
]},
{ key: 'doc', label: 'Piece', value: this.kycDocument(), options: [
{ value: 'all', label: 'Toutes pieces' }, { value: 'CIN', label: 'CIN' },
{ value: 'PASSPORT', label: 'Passeport' }, { value: 'RESIDENCE', label: 'Carte sejour' }, { value: 'DRIVING', label: 'Permis de conduire' },
]},
]);

protected readonly filteredKyc = computed<KycRow[]>(() => {
const term = this.kycSearch().trim().toLowerCase();
const status = this.kycStatus(); const risk = this.kycRisk();
const country = this.kycCountry(); const doc = this.kycDocument();
return this.kycRecords().filter((r) => {
if (status !== 'all' && r.kycStatus !== status) return false;
if (risk !== 'all' && r.risk !== risk) return false;
if (country !== 'all' && r.countryCode !== country) return false;
if (doc !== 'all' && r.documentType !== doc) return false;
if (!term) return true;
return r.fullName.toLowerCase().includes(term) || r.email.toLowerCase().includes(term) ||
r.phone.toLowerCase().includes(term) || r.clientId.toLowerCase().includes(term) || r.id.toLowerCase().includes(term);
});
});

protected readonly filteredAml = computed<AmlRow[]>(() => {
const status = this.amlStatus(); const risk = this.amlRisk();
return this.amlAlerts().filter((a) => {
if (status !== 'all' && a.status !== status) return false;
if (risk !== 'all' && a.risk !== risk) return false;
return true;
});
});

protected readonly kpiCards = computed(() => {
const s = this.summary();
const v: Record<string, { value: string; suffix: string }> = {
KYC_PENDING: { value: s ? String(s.pendingKyc) : '0', suffix: 'a traiter' },
KYC_VERIFIED: { value: s ? String(s.verifiedKyc) : '0', suffix: 'cumul' },
KYC_REJECTED: { value: s ? String(s.rejectedKyc) : '0', suffix: 'cumul' },
AML_ALERTS: { value: s ? String(s.amlAlerts) : '0', suffix: 'ouvertes' },
SUSPICIOUS_TX: { value: s ? String(s.suspiciousTransactions) : '0', suffix: 'risque eleve/critique' },
BLACKLISTED: { value: s ? String(s.blacklistedClients) : '0', suffix: 'actifs' },
};
return COMPLIANCE_KPIS.map((kpi) => ({ ...kpi, ...v[kpi.key] }));
});

public ngOnInit(): void { this.loadAll(); }

private loadAll(): void {
this.error.set(null);
this._api.listKyc().subscribe({ next: (rows) => this.kycRecords.set(rows.map((r) => this.toKycRow(r))), error: (err) => this.error.set(this.extractMessage(err)) });
this._api.listAmlAlerts().subscribe({ next: (rows) => this.amlAlerts.set(rows.map((r) => this.toAmlRow(r))), error: () => this.amlAlerts.set([]) });
this._api.listBlacklist().subscribe({ next: (rows) => this.blacklistEntries.set(rows.map((r) => this.toBlacklistRow(r))), error: () => this.blacklistEntries.set([]) });
this._api.getSummary().subscribe({ next: (data) => this.summary.set(data), error: () => this.summary.set(null) });
}

private toKycRow(api: ApiKycRecord): KycRow {
return { id: 'KYC-' + api.id, clientId: api.clientId ?? '-', fullName: api.clientName ?? '-',
email: api.email ?? '-', phone: api.phone ?? '-', documentType: this.mapDocType(api.documentType),
documentNumberMasked: api.maskedDocumentNumber ?? '......', country: api.country ?? '-',
countryCode: api.countryCode ?? '-', kycStatus: this.mapKycStatus(api.status),
risk: this.mapRisk(api.riskLevel), submittedAt: api.submittedAt ?? '-' };
}

private toAmlRow(api: ApiAmlAlert): AmlRow {
return { id: 'AML-' + api.id, reference: api.reference ?? 'AML-' + api.id,
clientId: api.clientId ?? '-', clientName: api.clientName ?? '-',
type: this.mapAmlType(api.alertType), amount: Number(api.amount ?? 0),
currency: api.currency ?? 'MAD', risk: this.mapRisk(api.riskLevel),
status: this.mapAmlStatus(api.status), createdAt: api.createdAt ?? '-' };
}

private toBlacklistRow(api: ApiBlacklistEntry): BlacklistRow {
return { id: 'BL-' + api.id, name: api.fullName ?? '-', country: api.country ?? '-',
countryCode: api.countryCode ?? '-', type: this.mapBlacklistType(api.type),
source: this.mapBlacklistSource(api.source), status: this.mapBlacklistStatus(api.status),
addedAt: api.addedAt ?? '-' };
}

private mapKycStatus(s: ApiKycStatus | null | undefined): ComplianceKycStatus {
if (s === 'REVIEW_REQUIRED') return 'REVIEW';
const valid: ComplianceKycStatus[] = ['VERIFIED', 'PENDING', 'REJECTED', 'REVIEW'];
return valid.includes(s as ComplianceKycStatus) ? (s as ComplianceKycStatus) : 'PENDING';
}
private mapRisk(r: ApiRiskLevel | null | undefined): RiskLevel {
const valid: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
return valid.includes(r as RiskLevel) ? (r as RiskLevel) : 'LOW';
}
private mapAmlStatus(s: string | null | undefined): AmlRow['status'] {
const valid = ['NEW', 'IN_ANALYSIS', 'RESOLVED', 'ESCALATED'] as const;
return valid.includes(s as AmlRow['status']) ? (s as AmlRow['status']) : 'NEW';
}
private mapDocType(t: string | null | undefined): string {
return ['CIN', 'PASSPORT', 'RESIDENCE', 'DRIVING'].includes(t ?? '') ? (t as string) : 'CIN';
}
private mapAmlType(t: string | null | undefined): AmlAlertType {
const valid: AmlAlertType[] = ['HIGH_AMOUNT', 'REPEATED_TRANSFERS', 'SENSITIVE_CORRIDOR', 'BLACKLIST_MATCH', 'SUSPICIOUS_PATTERN'];
return valid.includes(t as AmlAlertType) ? (t as AmlAlertType) : 'SUSPICIOUS_PATTERN';
}
private mapBlacklistType(t: string | null | undefined): BlacklistEntityType {
const valid: BlacklistEntityType[] = ['CLIENT', 'BENEFICIARY', 'SENDER', 'ENTITY'];
return valid.includes(t as BlacklistEntityType) ? (t as BlacklistEntityType) : 'ENTITY';
}
private mapBlacklistSource(s: string | null | undefined): BlacklistSource {
const valid: BlacklistSource[] = ['OFAC_FAKE', 'INTERNAL', 'AML_REVIEW'];
return valid.includes(s as BlacklistSource) ? (s as BlacklistSource) : 'INTERNAL';
}
private mapBlacklistStatus(s: string | null | undefined): BlacklistStatus {
const valid: BlacklistStatus[] = ['ACTIVE', 'UNDER_REVIEW', 'CLEARED'];
return valid.includes(s as BlacklistStatus) ? (s as BlacklistStatus) : 'ACTIVE';
}

protected onKycFilterChange(change: { key: string; value: string }): void {
switch (change.key) {
case 'status': this.kycStatus.set(change.value); break;
case 'risk': this.kycRisk.set(change.value); break;
case 'country': this.kycCountry.set(change.value); break;
case 'doc': this.kycDocument.set(change.value); break;
}
}
protected asValue(event: Event): string { return (event.target as HTMLSelectElement).value; }
protected openExport(): void { this.exportDialog.set(true); }
protected initials(name: string): string {
return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}
protected formatAmount(value: number): string {
return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
}
protected documentLabel(type: string): string { return DOCUMENT_LABELS[type as keyof typeof DOCUMENT_LABELS] ?? type; }
protected kycStatusLabel(status: ComplianceKycStatus): string { return COMPLIANCE_KYC_LABELS[status]; }
protected kycStatusVariant(status: ComplianceKycStatus) { return COMPLIANCE_KYC_VARIANTS[status]; }
protected riskLabel(risk: RiskLevel): string { return RISK_LABELS[risk]; }
protected riskVariant(risk: RiskLevel) { return RISK_VARIANTS[risk]; }
protected amlTypeLabel(type: AmlAlertType): string { return AML_TYPE_LABELS[type]; }
protected amlStatusLabel(status: AmlRow['status']): string { return AML_STATUS_LABELS[status]; }
protected amlStatusVariant(status: AmlRow['status']) { return AML_STATUS_VARIANTS[status]; }
protected blacklistTypeLabel(type: BlacklistEntityType): string { return BLACKLIST_TYPE_LABELS[type]; }
protected blacklistSourceLabel(source: BlacklistSource): string { return BLACKLIST_SOURCE_LABELS[source]; }
protected blacklistStatusLabel(status: BlacklistStatus): string { return BLACKLIST_STATUS_LABELS[status]; }
protected blacklistStatusVariant(status: BlacklistStatus) { return BLACKLIST_STATUS_VARIANTS[status]; }

protected kycActions(record: KycRow): UserActionItem[] {
const numId = Number(record.id.replace('KYC-', ''));
const isPending = record.kycStatus === 'PENDING' || record.kycStatus === 'REVIEW';
return [
{ label: 'Voir details', icon: 'lucideEye', action: () => this._api.getKyc(numId).subscribe({ next: () => {}, error: () => {} }) },
...(isPending ? [
{ label: 'Verifier', icon: 'lucideCheck', action: () => this._api.verifyKyc(numId).subscribe({
next: (u) => { this.kycRecords.update((rows) => rows.map((r) => r.id === record.id ? { ...r, kycStatus: this.mapKycStatus(u.status) } : r)); this.verifyDialog.set(true); this.refreshSummary(); },
error: () => this.verifyDialog.set(true),
})},
{ label: 'Rejeter', icon: 'lucideXCircle', action: () => this._api.rejectKyc(numId, 'Document invalide').subscribe({
next: (u) => { this.kycRecords.update((rows) => rows.map((r) => r.id === record.id ? { ...r, kycStatus: this.mapKycStatus(u.status) } : r)); this.rejectDialog.set(true); this.refreshSummary(); },
error: () => this.rejectDialog.set(true),
}), variant: 'destructive' as const },
] : []),
{ label: 'Voir documents', icon: 'lucideFileText', action: () => {} },
{ label: 'Voir historique', icon: 'lucideHistory', action: () => {} },
];
}

protected amlActions(alert: AmlRow): UserActionItem[] {
const numId = Number(alert.id.replace('AML-', ''));
const canEscalate = alert.status !== 'ESCALATED' && alert.status !== 'RESOLVED';
const canResolve = alert.status !== 'RESOLVED';
return [
{ label: 'Voir details', icon: 'lucideEye', action: () => this._api.getAmlAlert(numId).subscribe({ next: () => {}, error: () => {} }) },
{ label: 'Voir historique', icon: 'lucideHistory', action: () => {} },
...(canResolve ? [{ label: 'Marquer resolue', icon: 'lucideCheck', action: () => this._api.changeAmlStatus(numId, 'RESOLVED').subscribe({
next: (u) => { this.amlAlerts.update((rows) => rows.map((r) => r.id === alert.id ? { ...r, status: this.mapAmlStatus(u.status) } : r)); this.refreshSummary(); },
error: () => {},
})}] : []),
...(canEscalate ? [{ label: 'Escalader', icon: 'lucideFlag', action: () => this._api.changeAmlStatus(numId, 'ESCALATED').subscribe({
next: (u) => { this.amlAlerts.update((rows) => rows.map((r) => r.id === alert.id ? { ...r, status: this.mapAmlStatus(u.status) } : r)); this.escalateDialog.set(true); this.refreshSummary(); },
error: () => this.escalateDialog.set(true),
}), variant: 'destructive' as const }] : []),
];
}

private refreshSummary(): void {
this._api.getSummary().subscribe({ next: (data) => this.summary.set(data), error: () => {} });
}
private extractMessage(err: unknown): string {
const fallback = 'Erreur reseau. Verifiez votre connexion ou votre session.';
if (typeof err === 'object' && err !== null) {
const e = err as { error?: { message?: string }; message?: string };
return e.error?.message ?? e.message ?? fallback;
}
return fallback;
}
}
