import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiValidation {
	id: number;
	type: string;
	reference: string;
	description: string;
	requesterName: string;
	requesterRole: string;
	status: string;
	requestedAt: string;
	relatedEntityId: number;
	relatedEntityType: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerValidationsApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/validations`;

	public getPendingCount(): Observable<number> {
		return this._http.get<number>(`${this._base}/pending-count`);
	}

	public getValidations(): Observable<ApiValidation[]> {
		return this._http.get<ApiValidation[]>(this._base);
	}

	public approveValidation(id: number): Observable<void> {
		return this._http.post<void>(`${this._base}/${id}/approve`, {});
	}

	public rejectValidation(id: number): Observable<void> {
		return this._http.post<void>(`${this._base}/${id}/reject`, {});
	}
}
