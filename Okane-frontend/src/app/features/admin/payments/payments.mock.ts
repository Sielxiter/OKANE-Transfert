import type { StatusVariant } from '../users/shared/user-status.types';

/**
 * Display-side metadata for the Payments page (status labels, KPI definitions,
 * types). These values drive the validated UI and are intentionally kept
 * client-side. Live rows now come from {@link AdminPaymentsApiService}.
 */

export type PaymentStatus = 'EN_ATTENTE' | 'VALIDE' | 'ECHOUE' | 'ANNULE' | 'BLOQUE';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
	EN_ATTENTE: 'En attente',
	VALIDE: 'Validé',
	ECHOUE: 'Échoué',
	ANNULE: 'Annulé',
	BLOQUE: 'Bloqué',
};

export const PAYMENT_STATUS_VARIANTS: Record<PaymentStatus, StatusVariant> = {
	EN_ATTENTE: 'warning',
	VALIDE: 'success',
	ECHOUE: 'destructive',
	ANNULE: 'muted',
	BLOQUE: 'destructive',
};

export type PaymentCurrency = 'MAD' | 'EUR' | 'USD' | 'XOF';

export interface AgencyRef {
	code: string;
	name: string;
}

export interface AgentRef {
	id: string;
	name: string;
}

export interface PaymentKpi {
	key: 'TOTAL' | 'TODAY' | PaymentStatus | 'AMOUNT';
	label: string;
	icon: string;
	accent: string;
}

export const PAYMENT_KPIS: PaymentKpi[] = [
	{ key: 'TOTAL', label: 'Total', icon: 'lucideWallet', accent: 'bg-primary/10 text-primary' },
	{ key: 'TODAY', label: "Aujourd'hui", icon: 'lucideCalendar', accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
	{ key: 'EN_ATTENTE', label: 'En attente', icon: 'lucideHourglass', accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
	{ key: 'VALIDE', label: 'Validés', icon: 'lucideBadgeCheck', accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
	{ key: 'ECHOUE', label: 'Échoués', icon: 'lucideTriangleAlert', accent: 'bg-destructive/10 text-destructive' },
	{ key: 'AMOUNT', label: 'Montant payé', icon: 'lucideCoins', accent: 'bg-secondary/50 text-secondary-foreground' },
];
