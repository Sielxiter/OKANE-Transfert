import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

export interface ApiDashboardKpis {
	totalUsers: number;
	activeAgencies: number;
	transfersToday: number;
	pendingPayments: number;
	totalRevenue: number;
	activeAgents: number;
	suspiciousTransactions: number;
	monthlyVolume: number;
	totalClients: number;
	totalAdmins: number;
	totalManagers: number;
	totalAgents: number;
	suspendedAgencies: number;
	pendingAgencies: number;
}

export interface ApiTrendPoint {
	label: string;
	value: number;
}

export interface ApiDashboardAnalytics {
	transferTrend: ApiTrendPoint[];
	revenueTrend: ApiTrendPoint[];
	userGrowth: ApiTrendPoint[];
}

export interface ApiRecentActivity {
	id: number;
	type: string;
	title: string;
	description: string;
	module: string;
	actor: string | null;
	createdAt: string | null;
}

export interface ApiSystemAlert {
	id: string;
	title: string;
	message: string;
	severity: AlertSeverity;
	category: string;
	createdAt: string | null;
	status: AlertStatus;
}

export interface ApiAdminDashboard {
	kpis: ApiDashboardKpis;
	recentActivities: ApiRecentActivity[];
	systemAlerts: ApiSystemAlert[];
	analytics: ApiDashboardAnalytics;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardApiService {
	private readonly _http = inject(HttpClient);
	private readonly _url = `${ADMIN_API_BASE}/dashboard`;

	public getSummary(): Observable<ApiAdminDashboard> {
		return this._http.get<ApiAdminDashboard>(this._url);
	}
}
