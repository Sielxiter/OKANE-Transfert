import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiCashClosure {
	id: number;
	sessionId: number;
	agentName: string;
	agentEmail: string;
	agencyName: string;
	agencyCode: string;
	sessionDate: string;
	openingBalance: string;
	expectedBalance: string;
	actualBalance: string;
	differenceAmount: string;
	status: string;
	note: string;
	closedAt: string;
	validatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerCashApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/cash`;

	public getClosures(): Observable<ApiCashClosure[]> {
		return this._http.get<ApiCashClosure[]>(`${this._base}/closures`);
	}

	public getClosureDetails(id: number): Observable<ApiCashClosure> {
		return this._http.get<ApiCashClosure>(`${this._base}/closures/${id}`);
	}

	public validateClosure(id: number): Observable<void> {
		return this._http.post<void>(`${this._base}/closures/${id}/validate`, {});
	}
}
