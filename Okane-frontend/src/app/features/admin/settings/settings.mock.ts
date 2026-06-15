import type { LocaleCode } from '../../../shared/i18n/i18n.translations';
export interface AdminProfile {
	fullName: string;
	email: string;
	phone: string;
	role: string;
	roleLabel: string;
	avatarInitials: string;
	lastLogin: string;
}

export const ADMIN_PROFILE_MOCK: AdminProfile = {
	fullName: 'Sara El Idrissi',
	email: 'sara.elidrissi@okane.test',
	phone: '+212 6 22 41 88 03',
	role: 'ROLE_ADMIN',
	roleLabel: 'Administrateur',
	avatarInitials: 'SE',
	lastLogin: '2026-05-23 09:14',
};

export interface AdminSession {
	id: string;
	device: string;
	browser: string;
	location: string;
	ipAddress: string;
	startedAt: string;
	current: boolean;
}

export const ADMIN_SESSIONS_MOCK: AdminSession[] = [
	{
		id: 'SES-1',
		device: 'MacBook Pro',
		browser: 'Chrome 124',
		location: 'Casablanca, Maroc',
		ipAddress: '154.144.22.40',
		startedAt: '2026-05-23 09:14',
		current: true,
	},
	{
		id: 'SES-2',
		device: 'iPhone 15',
		browser: 'Safari Mobile',
		location: 'Rabat, Maroc',
		ipAddress: '41.140.18.72',
		startedAt: '2026-05-22 19:42',
		current: false,
	},
	{
		id: 'SES-3',
		device: 'Windows 11 PC',
		browser: 'Edge 122',
		location: 'Casablanca, Maroc',
		ipAddress: '154.144.22.18',
		startedAt: '2026-05-21 08:55',
		current: false,
	},
];

export interface SettingToggle {
	key: string;
	label: string;
	description: string;
	value: boolean;
}

export const NOTIFICATION_TOGGLES_MOCK: SettingToggle[] = [
	{
		key: 'email',
		label: 'Notifications email',
		description: 'Recevoir les rapports et alertes administratives par email.',
		value: true,
	},
	{
		key: 'system',
		label: 'Notifications systÃ¨me',
		description: 'Notifications dans l\u2019interface pour les Ã©vÃ©nements systÃ¨me.',
		value: true,
	},
	{
		key: 'compliance',
		label: 'Alertes conformitÃ©',
		description: 'Alertes KYC, AML et dÃ©clenchements blacklist.',
		value: true,
	},
	{
		key: 'payments',
		label: 'Alertes paiements',
		description: 'Notifications des paiements bloquÃ©s ou Ã©chouÃ©s.',
		value: false,
	},
	{
		key: 'suspicious',
		label: 'Alertes transferts suspects',
		description: 'Notifications immÃ©diates sur transferts Ã  risque Ã©levÃ©/critique.',
		value: true,
	},
];

export const SECURITY_TOGGLES_MOCK: SettingToggle[] = [
	{
		key: 'twoFa',
		label: 'Authentification Ã  deux facteurs',
		description: 'Code OTP Ã  la connexion sur appareil non reconnu.',
		value: true,
	},
	{
		key: 'securityAlerts',
		label: 'Alertes sÃ©curitÃ©',
		description: 'Recevoir une alerte Ã  chaque connexion ou tentative suspecte.',
		value: true,
	},
];

export type LanguageCode = LocaleCode;
export type ThemeMode = 'system' | 'light' | 'dark';
export type DefaultCurrency = 'MAD' | 'EUR' | 'USD';

export interface AdminPreferences {
	language: LanguageCode;
	theme: ThemeMode;
	currency: DefaultCurrency;
	timezone: string;
}

export const ADMIN_PREFERENCES_MOCK: AdminPreferences = {
	language: 'fr',
	theme: 'system',
	currency: 'MAD',
	timezone: 'Africa/Casablanca',
};

export const SUPPORTED_LANGUAGES: { value: LanguageCode; label: string }[] = [
	{ value: 'fr', label: 'Français' },
	{ value: 'en', label: 'English' },
	{ value: 'ar', label: 'العربية' },
];

export const SUPPORTED_THEMES: { value: ThemeMode; label: string }[] = [
	{ value: 'system', label: 'SystÃ¨me' },
	{ value: 'light', label: 'Clair' },
	{ value: 'dark', label: 'Sombre' },
];

export const SUPPORTED_CURRENCIES: { value: DefaultCurrency; label: string }[] = [
	{ value: 'MAD', label: 'MAD â€” Dirham marocain' },
	{ value: 'EUR', label: 'EUR â€” Euro' },
	{ value: 'USD', label: 'USD â€” Dollar amÃ©ricain' },
];

export const SUPPORTED_TIMEZONES: string[] = [
	'Africa/Casablanca',
	'Africa/Dakar',
	'Africa/Abidjan',
	'Europe/Paris',
	'Europe/Madrid',
	'UTC',
];

export interface SystemSetting {
	key: string;
	label: string;
	description: string;
	value: string;
	icon: string;
	editable: boolean;
}

export const SYSTEM_SETTINGS_MOCK: SystemSetting[] = [
	{
		key: 'access_token_ttl',
		label: 'DurÃ©e du jeton d\u2019accÃ¨s',
		description: 'ValiditÃ© d\u2019un access token JWT.',
		value: '1 heure',
		icon: 'lucideClock',
		editable: false,
	},
	{
		key: 'refresh_token_ttl',
		label: 'DurÃ©e du refresh token',
		description: 'ValiditÃ© d\u2019un refresh token JWT.',
		value: '7 jours',
		icon: 'lucideClock',
		editable: false,
	},
	{
		key: 'login_attempts',
		label: 'Tentatives de connexion max',
		description: 'Nombre max d\u2019Ã©checs avant verrouillage temporaire.',
		value: '5 / 10 min',
		icon: 'lucideShieldAlert',
		editable: false,
	},
	{
		key: 'bcrypt_strength',
		label: 'Force BCrypt',
		description: 'CoÃ»t de hachage utilisÃ© pour les mots de passe.',
		value: '12',
		icon: 'lucideKeyRound',
		editable: false,
	},
];
