import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type ApiPaymentStatus = 'EN_ATTENTE' | 'VALIDE' | 'ECHOUE' | 'ANNULE' | 'BLOQUE';

export interface ApiPayment {
	id: number;
	paymentReference: string | null;
	transferReference: string | null;
	withdrawalCode: string | null;
	beneficiaryName: string | null;
	amountPaid: number;
	currency: string | null;
	agencyId: number | null;
	agencyCode: string | null;
	agencyName: string | null;
	agentId: number | null;
	agentName: string | null;
	status: ApiPaymentStatus;
	paymentDate: string | null;
}

export interface ApiPaymentSummary {
	totalPayments: number;
	paymentsToday: number;
	pendingPayments: number;
	validatedPayments: number;
	failedPayments: number;
	totalPaidAmount: number;
}

export interface ApiPaymentReceipt {
	id: number;
	paymentReference: string | null;
	transferReference: string | null;
	withdrawalCode: string | null;
	beneficiaryName: string | null;
	amountPaid: number;
	currency: string | null;
	agencyName: string | null;
	agentName: string | null;
	status: ApiPaymentStatus;
	paymentDate: string | null;
}

export interface ApiPaymentAuditEntry {
	id: number;
	action: string;
	description: string;
	actor: string | null;
	createdAt: string | null;
}

export interface ApiPaymentQuery {
	search?: string;
	status?: ApiPaymentStatus;
	currency?: string;
	agencyId?: number;
	agentId?: number;
	dateFrom?: string;
	dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminPaymentsApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/payments`;

	public list(query: ApiPaymentQuery = {}): Observable<ApiPayment[]> {
		let params = new HttpParams();
		if (query.search) params = params.set('search', query.search);
		if (query.status) params = params.set('status', query.status);
		if (query.currency) params = params.set('currency', query.currency);
		if (query.agencyId != null) params = params.set('agencyId', String(query.agencyId));
		if (query.agentId != null) params = params.set('agentId', String(query.agentId));
		if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
		if (query.dateTo) params = params.set('dateTo', query.dateTo);
		return this._http.get<ApiPayment[]>(this._base, { params });
	}

	public getSummary(): Observable<ApiPaymentSummary> {
		return this._http.get<ApiPaymentSummary>(`${this._base}/summary`);
	}

	public getById(id: number): Observable<ApiPayment> {
		return this._http.get<ApiPayment>(`${this._base}/${id}`);
	}

	public block(id: number): Observable<ApiPayment> {
		return this._http.patch<ApiPayment>(`${this._base}/${id}/block`, {});
	}

	public getReceipt(id: number): Observable<ApiPaymentReceipt> {
		return this._http.get<ApiPaymentReceipt>(`${this._base}/${id}/receipt`);
	}

	public getAuditTrail(id: number): Observable<ApiPaymentAuditEntry[]> {
		return this._http.get<ApiPaymentAuditEntry[]>(`${this._base}/${id}/audit`);
	}
}
