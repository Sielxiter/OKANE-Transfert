import type { StatusVariant } from '../users/shared/user-status.types';

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

export const TRANSFER_COUNTRIES: CountryRef[] = [
	{ code: 'MA', label: 'Maroc' },
	{ code: 'FR', label: 'France' },
	{ code: 'ES', label: 'Espagne' },
	{ code: 'SN', label: 'Sénégal' },
	{ code: 'CI', label: "Côte d'Ivoire" },
	{ code: 'US', label: 'États-Unis' },
];

export interface Transfer {
	id: string;
	reference: string;
	withdrawalCode: string;
	senderName: string;
	beneficiaryName: string;
	amount: number;
	currency: Currency;
	sourceCountry: CountryRef;
	destinationCountry: CountryRef;
	fees: number;
	status: TransferStatus;
	createdAt: string;
	agentName: string;
	agentId: string;
}

export const TRANSFER_AGENTS = [
	{ id: 'AG-201', name: 'Soufiane El Mansouri' },
	{ id: 'AG-202', name: 'Hajar El Khattabi' },
	{ id: 'AG-203', name: 'Réda Lamrani' },
	{ id: 'AG-204', name: 'Wiam Saadi' },
	{ id: 'AG-205', name: 'Tarik Benabdellah' },
	{ id: 'AG-207', name: 'Achraf Idrissi' },
];

const MA = TRANSFER_COUNTRIES[0];
const FR = TRANSFER_COUNTRIES[1];
const ES = TRANSFER_COUNTRIES[2];
const SN = TRANSFER_COUNTRIES[3];
const CI = TRANSFER_COUNTRIES[4];
const US = TRANSFER_COUNTRIES[5];

export const TRANSFERS_MOCK: Transfer[] = [
	{
		id: 'TR-30001',
		reference: 'OKN-MA-30001',
		withdrawalCode: '482-913',
		senderName: 'Yassine El Alaoui',
		beneficiaryName: 'Awa Diallo',
		amount: 4500,
		currency: 'MAD',
		sourceCountry: MA,
		destinationCountry: SN,
		fees: 65,
		status: 'PAYE',
		createdAt: '2026-05-22 09:18',
		agentName: 'Soufiane El Mansouri',
		agentId: 'AG-201',
	},
	{
		id: 'TR-30002',
		reference: 'OKN-MA-30002',
		withdrawalCode: '739-208',
		senderName: 'Salma Bouzid',
		beneficiaryName: 'Pierre Lemoine',
		amount: 1200,
		currency: 'EUR',
		sourceCountry: MA,
		destinationCountry: FR,
		fees: 18,
		status: 'EN_ATTENTE',
		createdAt: '2026-05-22 10:32',
		agentName: 'Hajar El Khattabi',
		agentId: 'AG-202',
	},
	{
		id: 'TR-30003',
		reference: 'OKN-FR-30003',
		withdrawalCode: '561-347',
		senderName: 'Amélie Laurent',
		beneficiaryName: 'Karim Cherkaoui',
		amount: 850,
		currency: 'EUR',
		sourceCountry: FR,
		destinationCountry: MA,
		fees: 12,
		status: 'PAYE',
		createdAt: '2026-05-22 08:05',
		agentName: 'Réda Lamrani',
		agentId: 'AG-203',
	},
	{
		id: 'TR-30004',
		reference: 'OKN-MA-30004',
		withdrawalCode: '904-118',
		senderName: 'Mehdi Tazi',
		beneficiaryName: 'Konan Yao',
		amount: 6800,
		currency: 'MAD',
		sourceCountry: MA,
		destinationCountry: CI,
		fees: 95,
		status: 'SUSPECT',
		createdAt: '2026-05-22 07:41',
		agentName: 'Wiam Saadi',
		agentId: 'AG-204',
	},
	{
		id: 'TR-30005',
		reference: 'OKN-ES-30005',
		withdrawalCode: '218-672',
		senderName: 'Carmen Ruiz',
		beneficiaryName: 'Nadia Cherkaoui',
		amount: 950,
		currency: 'EUR',
		sourceCountry: ES,
		destinationCountry: MA,
		fees: 14,
		status: 'EN_ATTENTE',
		createdAt: '2026-05-22 11:02',
		agentName: 'Tarik Benabdellah',
		agentId: 'AG-205',
	},
	{
		id: 'TR-30006',
		reference: 'OKN-MA-30006',
		withdrawalCode: '643-509',
		senderName: 'Ibrahim Ndiaye',
		beneficiaryName: 'Mariam Sow',
		amount: 1850000,
		currency: 'XOF',
		sourceCountry: MA,
		destinationCountry: SN,
		fees: 35000,
		status: 'PAYE',
		createdAt: '2026-05-21 17:24',
		agentName: 'Achraf Idrissi',
		agentId: 'AG-207',
	},
	{
		id: 'TR-30007',
		reference: 'OKN-MA-30007',
		withdrawalCode: '305-871',
		senderName: 'Karim Saidi',
		beneficiaryName: 'Mohammed Ait Ali',
		amount: 2300,
		currency: 'MAD',
		sourceCountry: MA,
		destinationCountry: MA,
		fees: 28,
		status: 'EXPIRE',
		createdAt: '2026-05-15 14:11',
		agentName: 'Soufiane El Mansouri',
		agentId: 'AG-201',
	},
	{
		id: 'TR-30008',
		reference: 'OKN-FR-30008',
		withdrawalCode: '127-984',
		senderName: 'Daniela Costa',
		beneficiaryName: 'Hicham Berrada',
		amount: 1700,
		currency: 'EUR',
		sourceCountry: FR,
		destinationCountry: MA,
		fees: 24,
		status: 'ANNULE',
		createdAt: '2026-05-19 16:53',
		agentName: 'Hajar El Khattabi',
		agentId: 'AG-202',
	},
	{
		id: 'TR-30009',
		reference: 'OKN-MA-30009',
		withdrawalCode: '768-241',
		senderName: 'Anouar Idrissi',
		beneficiaryName: 'Yves Kouassi',
		amount: 9200,
		currency: 'MAD',
		sourceCountry: MA,
		destinationCountry: CI,
		fees: 130,
		status: 'EN_ATTENTE',
		createdAt: '2026-05-22 12:08',
		agentName: 'Réda Lamrani',
		agentId: 'AG-203',
	},
	{
		id: 'TR-30010',
		reference: 'OKN-US-30010',
		withdrawalCode: '419-052',
		senderName: 'James Carter',
		beneficiaryName: 'Lina Fassi',
		amount: 2200,
		currency: 'USD',
		sourceCountry: US,
		destinationCountry: MA,
		fees: 32,
		status: 'PAYE',
		createdAt: '2026-05-20 19:46',
		agentName: 'Wiam Saadi',
		agentId: 'AG-204',
	},
	{
		id: 'TR-30011',
		reference: 'OKN-ES-30011',
		withdrawalCode: '952-336',
		senderName: 'Lucia Hernandez',
		beneficiaryName: 'Omar El Hassani',
		amount: 540,
		currency: 'EUR',
		sourceCountry: ES,
		destinationCountry: MA,
		fees: 9,
		status: 'SUSPECT',
		createdAt: '2026-05-22 06:55',
		agentName: 'Tarik Benabdellah',
		agentId: 'AG-205',
	},
	{
		id: 'TR-30012',
		reference: 'OKN-MA-30012',
		withdrawalCode: '684-770',
		senderName: 'Nadia Cherkaoui',
		beneficiaryName: 'Aïcha Diallo',
		amount: 3100,
		currency: 'MAD',
		sourceCountry: MA,
		destinationCountry: SN,
		fees: 45,
		status: 'EXPIRE',
		createdAt: '2026-05-12 10:20',
		agentName: 'Achraf Idrissi',
		agentId: 'AG-207',
	},
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
