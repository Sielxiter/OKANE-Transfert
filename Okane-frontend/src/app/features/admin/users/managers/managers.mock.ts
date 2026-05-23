import type { AccountStatus } from '../shared/user-status.types';

export interface AgencyRef {
	code: string;
	name: string;
}

export interface ManagerUser {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	role: 'ROLE_MANAGER';
	agency: AgencyRef;
	account: AccountStatus;
	lastLogin: string;
}

export const MANAGER_AGENCIES: AgencyRef[] = [
	{ code: 'AG-CASA-01', name: 'Casablanca Centre' },
	{ code: 'AG-RBT-02', name: 'Rabat Agdal' },
	{ code: 'AG-MRK-03', name: 'Marrakech Guéliz' },
	{ code: 'AG-TNG-04', name: 'Tanger Médina' },
	{ code: 'AG-FES-05', name: 'Fès Atlas' },
];

export const MANAGERS_MOCK: ManagerUser[] = [
	{
		id: 'MG-101',
		fullName: 'Khalid Amrani',
		email: 'khalid.amrani@okane.test',
		phone: '+212 6 11 22 33 44',
		role: 'ROLE_MANAGER',
		agency: MANAGER_AGENCIES[0],
		account: 'ACTIVE',
		lastLogin: '2026-05-22 10:32',
	},
	{
		id: 'MG-102',
		fullName: 'Imane Ouahbi',
		email: 'imane.ouahbi@okane.test',
		phone: '+212 6 55 87 22 19',
		role: 'ROLE_MANAGER',
		agency: MANAGER_AGENCIES[1],
		account: 'ACTIVE',
		lastLogin: '2026-05-22 09:45',
	},
	{
		id: 'MG-103',
		fullName: 'Younes Berrada',
		email: 'younes.berrada@okane.test',
		phone: '+212 6 67 18 02 88',
		role: 'ROLE_MANAGER',
		agency: MANAGER_AGENCIES[2],
		account: 'SUSPENDED',
		lastLogin: '2026-05-18 14:21',
	},
	{
		id: 'MG-104',
		fullName: 'Lina Fassi',
		email: 'lina.fassi@okane.test',
		phone: '+212 6 22 76 41 33',
		role: 'ROLE_MANAGER',
		agency: MANAGER_AGENCIES[3],
		account: 'ACTIVE',
		lastLogin: '2026-05-21 18:58',
	},
	{
		id: 'MG-105',
		fullName: 'Anas Benkirane',
		email: 'anas.benkirane@okane.test',
		phone: '+212 6 70 33 12 49',
		role: 'ROLE_MANAGER',
		agency: MANAGER_AGENCIES[4],
		account: 'LOCKED',
		lastLogin: '2026-05-10 11:08',
	},
];
