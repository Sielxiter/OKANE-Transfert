import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiSubAgency {
	id: number;
	name: string;
	code: string;
	city: string;
	country: string;
	phone: string;
	email: string;
	dailyLimit: string;
	status: string;
	agentCount: number;
	transferCountToday: number;
	createdAt: string;
}

export interface ApiSubAgencyDetails extends ApiSubAgency {
	address: string;
	activeAgentCount: number;
	volumeToday: string;
	updatedAt: string;
	agents: Array<{
		id: number;
		fullName: string;
		email: string;
		phone: string;
		active: boolean;
	}>;
}

@Injectable({ providedIn: 'root' })
export class ManagerSubAgenciesApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/subagencies`;

	public getSubAgencies(): Observable<ApiSubAgency[]> {
		return this._http.get<ApiSubAgency[]>(this._base);
	}

	public getSubAgencyDetails(id: number): Observable<ApiSubAgencyDetails> {
		return this._http.get<ApiSubAgencyDetails>(`${this._base}/${id}`);
	}
}
