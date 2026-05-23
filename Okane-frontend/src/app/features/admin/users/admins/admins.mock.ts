import type { AccountStatus } from '../shared/user-status.types';

export interface AdminUser {
	id: string;
	fullName: string;
	email: string;
	role: 'ROLE_ADMIN';
	account: AccountStatus;
	lastLogin: string;
}

export const ADMINS_MOCK: AdminUser[] = [
	{
		id: 'AD-001',
		fullName: 'Hicham Bennani',
		email: 'hicham.bennani@okane.test',
		role: 'ROLE_ADMIN',
		account: 'ACTIVE',
		lastLogin: '2026-05-22 09:14',
	},
	{
		id: 'AD-002',
		fullName: 'Sara El Idrissi',
		email: 'sara.elidrissi@okane.test',
		role: 'ROLE_ADMIN',
		account: 'ACTIVE',
		lastLogin: '2026-05-22 08:02',
	},
	{
		id: 'AD-003',
		fullName: 'Omar Lahlou',
		email: 'omar.lahlou@okane.test',
		role: 'ROLE_ADMIN',
		account: 'SUSPENDED',
		lastLogin: '2026-05-12 17:48',
	},
];
