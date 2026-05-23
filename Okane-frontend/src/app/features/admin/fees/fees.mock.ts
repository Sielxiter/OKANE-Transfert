import type { StatusVariant } from '../users/shared/user-status.types';

export type FeeGridStatus = 'ACTIVE' | 'SUSPENDED' | 'DRAFT';

export const FEE_GRID_STATUS_LABELS: Record<FeeGridStatus, string> = {
	ACTIVE: 'Active',
	SUSPENDED: 'Suspendue',
	DRAFT: 'Brouillon',
};

export const FEE_GRID_STATUS_VARIANTS: Record<FeeGridStatus, StatusVariant> = {
	ACTIVE: 'success',
	SUSPENDED: 'destructive',
	DRAFT: 'warning',
};

export type FeeCurrency = 'MAD' | 'EUR' | 'USD' | 'XOF';

export interface FeeCorridor {
	sourceCountry: string;
	sourceCountryCode: string;
	destCountry: string;
	destCountryCode: string;
}

export const FEE_CORRIDORS: FeeCorridor[] = [
	{ sourceCountry: 'Maroc', sourceCountryCode: 'MA', destCountry: 'Sénégal', destCountryCode: 'SN' },
	{ sourceCountry: 'Maroc', sourceCountryCode: 'MA', destCountry: 'France', destCountryCode: 'FR' },
	{ sourceCountry: 'France', sourceCountryCode: 'FR', destCountry: 'Maroc', destCountryCode: 'MA' },
	{ sourceCountry: 'Espagne', sourceCountryCode: 'ES', destCountry: 'Maroc', destCountryCode: 'MA' },
	{ sourceCountry: 'Maroc', sourceCountryCode: 'MA', destCountry: "Côte d'Ivoire", destCountryCode: 'CI' },
];

export const FEE_SOURCE_COUNTRIES = Array.from(
	new Map(FEE_CORRIDORS.map((c) => [c.sourceCountryCode, { code: c.sourceCountryCode, label: c.sourceCountry }])).values(),
);

export const FEE_DEST_COUNTRIES = Array.from(
	new Map(FEE_CORRIDORS.map((c) => [c.destCountryCode, { code: c.destCountryCode, label: c.destCountry }])).values(),
);

export interface FeeGrid {
	id: string;
	name: string;
	corridor: FeeCorridor;
	currency: FeeCurrency;
	minAmount: number;
	maxAmount: number;
	fixedFee: number;
	percentageFee: number;
	agencyCommissionPct: number;
	centralCommissionPct: number;
	status: FeeGridStatus;
}

export const FEE_GRIDS_MOCK: FeeGrid[] = [
	{
		id: 'GRID-MA-SN-STD',
		name: 'Standard MA → SN',
		corridor: FEE_CORRIDORS[0],
		currency: 'MAD',
		minAmount: 0,
		maxAmount: 5000,
		fixedFee: 25,
		percentageFee: 1.2,
		agencyCommissionPct: 35,
		centralCommissionPct: 65,
		status: 'ACTIVE',
	},
	{
		id: 'GRID-MA-SN-PRM',
		name: 'Premium MA → SN',
		corridor: FEE_CORRIDORS[0],
		currency: 'MAD',
		minAmount: 5000,
		maxAmount: 50000,
		fixedFee: 75,
		percentageFee: 0.9,
		agencyCommissionPct: 30,
		centralCommissionPct: 70,
		status: 'ACTIVE',
	},
	{
		id: 'GRID-MA-FR-STD',
		name: 'Standard MA → FR',
		corridor: FEE_CORRIDORS[1],
		currency: 'MAD',
		minAmount: 0,
		maxAmount: 10000,
		fixedFee: 30,
		percentageFee: 1.0,
		agencyCommissionPct: 32,
		centralCommissionPct: 68,
		status: 'ACTIVE',
	},
	{
		id: 'GRID-FR-MA-STD',
		name: 'Standard FR → MA',
		corridor: FEE_CORRIDORS[2],
		currency: 'EUR',
		minAmount: 0,
		maxAmount: 1500,
		fixedFee: 3,
		percentageFee: 0.8,
		agencyCommissionPct: 30,
		centralCommissionPct: 70,
		status: 'ACTIVE',
	},
	{
		id: 'GRID-FR-MA-MM',
		name: 'Mobile Money FR → MA',
		corridor: FEE_CORRIDORS[2],
		currency: 'EUR',
		minAmount: 0,
		maxAmount: 800,
		fixedFee: 1.5,
		percentageFee: 1.5,
		agencyCommissionPct: 25,
		centralCommissionPct: 75,
		status: 'DRAFT',
	},
	{
		id: 'GRID-ES-MA-STD',
		name: 'Standard ES → MA',
		corridor: FEE_CORRIDORS[3],
		currency: 'EUR',
		minAmount: 0,
		maxAmount: 1500,
		fixedFee: 4,
		percentageFee: 1.0,
		agencyCommissionPct: 30,
		centralCommissionPct: 70,
		status: 'ACTIVE',
	},
	{
		id: 'GRID-ES-MA-EXP',
		name: 'International Express ES → MA',
		corridor: FEE_CORRIDORS[3],
		currency: 'EUR',
		minAmount: 1500,
		maxAmount: 10000,
		fixedFee: 12,
		percentageFee: 0.7,
		agencyCommissionPct: 28,
		centralCommissionPct: 72,
		status: 'SUSPENDED',
	},
	{
		id: 'GRID-MA-CI-STD',
		name: 'Standard MA → CI',
		corridor: FEE_CORRIDORS[4],
		currency: 'MAD',
		minAmount: 0,
		maxAmount: 8000,
		fixedFee: 30,
		percentageFee: 1.3,
		agencyCommissionPct: 33,
		centralCommissionPct: 67,
		status: 'ACTIVE',
	},
];

export interface AgencyCommissionRow {
	agencyCode: string;
	agencyName: string;
	corridor: string;
	volume: number;
	currency: FeeCurrency;
	commissionEarned: number;
	centralShare: number;
}

export const AGENCY_COMMISSIONS_MOCK: AgencyCommissionRow[] = [
	{
		agencyCode: 'AG-CASA-01',
		agencyName: 'Casablanca Centre',
		corridor: 'MA → FR',
		volume: 482000,
		currency: 'MAD',
		commissionEarned: 4220,
		centralShare: 8980,
	},
	{
		agencyCode: 'AG-RBT-02',
		agencyName: 'Rabat Agdal',
		corridor: 'MA → SN',
		volume: 312500,
		currency: 'MAD',
		commissionEarned: 3140,
		centralShare: 5840,
	},
	{
		agencyCode: 'AG-MRK-03',
		agencyName: 'Marrakech Guéliz',
		corridor: 'ES → MA',
		volume: 98400,
		currency: 'EUR',
		commissionEarned: 740,
		centralShare: 1730,
	},
	{
		agencyCode: 'AG-TNG-04',
		agencyName: 'Tanger Médina',
		corridor: 'FR → MA',
		volume: 145600,
		currency: 'EUR',
		commissionEarned: 1310,
		centralShare: 3060,
	},
	{
		agencyCode: 'AG-DKR-07',
		agencyName: 'Dakar Plateau',
		corridor: 'MA → SN',
		volume: 28400000,
		currency: 'XOF',
		commissionEarned: 184000,
		centralShare: 342000,
	},
];

export interface FeeKpi {
	key: string;
	label: string;
	icon: string;
	accent: string;
}

export const FEE_KPIS: FeeKpi[] = [
	{ key: 'ACTIVE_GRIDS', label: 'Grilles actives', icon: 'lucideLayers', accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
	{ key: 'AVG_FEES', label: 'Frais moyens', icon: 'lucidePercent', accent: 'bg-primary/10 text-primary' },
	{ key: 'CENTRAL_COM', label: 'Comm. centrale', icon: 'lucideLandmark', accent: 'bg-secondary/50 text-secondary-foreground' },
	{ key: 'AGENCY_COM', label: 'Comm. agences', icon: 'lucideBuilding2', accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
	{ key: 'SIMULATIONS', label: 'Simulations aujourd\u2019hui', icon: 'lucideCalculator', accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
];
