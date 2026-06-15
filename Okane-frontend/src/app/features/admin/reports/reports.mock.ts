import type { StatusVariant } from '../users/shared/user-status.types';

export type ReportType =
	| 'FINANCIAL'
	| 'TRANSFERS'
	| 'COMMISSIONS'
	| 'AGENCIES'
	| 'COMPLIANCE'
	| 'USERS';

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
	FINANCIAL: 'Financier',
	TRANSFERS: 'Transferts',
	COMMISSIONS: 'Commissions',
	AGENCIES: 'Agences',
	COMPLIANCE: 'Conformité',
	USERS: 'Utilisateurs',
};

export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
	DAILY: "Aujourd'hui",
	WEEKLY: 'Cette semaine',
	MONTHLY: 'Ce mois',
	YEARLY: 'Cette année',
	CUSTOM: 'Période personnalisée',
};

export type ReportStatus = 'AVAILABLE' | 'PREPARING' | 'ARCHIVED';

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
	AVAILABLE: 'Disponible',
	PREPARING: 'En préparation',
	ARCHIVED: 'Archivé',
};

export const REPORT_STATUS_VARIANTS: Record<ReportStatus, StatusVariant> = {
	AVAILABLE: 'success',
	PREPARING: 'warning',
	ARCHIVED: 'muted',
};

export type ReportCurrency = 'MAD' | 'EUR' | 'USD' | 'XOF';

export interface AgencyRef {
	code: string;
	name: string;
}

export const REPORT_AGENCIES: AgencyRef[] = [
	{ code: 'AG-CASA-01', name: 'Casablanca Centre' },
	{ code: 'AG-MRK-03', name: 'Marrakech Guéliz' },
	{ code: 'AG-RBT-02', name: 'Rabat Agdal' },
	{ code: 'AG-TNG-04', name: 'Tanger Ville' },
	{ code: 'AG-DKR-07', name: 'Dakar Plateau' },
];

export const REPORT_COUNTRIES = [
	{ code: 'MA', label: 'Maroc' },
	{ code: 'FR', label: 'France' },
	{ code: 'ES', label: 'Espagne' },
	{ code: 'SN', label: 'Sénégal' },
	{ code: 'CI', label: "Côte d'Ivoire" },
];

export interface ReportRow {
	id: string;
	name: string;
	type: ReportType;
	period: ReportPeriod;
	periodRange: string;
	agency: AgencyRef | null;
	countryCode: string | 'ALL';
	country: string;
	currency: ReportCurrency | 'MULTI';
	status: ReportStatus;
	generatedAt: string;
	owner: string;
}

export const REPORTS_MOCK: ReportRow[] = [
	{
		id: 'RPT-9001',
		name: 'Rapport financier mensuel - Mai 2026',
		type: 'FINANCIAL',
		period: 'MONTHLY',
		periodRange: '01/05/2026 → 31/05/2026',
		agency: null,
		countryCode: 'ALL',
		country: 'Tous',
		currency: 'MULTI',
		status: 'AVAILABLE',
		generatedAt: '2026-05-23 06:00',
		owner: 'Sara El Idrissi',
	},
	{
		id: 'RPT-9002',
		name: 'Rapport transferts journaliers',
		type: 'TRANSFERS',
		period: 'DAILY',
		periodRange: '22/05/2026',
		agency: null,
		countryCode: 'ALL',
		country: 'Tous',
		currency: 'MULTI',
		status: 'AVAILABLE',
		generatedAt: '2026-05-23 04:30',
		owner: 'Système',
	},
	{
		id: 'RPT-9003',
		name: 'Rapport commissions agences - Casablanca Centre',
		type: 'COMMISSIONS',
		period: 'MONTHLY',
		periodRange: '01/05/2026 → 31/05/2026',
		agency: REPORT_AGENCIES[0],
		countryCode: 'MA',
		country: 'Maroc',
		currency: 'MAD',
		status: 'AVAILABLE',
		generatedAt: '2026-05-23 05:12',
		owner: 'Sara El Idrissi',
	},
	{
		id: 'RPT-9004',
		name: 'Rapport conformité AML - Mai 2026',
		type: 'COMPLIANCE',
		period: 'MONTHLY',
		periodRange: '01/05/2026 → 31/05/2026',
		agency: null,
		countryCode: 'ALL',
		country: 'Tous',
		currency: 'MULTI',
		status: 'PREPARING',
		generatedAt: '2026-05-23 02:00',
		owner: 'Hicham Bennani',
	},
	{
		id: 'RPT-9005',
		name: 'Rapport performance agences - Q2 2026',
		type: 'AGENCIES',
		period: 'CUSTOM',
		periodRange: '01/04/2026 → 30/06/2026',
		agency: null,
		countryCode: 'ALL',
		country: 'Tous',
		currency: 'MULTI',
		status: 'PREPARING',
		generatedAt: '2026-05-22 22:18',
		owner: 'Sara El Idrissi',
	},
	{
		id: 'RPT-9006',
		name: 'Rapport utilisateurs actifs - Mai 2026',
		type: 'USERS',
		period: 'MONTHLY',
		periodRange: '01/05/2026 → 31/05/2026',
		agency: null,
		countryCode: 'ALL',
		country: 'Tous',
		currency: 'MULTI',
		status: 'AVAILABLE',
		generatedAt: '2026-05-22 21:45',
		owner: 'Système',
	},
	{
		id: 'RPT-9007',
		name: 'Rapport transferts - Marrakech Guéliz',
		type: 'TRANSFERS',
		period: 'WEEKLY',
		periodRange: '16/05/2026 → 22/05/2026',
		agency: REPORT_AGENCIES[1],
		countryCode: 'MA',
		country: 'Maroc',
		currency: 'MAD',
		status: 'AVAILABLE',
		generatedAt: '2026-05-23 03:08',
		owner: 'Système',
	},
	{
		id: 'RPT-9008',
		name: 'Rapport commissions - Dakar Plateau',
		type: 'COMMISSIONS',
		period: 'MONTHLY',
		periodRange: '01/05/2026 → 31/05/2026',
		agency: REPORT_AGENCIES[4],
		countryCode: 'SN',
		country: 'Sénégal',
		currency: 'XOF',
		status: 'AVAILABLE',
		generatedAt: '2026-05-23 05:42',
		owner: 'Sara El Idrissi',
	},
	{
		id: 'RPT-9009',
		name: 'Rapport financier annuel - 2025',
		type: 'FINANCIAL',
		period: 'YEARLY',
		periodRange: '01/01/2025 → 31/12/2025',
		agency: null,
		countryCode: 'ALL',
		country: 'Tous',
		currency: 'MULTI',
		status: 'ARCHIVED',
		generatedAt: '2026-01-15 10:00',
		owner: 'Sara El Idrissi',
	},
	{
		id: 'RPT-9010',
		name: 'Rapport conformité - Q1 2026',
		type: 'COMPLIANCE',
		period: 'CUSTOM',
		periodRange: '01/01/2026 → 31/03/2026',
		agency: null,
		countryCode: 'ALL',
		country: 'Tous',
		currency: 'MULTI',
		status: 'ARCHIVED',
		generatedAt: '2026-04-08 09:30',
		owner: 'Hicham Bennani',
	},
];

export interface ReportKpi {
	key: string;
	label: string;
	icon: string;
	accent: string;
	trend?: 'up' | 'down' | 'neutral';
}

export const REPORT_KPIS: ReportKpi[] = [
	{ key: 'DAILY_VOLUME', label: 'Volume journalier', icon: 'lucideArrowRightLeft', accent: 'bg-primary/10 text-primary', trend: 'up' },
	{ key: 'MONTHLY_VOLUME', label: 'Volume mensuel', icon: 'lucideBarChart3', accent: 'bg-secondary/50 text-secondary-foreground', trend: 'up' },
	{ key: 'REVENUE', label: 'Chiffre d\u2019affaires', icon: 'lucideCoins', accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300', trend: 'up' },
	{ key: 'COMMISSIONS', label: 'Commissions totales', icon: 'lucideLandmark', accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-300', trend: 'up' },
	{ key: 'SUCCESS', label: 'Transferts réussis', icon: 'lucideBadgeCheck', accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300', trend: 'up' },
	{ key: 'FAILURE_RATE', label: 'Taux d\u2019échec', icon: 'lucideTriangleAlert', accent: 'bg-destructive/10 text-destructive', trend: 'down' },
];

export const REPORT_KPI_VALUES: Record<string, { value: string; change: string }> = {
	DAILY_VOLUME: { value: '2 346', change: '+12,9%' },
	MONTHLY_VOLUME: { value: '38,4M MAD', change: '+9,8%' },
	REVENUE: { value: '4,82M MAD', change: '+15,7%' },
	COMMISSIONS: { value: '1,18M MAD', change: '+8,3%' },
	SUCCESS: { value: '97,4%', change: '+0,4%' },
	FAILURE_RATE: { value: '2,6%', change: '-0,3%' },
};

export interface VolumeBucket {
	label: string;
	value: number;
}

export const VOLUME_TREND_MOCK: VolumeBucket[] = [
	{ label: 'Lun', value: 42 },
	{ label: 'Mar', value: 58 },
	{ label: 'Mer', value: 51 },
	{ label: 'Jeu', value: 73 },
	{ label: 'Ven', value: 89 },
	{ label: 'Sam', value: 64 },
	{ label: 'Dim', value: 48 },
];

export interface RevenueBucket {
	label: string;
	revenue: number;
	commission: number;
}

export const REVENUE_TREND_MOCK: RevenueBucket[] = [
	{ label: 'Jan', revenue: 78, commission: 22 },
	{ label: 'Fév', revenue: 84, commission: 26 },
	{ label: 'Mar', revenue: 92, commission: 28 },
	{ label: 'Avr', revenue: 88, commission: 27 },
	{ label: 'Mai', revenue: 96, commission: 31 },
];

export interface AgencyPerformance {
	agency: AgencyRef;
	volume: number;
	transfers: number;
	currency: ReportCurrency;
	share: number;
}

export const AGENCY_PERFORMANCE_MOCK: AgencyPerformance[] = [
	{ agency: REPORT_AGENCIES[0], volume: 12_400_000, transfers: 1840, currency: 'MAD', share: 32 },
	{ agency: REPORT_AGENCIES[1], volume: 6_780_000, transfers: 920, currency: 'MAD', share: 18 },
	{ agency: REPORT_AGENCIES[2], volume: 8_220_000, transfers: 1130, currency: 'MAD', share: 22 },
	{ agency: REPORT_AGENCIES[3], volume: 4_180_000, transfers: 640, currency: 'MAD', share: 11 },
	{ agency: REPORT_AGENCIES[4], volume: 28_400_000, transfers: 1480, currency: 'XOF', share: 17 },
];

export interface StatusDistribution {
	label: string;
	count: number;
	share: number;
	accent: string;
}

export const STATUS_DISTRIBUTION_MOCK: StatusDistribution[] = [
	{ label: 'Payés', count: 1842, share: 78, accent: 'bg-emerald-500/70 dark:bg-emerald-400/70' },
	{ label: 'En attente', count: 312, share: 13, accent: 'bg-amber-500/70 dark:bg-amber-400/70' },
	{ label: 'Annulés', count: 78, share: 4, accent: 'bg-muted-foreground/40' },
	{ label: 'Expirés', count: 92, share: 3, accent: 'bg-sky-500/70 dark:bg-sky-400/70' },
	{ label: 'Suspects', count: 22, share: 2, accent: 'bg-destructive/70' },
];
