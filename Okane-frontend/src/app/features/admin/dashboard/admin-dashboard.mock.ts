export type AdminKpiTrend = 'up' | 'down';

export interface AdminKpi {
	title: string;
	value: string;
	change: string;
	trend: AdminKpiTrend;
	icon: string;
	accent: string;
	note: string;
}

export interface AdminActivity {
	title: string;
	time: string;
	icon: string;
	accent: string;
}

export interface AdminAlert {
	title: string;
	description: string;
	badge: string;
	accent: string;
}

export interface AdminQuickAction {
	label: string;
	link: string;
	icon: string;
	accent: string;
}

export interface AdminAnalyticsPlaceholder {
	title: string;
	description: string;
	accent: string;
}

export const adminKpis: AdminKpi[] = [
	{
		title: 'Total Utilisateurs',
		value: '12 480',
		change: '+8,4%',
		trend: 'up',
		icon: 'lucideUsers',
		accent: 'bg-primary/10 text-primary',
		note: 'Depuis le mois dernier',
	},
	{
		title: 'Agences Actives',
		value: '184',
		change: '+2,1%',
		trend: 'up',
		icon: 'lucideBuilding2',
		accent: 'bg-secondary/50 text-secondary-foreground',
		note: 'Réseau opérationnel',
	},
	{
		title: 'Transferts Aujourd’hui',
		value: '2 346',
		change: '+12,9%',
		trend: 'up',
		icon: 'lucideArrowRightLeft',
		accent: 'bg-accent/50 text-accent-foreground',
		note: 'Flux en temps réel',
	},
	{
		title: 'Paiements en attente',
		value: '27',
		change: '-4,0%',
		trend: 'down',
		icon: 'lucideWallet',
		accent: 'bg-muted text-muted-foreground',
		note: 'À traiter aujourd’hui',
	},
	{
		title: 'Revenus Totaux',
		value: '4,82M DH',
		change: '+15,7%',
		trend: 'up',
		icon: 'lucideCoins',
		accent: 'bg-primary/10 text-primary',
		note: 'Cumul de période',
	},
	{
		title: 'Agents Actifs',
		value: '96',
		change: '+3,8%',
		trend: 'up',
		icon: 'lucideUserCheck',
		accent: 'bg-secondary/50 text-secondary-foreground',
		note: 'Connectés aujourd’hui',
	},
	{
		title: 'Transactions Suspectes',
		value: '14',
		change: '+1,3%',
		trend: 'up',
		icon: 'lucideShieldAlert',
		accent: 'bg-destructive/10 text-destructive',
		note: 'Sous revue KYC',
	},
	{
		title: 'Volume Mensuel',
		value: '38,4M DH',
		change: '+9,8%',
		trend: 'up',
		icon: 'lucideBarChart3',
		accent: 'bg-primary/10 text-primary',
		note: 'Sur 30 jours',
	},
];

export const adminActivities: AdminActivity[] = [
	{ title: 'Nouveau transfert créé', time: 'Il y a 5 min', icon: 'lucideSend', accent: 'bg-primary/10 text-primary' },
	{ title: 'Paiement validé', time: 'Il y a 12 min', icon: 'lucideBadgeCheck', accent: 'bg-secondary/50 text-secondary-foreground' },
	{ title: 'Agent ajouté', time: 'Il y a 24 min', icon: 'lucideUserPlus', accent: 'bg-accent/50 text-accent-foreground' },
	{ title: 'Taux de change mis à jour', time: 'Il y a 41 min', icon: 'lucideArrowUpDown', accent: 'bg-muted text-muted-foreground' },
	{ title: 'Alerte KYC détectée', time: 'Il y a 58 min', icon: 'lucideShieldAlert', accent: 'bg-destructive/10 text-destructive' },
	{ title: 'Nouveau client inscrit', time: 'Il y a 1 h', icon: 'lucideUserRound', accent: 'bg-primary/10 text-primary' },
];

export const adminAlerts: AdminAlert[] = [
	{
		title: '3 transactions suspectes',
		description: 'Dossiers en attente de validation conformité.',
		badge: 'Critique',
		accent: 'border-destructive/20 bg-destructive/5 text-destructive',
	},
	{
		title: '2 agences à faible activité',
		description: 'Volume inférieur au seuil attendu sur 7 jours.',
		badge: 'Surveillance',
		accent: 'border-secondary/20 bg-secondary/10 text-secondary-foreground',
	},
	{
		title: '1 agent suspendu',
		description: 'Suspension temporaire en attente de revue.',
		badge: 'Sécurité',
		accent: 'border-border bg-card text-foreground',
	},
	{
		title: 'KYC review pending',
		description: 'Contrôles documents et identité à finaliser.',
		badge: 'Action requise',
		accent: 'border-primary/20 bg-primary/5 text-primary',
	},
];

export const adminQuickActions: AdminQuickAction[] = [
	{ label: 'Ajouter un utilisateur', link: '/admin/users/admins', icon: 'lucideUserPlus', accent: 'text-primary' },
	{ label: 'Créer une agence', link: '/admin/agencies', icon: 'lucideBuilding2', accent: 'text-secondary-foreground' },
	{ label: 'Voir transferts', link: '/admin/transfers', icon: 'lucideArrowRightLeft', accent: 'text-accent-foreground' },
	{ label: 'Vérifier conformité', link: '/admin/compliance', icon: 'lucideShieldCheck', accent: 'text-destructive' },
	{ label: 'Générer rapport', link: '/admin/reports', icon: 'lucideFileText', accent: 'text-primary' },
];

export const adminAnalytics: AdminAnalyticsPlaceholder[] = [
	{
		title: 'Transfer Trend',
		description: 'Préparation des volumes de transferts pour la Phase 3.',
		accent: 'bg-primary/10',
	},
	{
		title: 'Revenue Trend',
		description: 'Emplacement réservé pour les courbes de revenus.',
		accent: 'bg-secondary/50',
	},
	{
		title: 'User Growth',
		description: 'Structure prête pour les futures analyses d’acquisition.',
		accent: 'bg-accent/50',
	},
];
