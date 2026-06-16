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

@Injectable({ providedIn: 'root' })
export class AgentCashSessionApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${API_BASE_URL}/agent/cash-session`;

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
}
