import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiReport {
	id: number;
	name: string;
	type: string;
	period: string;
	agencyName: string;
	format: string;
	status: string;
	filePath: string;
	generatedAt: string;
	generatedBy: string;
}

@Injectable({ providedIn: 'root' })
export class ManagerReportsApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/reports`;

	public getReports(): Observable<ApiReport[]> {
		return this._http.get<ApiReport[]>(this._base);
	}

	public generateReport(type: string): Observable<ApiReport> {
		return this._http.get<ApiReport>(`${this._base}/${type}`);
	}
}
