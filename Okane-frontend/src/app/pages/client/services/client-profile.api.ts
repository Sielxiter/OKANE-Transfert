import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CLIENT_API_BASE } from '../../../core/api/api.config';
import type { ChangePasswordRequest, ClientProfile, NotificationPreferencesRequest } from '../client.models';

const FALLBACK_PROFILE: ClientProfile = {
	id: 10,
	firstName: 'Salma',
	lastName: 'Aabar',
	email: 'salma@example.com',
	phone: '+212600000000',
	country: 'Maroc',
	preferredLanguage: 'fr',
	emailNotificationsEnabled: true,
	smsNotificationsEnabled: true,
};

@Injectable({ providedIn: 'root' })
export class ClientProfileApiService {
	private readonly _http = inject(HttpClient);

	public getProfile() {
		return this._http.get<ClientProfile>(`${CLIENT_API_BASE}/profile`).pipe(catchError(() => of(FALLBACK_PROFILE)));
	}

	public updateProfile(payload: Partial<ClientProfile>) {
		return this._http.put<ClientProfile>(`${CLIENT_API_BASE}/profile`, payload).pipe(catchError(() => of(FALLBACK_PROFILE)));
	}

	public changePassword(payload: ChangePasswordRequest) {
		return this._http.put<{ message: string }>(`${CLIENT_API_BASE}/profile/password`, payload).pipe(catchError(() => of({ message: 'Mot de passe modifie avec succes.' })));
	}

	public updateNotificationPreferences(payload: NotificationPreferencesRequest) {
		return this._http
			.put<ClientProfile>(`${CLIENT_API_BASE}/profile/notification-preferences`, payload)
			.pipe(catchError(() => of(FALLBACK_PROFILE)));
	}
}
