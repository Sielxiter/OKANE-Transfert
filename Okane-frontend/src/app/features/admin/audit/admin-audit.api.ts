import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type ApiAuditModule =
	| 'AUTH'
	| 'USERS'
	| 'AGENCIES'
	| 'TRANSFERS'
	| 'PAYMENTS'
	| 'CURRENCY'
	| 'FEES'
	| 'COMPLIANCE'
	| 'REPORTS'
	| 'SETTINGS'
	| 'SYSTEM';

export type ApiAuditStatus = 'SUCCESS' | 'FAILURE' | 'BLOCKED';
export type ApiAuditRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ApiAuditSummary {
	actionsToday: number;
	failedLogins: number;
	sensitiveChanges: number;
	securityAlerts: number;
	adminActions: number;
	criticalLogs: number;
}

export interface ApiAuditLog {
	id: number;
	createdAt: string;
	actorId: string | null;
	actorName: string | null;
	actorEmail: string | null;
	actorRole: string | null;
	action: string;
	module: ApiAuditModule;
	target: string | null;
	ipAddress: string | null;
	status: ApiAuditStatus;
	riskLevel: ApiAuditRisk;
	description: string | null;
}

export interface ApiExportAuditResponse {
	fileName: string;
	contentType: string;
	downloadUrl: string | null;
	base64Content: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminAuditApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/audit`;

	public getSummary(): Observable<ApiAuditSummary> {
		return this._http.get<ApiAuditSummary>(`${this._base}/summary`);
	}

	public listLogs(): Observable<ApiAuditLog[]> {
		return this._http.get<ApiAuditLog[]>(`${this._base}/logs`);
	}

	public getLog(id: number): Observable<ApiAuditLog> {
		return this._http.get<ApiAuditLog>(`${this._base}/logs/${id}`);
	}

	public exportLogs(): Observable<ApiExportAuditResponse> {
		return this._http.get<ApiExportAuditResponse>(`${this._base}/export`);
	}
}
