import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiManagerProfile {
	id: number;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	phone: string;
	role: string;
	centralAgencyName: string;
	centralAgencyCode: string;
	centralAgencyId: number;
	subAgencyCount: number;
	totalAgentCount: number;
	lastLoginAt: string;
	createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerProfileApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/profile`;

	public getProfile(): Observable<ApiManagerProfile> {
		return this._http.get<ApiManagerProfile>(this._base);
	}

	public updateProfile(payload: { firstName: string; lastName: string; phone: string }): Observable<void> {
		return this._http.put<void>(this._base, payload);
	}

	public changePassword(payload: { currentPassword: string; newPassword: string }): Observable<void> {
		return this._http.post<void>(`${this._base}/change-password`, payload);
	}
}
