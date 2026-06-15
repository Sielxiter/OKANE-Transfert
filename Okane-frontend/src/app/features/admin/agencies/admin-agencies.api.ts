import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type ApiAgencyStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface ApiAgency {
	id: number;
	name: string;
	code: string;
	city: string;
	country: string;
	address: string;
	phone: string | null;
	email: string | null;
	dailyLimit: number;
	status: ApiAgencyStatus;
	managerId: number | null;
	managerName: string | null;
	agentsCount: number;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface CreateAgencyRequest {
	name: string;
	code: string;
	city: string;
	country: string;
	address: string;
	phone?: string | null;
	email?: string | null;
	dailyLimit: number;
	managerId?: number | null;
}

export interface UpdateAgencyRequest {
	name: string;
	city: string;
	country: string;
	address: string;
	phone?: string | null;
	email?: string | null;
	dailyLimit: number;
	managerId?: number | null;
}

export interface ChangeAgencyStatusRequest {
	status: ApiAgencyStatus;
}

@Injectable({ providedIn: 'root' })
export class AdminAgenciesApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/agencies`;

	public list(): Observable<ApiAgency[]> {
		return this._http.get<ApiAgency[]>(this._base);
	}

	public getById(id: number): Observable<ApiAgency> {
		return this._http.get<ApiAgency>(`${this._base}/${id}`);
	}

	public create(payload: CreateAgencyRequest): Observable<ApiAgency> {
		return this._http.post<ApiAgency>(this._base, payload);
	}

	public update(id: number, payload: UpdateAgencyRequest): Observable<ApiAgency> {
		return this._http.put<ApiAgency>(`${this._base}/${id}`, payload);
	}

	public changeStatus(id: number, status: ApiAgencyStatus): Observable<ApiAgency> {
		return this._http.patch<ApiAgency>(`${this._base}/${id}/status`, { status });
	}

	public assignManager(id: number, managerId: number): Observable<ApiAgency> {
		return this._http.patch<ApiAgency>(`${this._base}/${id}/manager`, { managerId });
	}

	public assignAgent(id: number, agentId: number): Observable<ApiAgency> {
		return this._http.post<ApiAgency>(`${this._base}/${id}/agents`, { agentId });
	}

	public removeAgent(id: number, agentId: number): Observable<ApiAgency> {
		return this._http.delete<ApiAgency>(`${this._base}/${id}/agents/${agentId}`);
	}

	public disable(id: number): Observable<ApiAgency> {
		return this._http.delete<ApiAgency>(`${this._base}/${id}`);
	}
}
