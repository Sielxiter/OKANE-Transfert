import type { StatusVariant } from '../users/shared/user-status.types';

/**
 * Display-side metadata for the Currency & FX page (status labels, KPI
 * definitions). These are config values, not mock data — they remain
 * client-side because the design and wording were validated. Live rows are
 * fetched via {@link AdminCurrencyApiService}.
 */

export type CurrencyStatus = 'ACTIVE' | 'SUSPENDED';

export const CURRENCY_STATUS_LABELS: Record<CurrencyStatus, string> = {
	ACTIVE: 'Active',
	SUSPENDED: 'Suspendue',
};

export const CURRENCY_STATUS_VARIANTS: Record<CurrencyStatus, StatusVariant> = {
	ACTIVE: 'success',
	SUSPENDED: 'destructive',
};

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
