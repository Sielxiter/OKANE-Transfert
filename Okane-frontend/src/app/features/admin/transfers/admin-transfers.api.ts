import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type ApiTransferStatus = 'EN_ATTENTE' | 'PAYE' | 'ANNULE' | 'EXPIRE' | 'SUSPECT';

export interface ApiTransfer {
	id: number;
	reference: string;
	withdrawalCode: string;
	senderFullName: string | null;
	senderPhone: string | null;
	senderCountry: string | null;
	beneficiaryFullName: string | null;
	beneficiaryPhone: string | null;
	beneficiaryCountry: string | null;
	amount: number;
	currency: string | null;
	fees: number;
	netAmount: number;
	sourceCountry: string | null;
	destinationCountry: string | null;
	status: ApiTransferStatus;
	createdAt: string | null;
	agentId: number | null;
	agentName: string | null;
	agencyCode: string | null;
	agencyName: string | null;
}

export interface ApiTransferQuery {
	search?: string;
	status?: ApiTransferStatus;
	currency?: string;
	sourceCountry?: string;
	destinationCountry?: string;
	agentId?: number;
	dateFrom?: string;
	dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminTransfersApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/transfers`;

	public list(query: ApiTransferQuery = {}): Observable<ApiTransfer[]> {
		let params = new HttpParams();
		if (query.search) params = params.set('search', query.search);
		if (query.status) params = params.set('status', query.status);
		if (query.currency) params = params.set('currency', query.currency);
		if (query.sourceCountry) params = params.set('sourceCountry', query.sourceCountry);
		if (query.destinationCountry) params = params.set('destinationCountry', query.destinationCountry);
		if (query.agentId != null) params = params.set('agentId', String(query.agentId));
		if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
		if (query.dateTo) params = params.set('dateTo', query.dateTo);
		return this._http.get<ApiTransfer[]>(this._base, { params });
	}

	public getById(id: number): Observable<ApiTransfer> {
		return this._http.get<ApiTransfer>(`${this._base}/${id}`);
	}

	public markSuspect(id: number): Observable<ApiTransfer> {
		return this._http.patch<ApiTransfer>(`${this._base}/${id}/suspect`, {});
	}

	public cancel(id: number): Observable<ApiTransfer> {
		return this._http.patch<ApiTransfer>(`${this._base}/${id}/cancel`, {});
	}
}
