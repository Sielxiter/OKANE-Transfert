import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CLIENT_API_BASE } from '../../../core/api/api.config';

@Injectable({ providedIn: 'root' })
export class ClientNotificationBadgeService {
	private readonly _http = inject(HttpClient);
	public readonly unreadCount = signal<number | null>(null);

	public refresh(): void {
		this._http
			.get<{ unreadCount: number }>(`${CLIENT_API_BASE}/notifications/unread-count`)
			.pipe(catchError(() => of({ unreadCount: 0 })))
			.subscribe((response) => {
				this.unreadCount.set(response.unreadCount);
			});
	}
}
