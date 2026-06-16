import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';

export interface ApiAgentSessionStatus {
	hasActiveSession: boolean;
	sessionId: number | null;
	sessionDate: string | null;
	openingBalance: number;
	currentBalance: number;
	status: string | null;
	openedAt: string | null;
}

export interface ApiCloseSessionRequest {
	actualBalance: number;
}

export interface ApiSessionCloseResult {
	closureId: number;
	sessionId: number;
	expectedBalance: number;
	actualBalance: number;
	differenceAmount: number;
	discrepancyDetected: boolean;
	discrepancyType: string | null;
	message: string;
	closedAt: string;
}

export interface ApiAgentDashboardStats {
	soldeCaisse: number;
	transfertsJour: number;
	paiementsJour: number;
	transfertsEnAttente: number;
	paiementsEnAttente: number;
	revenus: number;
	devise: string;
}

export interface ApiCashMovement {
	id: number;
	movementType: string;
	amount: number;
	description: string | null;
	createdAt: string | null;
	transferId: number | null;
	payoutId: number | null;
}

export interface ApiTransferListItem {
	id: number;
	referenceCode: string;
	withdrawalCode: string;
	senderFullName: string;
	senderPhone: string | null;
	beneficiaryFullName: string;
	beneficiaryPhone: string | null;
	amount: number;
	currencySymbol: string | null;
	feeAmount: number;
	netAmount: number;
	status: string;
	createdAt: string;
	sentAt: string | null;
	expiresAt: string | null;
}

export interface ApiTransferLookup {
	id: number;
	referenceCode: string;
	withdrawalCode: string;
	senderFullName: string;
	senderPhone: string | null;
	beneficiaryFullName: string;
	beneficiaryPhone: string | null;
	amount: number;
	currencySymbol: string | null;
	feeAmount: number;
	netAmount: number;
	status: string;
	createdAt: string;
	sentAt: string | null;
	expiresAt: string | null;
	sourceAgencyName: string | null;
	sourceAgencyCode: string | null;
}

@Injectable({ providedIn: 'root' })
export class AgentCashSessionApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${API_BASE_URL}/agent/cash-session`;
	private readonly _transferBase = `${API_BASE_URL}/agent`;

	public getStatus(): Observable<ApiAgentSessionStatus> {
		return this._http.get<ApiAgentSessionStatus>(`${this._base}/status`);
	}

	public openSession(): Observable<ApiAgentSessionStatus> {
		return this._http.post<ApiAgentSessionStatus>(`${this._base}/open`, {});
	}

	public closeSession(actualBalance: number): Observable<ApiSessionCloseResult> {
		return this._http.post<ApiSessionCloseResult>(`${this._base}/close`, { actualBalance });
	}

	public getMovements(): Observable<ApiCashMovement[]> {
		return this._http.get<ApiCashMovement[]>(`${this._base}/movements`);
	}

	public getDashboardStats(): Observable<ApiAgentDashboardStats> {
		return this._http.get<ApiAgentDashboardStats>(`${this._base}/dashboard-stats`);
	}

	// Transfer APIs
	public getMyTransfers(): Observable<ApiTransferListItem[]> {
		return this._http.get<ApiTransferListItem[]>(`${this._transferBase}/transfers`);
	}

	public lookupTransfer(params: { reference?: string; withdrawalCode?: string; phone?: string }): Observable<ApiTransferLookup> {
		return this._http.get<ApiTransferLookup>(`${this._transferBase}/transfers/lookup`, { params });
	}
}
