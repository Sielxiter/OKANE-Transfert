export type DashboardRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_AGENT' | 'ROLE_CLIENT';

export interface SidebarSubItem {
	title: string;
	url?: string;
}

export interface SidebarItem {
	title: string;
	icon: string;
	url?: string;
	isActive?: boolean;
	badge?: number;
	items?: SidebarSubItem[];
}

export interface SidebarUser {
	name: string;
	email: string;
	avatar: string;
	roleLabel: string;
}

export interface SidebarData {
	user: SidebarUser;
	navMain: SidebarItem[];
}

const adminItems: SidebarItem[] = [
	{
		title: 'Tableau de bord',
		icon: 'lucideLayoutDashboard',
		url: '/admin/dashboard',
	},
	{
		title: 'Utilisateurs',
		icon: 'lucideUsers',
		items: [
			{ title: 'Clients', url: '/admin/users/clients' },
			{ title: 'Admins', url: '/admin/users/admins' },
			{ title: 'Managers', url: '/admin/users/managers' },
			{ title: 'Agents', url: '/admin/users/agents' },
		],
	},
	{
		title: 'Agences',
		icon: 'lucideBuilding2',
		url: '/admin/agencies',
		items: [
			{ title: 'Agences centrales', url: '/admin/agencies/central' },
			{ title: 'Sous-agences', url: '/admin/agencies/sub' },
		],
	},
	{
		title: 'Transferts',
		icon: 'lucideArrowRightLeft',
		url: '/admin/transfers',
	},
	{
		title: 'Paiements',
		icon: 'lucideWallet',
		url: '/admin/payments',
	},
	{
		title: 'Devises et change',
		icon: 'lucideCoins',
		url: '/admin/currency',
	},
	{
		title: 'Corridors de transfert',
		icon: 'lucideArrowRightLeft',
		url: '/admin/corridors',
	},
	{
		title: 'Frais et commissions',
		icon: 'lucideBadgePercent',
		url: '/admin/fees',
	},
	{
		title: 'Conformité / KYC',
		icon: 'lucideShieldCheck',
		url: '/admin/compliance',
	},
	{
		title: 'Rapports',
		icon: 'lucideBarChart3',
		url: '/admin/reports',
	},
	{
		title: "Journal d'audit",
		icon: 'lucideClipboardList',
		url: '/admin/audit',
	},
	{
		title: 'Paramètres',
		icon: 'lucideSettings2',
		url: '/admin/settings',
	},
];

const managerItems: SidebarItem[] = [
	{
		title: 'Tableau de bord',
		icon: 'lucideLayoutDashboard',
		url: '/manager/overview',
	},
	{
		title: 'Sous-Agences',
		icon: 'lucideBuilding2',
		url: '/manager/sub-agencies',
	},
	{
		title: 'Agents',
		icon: 'lucideUsers',
		url: '/manager/agents',
	},
	{
		title: 'Transferts',
		icon: 'lucideArrowRightLeft',
		url: '/manager/transfers',
	},
	{
		title: 'Validations en attente',
		icon: 'lucideClipboardCheck',
		url: '/manager/validations',
	},
	{
		title: 'Supervision Caisse',
		icon: 'lucideBanknote',
		url: '/manager/cash',
	},
	{
		title: 'Rapports',
		icon: 'lucideBarChart3',
		url: '/manager/reports',
	},
	{
		title: 'Alertes',
		icon: 'lucideBell',
		url: '/manager/alerts',
	},
	{
		title: "Journal d'audit",
		icon: 'lucideHistory',
		url: '/manager/audit-log',
	},
	{
		title: 'Profil',
		icon: 'lucideUser',
		url: '/manager/profile',
	},
];

const agentItems: SidebarItem[] = [
	{
		title: 'Tableau de bord',
		icon: 'lucideSquareTerminal',
		url: '/agent/dashboard',
		isActive: true,
	},
	{ title: 'Nouvel envoi', icon: 'lucideBookOpen', url: '/agent/new-transfer' },
	{ title: "Paiement d'un transfert", icon: 'lucideSettings2', url: '/agent/payout-transfer' },
	{ title: 'Clients', icon: 'lucideBot', url: '/agent/customers' },
	{ title: 'Gestion de caisse', icon: 'lucideSettings2', url: '/agent/cash-register' },
	{ title: 'Historique des transferts', icon: 'lucideBookOpen', url: '/agent/transfer-history' },
	{ title: 'Vérification KYC', icon: 'lucideSettings2', url: '/agent/kyc-verification' },
	{ title: 'Notifications', icon: 'lucideSettings2', url: '/agent/notifications' },
	{ title: 'Paramètres', icon: 'lucideSettings2', url: '/agent/settings' },
];

const clientItems: SidebarItem[] = [
	{
		title: 'Tableau de bord',
		icon: 'lucideLayoutDashboard',
		url: '/client/dashboard',
	},
	{
		title: 'Mes transferts',
		icon: 'lucideArrowRightLeft',
		url: '/client/transfers',
	},
	{
		title: 'Suivi transfert',
		icon: 'lucideSearch',
		url: '/client/track',
	},
	{
		title: 'Notifications',
		icon: 'lucideBell',
		url: '/client/notifications',
	},
	{
		title: 'Vérification KYC / AML',
		icon: 'lucideShieldCheck',
		url: '/client/kyc-verification',
	},
	{
		title: 'Profil',
		icon: 'lucideUser',
		url: '/client/profile',
	},
];

export const roleNavMap: Record<DashboardRole, SidebarItem[]> = {
	ROLE_ADMIN: adminItems,
	ROLE_MANAGER: managerItems,
	ROLE_AGENT: agentItems,
	ROLE_CLIENT: clientItems,
};

export function resolveRoleFromPath(pathname: string): DashboardRole {
	const normalized = pathname.toLowerCase();
	if (normalized.startsWith('/admin')) return 'ROLE_ADMIN';
	if (normalized.startsWith('/manager')) return 'ROLE_MANAGER';
	if (normalized.startsWith('/agent')) return 'ROLE_AGENT';
	return 'ROLE_CLIENT';
}

export function getSidebarData(role: DashboardRole, user?: Partial<SidebarUser>): SidebarData {
	return {
		user: {
			name: user?.name ?? 'Okane Transfer',
			email: user?.email ?? 'hello@okane.com',
			avatar: user?.avatar ?? '/assets/avatar.png',
			roleLabel: user?.roleLabel ?? role.replace('ROLE_', ''),
		},
		navMain: roleNavMap[role] ?? clientItems,
	};
}
