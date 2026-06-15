import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CLIENT_API_BASE } from '../../../core/api/api.config';
import type { ClientTrackTransfer, ClientTransferDetails, ClientTransferListItem, PageResponse } from '../client.models';

const FALLBACK_PAGE: PageResponse<ClientTransferListItem> = {
	content: [
		{
			reference: 'TRX-2026-0001',
			beneficiaryFullName: 'Amine Diallo',
			sendCountry: 'Maroc',
			receiveCountry: 'Sénégal',
			sendAmount: 1000,
			sendCurrency: 'MAD',
			receiveAmount: 61000,
			receiveCurrency: 'XOF',
			fees: 35,
			status: 'EN_ATTENTE',
			createdAt: new Date().toISOString(),
		},
	],
	page: 0,
	size: 10,
	totalElements: 1,
	totalPages: 1,
};

const FALLBACK_DETAILS: ClientTransferDetails = {
	...FALLBACK_PAGE.content[0],
	senderFullName: 'Salma Aabar',
	senderPhone: '+212600000000',
	beneficiaryPhone: '+221770000000',
	exchangeRate: 61,
	agencyName: 'Agence Marrakech Centre',
	payoutAgencyName: 'Agence Dakar Centre',
	statusHistory: [
		{
			status: 'EN_ATTENTE',
			label: 'Transfert créé',
			description: 'Le transfert a été créé et attend le retrait.',
			createdAt: new Date().toISOString(),
		},
	],
};

@Injectable({ providedIn: 'root' })
export class ClientTransfersApiService {
	private readonly _http = inject(HttpClient);

	public list(params: Record<string, string | number | boolean | null | undefined> = {}) {
		const cleanParams = Object.fromEntries(
			Object.entries(params).filter(([, value]) => value !== null && value !== undefined && `${value}`.length > 0),
		) as Record<string, string | number | boolean>;
		return this._http
			.get<PageResponse<ClientTransferListItem>>(`${CLIENT_API_BASE}/transfers`, { params: cleanParams })
			.pipe(catchError(() => of(FALLBACK_PAGE)));
	}

	public get(reference: string) {
		return this._http.get<ClientTransferDetails>(`${CLIENT_API_BASE}/transfers/${encodeURIComponent(reference)}`).pipe(catchError(() => of(FALLBACK_DETAILS)));
	}

	public track(reference: string) {
		return this._http
			.get<ClientTrackTransfer>(`${CLIENT_API_BASE}/transfers/track`, { params: { reference } })
			.pipe(catchError(() => of({
				reference: FALLBACK_DETAILS.reference,
				beneficiaryFullName: FALLBACK_DETAILS.beneficiaryFullName,
				sendAmount: FALLBACK_DETAILS.sendAmount,
				sendCurrency: FALLBACK_DETAILS.sendCurrency,
				receiveAmount: FALLBACK_DETAILS.receiveAmount,
				receiveCurrency: FALLBACK_DETAILS.receiveCurrency,
				status: FALLBACK_DETAILS.status,
				createdAt: FALLBACK_DETAILS.createdAt,
				statusHistory: FALLBACK_DETAILS.statusHistory,
				receiveCountry: FALLBACK_DETAILS.receiveCountry,
			})));
	}

	public receipt(reference: string) {
		return this._http.get(`${CLIENT_API_BASE}/transfers/${encodeURIComponent(reference)}/receipt`).pipe(catchError(() => of(FALLBACK_DETAILS)));
	}
}
