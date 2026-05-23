import type { StatusVariant } from '../users/shared/user-status.types';

export type CurrencyStatus = 'ACTIVE' | 'SUSPENDED';

export const CURRENCY_STATUS_LABELS: Record<CurrencyStatus, string> = {
	ACTIVE: 'Active',
	SUSPENDED: 'Suspendue',
};

export const CURRENCY_STATUS_VARIANTS: Record<CurrencyStatus, StatusVariant> = {
	ACTIVE: 'success',
	SUSPENDED: 'destructive',
};

export interface Currency {
	code: string;
	name: string;
	mainCountry: string;
	mainCountryCode: string;
	symbol: string;
	rateToMad: number;
	status: CurrencyStatus;
	updatedAt: string;
}

export const CURRENCIES_MOCK: Currency[] = [
	{
		code: 'MAD',
		name: 'Dirham marocain',
		mainCountry: 'Maroc',
		mainCountryCode: 'MA',
		symbol: 'د.م.',
		rateToMad: 1,
		status: 'ACTIVE',
		updatedAt: '2026-05-23 08:00',
	},
	{
		code: 'EUR',
		name: 'Euro',
		mainCountry: 'Union européenne',
		mainCountryCode: 'EU',
		symbol: '€',
		rateToMad: 10.92,
		status: 'ACTIVE',
		updatedAt: '2026-05-23 08:00',
	},
	{
		code: 'USD',
		name: 'Dollar américain',
		mainCountry: 'États-Unis',
		mainCountryCode: 'US',
		symbol: '$',
		rateToMad: 9.84,
		status: 'ACTIVE',
		updatedAt: '2026-05-23 08:00',
	},
	{
		code: 'GBP',
		name: 'Livre sterling',
		mainCountry: 'Royaume-Uni',
		mainCountryCode: 'GB',
		symbol: '£',
		rateToMad: 12.65,
		status: 'ACTIVE',
		updatedAt: '2026-05-23 07:55',
	},
	{
		code: 'XOF',
		name: 'Franc CFA (UEMOA)',
		mainCountry: 'Sénégal',
		mainCountryCode: 'SN',
		symbol: 'CFA',
		rateToMad: 0.0166,
		status: 'ACTIVE',
		updatedAt: '2026-05-22 18:30',
	},
	{
		code: 'CHF',
		name: 'Franc suisse',
		mainCountry: 'Suisse',
		mainCountryCode: 'CH',
		symbol: 'CHF',
		rateToMad: 11.04,
		status: 'SUSPENDED',
		updatedAt: '2026-04-12 14:20',
	},
	{
		code: 'AED',
		name: 'Dirham émirati',
		mainCountry: 'Émirats arabes unis',
		mainCountryCode: 'AE',
		symbol: 'د.إ',
		rateToMad: 2.68,
		status: 'ACTIVE',
		updatedAt: '2026-05-23 08:00',
	},
];

export type CorridorStatus = 'ACTIVE' | 'DISABLED' | 'IN_REVIEW';

export const CORRIDOR_STATUS_LABELS: Record<CorridorStatus, string> = {
	ACTIVE: 'Actif',
	DISABLED: 'Désactivé',
	IN_REVIEW: 'En révision',
};

export const CORRIDOR_STATUS_VARIANTS: Record<CorridorStatus, StatusVariant> = {
	ACTIVE: 'success',
	DISABLED: 'muted',
	IN_REVIEW: 'warning',
};

export interface Corridor {
	id: string;
	sourceCountry: string;
	sourceCountryCode: string;
	destCountry: string;
	destCountryCode: string;
	sourceCurrency: string;
	destCurrency: string;
	estimatedFee: string;
	status: CorridorStatus;
}

export const CORRIDORS_MOCK: Corridor[] = [
	{
		id: 'COR-MA-SN',
		sourceCountry: 'Maroc',
		sourceCountryCode: 'MA',
		destCountry: 'Sénégal',
		destCountryCode: 'SN',
		sourceCurrency: 'MAD',
		destCurrency: 'XOF',
		estimatedFee: '1,5%',
		status: 'ACTIVE',
	},
	{
		id: 'COR-MA-FR',
		sourceCountry: 'Maroc',
		sourceCountryCode: 'MA',
		destCountry: 'France',
		destCountryCode: 'FR',
		sourceCurrency: 'MAD',
		destCurrency: 'EUR',
		estimatedFee: '1,2%',
		status: 'ACTIVE',
	},
	{
		id: 'COR-FR-MA',
		sourceCountry: 'France',
		sourceCountryCode: 'FR',
		destCountry: 'Maroc',
		destCountryCode: 'MA',
		sourceCurrency: 'EUR',
		destCurrency: 'MAD',
		estimatedFee: '1,2%',
		status: 'ACTIVE',
	},
	{
		id: 'COR-ES-MA',
		sourceCountry: 'Espagne',
		sourceCountryCode: 'ES',
		destCountry: 'Maroc',
		destCountryCode: 'MA',
		sourceCurrency: 'EUR',
		destCurrency: 'MAD',
		estimatedFee: '1,3%',
		status: 'IN_REVIEW',
	},
	{
		id: 'COR-MA-CI',
		sourceCountry: 'Maroc',
		sourceCountryCode: 'MA',
		destCountry: "Côte d'Ivoire",
		destCountryCode: 'CI',
		sourceCurrency: 'MAD',
		destCurrency: 'XOF',
		estimatedFee: '1,6%',
		status: 'ACTIVE',
	},
	{
		id: 'COR-MA-AE',
		sourceCountry: 'Maroc',
		sourceCountryCode: 'MA',
		destCountry: 'Émirats arabes unis',
		destCountryCode: 'AE',
		sourceCurrency: 'MAD',
		destCurrency: 'AED',
		estimatedFee: '1,4%',
		status: 'DISABLED',
	},
];

export interface FxHistoryEntry {
	id: string;
	currency: string;
	previousRate: number;
	newRate: number;
	changedAt: string;
	changedBy: string;
}

export const FX_HISTORY_MOCK: FxHistoryEntry[] = [
	{
		id: 'FX-1',
		currency: 'EUR',
		previousRate: 10.88,
		newRate: 10.92,
		changedAt: '2026-05-23 08:00',
		changedBy: 'Sara El Idrissi',
	},
	{
		id: 'FX-2',
		currency: 'USD',
		previousRate: 9.78,
		newRate: 9.84,
		changedAt: '2026-05-23 08:00',
		changedBy: 'Sara El Idrissi',
	},
	{
		id: 'FX-3',
		currency: 'GBP',
		previousRate: 12.71,
		newRate: 12.65,
		changedAt: '2026-05-23 07:55',
		changedBy: 'Hicham Bennani',
	},
	{
		id: 'FX-4',
		currency: 'XOF',
		previousRate: 0.0164,
		newRate: 0.0166,
		changedAt: '2026-05-22 18:30',
		changedBy: 'Hicham Bennani',
	},
	{
		id: 'FX-5',
		currency: 'AED',
		previousRate: 2.7,
		newRate: 2.68,
		changedAt: '2026-05-23 08:00',
		changedBy: 'Sara El Idrissi',
	},
	{
		id: 'FX-6',
		currency: 'EUR',
		previousRate: 10.95,
		newRate: 10.88,
		changedAt: '2026-05-22 08:00',
		changedBy: 'Sara El Idrissi',
	},
];

export const CURRENCY_COUNTRIES = Array.from(
	new Map(CURRENCIES_MOCK.map((c) => [c.mainCountryCode, { code: c.mainCountryCode, label: c.mainCountry }])).values(),
);

export const CORRIDOR_SOURCE_COUNTRIES = Array.from(
	new Map(CORRIDORS_MOCK.map((c) => [c.sourceCountryCode, { code: c.sourceCountryCode, label: c.sourceCountry }])).values(),
);

export const CORRIDOR_DEST_COUNTRIES = Array.from(
	new Map(CORRIDORS_MOCK.map((c) => [c.destCountryCode, { code: c.destCountryCode, label: c.destCountry }])).values(),
);

export interface CurrencyKpi {
	key: string;
	label: string;
	icon: string;
	accent: string;
}

export const CURRENCY_KPIS: CurrencyKpi[] = [
	{ key: 'ACTIVE_CCY', label: 'Devises actives', icon: 'lucideCoins', accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
	{ key: 'ACTIVE_COR', label: 'Corridors actifs', icon: 'lucideArrowRightLeft', accent: 'bg-primary/10 text-primary' },
	{ key: 'TODAY_RATES', label: 'Taux MAJ aujourd\u2019hui', icon: 'lucideTrendingUp', accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
	{ key: 'SUSPENDED_CCY', label: 'Devises suspendues', icon: 'lucideBan', accent: 'bg-destructive/10 text-destructive' },
	{ key: 'LAST_SYNC', label: 'Dernière synchro', icon: 'lucideClock', accent: 'bg-secondary/50 text-secondary-foreground' },
];
