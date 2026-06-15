import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CLIENT_API_BASE } from '../../../core/api/api.config';
import type { ClientDashboardSummary, ClientNotification, ClientTransferListItem } from '../client.models';

const FALLBACK_SUMMARY: ClientDashboardSummary = {
	totalTransfers: 12,
	pendingTransfers: 4,
	paidTransfers: 7,
	cancelledTransfers: 1,
	expiredTransfers: 0,
	totalSentAmount: 24000,
	totalReceivedAmount: 1464000,
	totalFeesPaid: 320,
	defaultCurrency: 'MAD',
};

const FALLBACK_TRANSFERS: ClientTransferListItem[] = [
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
];

const FALLBACK_NOTIFICATIONS: ClientNotification[] = [
	{
		id: 1,
		title: 'Transfert payé',
		message: 'Votre transfert TRX-2026-0001 a été payé au bénéficiaire.',
		type: 'TRANSFER_PAID',
		read: false,
		createdAt: new Date().toISOString(),
		transferReference: 'TRX-2026-0001',
	},
];

@Injectable({ providedIn: 'root' })
export class ClientDashboardApiService {
	private readonly _http = inject(HttpClient);

	public summary() {
		return this._http.get<ClientDashboardSummary>(`${CLIENT_API_BASE}/dashboard/summary`).pipe(catchError(() => of(FALLBACK_SUMMARY)));
	}

	public recentTransfers(limit = 5) {
		return this._http
			.get<{ content: ClientTransferListItem[] }>(`${CLIENT_API_BASE}/transfers`, {
				params: { size: limit, page: 0, sort: 'createdAt,desc' },
			})
			.pipe(catchError(() => of({ content: FALLBACK_TRANSFERS.slice(0, limit) })));
	}

	public recentNotifications(limit = 5) {
		return this._http
			.get<{ content: ClientNotification[] }>(`${CLIENT_API_BASE}/notifications`, {
				params: { size: limit, page: 0, sort: 'createdAt,desc' },
			})
			.pipe(catchError(() => of({ content: FALLBACK_NOTIFICATIONS.slice(0, limit) })));
	}

	public unreadCount() {
		return this._http.get<{ unreadCount: number }>(`${CLIENT_API_BASE}/notifications/unread-count`).pipe(catchError(() => of({ unreadCount: 1 })));
	}
}
