import type { AccountStatus, KycStatus } from '../shared/user-status.types';

export interface ClientUser {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	country: string;
	countryCode: string;
	kyc: KycStatus;
	account: AccountStatus;
	registeredAt: string;
}

export const CLIENTS_MOCK: ClientUser[] = [
	{
		id: 'CL-1001',
		fullName: 'Yassine El Alaoui',
		email: 'yassine.elalaoui@okane.test',
		phone: '+212 6 12 45 78 90',
		country: 'Maroc',
		countryCode: 'MA',
		kyc: 'VERIFIED',
		account: 'ACTIVE',
		registeredAt: '2025-11-04',
	},
	{
		id: 'CL-1002',
		fullName: 'Salma Bouzid',
		email: 'salma.bouzid@okane.test',
		phone: '+212 6 33 21 09 87',
		country: 'Maroc',
		countryCode: 'MA',
		kyc: 'PENDING',
		account: 'ACTIVE',
		registeredAt: '2026-01-12',
	},
	{
		id: 'CL-1003',
		fullName: 'Mehdi Tazi',
		email: 'mehdi.tazi@okane.test',
		phone: '+212 6 70 12 88 33',
		country: 'Maroc',
		countryCode: 'MA',
		kyc: 'REJECTED',
		account: 'LOCKED',
		registeredAt: '2025-09-21',
	},
	{
		id: 'CL-1004',
		fullName: 'Amélie Laurent',
		email: 'amelie.laurent@okane.test',
		phone: '+33 6 24 18 52 41',
		country: 'France',
		countryCode: 'FR',
		kyc: 'VERIFIED',
		account: 'ACTIVE',
		registeredAt: '2025-12-02',
	},
	{
		id: 'CL-1005',
		fullName: 'Ibrahim Ndiaye',
		email: 'ibrahim.ndiaye@okane.test',
		phone: '+221 77 654 22 11',
		country: 'Sénégal',
		countryCode: 'SN',
		kyc: 'PENDING',
		account: 'SUSPENDED',
		registeredAt: '2026-02-18',
	},
	{
		id: 'CL-1006',
		fullName: 'Daniela Costa',
		email: 'daniela.costa@okane.test',
		phone: '+351 91 233 41 22',
		country: 'Portugal',
		countryCode: 'PT',
		kyc: 'VERIFIED',
		account: 'ACTIVE',
		registeredAt: '2026-03-09',
	},
	{
		id: 'CL-1007',
		fullName: 'James Carter',
		email: 'james.carter@okane.test',
		phone: '+1 415 998 22 31',
		country: 'États-Unis',
		countryCode: 'US',
		kyc: 'VERIFIED',
		account: 'ACTIVE',
		registeredAt: '2026-04-14',
	},
	{
		id: 'CL-1008',
		fullName: 'Nadia Cherkaoui',
		email: 'nadia.cherkaoui@okane.test',
		phone: '+212 6 60 47 11 25',
		country: 'Maroc',
		countryCode: 'MA',
		kyc: 'PENDING',
		account: 'ACTIVE',
		registeredAt: '2026-04-28',
	},
	{
		id: 'CL-1009',
		fullName: 'Aïcha Diallo',
		email: 'aicha.diallo@okane.test',
		phone: '+225 07 88 23 41 90',
		country: "Côte d'Ivoire",
		countryCode: 'CI',
		kyc: 'REJECTED',
		account: 'SUSPENDED',
		registeredAt: '2025-10-30',
	},
	{
		id: 'CL-1010',
		fullName: 'Karim Saidi',
		email: 'karim.saidi@okane.test',
		phone: '+213 5 55 12 36 47',
		country: 'Algérie',
		countryCode: 'DZ',
		kyc: 'VERIFIED',
		account: 'ACTIVE',
		registeredAt: '2026-05-05',
	},
];

export const CLIENT_COUNTRIES: { code: string; label: string }[] = [
	{ code: 'MA', label: 'Maroc' },
	{ code: 'FR', label: 'France' },
	{ code: 'SN', label: 'Sénégal' },
	{ code: 'PT', label: 'Portugal' },
	{ code: 'US', label: 'États-Unis' },
	{ code: 'CI', label: "Côte d'Ivoire" },
	{ code: 'DZ', label: 'Algérie' },
];
