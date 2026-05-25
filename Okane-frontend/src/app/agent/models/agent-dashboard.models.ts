export type StatutTransfert = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'EN_ATTENTE' | 'PAYÉ' | 'PAYE' | 'ANNULÉ' | 'ANNULE' | 'EXPIRÉ' | 'EXPIRE';
export type StatutSessionCaisse = 'OPEN' | 'CLOSED';
export type TypeMouvementCaisse = 'IN' | 'OUT';
export type StatutKyc = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TypeNotification = 'INFO' | 'ALERT' | 'SUCCESS';
export type TypeNotificationBackend = TypeNotification | 'ERROR';
export type StatutNotification = 'UNREAD' | 'READ';

export interface StatistiquesTableauDeBord {
	soldeCaisse: number;
	transfertsJour: number;
	paiementsJour: number;
	transfertsEnAttente: number;
	devise: string;
}

export interface Transfert {
	id: string;
	codeReference: string;
	codeRetrait: string;
	nomExpediteur: string;
	telephoneExpediteur: string;
	nomBeneficiaire: string;
	telephoneBeneficiaire: string;
	beneficiaryDocumentType?: string;
	beneficiaryDocumentNumber?: string;
	paysDestination: string;
	montant: number;
	montantFrais: number;
	montantNet: number;
	statut: StatutTransfert;
	creeLe: string;
	devise: string;
	deviseSource?: string;
	deviseDestination?: string;
}

export interface TransferCreateRequest {
	senderFirstName: string;
	senderLastName: string;
	senderPhone: string;
	senderCountry: string;
	senderIdType: string;
	senderIdNumber: string;
	receiverFirstName: string;
	receiverLastName: string;
	receiverPhone: string;
	receiverCountry: string;
	beneficiaryDocumentType: string;
	beneficiaryDocumentNumber: string;
	destinationCountry: string;
	sourceCurrency: string;
	destinationCurrency: string;
	amountSent: number;
	fees: number;
	amountReceived: number;
	exchangeRate: number;
}

export interface TransferStatsResponse {
	soldeCaisse: number;
	transfertsJour: number;
	paiementsJour: number;
	transfertsEnAttente: number;
	devise: string;
}

export interface AgentFxContextResponse {
	sourceCountryCode: string;
	sourceCountryName: string;
	sourceCurrencyCode: string;
}

export interface CorridorDestinationResponse {
	countryCode: string;
	countryName: string;
	currencyCode: string | null;
}

export interface ExchangeRateResponse {
	fromCurrency: string;
	toCurrency: string;
	rate: number;
}

export interface PayoutRequest {
	transferId?: string;
	reference?: string;
	codeRetrait?: string;
	withdrawCode?: string;
	beneficiaryDocumentType: string;
	beneficiaryDocumentNumber: string;
}

export interface PayoutReceiptResponse {
	paidAt: string;
	paidBy: string;
	agencyName: string;
	receiverIdLabel: string;
}

export interface PayoutResponse {
	transfer: Transfert;
	receipt: PayoutReceiptResponse;
}

export interface SessionCaisse {
	id: string;
	soldeOuverture: number;
	soldeActuel: number;
	totalEntrees: number;
	totalSorties: number;
	montantAttendu: number;
	montantReel?: number | null;
	ecart: number;
	statut: StatutSessionCaisse;
	ouverteLe: string;
	clotureeLe?: string | null;
	devise: string;
	commentaireCloture?: string | null;
}

export interface MouvementCaisse {
	id: string;
	reference?: string | null;
	typeMouvement: TypeMouvementCaisse;
	montant: number;
	amountMad?: number;
	amountOriginal?: number;
	currencyOriginal?: string | null;
	exchangeRateToMad?: number;
	motif: string;
	creeLe: string;
}

export interface OpenCashSessionRequest {
	soldeOuverture: number;
}

export interface CloseCashSessionRequest {
	montantReel: number;
	commentaire?: string | null;
}

export interface Client {
	id: string;
	prenom: string;
	nom: string;
	telephone: string;
	pays: string;
	typePiece: 'CIN' | 'Passeport';
	numeroPiece: string;
	statutKyc: StatutKyc;
	creeLe: string;
}

export interface CreateCustomerRequest {
	prenom: string;
	nom: string;
	telephone: string;
	pays: string;
	typePiece: 'CIN' | 'Passeport';
	numeroPiece: string;
}

export interface VerificationKyc {
	id: string;
	nomClient: string;
	typeDocument: string;
	numeroDocument: string;
	statut: StatutKyc;
	notes: string;
	creeLe: string;
}

export interface NotificationAffichage {
	id: string;
	titre: string;
	message: string;
	type: TypeNotificationBackend;
	statut: StatutNotification;
	referenceLiee?: string | null;
	creeLe: string;
}

export interface PreferencesNotificationAgent {
	transferPaid: boolean;
	cashSession: boolean;
	systemAlerts: boolean;
	kycAlerts: boolean;
	cashDiscrepancy: boolean;
}

export interface ProfilAgent {
	id: number;
	fullName: string;
	email: string;
	agencyName: string | null;
	role: string | null;
	preferredLanguage: 'FR' | 'EN' | 'AR';
	notificationPreferences: PreferencesNotificationAgent;
}

export interface ProfilAgentUpdateRequest {
	fullName: string;
	preferredLanguage: 'FR' | 'EN' | 'AR';
	notificationPreferences: PreferencesNotificationAgent;
}
