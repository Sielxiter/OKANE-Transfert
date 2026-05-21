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
	title: 'Settings',
	icon: 'lucideSettings2',
	items: [
		{ title: 'Profile' },
		{ title: 'Change Password' },
		{ title: '2FA' },
		{ title: 'Notification Preferences' },
		{ title: 'Security Logs' },
		{ title: 'Language' },
		{ title: 'Theme' },
		{ title: 'Logout' },
	],
};

const adminItems: SidebarItem[] = [
	{
		title: 'Dashboard',
		icon: 'lucideSquareTerminal',
		url: '/admin/dashboard',
		isActive: true,
		items: [
			{ title: 'KPIs' },
			{ title: 'Total transfers' },
			{ title: 'Pending transfers' },
			{ title: 'Paid transfers' },
			{ title: 'Expired transfers' },
			{ title: 'Suspicious transfers' },
			{ title: 'Total commissions' },
			{ title: 'Total revenue' },
			{ title: 'Active agencies' },
			{ title: 'Active agents' },
		],
	},
	{
		title: 'Users',
		icon: 'lucideBot',
		items: [
			{ title: 'List users' },
			{ title: 'Create user' },
			{ title: 'Activate / suspend' },
			{ title: 'Assign roles' },
		],
	},
	{
		title: 'Agencies',
		icon: 'lucideBookOpen',
		items: [
			{ title: 'Create agency' },
			{ title: 'Edit agency' },
			{ title: 'Suspend' },
			{ title: 'Assign manager' },
			{ title: 'Set agency limits' },
		],
	},
	{ title: 'Managers', icon: 'lucideSettings2', items: [{ title: 'List managers' }, { title: 'Assign agencies' }] },
	{ title: 'Agents', icon: 'lucideSettings2', items: [{ title: 'List agents' }, { title: 'Create agent' }, { title: 'Enable / disable' }] },
	{ title: 'Clients', icon: 'lucideSettings2', items: [{ title: 'List clients' }, { title: 'Create client' }, { title: 'Suspend / restore' }] },
	{
		title: 'Transfers',
		icon: 'lucideBookOpen',
		items: [
			{ title: 'All transfers' },
			{ title: 'Search by OTP' },
			{ title: 'Filter by country' },
			{ title: 'Failed transfers' },
			{ title: 'Expired transfers' },
		],
	},
	{ title: 'Payments', icon: 'lucideBookOpen', items: [{ title: 'Payout history' }, { title: 'Pending payout' }, { title: 'Reversal' }] },
	{
		title: 'Currency & FX',
		icon: 'lucideBookOpen',
		items: [{ title: 'Manage currencies' }, { title: 'Live FX rates' }, { title: 'FX history' }],
	},
	{
		title: 'Fees & Commissions',
		icon: 'lucideSettings2',
		items: [{ title: 'Fee grid' }, { title: 'Simulation' }, { title: 'Agency share' }, { title: 'Central share' }],
	},
	{ title: 'Corridors', icon: 'lucideBookOpen', items: [{ title: 'Morocco → Senegal' }, { title: 'Create' }, { title: 'Activate' }, { title: 'Disable' }] },
	{
		title: 'Compliance / KYC',
		icon: 'lucideSettings2',
		items: [{ title: 'Flagged users' }, { title: 'Suspicious transactions' }, { title: 'Blacklist' }, { title: 'AML thresholds' }],
	},
	{ title: 'Reports', icon: 'lucideBookOpen', items: [{ title: 'Revenue' }, { title: 'Volume' }, { title: 'Transfer trends' }, { title: 'Monthly finance' }, { title: 'Exports' }] },
	{ title: 'Audit Logs', icon: 'lucideSettings2', items: [{ title: 'Who did what' }, { title: 'IP' }, { title: 'Timestamp' }, { title: 'Action type' }] },
	{ title: 'Mobile Money', icon: 'lucideBookOpen', items: [{ title: 'Operators' }, { title: 'Transfers' }, { title: 'Reconciliation' }] },
	{ title: 'Notifications', icon: 'lucideSettings2', items: [{ title: 'Templates' }, { title: 'Channels' }, { title: 'Delivery history' }] },
	{ title: 'Chatbot Monitoring', icon: 'lucideBot', items: [{ title: 'Conversations' }, { title: 'Alerts' }, { title: 'FAQ performance' }] },
	sharedSettings,
];

const managerItems: SidebarItem[] = [
	{
		title: 'Dashboard',
		icon: 'lucideSquareTerminal',
		url: '/manager/dashboard',
		isActive: true,
		items: [
			{ title: 'Agency balance' },
			{ title: 'Daily transfers' },
			{ title: 'Pending payouts' },
			{ title: 'Active agents' },
			{ title: 'Suspicious transfers' },
		],
	},
	{ title: 'Agents', icon: 'lucideBot', items: [{ title: 'Create agent' }, { title: 'Enable / disable' }, { title: 'Assign shifts' }] },
	{ title: 'Customers', icon: 'lucideBookOpen', items: [{ title: 'Agency customers' }, { title: 'KYC validation' }] },
	{
		title: 'Transfers',
		icon: 'lucideBookOpen',
		items: [{ title: 'Validate sensitive transfers' }, { title: 'Approve limits' }, { title: 'Pending transfers' }],
	},
	{ title: 'Payments', icon: 'lucideSettings2', items: [{ title: 'Payout history' }, { title: 'Pending payouts' }, { title: 'Reversal' }] },
	{ title: 'Cash Management', icon: 'lucideSettings2', items: [{ title: 'Cash sessions' }, { title: 'End day reconciliation' }, { title: 'Shortages' }] },
	{ title: 'Compliance', icon: 'lucideSettings2', items: [{ title: 'Suspicious transfers' }, { title: 'Watchlist' }, { title: 'KYC reviews' }] },
	{ title: 'Reports', icon: 'lucideBookOpen', items: [{ title: 'Agency performance' }, { title: 'Commissions' }] },
	{ title: 'Notifications', icon: 'lucideSettings2', items: [{ title: 'Templates' }, { title: 'Channels' }] },
	sharedSettings,
];

const agentItems: SidebarItem[] = [
	{
		title: 'Dashboard',
		icon: 'lucideSquareTerminal',
		url: '/agent/dashboard',
		isActive: true,
		items: [
			{ title: 'Current cash balance' },
			{ title: 'Transfers today' },
			{ title: 'Payouts today' },
		],
	},
	{
		title: 'New Transfer',
		icon: 'lucideBookOpen',
		items: [
			{ title: 'Sender: name' },
			{ title: 'Sender: phone' },
			{ title: 'Sender: CIN / passport' },
			{ title: 'Receiver: name' },
			{ title: 'Receiver: phone' },
			{ title: 'Receiver: country' },
			{ title: 'Transfer: amount' },
			{ title: 'Transfer: currency' },
			{ title: 'Transfer: destination' },
			{ title: 'System: fee calc' },
			{ title: 'System: net amount' },
			{ title: 'System: OTP code' },
			{ title: 'System: receipt' },
		],
	},
	{
		title: 'Payout Transfer',
		icon: 'lucideSettings2',
		items: [{ title: 'Search OTP' }, { title: 'Beneficiary phone' }, { title: 'Verify ID' }, { title: 'Payout' }, { title: 'Update status' }],
	},
	{ title: 'Customers', icon: 'lucideBot', items: [{ title: 'Search' }, { title: 'Create customer' }, { title: 'Update profile' }] },
	{
		title: 'Cash Register',
		icon: 'lucideSettings2',
		items: [{ title: 'Opening balance' }, { title: 'Deposits' }, { title: 'Withdrawals' }, { title: 'Closing balance' }, { title: 'Shortage report' }],
	},
	{ title: 'Transfer History', icon: 'lucideBookOpen', items: [{ title: 'Today' }, { title: 'Pending' }, { title: 'Completed' }] },
	{ title: 'KYC Verification', icon: 'lucideSettings2', items: [{ title: 'Verify documents' }, { title: 'Risk score' }, { title: 'Blacklist check' }] },
	{ title: 'Notifications', icon: 'lucideSettings2', items: [{ title: 'Inbox' }, { title: 'Alerts' }] },
	sharedSettings,
];

const clientItems: SidebarItem[] = [
	{
		title: 'Dashboard',
		icon: 'lucideSquareTerminal',
		url: '/client/dashboard',
		isActive: true,
		items: [
			{ title: 'Recent transfers' },
			{ title: 'Pending' },
			{ title: 'Completed' },
			{ title: 'Wallet balance' },
			{ title: 'Alerts' },
		],
	},
	{ title: 'Send Money', icon: 'lucideBookOpen', items: [{ title: 'Online transfer simulation' }] },
	{
		title: 'Track Transfer',
		icon: 'lucideSettings2',
		items: [{ title: 'Search by OTP' }, { title: 'Search by reference' }],
	},
	{ title: 'History', icon: 'lucideBookOpen', items: [{ title: 'Date' }, { title: 'Status' }, { title: 'Amount' }, { title: 'Corridor' }] },
	{ title: 'Beneficiaries', icon: 'lucideBot', items: [{ title: 'Add beneficiary' }, { title: 'Edit' }, { title: 'Favorites' }] },
	{ title: 'Wallet / Mobile Money', icon: 'lucideSettings2', items: [{ title: 'Orange Money' }, { title: 'Wave' }, { title: 'M-Pesa' }] },
	{ title: 'Notifications', icon: 'lucideSettings2', items: [{ title: 'Alerts' }, { title: 'Delivery history' }] },
	{ title: 'Chatbot', icon: 'lucideBot', items: [{ title: 'Fees' }, { title: 'Transfer status' }, { title: 'Delays' }, { title: 'FAQ' }] },
	{ title: 'Profile', icon: 'lucideBookOpen', items: [{ title: 'Account' }, { title: 'Security' }] },
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
	return {
		user: {
			name: user?.name ?? 'Okane Transfer',
			email: user?.email ?? 'hello@okane.com',
			avatar: user?.avatar ?? '/assets/avatar.png',
			roleLabel: user?.roleLabel ?? role.replace('ROLE_', ''),
		},
		navMain: roleNavMap[role] ?? clientItems,
		navSecondary: [
			{ title: 'Support', url: '.', icon: 'lucideLifeBuoy' },
			{ title: 'Feedback', url: '.', icon: 'lucideSend' },
		],
		projects: [
			{ name: 'Design Engineering', url: '.', icon: 'lucideFrame' },
			{ name: 'Sales & Marketing', url: '.', icon: 'lucideChartPie' },
			{ name: 'Travel', url: '.', icon: 'lucideMap' },
		],
	};
}
