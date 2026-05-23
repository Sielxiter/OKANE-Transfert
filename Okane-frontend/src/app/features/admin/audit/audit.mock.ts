import type { StatusVariant } from '../users/shared/user-status.types';

export type AuditModule =
	| 'AUTH'
	| 'USERS'
	| 'AGENCIES'
	| 'TRANSFERS'
	| 'PAYMENTS'
	| 'CURRENCY'
	| 'FEES'
	| 'COMPLIANCE'
	| 'REPORTS'
	| 'SETTINGS';

export const AUDIT_MODULE_LABELS: Record<AuditModule, string> = {
	AUTH: 'Auth',
	USERS: 'Users',
	AGENCIES: 'Agencies',
	TRANSFERS: 'Transfers',
	PAYMENTS: 'Payments',
	CURRENCY: 'Currency',
	FEES: 'Fees',
	COMPLIANCE: 'Compliance',
	REPORTS: 'Reports',
	SETTINGS: 'Settings',
};

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'BLOCKED';

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
	SUCCESS: 'Succès',
	FAILURE: 'Échec',
	BLOCKED: 'Bloqué',
};

export const AUDIT_STATUS_VARIANTS: Record<AuditStatus, StatusVariant> = {
	SUCCESS: 'success',
	FAILURE: 'warning',
	BLOCKED: 'destructive',
};

export type AuditRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const AUDIT_RISK_LABELS: Record<AuditRiskLevel, string> = {
	LOW: 'Faible',
	MEDIUM: 'Moyen',
	HIGH: 'Élevé',
	CRITICAL: 'Critique',
};

export const AUDIT_RISK_VARIANTS: Record<AuditRiskLevel, StatusVariant> = {
	LOW: 'success',
	MEDIUM: 'info',
	HIGH: 'warning',
	CRITICAL: 'destructive',
};

export type AuditUserRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_AGENT' | 'ROLE_CLIENT' | 'SYSTEM';

export const AUDIT_ROLE_LABELS: Record<AuditUserRole, string> = {
	ROLE_ADMIN: 'Admin',
	ROLE_MANAGER: 'Manager',
	ROLE_AGENT: 'Agent',
	ROLE_CLIENT: 'Client',
	SYSTEM: 'Système',
};

export interface AuditUser {
	id: string;
	name: string;
	email: string;
	role: AuditUserRole;
}

export const AUDIT_USERS: AuditUser[] = [
	{ id: 'AD-001', name: 'Hicham Bennani', email: 'hicham.bennani@okane.test', role: 'ROLE_ADMIN' },
	{ id: 'AD-002', name: 'Sara El Idrissi', email: 'sara.elidrissi@okane.test', role: 'ROLE_ADMIN' },
	{ id: 'MG-101', name: 'Khalid Amrani', email: 'khalid.amrani@okane.test', role: 'ROLE_MANAGER' },
	{ id: 'MG-103', name: 'Younes Berrada', email: 'younes.berrada@okane.test', role: 'ROLE_MANAGER' },
	{ id: 'AG-201', name: 'Soufiane El Mansouri', email: 'soufiane.elmansouri@okane.test', role: 'ROLE_AGENT' },
	{ id: 'AG-204', name: 'Wiam Saadi', email: 'wiam.saadi@okane.test', role: 'ROLE_AGENT' },
	{ id: 'CL-1003', name: 'Mehdi Tazi', email: 'mehdi.tazi@okane.test', role: 'ROLE_CLIENT' },
	{ id: 'SYS-CRON', name: 'Système', email: 'system@okane.local', role: 'SYSTEM' },
];

export interface AuditLog {
	id: string;
	timestamp: string;
	user: AuditUser;
	action: string;
	module: AuditModule;
	target: string;
	ipAddress: string;
	status: AuditStatus;
	risk: AuditRiskLevel;
}

export const AUDIT_LOGS_MOCK: AuditLog[] = [
	{
		id: 'LOG-50001',
		timestamp: '2026-05-23 09:14:22',
		user: AUDIT_USERS[0],
		action: 'LOGIN_SUCCESS',
		module: 'AUTH',
		target: 'session/admin-001',
		ipAddress: '154.144.22.18',
		status: 'SUCCESS',
		risk: 'LOW',
	},
	{
		id: 'LOG-50002',
		timestamp: '2026-05-23 09:18:04',
		user: AUDIT_USERS[1],
		action: 'FX_RATE_UPDATED',
		module: 'CURRENCY',
		target: 'EUR → MAD : 10,88 → 10,92',
		ipAddress: '154.144.22.40',
		status: 'SUCCESS',
		risk: 'MEDIUM',
	},
	{
		id: 'LOG-50003',
		timestamp: '2026-05-23 09:22:48',
		user: AUDIT_USERS[6],
		action: 'LOGIN_FAILED',
		module: 'AUTH',
		target: 'tentatives = 3',
		ipAddress: '41.140.88.12',
		status: 'FAILURE',
		risk: 'MEDIUM',
	},
	{
		id: 'LOG-50004',
		timestamp: '2026-05-23 09:31:11',
		user: AUDIT_USERS[2],
		action: 'USER_CREATED',
		module: 'USERS',
		target: 'AG-208 / Mariam Sow',
		ipAddress: '196.200.41.74',
		status: 'SUCCESS',
		risk: 'LOW',
	},
	{
		id: 'LOG-50005',
		timestamp: '2026-05-23 09:42:27',
		user: AUDIT_USERS[5],
		action: 'TRANSFER_MARKED_SUSPICIOUS',
		module: 'TRANSFERS',
		target: 'OKN-MA-30004',
		ipAddress: '196.200.18.92',
		status: 'BLOCKED',
		risk: 'CRITICAL',
	},
	{
		id: 'LOG-50006',
		timestamp: '2026-05-23 09:55:53',
		user: AUDIT_USERS[4],
		action: 'PAYMENT_VALIDATED',
		module: 'PAYMENTS',
		target: 'PMT-50001',
		ipAddress: '196.200.41.70',
		status: 'SUCCESS',
		risk: 'LOW',
	},
	{
		id: 'LOG-50007',
		timestamp: '2026-05-23 10:08:15',
		user: AUDIT_USERS[1],
		action: 'KYC_REJECTED',
		module: 'COMPLIANCE',
		target: 'KYC-1003',
		ipAddress: '154.144.22.40',
		status: 'SUCCESS',
		risk: 'HIGH',
	},
	{
		id: 'LOG-50008',
		timestamp: '2026-05-23 10:14:39',
		user: AUDIT_USERS[0],
		action: 'FEE_GRID_UPDATED',
		module: 'FEES',
		target: 'GRID-FR-MA-STD',
		ipAddress: '154.144.22.18',
		status: 'SUCCESS',
		risk: 'MEDIUM',
	},
	{
		id: 'LOG-50009',
		timestamp: '2026-05-23 10:22:01',
		user: AUDIT_USERS[2],
		action: 'USER_SUSPENDED',
		module: 'USERS',
		target: 'AG-204 / Wiam Saadi',
		ipAddress: '196.200.41.74',
		status: 'SUCCESS',
		risk: 'HIGH',
	},
	{
		id: 'LOG-50010',
		timestamp: '2026-05-23 10:35:28',
		user: AUDIT_USERS[7],
		action: 'REPORT_EXPORTED',
		module: 'REPORTS',
		target: 'RPT-9001 (PDF)',
		ipAddress: '10.0.0.12',
		status: 'SUCCESS',
		risk: 'LOW',
	},
	{
		id: 'LOG-50011',
		timestamp: '2026-05-23 10:48:56',
		user: AUDIT_USERS[3],
		action: 'LOGIN_FAILED',
		module: 'AUTH',
		target: 'tentatives = 5',
		ipAddress: '41.140.88.42',
		status: 'BLOCKED',
		risk: 'CRITICAL',
	},
	{
		id: 'LOG-50012',
		timestamp: '2026-05-23 11:02:14',
		user: AUDIT_USERS[1],
		action: 'AGENCY_SUSPENDED',
		module: 'AGENCIES',
		target: 'AG-MRK-03 / Marrakech Guéliz',
		ipAddress: '154.144.22.40',
		status: 'SUCCESS',
		risk: 'HIGH',
	},
	{
		id: 'LOG-50013',
		timestamp: '2026-05-23 11:18:47',
		user: AUDIT_USERS[0],
		action: 'SETTINGS_UPDATED',
		module: 'SETTINGS',
		target: 'rate.limit.login = 5/10min',
		ipAddress: '154.144.22.18',
		status: 'SUCCESS',
		risk: 'MEDIUM',
	},
	{
		id: 'LOG-50014',
		timestamp: '2026-05-23 11:34:09',
		user: AUDIT_USERS[7],
		action: 'CASH_SESSION_OPENED',
		module: 'PAYMENTS',
		target: 'session-AG201-2026-05-23',
		ipAddress: '10.0.0.12',
		status: 'SUCCESS',
		risk: 'LOW',
	},
	{
		id: 'LOG-50015',
		timestamp: '2026-05-23 11:52:33',
		user: AUDIT_USERS[5],
		action: 'TRANSFER_CREATED',
		module: 'TRANSFERS',
		target: 'OKN-MA-30009',
		ipAddress: '196.200.18.92',
		status: 'SUCCESS',
		risk: 'LOW',
	},
	{
		id: 'LOG-50016',
		timestamp: '2026-05-23 12:08:22',
		user: AUDIT_USERS[1],
		action: 'COMPLIANCE_ALERT_REVIEWED',
		module: 'COMPLIANCE',
		target: 'AML-7003',
		ipAddress: '154.144.22.40',
		status: 'SUCCESS',
		risk: 'CRITICAL',
	},
	{
		id: 'LOG-50017',
		timestamp: '2026-05-22 23:55:48',
		user: AUDIT_USERS[6],
		action: 'PASSWORD_RESET_REQUEST',
		module: 'AUTH',
		target: 'CL-1003',
		ipAddress: '41.140.88.12',
		status: 'SUCCESS',
		risk: 'MEDIUM',
	},
	{
		id: 'LOG-50018',
		timestamp: '2026-05-22 22:14:11',
		user: AUDIT_USERS[7],
		action: 'CRON_DAILY_REPORT',
		module: 'REPORTS',
		target: 'volume-quotidien-2026-05-22',
		ipAddress: '10.0.0.12',
		status: 'SUCCESS',
		risk: 'LOW',
	},
];

export interface AuditKpi {
	key: string;
	label: string;
	icon: string;
	accent: string;
}

export const AUDIT_KPIS: AuditKpi[] = [
	{ key: 'TODAY', label: 'Actions aujourd\u2019hui', icon: 'lucideActivity', accent: 'bg-primary/10 text-primary' },
	{ key: 'LOGIN_FAILED', label: 'Connexions échouées', icon: 'lucideUserX', accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
	{ key: 'SENSITIVE', label: 'Modifications sensibles', icon: 'lucideShieldAlert', accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
	{ key: 'SECURITY_ALERTS', label: 'Alertes sécurité', icon: 'lucideTriangleAlert', accent: 'bg-destructive/10 text-destructive' },
	{ key: 'ADMIN_ACTIONS', label: 'Actions admin', icon: 'lucideShieldCheck', accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
	{ key: 'CRITICAL', label: 'Logs critiques', icon: 'lucideFlame', accent: 'bg-destructive/10 text-destructive' },
];
