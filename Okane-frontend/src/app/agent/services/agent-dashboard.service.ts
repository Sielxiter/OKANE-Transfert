import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import {
	Client,
	CloseCashSessionRequest,
	CreateCustomerRequest,
	CorridorDestinationResponse,
	ExchangeRateResponse,
	AgentFxContextResponse,
	MouvementCaisse,
	NotificationAffichage,
	OpenCashSessionRequest,
	PayoutRequest,
	PayoutResponse,
	ProfilAgent,
	ProfilAgentUpdateRequest,
	SessionCaisse,
	StatistiquesTableauDeBord,
	TransferCreateRequest,
	TransferStatsResponse,
	Transfert,
	VerificationKyc,
} from '../models/agent-dashboard.models';

@Injectable({ providedIn: 'root' })
export class AgentDashboardService {
	private readonly _http = inject(HttpClient);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly _baseUrl = '/api/agent/clients';
	private readonly _cashBaseUrl = '/api/agent/cash';
	private readonly _transferBaseUrl = '/api/agent/transfers';
	private readonly _notificationBaseUrl = '/api/agent/notifications';
	private readonly _profileBaseUrl = '/api/agent/profile';
	private readonly _fxBaseUrl = '/api/agent/fx';
	private readonly _currency = 'MAD';

	private readonly _customers: Client[] = [
		{
			id: 'cus-01',
			prenom: 'Amina',
			nom: 'El Idrissi',
			telephone: '+212612345678',
			pays: 'Maroc',
			typePiece: 'CIN',
			numeroPiece: 'BK778899',
			statutKyc: 'APPROVED',
			creeLe: '2026-05-12T13:20:00Z',
		},
		{
			id: 'cus-02',
			prenom: 'Yassine',
			nom: 'Ben Ali',
			telephone: '+212611223344',
			pays: 'Maroc',
			typePiece: 'Passeport',
			numeroPiece: 'MA-1234567',
			statutKyc: 'PENDING',
			creeLe: '2026-05-18T10:40:00Z',
		},
		{
			id: 'cus-03',
			prenom: 'Khadija',
			nom: 'Rahmani',
			telephone: '+212699998877',
			pays: 'Maroc',
			typePiece: 'CIN',
			numeroPiece: 'BK665544',
			statutKyc: 'REJECTED',
			creeLe: '2026-05-20T09:05:00Z',
		},
	];

	private readonly _kycItems: VerificationKyc[] = [
		{
			id: 'kyc-01',
			nomClient: 'Yassine Ben Ali',
			typeDocument: 'Passeport',
			numeroDocument: 'MA-1234567',
			statut: 'PENDING',
			notes: 'Photo a clarifier',
			creeLe: '2026-05-22T07:10:00Z',
		},
		{
			id: 'kyc-02',
			nomClient: 'Khadija Rahmani',
			typeDocument: 'CNI',
			numeroDocument: 'BK778899',
			statut: 'REJECTED',
			notes: 'Document expire',
			creeLe: '2026-05-21T16:15:00Z',
		},
	];

	getDashboardStats(): Observable<StatistiquesTableauDeBord> {
		if (!this._isBrowser) {
			return of({
				soldeCaisse: 0,
				transfertsJour: 0,
				paiementsJour: 0,
				transfertsEnAttente: 0,
				devise: this._currency,
			});
		}
		return this._http.get<TransferStatsResponse>(`${this._transferBaseUrl}/stats`).pipe(
			map((stats) => ({
				soldeCaisse: stats.soldeCaisse,
				transfertsJour: stats.transfertsJour,
				paiementsJour: stats.paiementsJour,
				transfertsEnAttente: stats.transfertsEnAttente,
				devise: stats.devise ?? this._currency,
			}))
		);
	}

	getRecentTransfers(): Observable<Transfert[]> {
		if (!this._isBrowser) {
			return of([]);
		}
		return this._http.get<Transfert[]>(`${this._transferBaseUrl}/recent?limit=4`);
	}

	getTransferHistory(): Observable<Transfert[]> {
		if (!this._isBrowser) {
			return of([]);
		}
		return this._http.get<Transfert[]>(this._transferBaseUrl);
	}

	getFxContext(): Observable<AgentFxContextResponse> {
		return this._http.get<AgentFxContextResponse>(`${this._fxBaseUrl}/context`);
	}

	getCorridorDestinations(): Observable<CorridorDestinationResponse[]> {
		return this._http.get<CorridorDestinationResponse[]>(`${this._fxBaseUrl}/corridors`);
	}

	getExchangeRate(fromCurrency: string, toCurrency: string): Observable<ExchangeRateResponse> {
		const params = new URLSearchParams({ from: fromCurrency, to: toCurrency });
		return this._http.get<ExchangeRateResponse>(`${this._fxBaseUrl}/exchange-rate?${params.toString()}`);
	}

	createTransfer(payload: TransferCreateRequest): Observable<Transfert> {
		return this._http.post<Transfert>(this._transferBaseUrl, payload);
	}

	searchTransfer(reference?: string, phone?: string): Observable<Transfert> {
		const params = new URLSearchParams();
		if (reference) {
			params.set('reference', reference);
		}
		if (phone) {
			params.set('phone', phone);
		}
		const query = params.toString();
		const url = query ? `${this._transferBaseUrl}/search?${query}` : `${this._transferBaseUrl}/search`;
		return this._http.get<Transfert>(url);
	}

	payTransfer(transferId: string, payload: PayoutRequest): Observable<PayoutResponse> {
		return this._http.post<PayoutResponse>(`${this._transferBaseUrl}/${transferId}/payout`, payload);
	}

	getCashSession(): Observable<SessionCaisse> {
		if (!this._isBrowser) {
			return of(this.emptyCashSession());
		}
		return this._http.get<SessionCaisse>(`${this._cashBaseUrl}/session`);
	}

	getCashMovements(): Observable<MouvementCaisse[]> {
		if (!this._isBrowser) {
			return of([]);
		}
		return this._http.get<MouvementCaisse[]>(`${this._cashBaseUrl}/movements`);
	}

	openCashSession(payload: OpenCashSessionRequest): Observable<SessionCaisse> {
		return this._http.post<SessionCaisse>(`${this._cashBaseUrl}/session/open`, payload);
	}

	closeCashSession(payload: CloseCashSessionRequest): Observable<SessionCaisse> {
		return this._http.post<SessionCaisse>(`${this._cashBaseUrl}/session/close`, payload);
	}

	getAlerts(): Observable<string[]> {
		return of([
			'Session de caisse non ouverte',
			'Tentatives de code de retrait invalide',
			'Transfert expire',
			'Ecart de caisse detecte',
		]);
	}

	getCustomers(): Observable<Client[]> {
		if (!this._isBrowser) {
			return of([]);
		}
		return this._http.get<Client[]>(this._baseUrl);
	}

	createCustomer(payload: CreateCustomerRequest): Observable<Client> {
		return this._http.post<Client>(this._baseUrl, payload);
	}

	getKycVerifications(): Observable<VerificationKyc[]> {
		return of(this._kycItems);
	}

	getNotifications(): Observable<NotificationAffichage[]> {
		if (!this._isBrowser) {
			return of([]);
		}
		return this._http.get<Array<{
			id: string;
			title: string;
			message: string;
			type: NotificationAffichage['type'];
			status: NotificationAffichage['statut'];
			referenceCode?: string | null;
			createdAt: string;
		}>>(this._notificationBaseUrl).pipe(
			map((items) =>
				items.map((item) => ({
					id: item.id,
					titre: item.title,
					message: item.message,
					type: item.type,
					statut: item.status,
					referenceLiee: item.referenceCode ?? null,
					creeLe: item.createdAt,
				}))
			)
		);
	}

	markNotificationAsRead(notificationId: string): Observable<void> {
		return this._http.post<void>(`${this._notificationBaseUrl}/${notificationId}/read`, {});
	}

	getAgentProfile(): Observable<ProfilAgent> {
		if (!this._isBrowser) {
			return of({
				id: 0,
				fullName: '',
				email: '',
				agencyName: '',
				role: 'ROLE_AGENT',
				preferredLanguage: 'FR',
				notificationPreferences: {
					transferPaid: true,
					cashSession: true,
					systemAlerts: true,
					kycAlerts: true,
					cashDiscrepancy: true,
				},
			});
		}
		return this._http.get<ProfilAgent>(this._profileBaseUrl);
	}

	updateAgentProfile(payload: ProfilAgentUpdateRequest): Observable<ProfilAgent> {
		return this._http.put<ProfilAgent>(this._profileBaseUrl, payload);
	}

	findTransferByReference(referenceCode: string): Observable<Transfert> {
		return this.searchTransfer(referenceCode, undefined);
	}

	findTransferByReceiverPhone(phone: string): Observable<Transfert> {
		return this.searchTransfer(undefined, phone);
	}

	private emptyCashSession(): SessionCaisse {
		return {
			id: '',
			soldeOuverture: 0,
			soldeActuel: 0,
			totalEntrees: 0,
			totalSorties: 0,
			montantAttendu: 0,
			montantReel: null,
			ecart: 0,
			statut: 'CLOSED',
			ouverteLe: '',
			clotureeLe: null,
			devise: this._currency,
			commentaireCloture: null,
		};
	}
}
