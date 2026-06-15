export type StatusVariant = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

export interface UserActionItem {
	label: string;
	icon: string;
	action: () => void;
	variant?: 'default' | 'destructive';
}

export interface SelectOption<T extends string = string> {
	value: T;
	label: string;
}

export type KycStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'REVIEW_REQUIRED';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED';

export const KYC_LABELS: Record<KycStatus, string> = {
	VERIFIED: 'Vérifié',
	PENDING: 'En attente',
	REJECTED: 'Rejeté',
	REVIEW_REQUIRED: 'À revoir',
};

export const KYC_VARIANTS: Record<KycStatus, StatusVariant> = {
	VERIFIED: 'success',
	PENDING: 'warning',
	REJECTED: 'destructive',
	REVIEW_REQUIRED: 'info',
};

export const ACCOUNT_LABELS: Record<AccountStatus, string> = {
	ACTIVE: 'Actif',
	SUSPENDED: 'Suspendu',
	LOCKED: 'Verrouillé',
};

export const ACCOUNT_VARIANTS: Record<AccountStatus, StatusVariant> = {
	ACTIVE: 'success',
	SUSPENDED: 'warning',
	LOCKED: 'destructive',
};
