import type { StatusVariant } from '../users/shared/user-status.types';

/**
 * Display-side metadata for the Fees & Commissions page (status labels, KPI
 * definitions, country dictionary). Live rows now come from
 * {@link AdminFeesApiService}; this file only holds config used by the UI.
 */

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

export interface CountryRef {
	code: string;
	label: string;
}

export const FEE_SOURCE_COUNTRIES: CountryRef[] = [
	{ code: 'MAR', label: 'Maroc' },
	{ code: 'FRA', label: 'France' },
	{ code: 'ESP', label: 'Espagne' },
	{ code: 'SEN', label: 'Sénégal' },
	{ code: 'CIV', label: "Côte d'Ivoire" },
];

export const FEE_DEST_COUNTRIES: CountryRef[] = FEE_SOURCE_COUNTRIES;

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
