import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiAgent {
	id: number;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	phone: string;
	accountStatus: string;
	kycStatus: string;
	agencyId: number;
	agencyName: string;
	agencyCode: string;
	lastLoginAt: string;
	createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerAgentsApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/agents`;

	public getAgents(): Observable<ApiAgent[]> {
		return this._http.get<ApiAgent[]>(this._base);
	}

	public getAgentById(id: number): Observable<ApiAgent> {
		return this._http.get<ApiAgent>(`${this._base}/${id}`);
	}

	public changeAgentStatus(id: number, status: string): Observable<void> {
		return this._http.patch<void>(`${this._base}/${id}/status`, { status });
	}
}
