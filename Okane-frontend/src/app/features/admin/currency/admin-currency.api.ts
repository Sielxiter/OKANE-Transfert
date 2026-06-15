import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE } from '../../../core/api/api.config';

export type ApiCurrencyStatus = 'ACTIVE' | 'SUSPENDED';
export type ApiCorridorStatus = 'ACTIVE' | 'DISABLED' | 'UNDER_REVIEW';

export interface ApiCurrencySummary {
	activeCurrencies: number;
	activeCorridors: number;
	ratesUpdatedToday: number;
	suspendedCurrencies: number;
	lastSyncAt: string | null;
}

export interface ApiCurrency {
	id: number;
	name: string;
	symbol: string | null;
	mainCountry: string | null;
	mainCountryCode: string | null;
	rateToMad: number | null;
	status: ApiCurrencyStatus;
	lastUpdatedAt: string | null;
}

export interface ApiCorridor {
	id: number;
	sourceCountryCode: string | null;
	sourceCountry: string | null;
	destinationCountryCode: string | null;
	destinationCountry: string | null;
	sourceCurrency: string | null;
	destinationCurrency: string | null;
	estimatedFees: number | null;
	status: ApiCorridorStatus;
}

export interface ApiExchangeRateHistory {
	id: number;
	currencyCode: string | null;
	pair: string | null;
	oldRate: number | null;
	newRate: number | null;
	changedAt: string | null;
	changedByName: string | null;
}

export interface ApiFxSyncResult {
	success: boolean;
	source: string;
	syncedAt: string;
	updatedCurrencies: number;
	skippedCurrencies: number;
	skippedCurrencyCodes: string[];
	message: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCurrencyApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${ADMIN_API_BASE}/currency`;

	public getSummary(): Observable<ApiCurrencySummary> {
		return this._http.get<ApiCurrencySummary>(`${this._base}/summary`);
	}

	public listCurrencies(): Observable<ApiCurrency[]> {
		return this._http.get<ApiCurrency[]>(`${this._base}/currencies`);
	}

	public createCurrency(payload: {
		name: string;
		symbol: string;
		mainCountry: string;
		rateToMad: number;
		status: ApiCurrencyStatus;
	}): Observable<ApiCurrency> {
		return this._http.post<ApiCurrency>(`${this._base}/currencies`, payload);
	}

	public getCurrency(id: number): Observable<ApiCurrency> {
		return this._http.get<ApiCurrency>(`${this._base}/currencies/${id}`);
	}

	public changeCurrencyStatus(id: number, status: ApiCurrencyStatus): Observable<ApiCurrency> {
		return this._http.patch<ApiCurrency>(`${this._base}/currencies/${id}/status`, { status });
	}

	public getCurrencyHistory(id: number): Observable<ApiExchangeRateHistory[]> {
		return this._http.get<ApiExchangeRateHistory[]>(`${this._base}/currencies/${id}/history`);
	}

	public listCorridors(): Observable<ApiCorridor[]> {
		return this._http.get<ApiCorridor[]>(`${this._base}/corridors`);
	}

	public getCorridor(id: number): Observable<ApiCorridor> {
		return this._http.get<ApiCorridor>(`${this._base}/corridors/${id}`);
	}

	public createCorridor(payload: {
		sourceCountryCode: string;
		destinationCountryCode: string;
		estimatedFees: number;
		active: boolean;
	}): Observable<ApiCorridor> {
		return this._http.post<ApiCorridor>(`${this._base}/corridors`, payload);
	}

	public updateCorridor(id: number, payload: { estimatedFees?: number; active: boolean }): Observable<ApiCorridor> {
		return this._http.put<ApiCorridor>(`${this._base}/corridors/${id}`, payload);
	}

	public changeCorridorStatus(id: number, status: ApiCorridorStatus): Observable<ApiCorridor> {
		return this._http.patch<ApiCorridor>(`${this._base}/corridors/${id}/status`, { status });
	}

	public disableCorridor(id: number): Observable<ApiCorridor> {
		return this._http.delete<ApiCorridor>(`${this._base}/corridors/${id}`);
	}

	public getRateHistory(): Observable<ApiExchangeRateHistory[]> {
		return this._http.get<ApiExchangeRateHistory[]>(`${this._base}/rate-history`);
	}

	public syncExchangeRates(): Observable<ApiFxSyncResult> {
		return this._http.post<ApiFxSyncResult>(`${this._base}/sync`, {});
	}
}
