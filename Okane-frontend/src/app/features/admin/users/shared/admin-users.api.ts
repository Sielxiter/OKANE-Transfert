import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../../core/api/api.config';

export type ApiAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
export type ApiKycStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'REVIEW_REQUIRED';
export type ApiRoleName = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_AGENT' | 'ROLE_CLIENT';

export interface ApiUser {
	id: number;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	phone: string | null;
	role: ApiRoleName;
	accountStatus: ApiAccountStatus;
	country: string | null;
	kycStatus: ApiKycStatus | null;
	agencyId: number | null;
	agencyName: string | null;
	agencyCode: string | null;
	createdAt: string | null;
	lastLoginAt: string | null;
}

export interface CreateUserRequest {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string | null;
	password: string;
	role: ApiRoleName;
	country?: string | null;
	agencyId?: number | null;
}

export interface UpdateUserRequest {
	firstName: string;
	lastName: string;
	phone?: string | null;
	country?: string | null;
	agencyId?: number | null;
}

export interface ChangeUserStatusRequest {
	status: ApiAccountStatus;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/users`;

	public getClients(): Observable<ApiUser[]> {
		return this._http.get<ApiUser[]>(`${this._base}/clients`);
	}

	public getAdmins(): Observable<ApiUser[]> {
		return this._http.get<ApiUser[]>(`${this._base}/admins`);
	}

	public getManagers(): Observable<ApiUser[]> {
		return this._http.get<ApiUser[]>(`${this._base}/managers`);
	}

	public getAgents(): Observable<ApiUser[]> {
		return this._http.get<ApiUser[]>(`${this._base}/agents`);
	}

	public getById(id: number): Observable<ApiUser> {
		return this._http.get<ApiUser>(`${this._base}/${id}`);
	}

	public create(payload: CreateUserRequest): Observable<ApiUser> {
		return this._http.post<ApiUser>(this._base, payload);
	}

	public update(id: number, payload: UpdateUserRequest): Observable<ApiUser> {
		return this._http.put<ApiUser>(`${this._base}/${id}`, payload);
	}

	public changeStatus(id: number, status: ApiAccountStatus): Observable<ApiUser> {
		return this._http.patch<ApiUser>(`${this._base}/${id}/status`, { status });
	}

	public disable(id: number): Observable<ApiUser> {
		return this._http.delete<ApiUser>(`${this._base}/${id}`);
	}
}
