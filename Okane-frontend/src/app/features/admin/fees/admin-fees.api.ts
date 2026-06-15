import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type ApiFeeGridStatus = 'ACTIVE' | 'SUSPENDED' | 'DRAFT';

export interface ApiFeeSummary {
	activeFeeGrids: number;
	averageFee: number;
	centralCommission: number;
	agencyCommission: number;
	simulationsToday: number;
}

export interface ApiFeeGrid {
	id: number;
	name: string;
	corridor: string | null;
	sourceCountryCode: string | null;
	sourceCountry: string | null;
	destinationCountryCode: string | null;
	destinationCountry: string | null;
	currency: string | null;
	minAmount: number;
	maxAmount: number;
	fixedFee: number;
	percentageFee: number;
	agencyCommissionRate: number;
	centralCommissionRate: number;
	status: ApiFeeGridStatus;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface CreateFeeGridPayload {
	name: string;
	sourceCountry: string;
	destinationCountry: string;
	currency: string;
	minAmount: number;
	maxAmount: number;
	fixedFee: number;
	percentageFee: number;
	agencyCommissionRate: number;
	centralCommissionRate: number;
	status: ApiFeeGridStatus;
}

export interface ApiFeeSimulation {
	amount: number;
	estimatedFees: number;
	netAmount: number;
	agencyCommission: number;
	centralCommission: number;
	gridName: string | null;
	gridId: number | null;
	currency: string | null;
}

export interface FeeSimulationPayload {
	amount: number;
	currency: string;
	sourceCountry: string;
	destinationCountry: string;
}

export interface ApiCommissionRow {
	agencyId: number | null;
	agencyCode: string | null;
	agencyName: string | null;
	corridor: string | null;
	currency: string | null;
	volume: number;
	agencyCommission: number;
	centralCommission: number;
	transferCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminFeesApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/fees`;

	public getSummary(): Observable<ApiFeeSummary> {
		return this._http.get<ApiFeeSummary>(`${this._base}/summary`);
	}

	public listGrids(): Observable<ApiFeeGrid[]> {
		return this._http.get<ApiFeeGrid[]>(`${this._base}/grids`);
	}

	public getGrid(id: number): Observable<ApiFeeGrid> {
		return this._http.get<ApiFeeGrid>(`${this._base}/grids/${id}`);
	}

	public createGrid(payload: CreateFeeGridPayload): Observable<ApiFeeGrid> {
		return this._http.post<ApiFeeGrid>(`${this._base}/grids`, payload);
	}

	public updateGrid(id: number, payload: CreateFeeGridPayload): Observable<ApiFeeGrid> {
		return this._http.put<ApiFeeGrid>(`${this._base}/grids/${id}`, payload);
	}

	public changeStatus(id: number, status: ApiFeeGridStatus): Observable<ApiFeeGrid> {
		return this._http.patch<ApiFeeGrid>(`${this._base}/grids/${id}/status`, { status });
	}

	public duplicate(id: number): Observable<ApiFeeGrid> {
		return this._http.post<ApiFeeGrid>(`${this._base}/grids/${id}/duplicate`, {});
	}

	public simulate(payload: FeeSimulationPayload): Observable<ApiFeeSimulation> {
		return this._http.post<ApiFeeSimulation>(`${this._base}/simulate`, payload);
	}

	public listCommissions(): Observable<ApiCommissionRow[]> {
		return this._http.get<ApiCommissionRow[]>(`${this._base}/commissions`);
	}
}
