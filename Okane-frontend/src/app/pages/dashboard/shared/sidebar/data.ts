export type DashboardRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_AGENT' | 'ROLE_CLIENT';

export interface SidebarSubItem {
	title: string;
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
		icon: 'lucideSquareTerminal',
		url: '/admin/dashboard',
		isActive: true,
		items: [
			{ title: 'Indicateurs' },
			{ title: 'Total des transferts' },
			{ title: 'Transferts en attente' },
			{ title: 'Transferts payés' },
			{ title: 'Transferts expirés' },
			{ title: 'Transferts suspects' },
			{ title: 'Total des commissions' },
			{ title: "Chiffre d'affaires total" },
			{ title: 'Agences actives' },
			{ title: 'Agents actifs' },
		],
	},
	{
		title: 'Utilisateurs',
		icon: 'lucideBot',
		items: [
			{ title: 'Liste des utilisateurs' },
			{ title: 'Créer un utilisateur' },
			{ title: 'Activer / suspendre' },
			{ title: 'Affecter les rôles' },
		],
	},
	{
		title: 'Agences',
		icon: 'lucideBookOpen',
		items: [
			{ title: 'Créer une agence' },
			{ title: 'Modifier une agence' },
			{ title: 'Suspendre' },
			{ title: 'Affecter un manager' },
			{ title: 'Définir les plafonds' },
		],
	},
	{ title: 'Managers', icon: 'lucideSettings2', items: [{ title: 'Liste des managers' }, { title: 'Affecter les agences' }] },
	{ title: 'Agents', icon: 'lucideSettings2', items: [{ title: 'Liste des agents' }, { title: 'Créer un agent' }, { title: 'Activer / désactiver' }] },
	{ title: 'Clients', icon: 'lucideSettings2', items: [{ title: 'Liste des clients' }, { title: 'Créer un client' }, { title: 'Suspendre / réactiver' }] },
	{
		title: 'Transferts',
		icon: 'lucideBookOpen',
		items: [
			{ title: 'Tous les transferts' },
			{ title: 'Recherche par OTP' },
			{ title: 'Filtrer par pays' },
			{ title: 'Transferts échoués' },
			{ title: 'Transferts expirés' },
		],
	},
	{ title: 'Paiements', icon: 'lucideBookOpen', items: [{ title: 'Historique des paiements' }, { title: 'Paiements en attente' }, { title: 'Annulation' }] },
	{
		title: 'Devises et change',
		icon: 'lucideBookOpen',
		items: [{ title: 'Gérer les devises' }, { title: 'Taux de change en direct' }, { title: 'Historique du change' }],
	},
	{
		title: 'Frais et commissions',
		icon: 'lucideSettings2',
		items: [{ title: 'Grille tarifaire' }, { title: 'Simulation' }, { title: 'Part agence' }, { title: 'Part centrale' }],
	},
	{ title: 'Corridors', icon: 'lucideBookOpen', items: [{ title: 'Maroc -> Sénégal' }, { title: 'Créer' }, { title: 'Activer' }, { title: 'Désactiver' }] },
	{
		title: 'Conformité / KYC',
		icon: 'lucideSettings2',
		items: [{ title: 'Utilisateurs signalés' }, { title: 'Transactions suspectes' }, { title: 'Liste noire' }, { title: 'Seuils AML' }],
	},
	{ title: 'Rapports', icon: 'lucideBookOpen', items: [{ title: 'Revenus' }, { title: 'Volume' }, { title: 'Tendances des transferts' }, { title: 'Finance mensuelle' }, { title: 'Exports' }] },
	{ title: "Journal d'audit", icon: 'lucideSettings2', items: [{ title: 'Qui a fait quoi' }, { title: 'IP' }, { title: 'Horodatage' }, { title: "Type d'action" }] },
	{ title: 'Mobile Money', icon: 'lucideBookOpen', items: [{ title: 'Opérateurs' }, { title: 'Transferts' }, { title: 'Réconciliation' }] },
	{ title: 'Notifications', icon: 'lucideSettings2', items: [{ title: 'Modèles' }, { title: 'Canaux' }, { title: "Historique d'envoi" }] },
	{ title: 'Supervision chatbot', icon: 'lucideBot', items: [{ title: 'Conversations' }, { title: 'Alertes' }, { title: 'Performance FAQ' }] },
	sharedSettings,
];

const managerItems: SidebarItem[] = [
	{
		title: 'Tableau de bord',
		icon: 'lucideSquareTerminal',
		url: '/manager/dashboard',
		isActive: true,
	},
	{ title: 'Agents', icon: 'lucideBot', url: '/manager/agents'},
	{ title: 'Clients', icon: 'lucideBookOpen', url: '/manager/clients' },
	{
		title: 'Transferts',
		icon: 'lucideBookOpen',
		items: [{ title: 'Valider les transferts sensibles' }, { title: 'Approuver les plafonds' }, { title: 'Transferts en attente' }],
	},
	{ title: 'Paiements', icon: 'lucideSettings2', url: '/manager/payments' },
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

	return {
		user: {
			name: user?.name ?? 'Okane Transfer',
			email: user?.email ?? 'hello@okane.com',
			avatar: user?.avatar ?? '/assets/avatar.png',
			roleLabel: user?.roleLabel ?? role.replace('ROLE_', ''),
		},
		navMain: roleNavMap[role] ?? clientItems,
		navSecondary: isAgent
			? []
			: [
				{ title: 'Assistance', url: '.', icon: 'lucideLifeBuoy' },
				{ title: 'Retour utilisateur', url: '.', icon: 'lucideSend' },
			],
		projects: isAgent
			? []
			: [
				{ name: 'Conception produit', url: '.', icon: 'lucideFrame' },
				{ name: 'Ventes et marketing', url: '.', icon: 'lucideChartPie' },
				{ name: 'Voyage', url: '.', icon: 'lucideMap' },
			],
	};
}
