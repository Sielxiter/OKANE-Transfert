import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export interface ApiAgencyBalance {
	agencyId: number;
	agencyName: string;
	agencyCode: string;
	agencyType: string;
	centralAgencyId: number | null;
	centralAgencyName: string | null;
	currentBalance: number;
	dailyLimit: number;
	activeSessions: number;
	pendingClosures: number;
	todayInflow: number;
	todayOutflow: number;
	status: string | null;
}

export interface ApiCashMovement {
	id: number;
	movementType: string;
	amount: number;
	description: string | null;
	createdAt: string | null;
	transferId: number | null;
	payoutId: number | null;
	agentName: string | null;
}

export interface ApiSessionSummary {
	sessionId: number;
	agentName: string | null;
	sessionDate: string | null;
	openingBalance: number;
	status: string;
	openedAt: string | null;
}

export interface ApiClosureSummary {
	closureId: number;
	sessionId: number | null;
	agentName: string | null;
	agencyName: string | null;
	expectedBalance: number;
	actualBalance: number;
	differenceAmount: number;
	status: string;
	closedAt: string | null;
	validatedAt: string | null;
}

export interface ApiAgencyBalanceDetail {
	summary: ApiAgencyBalance;
	recentMovements: ApiCashMovement[];
	activeSessions: ApiSessionSummary[];
	pendingClosures: ApiClosureSummary[];
}

export interface FundAgencyRequest {
	amount: number;
	description: string;
	direction: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAgencyBalanceApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/agency-balances`;

	public list(): Observable<ApiAgencyBalance[]> {
		return this._http.get<ApiAgencyBalance[]>(this._base);
	}

	public getDetails(id: number): Observable<ApiAgencyBalanceDetail> {
		return this._http.get<ApiAgencyBalanceDetail>(`${this._base}/${id}`);
	}

	public fund(id: number, amount: number, description: string): Observable<void> {
		return this._http.post<void>(`${this._base}/${id}/fund`, { amount, description, direction: 'FUND' });
	}

	public withdraw(id: number, amount: number, description: string): Observable<void> {
		return this._http.post<void>(`${this._base}/${id}/withdraw`, { amount, description, direction: 'WITHDRAW' });
	}

	public getMovements(id: number, from?: string, to?: string): Observable<ApiCashMovement[]> {
		let url = `${this._base}/${id}/movements`;
		const params: string[] = [];
		if (from) params.push(`from=${from}`);
		if (to) params.push(`to=${to}`);
		if (params.length > 0) url += '?' + params.join('&');
		return this._http.get<ApiCashMovement[]>(url);
	}
}
