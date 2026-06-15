import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type ApiReportType = 'FINANCIAL' | 'TRANSFERS' | 'COMMISSIONS' | 'AGENCIES' | 'COMPLIANCE' | 'USERS';
export type ApiReportStatus = 'AVAILABLE' | 'PREPARING' | 'ARCHIVED';
export type ApiReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export interface ApiReportSummary {
	dailyVolume: number;
	monthlyVolume: number;
	revenue: number;
	totalCommissions: number;
	successfulTransfers: number;
	failureRate: number;
}

export interface ApiReportRow {
	id: number;
	name: string;
	type: ApiReportType;
	period: ApiReportPeriod;
	periodRange: string | null;
	agencyName: string | null;
	agencyCode: string | null;
	country: string | null;
	currency: string | null;
	status: ApiReportStatus;
	generatedAt: string | null;
	generatedBy: string | null;
}

export interface ApiTrendPoint {
	label: string;
	value: number;
}

export interface ApiRevenueTrendPoint {
	label: string;
	revenue: number;
	commission: number;
}

export interface ApiAgencyPerformance {
	agencyCode: string | null;
	agencyName: string | null;
	volume: number;
	transferCount: number;
	currency: string | null;
	share: number;
}

export interface ApiStatusDistribution {
	status: string;
	count: number;
	share: number;
}

export interface ApiReportAnalytics {
	transferVolume: ApiTrendPoint[];
	revenueCommissions: ApiRevenueTrendPoint[];
	agencyPerformance: ApiAgencyPerformance[];
	statusDistribution: ApiStatusDistribution[];
}

export interface ApiExportResponse {
	fileName: string;
	contentType: string;
	downloadUrl: string | null;
	base64Content: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminReportsApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/reports`;

	public getSummary(): Observable<ApiReportSummary> {
		return this._http.get<ApiReportSummary>(`${this._base}/summary`);
	}

	public listReports(): Observable<ApiReportRow[]> {
		return this._http.get<ApiReportRow[]>(this._base);
	}

	public getAnalytics(): Observable<ApiReportAnalytics> {
		return this._http.get<ApiReportAnalytics>(`${this._base}/analytics`);
	}

	public getReport(id: number): Observable<ApiReportRow> {
		return this._http.get<ApiReportRow>(`${this._base}/${id}`);
	}

	public exportPdf(id: number): Observable<ApiExportResponse> {
		return this._http.get<ApiExportResponse>(`${this._base}/${id}/export/pdf`);
	}

	public exportCsv(id: number): Observable<ApiExportResponse> {
		return this._http.get<ApiExportResponse>(`${this._base}/${id}/export/csv`);
	}
}
