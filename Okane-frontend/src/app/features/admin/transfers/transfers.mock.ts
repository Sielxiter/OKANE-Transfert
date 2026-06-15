import type { StatusVariant } from '../users/shared/user-status.types';

/**
 * Static metadata used by the Transfers page (filter labels, KPI definitions,
 * country dictionary). These are display-config values, not mock data — they
 * remain client-side because the design and wording were validated. Live rows
 * are fetched via {@link AdminTransfersApiService}.
 */

export type TransferStatus = 'EN_ATTENTE' | 'PAYE' | 'ANNULE' | 'EXPIRE' | 'SUSPECT';

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
	EN_ATTENTE: 'En attente',
	PAYE: 'Payé',
	ANNULE: 'Annulé',
	EXPIRE: 'Expiré',
	SUSPECT: 'Suspect',
};

export const TRANSFER_STATUS_VARIANTS: Record<TransferStatus, StatusVariant> = {
	EN_ATTENTE: 'warning',
	PAYE: 'success',
	ANNULE: 'muted',
	EXPIRE: 'info',
	SUSPECT: 'destructive',
};

export type Currency = 'MAD' | 'EUR' | 'USD' | 'XOF';

export interface CountryRef {
	code: string;
	label: string;
}

/**
 * Default country dictionary used to render readable corridors when the
 * backend only sends ISO codes (e.g. "MA", "SN"). The page keeps this list
 * locally so the UI labels (Maroc, France, …) stay consistent with the rest
 * of the admin space.
 */
export const TRANSFER_COUNTRIES: CountryRef[] = [
	{ code: 'MA', label: 'Maroc' },
	{ code: 'FR', label: 'France' },
	{ code: 'ES', label: 'Espagne' },
	{ code: 'SN', label: 'Sénégal' },
	{ code: 'CI', label: "Côte d'Ivoire" },
	{ code: 'US', label: 'États-Unis' },
];

export interface TransferKpi {
	key: TransferStatus | 'TOTAL';
	label: string;
	icon: string;
	accent: string;
}

export const TRANSFER_KPIS: TransferKpi[] = [
	{ key: 'TOTAL', label: 'Total', icon: 'lucideArrowRightLeft', accent: 'bg-primary/10 text-primary' },
	{ key: 'EN_ATTENTE', label: 'En attente', icon: 'lucideHourglass', accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
	{ key: 'PAYE', label: 'Payés', icon: 'lucideBadgeCheck', accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
	{ key: 'ANNULE', label: 'Annulés', icon: 'lucideBan', accent: 'bg-muted text-muted-foreground' },
	{ key: 'EXPIRE', label: 'Expirés', icon: 'lucideClock', accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
	{ key: 'SUSPECT', label: 'Suspects', icon: 'lucideShieldAlert', accent: 'bg-destructive/10 text-destructive' },
];

/**
 * Resolve a 2-letter ISO country code to a French label (or fall back to the
 * code itself when unknown).
 */
export function resolveCountry(code: string | null): CountryRef {
	if (!code) return { code: '—', label: '—' };
	const upper = code.toUpperCase();
	const match = TRANSFER_COUNTRIES.find((c) => c.code === upper);
	return match ?? { code: upper, label: upper };
}
