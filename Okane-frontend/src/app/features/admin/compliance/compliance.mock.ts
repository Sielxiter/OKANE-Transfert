import type { StatusVariant } from '../users/shared/user-status.types';

export type ComplianceKycStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'REVIEW';

export const COMPLIANCE_KYC_LABELS: Record<ComplianceKycStatus, string> = {
	VERIFIED: 'Vérifié',
	PENDING: 'En attente',
	REJECTED: 'Rejeté',
	REVIEW: 'À revoir',
};

export const COMPLIANCE_KYC_VARIANTS: Record<ComplianceKycStatus, StatusVariant> = {
	VERIFIED: 'success',
	PENDING: 'warning',
	REJECTED: 'destructive',
	REVIEW: 'info',
};

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const RISK_LABELS: Record<RiskLevel, string> = {
	LOW: 'Faible',
	MEDIUM: 'Moyen',
	HIGH: 'Élevé',
	CRITICAL: 'Critique',
};

export const RISK_VARIANTS: Record<RiskLevel, StatusVariant> = {
	LOW: 'success',
	MEDIUM: 'info',
	HIGH: 'warning',
	CRITICAL: 'destructive',
};

export type DocumentType = 'CIN' | 'PASSPORT' | 'RESIDENCE' | 'DRIVING';

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
	CIN: 'CIN',
	PASSPORT: 'Passeport',
	RESIDENCE: 'Carte séjour',
	DRIVING: 'Permis de conduire',
};

export interface KycRecord {
	id: string;
	clientId: string;
	fullName: string;
	email: string;
	phone: string;
	documentType: DocumentType;
	documentNumberMasked: string;
	country: string;
	countryCode: string;
	kycStatus: ComplianceKycStatus;
	risk: RiskLevel;
	submittedAt: string;
}

export const COMPLIANCE_COUNTRIES = [
	{ code: 'MA', label: 'Maroc' },
	{ code: 'FR', label: 'France' },
	{ code: 'ES', label: 'Espagne' },
	{ code: 'SN', label: 'Sénégal' },
	{ code: 'CI', label: "Côte d'Ivoire" },
	{ code: 'US', label: 'États-Unis' },
	{ code: 'NG', label: 'Nigéria' },
];

export const KYC_RECORDS_MOCK: KycRecord[] = [
	{
		id: 'KYC-1001',
		clientId: 'CL-1001',
		fullName: 'Yassine El Alaoui',
		email: 'yassine.elalaoui@okane.test',
		phone: '+212 6 12 45 78 90',
		documentType: 'CIN',
		documentNumberMasked: 'AB••••12',
		country: 'Maroc',
		countryCode: 'MA',
		kycStatus: 'VERIFIED',
		risk: 'LOW',
		submittedAt: '2025-11-04 10:18',
	},
	{
		id: 'KYC-1002',
		clientId: 'CL-1002',
		fullName: 'Salma Bouzid',
		email: 'salma.bouzid@okane.test',
		phone: '+212 6 33 21 09 87',
		documentType: 'CIN',
		documentNumberMasked: 'BK••••34',
		country: 'Maroc',
		countryCode: 'MA',
		kycStatus: 'PENDING',
		risk: 'MEDIUM',
		submittedAt: '2026-01-12 09:42',
	},
	{
		id: 'KYC-1003',
		clientId: 'CL-1003',
		fullName: 'Mehdi Tazi',
		email: 'mehdi.tazi@okane.test',
		phone: '+212 6 70 12 88 33',
		documentType: 'PASSPORT',
		documentNumberMasked: 'MA••••88',
		country: 'Maroc',
		countryCode: 'MA',
		kycStatus: 'REJECTED',
		risk: 'CRITICAL',
		submittedAt: '2025-09-21 14:55',
	},
	{
		id: 'KYC-1004',
		clientId: 'CL-1004',
		fullName: 'Amélie Laurent',
		email: 'amelie.laurent@okane.test',
		phone: '+33 6 24 18 52 41',
		documentType: 'PASSPORT',
		documentNumberMasked: 'FR••••12',
		country: 'France',
		countryCode: 'FR',
		kycStatus: 'VERIFIED',
		risk: 'LOW',
		submittedAt: '2025-12-02 11:30',
	},
	{
		id: 'KYC-1005',
		clientId: 'CL-1005',
		fullName: 'Ibrahim Ndiaye',
		email: 'ibrahim.ndiaye@okane.test',
		phone: '+221 77 654 22 11',
		documentType: 'PASSPORT',
		documentNumberMasked: 'SN••••44',
		country: 'Sénégal',
		countryCode: 'SN',
		kycStatus: 'REVIEW',
		risk: 'HIGH',
		submittedAt: '2026-02-18 17:08',
	},
	{
		id: 'KYC-1006',
		clientId: 'CL-1006',
		fullName: 'Daniela Costa',
		email: 'daniela.costa@okane.test',
		phone: '+351 91 233 41 22',
		documentType: 'RESIDENCE',
		documentNumberMasked: 'PT••••76',
		country: 'France',
		countryCode: 'FR',
		kycStatus: 'PENDING',
		risk: 'MEDIUM',
		submittedAt: '2026-03-09 13:24',
	},
	{
		id: 'KYC-1007',
		clientId: 'CL-1007',
		fullName: 'James Carter',
		email: 'james.carter@okane.test',
		phone: '+1 415 998 22 31',
		documentType: 'PASSPORT',
		documentNumberMasked: 'US••••03',
		country: 'États-Unis',
		countryCode: 'US',
		kycStatus: 'VERIFIED',
		risk: 'LOW',
		submittedAt: '2026-04-14 19:01',
	},
	{
		id: 'KYC-1008',
		clientId: 'CL-1008',
		fullName: 'Aïcha Diallo',
		email: 'aicha.diallo@okane.test',
		phone: '+225 07 88 23 41 90',
		documentType: 'CIN',
		documentNumberMasked: 'CI••••55',
		country: "Côte d'Ivoire",
		countryCode: 'CI',
		kycStatus: 'REVIEW',
		risk: 'HIGH',
		submittedAt: '2026-05-01 08:46',
	},
	{
		id: 'KYC-1009',
		clientId: 'CL-1009',
		fullName: 'Lucia Hernandez',
		email: 'lucia.hernandez@okane.test',
		phone: '+34 612 873 442',
		documentType: 'CIN',
		documentNumberMasked: 'ES••••29',
		country: 'Espagne',
		countryCode: 'ES',
		kycStatus: 'PENDING',
		risk: 'LOW',
		submittedAt: '2026-05-12 16:35',
	},
	{
		id: 'KYC-1010',
		clientId: 'CL-1010',
		fullName: 'Omar Diop',
		email: 'omar.diop@okane.test',
		phone: '+221 78 414 23 88',
		documentType: 'PASSPORT',
		documentNumberMasked: 'SN••••91',
		country: 'Sénégal',
		countryCode: 'SN',
		kycStatus: 'REJECTED',
		risk: 'CRITICAL',
		submittedAt: '2026-04-28 11:55',
	},
];

export type AmlAlertType =
	| 'HIGH_AMOUNT'
	| 'REPEATED_TRANSFERS'
	| 'SENSITIVE_CORRIDOR'
	| 'BLACKLIST_MATCH'
	| 'SUSPICIOUS_PATTERN';

export const AML_TYPE_LABELS: Record<AmlAlertType, string> = {
	HIGH_AMOUNT: 'Montant élevé',
	REPEATED_TRANSFERS: 'Transferts répétés',
	SENSITIVE_CORRIDOR: 'Corridor sensible',
	BLACKLIST_MATCH: 'Blacklist match',
	SUSPICIOUS_PATTERN: 'Pattern suspect',
};

export type AmlStatus = 'NEW' | 'IN_ANALYSIS' | 'RESOLVED' | 'ESCALATED';

export const AML_STATUS_LABELS: Record<AmlStatus, string> = {
	NEW: 'Nouvelle',
	IN_ANALYSIS: 'En analyse',
	RESOLVED: 'Résolue',
	ESCALATED: 'Escaladée',
};

export const AML_STATUS_VARIANTS: Record<AmlStatus, StatusVariant> = {
	NEW: 'warning',
	IN_ANALYSIS: 'info',
	RESOLVED: 'success',
	ESCALATED: 'destructive',
};

export interface AmlAlert {
	id: string;
	reference: string;
	clientId: string;
	clientName: string;
	type: AmlAlertType;
	amount: number;
	currency: 'MAD' | 'EUR' | 'USD' | 'XOF';
	risk: RiskLevel;
	status: AmlStatus;
	createdAt: string;
}

export const AML_ALERTS_MOCK: AmlAlert[] = [
	{
		id: 'AML-7001',
		reference: 'AML-7001',
		clientId: 'CL-1003',
		clientName: 'Mehdi Tazi',
		type: 'HIGH_AMOUNT',
		amount: 95000,
		currency: 'MAD',
		risk: 'CRITICAL',
		status: 'NEW',
		createdAt: '2026-05-22 09:14',
	},
	{
		id: 'AML-7002',
		reference: 'AML-7002',
		clientId: 'CL-1005',
		clientName: 'Ibrahim Ndiaye',
		type: 'REPEATED_TRANSFERS',
		amount: 28500,
		currency: 'MAD',
		risk: 'HIGH',
		status: 'IN_ANALYSIS',
		createdAt: '2026-05-22 10:48',
	},
	{
		id: 'AML-7003',
		reference: 'AML-7003',
		clientId: 'CL-1010',
		clientName: 'Omar Diop',
		type: 'BLACKLIST_MATCH',
		amount: 12000,
		currency: 'MAD',
		risk: 'CRITICAL',
		status: 'ESCALATED',
		createdAt: '2026-05-21 18:02',
	},
	{
		id: 'AML-7004',
		reference: 'AML-7004',
		clientId: 'CL-1008',
		clientName: 'Aïcha Diallo',
		type: 'SENSITIVE_CORRIDOR',
		amount: 4200,
		currency: 'EUR',
		risk: 'MEDIUM',
		status: 'IN_ANALYSIS',
		createdAt: '2026-05-22 07:35',
	},
	{
		id: 'AML-7005',
		reference: 'AML-7005',
		clientId: 'CL-1002',
		clientName: 'Salma Bouzid',
		type: 'SUSPICIOUS_PATTERN',
		amount: 6800,
		currency: 'MAD',
		risk: 'HIGH',
		status: 'NEW',
		createdAt: '2026-05-22 11:20',
	},
	{
		id: 'AML-7006',
		reference: 'AML-7006',
		clientId: 'CL-1006',
		clientName: 'Daniela Costa',
		type: 'HIGH_AMOUNT',
		amount: 7200,
		currency: 'EUR',
		risk: 'MEDIUM',
		status: 'RESOLVED',
		createdAt: '2026-05-19 16:08',
	},
];

export type BlacklistEntityType = 'CLIENT' | 'BENEFICIARY' | 'SENDER' | 'ENTITY';

export const BLACKLIST_TYPE_LABELS: Record<BlacklistEntityType, string> = {
	CLIENT: 'Client',
	BENEFICIARY: 'Bénéficiaire',
	SENDER: 'Expéditeur',
	ENTITY: 'Entité',
};

export type BlacklistSource = 'OFAC_FAKE' | 'INTERNAL' | 'AML_REVIEW';

export const BLACKLIST_SOURCE_LABELS: Record<BlacklistSource, string> = {
	OFAC_FAKE: 'OFAC fictive',
	INTERNAL: 'Interne',
	AML_REVIEW: 'AML Review',
};

export type BlacklistStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'CLEARED';

export const BLACKLIST_STATUS_LABELS: Record<BlacklistStatus, string> = {
	ACTIVE: 'Active',
	UNDER_REVIEW: 'En revue',
	CLEARED: 'Levée',
};

export const BLACKLIST_STATUS_VARIANTS: Record<BlacklistStatus, StatusVariant> = {
	ACTIVE: 'destructive',
	UNDER_REVIEW: 'warning',
	CLEARED: 'muted',
};

export interface BlacklistEntry {
	id: string;
	name: string;
	country: string;
	countryCode: string;
	type: BlacklistEntityType;
	source: BlacklistSource;
	status: BlacklistStatus;
	addedAt: string;
}

export const BLACKLIST_MOCK: BlacklistEntry[] = [
	{
		id: 'BL-001',
		name: 'Société Fictive Alpha',
		country: 'Nigéria',
		countryCode: 'NG',
		type: 'ENTITY',
		source: 'OFAC_FAKE',
		status: 'ACTIVE',
		addedAt: '2025-08-12',
	},
	{
		id: 'BL-002',
		name: 'Omar Diop',
		country: 'Sénégal',
		countryCode: 'SN',
		type: 'CLIENT',
		source: 'AML_REVIEW',
		status: 'ACTIVE',
		addedAt: '2026-04-28',
	},
	{
		id: 'BL-003',
		name: 'John D. Mock',
		country: 'États-Unis',
		countryCode: 'US',
		type: 'BENEFICIARY',
		source: 'OFAC_FAKE',
		status: 'UNDER_REVIEW',
		addedAt: '2026-05-10',
	},
	{
		id: 'BL-004',
		name: 'Anonyme Réseau X',
		country: "Côte d'Ivoire",
		countryCode: 'CI',
		type: 'SENDER',
		source: 'INTERNAL',
		status: 'ACTIVE',
		addedAt: '2026-03-22',
	},
	{
		id: 'BL-005',
		name: 'Mock Trader Co.',
		country: 'France',
		countryCode: 'FR',
		type: 'ENTITY',
		source: 'INTERNAL',
		status: 'CLEARED',
		addedAt: '2025-12-05',
	},
];

export interface ComplianceKpi {
	key: string;
	label: string;
	icon: string;
	accent: string;
}

export const COMPLIANCE_KPIS: ComplianceKpi[] = [
	{ key: 'KYC_PENDING', label: 'KYC en attente', icon: 'lucideHourglass', accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
	{ key: 'KYC_VERIFIED', label: 'KYC vérifiés', icon: 'lucideShieldCheck', accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
	{ key: 'KYC_REJECTED', label: 'KYC rejetés', icon: 'lucideShieldX', accent: 'bg-destructive/10 text-destructive' },
	{ key: 'AML_ALERTS', label: 'Alertes AML', icon: 'lucideTriangleAlert', accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
	{ key: 'SUSPICIOUS_TX', label: 'Transactions suspectes', icon: 'lucideShieldAlert', accent: 'bg-destructive/10 text-destructive' },
	{ key: 'BLACKLISTED', label: 'Blacklistés', icon: 'lucideUserX', accent: 'bg-secondary/50 text-secondary-foreground' },
];
