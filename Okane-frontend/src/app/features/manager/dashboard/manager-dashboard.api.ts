import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ApiRecentActivity {
	id: number;
	title: string;
	type: string;
	module: string;
	createdAt: string;
}

export interface ApiSystemAlert {
	id: number;
	title: string;
	description: string;
	severity: AlertSeverity;
}

export interface ApiTrendPoint {
	label: string;
	value: number;
}

export interface ApiManagerDashboard {
	updatedAt: string;
	kpis: Array<{
		title: string;
		value: string;
		icon: string;
		accent: string;
		note: string;
	}>;
	activities: ApiRecentActivity[];
	alerts: ApiSystemAlert[];
	analytics: Array<{
		title: string;
		description: string;
		accent: string;
		preview: number[];
	}>;
}

@Injectable({ providedIn: 'root' })
export class ManagerDashboardApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/dashboard`;

	public loadDashboard(): Observable<ApiManagerDashboard> {
		return this._http.get<ApiManagerDashboard>(`${this._base}/overview`);
	}
}
