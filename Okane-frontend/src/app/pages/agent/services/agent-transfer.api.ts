import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import type { CountryOption } from '../../../features/admin/currency/country-directory';
import type { CurrencyOption } from '../../../features/admin/currency/currency-directory';

const BASE = `${API_BASE_URL}/agent`;

export interface AgentTransferQuoteRequest {
	amount: number;
	senderCountryCode: string;
	beneficiaryCountryCode: string;
	sourceCurrencyCode: string;
	destinationCurrencyCode: string;
}

export interface AgentTransferQuoteResponse {
	amount: number;
	baseTransferFee: number;
	corridorPercent: number;
	corridorFee: number;
	finalTransferFee: number;
	agencyCommission: number;
	centralCommission: number;
	exchangeRate: number;
	matchedLineId: number | null;
	corridorId: number | null;
}

export interface CreateAgentTransferRequest {
	senderClientId: number;
	senderCountryCode: string;
	beneficiaryFirstName: string;
	beneficiaryLastName: string;
	beneficiaryEmail: string;
	beneficiaryPhone: string;
	beneficiaryIdentityType: string;
	beneficiaryIdentityNumber: string;
	beneficiaryCountryCode: string;
	sourceCurrencyCode: string;
	destinationCurrencyCode: string;
	amount: number;
	paymentMethod?: string | null;
}

export interface CreateAgentTransferResponse {
	id: number;
	reference: string;
	withdrawalCode: string;
	status: string;
	amount: number;
	transferFee: number;
	agencyCommission: number;
	centralCommission: number;
	netAmount: number;
	senderName: string | null;
	beneficiaryName: string | null;
	createdAt: string;
}

export interface AgentCountryApiResponse {
	id: number;
	code: string;
	name: string;
	currencyCode: string | null;
	phoneCode: string | null;
}

export interface AgentCurrencyApiResponse {
	id: number;
	name: string;
	symbol: string;
	active: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class AgentTransferApiService {
	private readonly _http = inject(HttpClient);

	public listCountries(): Observable<CountryOption[]> {
		return this._http.get<AgentCountryApiResponse[]>(`${BASE}/countries`).pipe(
			map((countries) => (countries ?? []).map(({ code, name, phoneCode }) => ({ code, name, phoneCode }))),
		);
	}

	public listCurrencies(): Observable<CurrencyOption[]> {
		return this._http.get<AgentCurrencyApiResponse[]>(`${BASE}/currencies`).pipe(
			map((currencies) => (currencies ?? []).map(({ id, name, symbol, active }) => ({ id, name, symbol, active: active ?? undefined }))),
		);
	}

	public quote(request: AgentTransferQuoteRequest): Observable<AgentTransferQuoteResponse> {
		return this._http.post<AgentTransferQuoteResponse>(`${BASE}/transfers/quote`, request);
	}

	public createTransfer(request: CreateAgentTransferRequest): Observable<CreateAgentTransferResponse> {
		return this._http.post<CreateAgentTransferResponse>(`${BASE}/transfers`, request);
	}
}
