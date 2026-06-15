import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiAuditLog {
	id: number;
	createdAt: string;
	actorName: string;
	actorEmail: string;
	actorRole: string;
	action: string;
	module: string;
	target: string;
	ipAddress: string;
	status: string;
	riskLevel: string;
	description: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerAuditApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/audit-log`;

	public getAuditLogs(): Observable<ApiAuditLog[]> {
		return this._http.get<ApiAuditLog[]>(this._base);
	}
}
