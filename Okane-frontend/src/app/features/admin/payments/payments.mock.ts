import type { StatusVariant } from '../users/shared/user-status.types';

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

export const PAYMENT_AGENCIES: AgencyRef[] = [
	{ code: 'AG-CASA-01', name: 'Casablanca Centre' },
	{ code: 'AG-MRK-03', name: 'Marrakech Guéliz' },
	{ code: 'AG-RBT-02', name: 'Rabat Agdal' },
	{ code: 'AG-TNG-04', name: 'Tanger Ville' },
	{ code: 'AG-DKR-07', name: 'Dakar Plateau' },
];

export const PAYMENT_AGENTS: AgentRef[] = [
	{ id: 'AG-201', name: 'Soufiane El Mansouri' },
	{ id: 'AG-202', name: 'Hajar El Khattabi' },
	{ id: 'AG-203', name: 'Réda Lamrani' },
	{ id: 'AG-204', name: 'Wiam Saadi' },
	{ id: 'AG-205', name: 'Tarik Benabdellah' },
	{ id: 'AG-207', name: 'Achraf Idrissi' },
	{ id: 'AG-208', name: 'Mariam Sow' },
];

export interface Payment {
	id: string;
	paymentReference: string;
	transferReference: string;
	withdrawalCode: string;
	beneficiaryName: string;
	amount: number;
	currency: PaymentCurrency;
	agency: AgencyRef;
	agent: AgentRef;
	status: PaymentStatus;
	paidAt: string;
}

export const PAYMENTS_MOCK: Payment[] = [
	{
		id: 'PMT-50001',
		paymentReference: 'PMT-50001',
		transferReference: 'OKN-MA-30001',
		withdrawalCode: '482-913',
		beneficiaryName: 'Awa Diallo',
		amount: 4500,
		currency: 'MAD',
		agency: PAYMENT_AGENCIES[4],
		agent: PAYMENT_AGENTS[6],
		status: 'VALIDE',
		paidAt: '2026-05-22 09:18',
	},
	{
		id: 'PMT-50002',
		paymentReference: 'PMT-50002',
		transferReference: 'OKN-MA-30002',
		withdrawalCode: '739-208',
		beneficiaryName: 'Pierre Lemoine',
		amount: 1200,
		currency: 'EUR',
		agency: PAYMENT_AGENCIES[0],
		agent: PAYMENT_AGENTS[1],
		status: 'EN_ATTENTE',
		paidAt: '2026-05-22 10:32',
	},
	{
		id: 'PMT-50003',
		paymentReference: 'PMT-50003',
		transferReference: 'OKN-FR-30003',
		withdrawalCode: '561-347',
		beneficiaryName: 'Karim Cherkaoui',
		amount: 850,
		currency: 'EUR',
		agency: PAYMENT_AGENCIES[0],
		agent: PAYMENT_AGENTS[0],
		status: 'VALIDE',
		paidAt: '2026-05-22 08:05',
	},
	{
		id: 'PMT-50004',
		paymentReference: 'PMT-50004',
		transferReference: 'OKN-MA-30004',
		withdrawalCode: '904-118',
		beneficiaryName: 'Konan Yao',
		amount: 6800,
		currency: 'MAD',
		agency: PAYMENT_AGENCIES[2],
		agent: PAYMENT_AGENTS[2],
		status: 'BLOQUE',
		paidAt: '2026-05-22 07:41',
	},
	{
		id: 'PMT-50005',
		paymentReference: 'PMT-50005',
		transferReference: 'OKN-ES-30005',
		withdrawalCode: '218-672',
		beneficiaryName: 'Nadia Cherkaoui',
		amount: 950,
		currency: 'EUR',
		agency: PAYMENT_AGENCIES[1],
		agent: PAYMENT_AGENTS[3],
		status: 'EN_ATTENTE',
		paidAt: '2026-05-22 11:02',
	},
	{
		id: 'PMT-50006',
		paymentReference: 'PMT-50006',
		transferReference: 'OKN-MA-30006',
		withdrawalCode: '643-509',
		beneficiaryName: 'Mariam Sow',
		amount: 1850000,
		currency: 'XOF',
		agency: PAYMENT_AGENCIES[4],
		agent: PAYMENT_AGENTS[5],
		status: 'VALIDE',
		paidAt: '2026-05-21 17:24',
	},
	{
		id: 'PMT-50007',
		paymentReference: 'PMT-50007',
		transferReference: 'OKN-MA-30010',
		withdrawalCode: '419-052',
		beneficiaryName: 'Lina Fassi',
		amount: 2200,
		currency: 'USD',
		agency: PAYMENT_AGENCIES[3],
		agent: PAYMENT_AGENTS[4],
		status: 'VALIDE',
		paidAt: '2026-05-20 19:46',
	},
	{
		id: 'PMT-50008',
		paymentReference: 'PMT-50008',
		transferReference: 'OKN-FR-30008',
		withdrawalCode: '127-984',
		beneficiaryName: 'Hicham Berrada',
		amount: 1700,
		currency: 'EUR',
		agency: PAYMENT_AGENCIES[0],
		agent: PAYMENT_AGENTS[1],
		status: 'ANNULE',
		paidAt: '2026-05-19 16:53',
	},
	{
		id: 'PMT-50009',
		paymentReference: 'PMT-50009',
		transferReference: 'OKN-MA-30009',
		withdrawalCode: '768-241',
		beneficiaryName: 'Yves Kouassi',
		amount: 9200,
		currency: 'MAD',
		agency: PAYMENT_AGENCIES[2],
		agent: PAYMENT_AGENTS[2],
		status: 'EN_ATTENTE',
		paidAt: '2026-05-22 12:08',
	},
	{
		id: 'PMT-50010',
		paymentReference: 'PMT-50010',
		transferReference: 'OKN-MA-30011',
		withdrawalCode: '952-336',
		beneficiaryName: 'Omar El Hassani',
		amount: 540,
		currency: 'EUR',
		agency: PAYMENT_AGENCIES[1],
		agent: PAYMENT_AGENTS[3],
		status: 'ECHOUE',
		paidAt: '2026-05-22 06:55',
	},
	{
		id: 'PMT-50011',
		paymentReference: 'PMT-50011',
		transferReference: 'OKN-MA-30013',
		withdrawalCode: '610-204',
		beneficiaryName: 'Fatou Camara',
		amount: 3400,
		currency: 'MAD',
		agency: PAYMENT_AGENCIES[4],
		agent: PAYMENT_AGENTS[6],
		status: 'VALIDE',
		paidAt: '2026-05-22 13:46',
	},
	{
		id: 'PMT-50012',
		paymentReference: 'PMT-50012',
		transferReference: 'OKN-MA-30014',
		withdrawalCode: '283-915',
		beneficiaryName: 'Stéphane Martin',
		amount: 2100,
		currency: 'EUR',
		agency: PAYMENT_AGENCIES[3],
		agent: PAYMENT_AGENTS[4],
		status: 'ECHOUE',
		paidAt: '2026-05-21 14:22',
	},
];

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
