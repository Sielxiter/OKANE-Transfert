import type { AccountStatus } from '../shared/user-status.types';
import { MANAGER_AGENCIES, type AgencyRef } from '../managers/managers.mock';

export interface AgentUser {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	role: 'ROLE_AGENT';
	agency: AgencyRef;
	cashBalance: number;
	currency: 'MAD';
	account: AccountStatus;
	lastLogin: string;
}

export const AGENT_AGENCIES = MANAGER_AGENCIES;

export const AGENTS_MOCK: AgentUser[] = [
	{
		id: 'AG-201',
		fullName: 'Soufiane El Mansouri',
		email: 'soufiane.elmansouri@okane.test',
		phone: '+212 6 12 84 27 90',
		role: 'ROLE_AGENT',
		agency: MANAGER_AGENCIES[0],
		cashBalance: 18500,
		currency: 'MAD',
		account: 'ACTIVE',
		lastLogin: '2026-05-22 11:02',
	},
	{
		id: 'AG-202',
		fullName: 'Hajar El Khattabi',
		email: 'hajar.elkhattabi@okane.test',
		phone: '+212 6 47 02 18 73',
		role: 'ROLE_AGENT',
		agency: MANAGER_AGENCIES[0],
		cashBalance: 9420,
		currency: 'MAD',
		account: 'ACTIVE',
		lastLogin: '2026-05-22 10:48',
	},
	{
		id: 'AG-203',
		fullName: 'Réda Lamrani',
		email: 'reda.lamrani@okane.test',
		phone: '+212 6 33 18 90 24',
		role: 'ROLE_AGENT',
		agency: MANAGER_AGENCIES[1],
		cashBalance: 22100,
		currency: 'MAD',
		account: 'ACTIVE',
		lastLogin: '2026-05-22 08:55',
	},
	{
		id: 'AG-204',
		fullName: 'Wiam Saadi',
		email: 'wiam.saadi@okane.test',
		phone: '+212 6 70 22 88 14',
		role: 'ROLE_AGENT',
		agency: MANAGER_AGENCIES[2],
		cashBalance: 13780,
		currency: 'MAD',
		account: 'SUSPENDED',
		lastLogin: '2026-05-19 16:41',
	},
	{
		id: 'AG-205',
		fullName: 'Tarik Benabdellah',
		email: 'tarik.benabdellah@okane.test',
		phone: '+212 6 18 33 24 57',
		role: 'ROLE_AGENT',
		agency: MANAGER_AGENCIES[3],
		cashBalance: 7290,
		currency: 'MAD',
		account: 'ACTIVE',
		lastLogin: '2026-05-22 09:18',
	},
	{
		id: 'AG-206',
		fullName: 'Naima Chafik',
		email: 'naima.chafik@okane.test',
		phone: '+212 6 25 94 11 38',
		role: 'ROLE_AGENT',
		agency: MANAGER_AGENCIES[4],
		cashBalance: 4500,
		currency: 'MAD',
		account: 'LOCKED',
		lastLogin: '2026-05-08 12:33',
	},
	{
		id: 'AG-207',
		fullName: 'Achraf Idrissi',
		email: 'achraf.idrissi@okane.test',
		phone: '+212 6 60 41 28 15',
		role: 'ROLE_AGENT',
		agency: MANAGER_AGENCIES[1],
		cashBalance: 15640,
		currency: 'MAD',
		account: 'ACTIVE',
		lastLogin: '2026-05-22 09:36',
	},
];
