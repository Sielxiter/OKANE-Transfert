import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiAlert {
	id: number;
	type: string;
	severity: string;
	title: string;
	description: string;
	status: string;
	relatedEntityId: number;
	relatedEntityType: string;
	createdAt: string;
	resolvedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerAlertsApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/alerts`;

	public getUnresolvedCount(): Observable<number> {
		return this._http.get<number>(`${this._base}/unresolved-count`);
	}

	public getAlerts(): Observable<ApiAlert[]> {
		return this._http.get<ApiAlert[]>(this._base);
	}

	public resolveAlert(id: number): Observable<void> {
		return this._http.post<void>(`${this._base}/${id}/resolve`, {});
	}
}
