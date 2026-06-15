export type ClientTransferStatus = 'EN_ATTENTE' | 'PAYE' | 'ANNULE' | 'EXPIRE' | 'SUSPECT';

export interface PageResponse<T> {
	content: T[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

export interface ClientDashboardSummary {
	totalTransfers: number;
	pendingTransfers: number;
	paidTransfers: number;
	cancelledTransfers: number;
	expiredTransfers: number;
	totalSentAmount: number;
	totalReceivedAmount: number;
	totalFeesPaid: number;
	defaultCurrency: string;
}

export interface ClientTransferListItem {
	reference: string;
	beneficiaryFullName: string;
	sendCountry: string;
	receiveCountry: string;
	sendAmount: number;
	sendCurrency: string;
	receiveAmount: number;
	receiveCurrency: string;
	fees: number;
	status: ClientTransferStatus;
	createdAt: string;
}

export interface TransferStatusHistory {
	status: ClientTransferStatus | string;
	label: string;
	description: string;
	createdAt: string;
}

export interface ClientTransferDetails extends ClientTransferListItem {
	senderFullName: string;
	senderPhone: string | null;
	beneficiaryPhone: string | null;
	exchangeRate: number;
	agencyName: string | null;
	payoutAgencyName: string | null;
	statusHistory: TransferStatusHistory[];
}

export interface ClientTrackTransfer extends Pick<ClientTransferDetails, 'reference' | 'beneficiaryFullName' | 'sendAmount' | 'sendCurrency' | 'receiveAmount' | 'receiveCurrency' | 'status' | 'createdAt' | 'statusHistory'> {
	receiveCountry: string;
}

export interface ClientNotification {
	id: number;
	title: string;
	message: string;
	type: string;
	read: boolean;
	createdAt: string;
	transferReference?: string | null;
}

export interface ClientProfile {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	country: string;
	preferredLanguage: 'fr' | 'en' | 'ar';
	emailNotificationsEnabled: boolean;
	smsNotificationsEnabled: boolean;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export interface NotificationPreferencesRequest {
	emailNotificationsEnabled: boolean;
	smsNotificationsEnabled: boolean;
}
