import type { StatusVariant } from '../users/shared/user-status.types';

export type AgencyStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export const AGENCY_STATUS_LABELS: Record<AgencyStatus, string> = {
	ACTIVE: 'Active',
	SUSPENDED: 'Suspendue',
	PENDING: 'En attente',
};

export const AGENCY_STATUS_VARIANTS: Record<AgencyStatus, StatusVariant> = {
	ACTIVE: 'success',
	SUSPENDED: 'destructive',
	PENDING: 'warning',
};

export interface Agency {
	id: string;
	name: string;
	code: string;
	city: string;
	country: string;
	countryCode: string;
	managerName: string;
	managerId: string;
	agentsCount: number;
	dailyLimit: number;
	currency: 'MAD' | 'XOF' | 'EUR';
	status: AgencyStatus;
	createdAt: string;
}

export const AGENCIES_MOCK: Agency[] = [
	{
		id: 'AG-CASA-01',
		name: 'Casablanca Centre',
		code: 'CASA-01',
		city: 'Casablanca',
		country: 'Maroc',
		countryCode: 'MA',
		managerName: 'Khalid Amrani',
		managerId: 'MG-101',
		agentsCount: 12,
		dailyLimit: 850000,
		currency: 'MAD',
		status: 'ACTIVE',
		createdAt: '2024-02-12',
	},
	{
		id: 'AG-RBT-02',
		name: 'Rabat Agdal',
		code: 'RBT-02',
		city: 'Rabat',
		country: 'Maroc',
		countryCode: 'MA',
		managerName: 'Imane Ouahbi',
		managerId: 'MG-102',
		agentsCount: 8,
		dailyLimit: 620000,
		currency: 'MAD',
		status: 'ACTIVE',
		createdAt: '2024-03-04',
	},
	{
		id: 'AG-MRK-03',
		name: 'Marrakech Guéliz',
		code: 'MRK-03',
		city: 'Marrakech',
		country: 'Maroc',
		countryCode: 'MA',
		managerName: 'Younes Berrada',
		managerId: 'MG-103',
		agentsCount: 6,
		dailyLimit: 450000,
		currency: 'MAD',
		status: 'SUSPENDED',
		createdAt: '2024-04-18',
	},
	{
		id: 'AG-TNG-04',
		name: 'Tanger Médina',
		code: 'TNG-04',
		city: 'Tanger',
		country: 'Maroc',
		countryCode: 'MA',
		managerName: 'Lina Fassi',
		managerId: 'MG-104',
		agentsCount: 7,
		dailyLimit: 500000,
		currency: 'MAD',
		status: 'ACTIVE',
		createdAt: '2024-06-22',
	},
	{
		id: 'AG-FES-05',
		name: 'Fès Atlas',
		code: 'FES-05',
		city: 'Fès',
		country: 'Maroc',
		countryCode: 'MA',
		managerName: 'Anas Benkirane',
		managerId: 'MG-105',
		agentsCount: 5,
		dailyLimit: 380000,
		currency: 'MAD',
		status: 'PENDING',
		createdAt: '2025-09-30',
	},
	{
		id: 'AG-AGA-06',
		name: 'Agadir Marina',
		code: 'AGA-06',
		city: 'Agadir',
		country: 'Maroc',
		countryCode: 'MA',
		managerName: 'Sofia Hilali',
		managerId: 'MG-106',
		agentsCount: 4,
		dailyLimit: 320000,
		currency: 'MAD',
		status: 'ACTIVE',
		createdAt: '2025-01-15',
	},
	{
		id: 'AG-DKR-07',
		name: 'Dakar Plateau',
		code: 'DKR-07',
		city: 'Dakar',
		country: 'Sénégal',
		countryCode: 'SN',
		managerName: 'Moussa Diop',
		managerId: 'MG-107',
		agentsCount: 9,
		dailyLimit: 28000000,
		currency: 'XOF',
		status: 'ACTIVE',
		createdAt: '2024-11-08',
	},
	{
		id: 'AG-ABJ-08',
		name: 'Abidjan Plateau',
		code: 'ABJ-08',
		city: 'Abidjan',
		country: "Côte d'Ivoire",
		countryCode: 'CI',
		managerName: 'Aïcha Touré',
		managerId: 'MG-108',
		agentsCount: 6,
		dailyLimit: 18000000,
		currency: 'XOF',
		status: 'PENDING',
		createdAt: '2026-02-05',
	},
	{
		id: 'AG-PAR-09',
		name: 'Paris Belleville',
		code: 'PAR-09',
		city: 'Paris',
		country: 'France',
		countryCode: 'FR',
		managerName: 'Camille Dupont',
		managerId: 'MG-109',
		agentsCount: 3,
		dailyLimit: 75000,
		currency: 'EUR',
		status: 'ACTIVE',
		createdAt: '2025-05-20',
	},
	{
		id: 'AG-OUJ-10',
		name: 'Oujda Centre',
		code: 'OUJ-10',
		city: 'Oujda',
		country: 'Maroc',
		countryCode: 'MA',
		managerName: 'Hicham Naciri',
		managerId: 'MG-110',
		agentsCount: 2,
		dailyLimit: 180000,
		currency: 'MAD',
		status: 'SUSPENDED',
		createdAt: '2025-07-11',
	},
];

export const AGENCY_COUNTRIES = Array.from(
	new Map(AGENCIES_MOCK.map((a) => [a.countryCode, { code: a.countryCode, label: a.country }])).values(),
);

export const AGENCY_CITIES = Array.from(new Set(AGENCIES_MOCK.map((a) => a.city))).sort();
