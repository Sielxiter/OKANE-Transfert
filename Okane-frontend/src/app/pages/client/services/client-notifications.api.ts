import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CLIENT_API_BASE } from '../../../core/api/api.config';
import type { ClientNotification, PageResponse } from '../client.models';

const FALLBACK_NOTIFICATIONS: PageResponse<ClientNotification> = {
	content: [
		{
			id: 1,
			title: 'Transfert payé',
			message: 'Votre transfert TRX-2026-0001 a été payé au bénéficiaire.',
			type: 'TRANSFER_PAID',
			read: false,
			createdAt: new Date().toISOString(),
			transferReference: 'TRX-2026-0001',
		},
	],
	page: 0,
	size: 10,
	totalElements: 1,
	totalPages: 1,
};

@Injectable({ providedIn: 'root' })
export class ClientNotificationsApiService {
	private readonly _http = inject(HttpClient);

	public list(params: Record<string, string | number | boolean | null | undefined> = {}) {
		const cleanParams = Object.fromEntries(
			Object.entries(params).filter(([, value]) => value !== null && value !== undefined && `${value}`.length > 0),
		) as Record<string, string | number | boolean>;
		return this._http.get<PageResponse<ClientNotification>>(`${CLIENT_API_BASE}/notifications`, { params: cleanParams }).pipe(catchError(() => of(FALLBACK_NOTIFICATIONS)));
	}

	public unreadCount() {
		return this._http.get<{ unreadCount: number }>(`${CLIENT_API_BASE}/notifications/unread-count`).pipe(catchError(() => of({ unreadCount: 1 })));
	}

	public markRead(id: number) {
		return this._http.patch<void>(`${CLIENT_API_BASE}/notifications/${id}/read`, {}).pipe(catchError(() => of(void 0)));
	}

	public markAllRead() {
		return this._http.patch<void>(`${CLIENT_API_BASE}/notifications/read-all`, {}).pipe(catchError(() => of(void 0)));
	}

	public delete(id: number) {
		return this._http.delete<void>(`${CLIENT_API_BASE}/notifications/${id}`).pipe(catchError(() => of(void 0)));
	}
}
