import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type ApiKycStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'REVIEW_REQUIRED';
export type ApiRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApiAmlStatus = 'NEW' | 'IN_ANALYSIS' | 'RESOLVED' | 'ESCALATED';

export interface ApiComplianceSummary {
	pendingKyc: number;
	verifiedKyc: number;
	rejectedKyc: number;
	amlAlerts: number;
	suspiciousTransactions: number;
	blacklistedClients: number;
}

export interface ApiKycRecord {
	id: number;
	clientId: string | null;
	clientName: string | null;
	email: string | null;
	phone: string | null;
	documentType: string | null;
	maskedDocumentNumber: string | null;
	country: string | null;
	countryCode: string | null;
	status: ApiKycStatus;
	riskLevel: ApiRiskLevel;
	submittedAt: string | null;
	reviewedAt: string | null;
	reviewedBy: string | null;
	rejectionReason: string | null;
}

export interface ApiAmlAlert {
	id: number;
	reference: string | null;
	clientId: string | null;
	clientName: string | null;
	alertType: string | null;
	amount: number | null;
	currency: string | null;
	riskLevel: ApiRiskLevel;
	status: ApiAmlStatus;
	createdAt: string | null;
	resolvedAt: string | null;
}

export interface ApiBlacklistEntry {
	id: number;
	fullName: string | null;
	country: string | null;
	countryCode: string | null;
	type: string | null;
	source: string | null;
	status: string | null;
	addedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminComplianceApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/compliance`;

	public getSummary(): Observable<ApiComplianceSummary> {
		return this._http.get<ApiComplianceSummary>(`${this._base}/summary`);
	}

	public listKyc(): Observable<ApiKycRecord[]> {
		return this._http.get<ApiKycRecord[]>(`${this._base}/kyc`);
	}

	public getKyc(id: number): Observable<ApiKycRecord> {
		return this._http.get<ApiKycRecord>(`${this._base}/kyc/${id}`);
	}

	public verifyKyc(id: number): Observable<ApiKycRecord> {
		return this._http.patch<ApiKycRecord>(`${this._base}/kyc/${id}/verify`, {});
	}

	public rejectKyc(id: number, reason: string): Observable<ApiKycRecord> {
		return this._http.patch<ApiKycRecord>(`${this._base}/kyc/${id}/reject`, { reason });
	}

	public reviewKyc(id: number): Observable<ApiKycRecord> {
		return this._http.patch<ApiKycRecord>(`${this._base}/kyc/${id}/review`, {});
	}

	public listAmlAlerts(): Observable<ApiAmlAlert[]> {
		return this._http.get<ApiAmlAlert[]>(`${this._base}/aml-alerts`);
	}

	public getAmlAlert(id: number): Observable<ApiAmlAlert> {
		return this._http.get<ApiAmlAlert>(`${this._base}/aml-alerts/${id}`);
	}

	public changeAmlStatus(id: number, status: ApiAmlStatus): Observable<ApiAmlAlert> {
		return this._http.patch<ApiAmlAlert>(`${this._base}/aml-alerts/${id}/status`, { status });
	}

	public listBlacklist(): Observable<ApiBlacklistEntry[]> {
		return this._http.get<ApiBlacklistEntry[]>(`${this._base}/blacklist`);
	}
}
