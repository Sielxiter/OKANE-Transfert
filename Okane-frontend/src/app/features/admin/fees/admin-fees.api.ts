import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type TariffValueType = 'FIXED' | 'PERCENT';

export interface ApiTariffSummary {
	totalLines: number;
	fixedLines: number;
	percentageLines: number;
	simulationsToday: number;
}

export interface ApiTariffLine {
	id: number;
	minAmount: number;
	maxAmount: number;
	transferFeeType: TariffValueType;
	transferFeeValue: number;
	agencyCommissionType: TariffValueType;
	agencyCommissionValue: number;
	centralCommissionType: TariffValueType;
	centralCommissionValue: number;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface CreateTariffLinePayload {
	minAmount: number;
	maxAmount: number;
	transferFeeType: TariffValueType;
	transferFeeValue: number;
	agencyCommissionType: TariffValueType;
	agencyCommissionValue: number;
	centralCommissionType: TariffValueType;
	centralCommissionValue: number;
}

export interface UpdateTariffLinePayload extends CreateTariffLinePayload {
}

export interface TariffSimulationPayload {
	amount: number;
	corridorId: number;
}

export interface TariffSimulationResult {
	amount: number;
	baseTransferFee: number;
	corridorPercent: number;
	corridorFee: number;
	finalTransferFee: number;
	agencyCommission: number;
	centralCommission: number;
	matchedLineId: number | null;
	corridorId: number | null;
}

export type ApiFeeGridStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED';

export interface ApiFeeGrid {
	id: number;
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

@Injectable({ providedIn: 'root' })
export class AdminFeesApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/fees`;

	public getSummary(): Observable<ApiTariffSummary> {
		return this._http.get<ApiTariffSummary>(`${this._base}/summary`);
	}

	public listTariffs(): Observable<ApiTariffLine[]> {
		return this._http.get<ApiTariffLine[]>(`${this._base}/tariffs`);
	}

	public getTariff(id: number): Observable<ApiTariffLine> {
		return this._http.get<ApiTariffLine>(`${this._base}/tariffs/${id}`);
	}

	public createTariff(payload: CreateTariffLinePayload): Observable<ApiTariffLine> {
		return this._http.post<ApiTariffLine>(`${this._base}/tariffs`, payload);
	}

	public updateTariff(id: number, payload: UpdateTariffLinePayload): Observable<ApiTariffLine> {
		return this._http.put<ApiTariffLine>(`${this._base}/tariffs/${id}`, payload);
	}

	public deleteTariff(id: number): Observable<void> {
		return this._http.delete<void>(`${this._base}/tariffs/${id}`);
	}

	public simulate(payload: TariffSimulationPayload): Observable<TariffSimulationResult> {
		return this._http.post<TariffSimulationResult>(`${this._base}/simulate`, payload);
	}

	public createGrid(payload: CreateFeeGridPayload): Observable<ApiFeeGrid> {
		return this._http.post<ApiFeeGrid>(`${this._base}/tariffs`, payload as unknown as CreateTariffLinePayload);
	}
}
