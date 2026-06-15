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
	navSecondary: {
		title: string;
		url: string;
		icon: string;
	}[];
	projects: {
		name: string;
		url: string;
		icon: string;
	}[];
}

const sharedSettings: SidebarItem = {
	title: 'Paramètres',
	icon: 'lucideSettings2',
	items: [
		{ title: 'Profil' },
		{ title: 'Changer le mot de passe' },
		{ title: '2FA' },
		{ title: 'Préférences de notification' },
		{ title: 'Journaux de sécurité' },
		{ title: 'Langue' },
		{ title: 'Thème' },
		{ title: 'Déconnexion' },
	],
};

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
		icon: 'lucideSquareTerminal',
		url: '/manager/dashboard',
		isActive: true,
		items: [
			{ title: 'Solde agence' },
			{ title: 'Transferts du jour' },
			{ title: 'Paiements en attente' },
			{ title: 'Agents actifs' },
			{ title: 'Transferts suspects' },
		],
	},
	{ title: 'Agents', icon: 'lucideBot', items: [{ title: 'Créer un agent' }, { title: 'Activer / désactiver' }, { title: 'Affecter les horaires' }] },
	{ title: 'Clients', icon: 'lucideBookOpen', items: [{ title: "Clients de l'agence" }, { title: 'Validation KYC' }] },
	{
		title: 'Transferts',
		icon: 'lucideBookOpen',
		items: [{ title: 'Valider les transferts sensibles' }, { title: 'Approuver les plafonds' }, { title: 'Transferts en attente' }],
	},
	{ title: 'Paiements', icon: 'lucideSettings2', items: [{ title: 'Historique des paiements' }, { title: 'Paiements en attente' }, { title: 'Annulation' }] },
	{ title: 'Gestion de caisse', icon: 'lucideSettings2', items: [{ title: 'Sessions de caisse' }, { title: 'Réconciliation fin de journée' }, { title: 'Écarts' }] },
	{ title: 'Conformité', icon: 'lucideSettings2', items: [{ title: 'Transferts suspects' }, { title: 'Liste de surveillance' }, { title: 'Revues KYC' }] },
	{ title: 'Rapports', icon: 'lucideBookOpen', items: [{ title: 'Performance agence' }, { title: 'Commissions' }] },
	{ title: 'Notifications', icon: 'lucideSettings2', items: [{ title: 'Modèles' }, { title: 'Canaux' }] },
	sharedSettings,
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
		icon: 'lucideSquareTerminal',
		url: '/client/dashboard',
		isActive: true,
		items: [
			{ title: 'Transferts récents' },
			{ title: 'En attente' },
			{ title: 'Terminés' },
			{ title: 'Solde wallet' },
			{ title: 'Alertes' },
		],
	},
	{ title: "Envoyer de l'argent", icon: 'lucideBookOpen', items: [{ title: 'Simulation de transfert en ligne' }] },
	{
		title: 'Suivi du transfert',
		icon: 'lucideSettings2',
		items: [{ title: 'Recherche par OTP' }, { title: 'Recherche par référence' }],
	},
	{ title: 'Historique', icon: 'lucideBookOpen', items: [{ title: 'Date' }, { title: 'Statut' }, { title: 'Montant' }, { title: 'Corridor' }] },
	{ title: 'Bénéficiaires', icon: 'lucideBot', items: [{ title: 'Ajouter un bénéficiaire' }, { title: 'Modifier' }, { title: 'Favoris' }] },
	{ title: 'Wallet / Mobile Money', icon: 'lucideSettings2', items: [{ title: 'Orange Money' }, { title: 'Wave' }, { title: 'M-Pesa' }] },
	{ title: 'Notifications', icon: 'lucideSettings2', items: [{ title: 'Alertes' }, { title: "Historique d'envoi" }] },
	{ title: 'Chatbot', icon: 'lucideBot', items: [{ title: 'Frais' }, { title: 'Statut du transfert' }, { title: 'Délais' }, { title: 'FAQ' }] },
	{ title: 'Profil', icon: 'lucideBookOpen', items: [{ title: 'Compte' }, { title: 'Sécurité' }] },
	sharedSettings,
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
	const isAgent = role === 'ROLE_AGENT';
	const isAdmin = role === 'ROLE_ADMIN';

	return {
		user: {
			name: user?.name ?? 'Okane Transfer',
			email: user?.email ?? 'hello@okane.com',
			avatar: user?.avatar ?? '/assets/avatar.png',
			roleLabel: user?.roleLabel ?? role.replace('ROLE_', ''),
		},
		navMain: roleNavMap[role] ?? clientItems,
		navSecondary: isAgent || isAdmin
			? []
			: [
				{ title: 'Assistance', url: '.', icon: 'lucideLifeBuoy' },
				{ title: 'Retour utilisateur', url: '.', icon: 'lucideSend' },
			],
		projects: isAgent || isAdmin
			? []
			: [
				{ name: 'Conception produit', url: '.', icon: 'lucideFrame' },
				{ name: 'Ventes et marketing', url: '.', icon: 'lucideChartPie' },
				{ name: 'Voyage', url: '.', icon: 'lucideMap' },
			],
	};
}

