import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

type CurrentUserResponse = {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	role: string;
	agency: { id: number; name: string; code: string } | null;
};

export type SessionUser = CurrentUserResponse & {
	avatar: string;
};

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
	private readonly _http = inject(HttpClient);
	private readonly _platformId = inject(PLATFORM_ID);
	private readonly _isBrowser = isPlatformBrowser(this._platformId);
	private readonly _user = signal<SessionUser | null>(null);

	public readonly user = this._user.asReadonly();
	public readonly displayName = computed(() => {
		const user = this._user();
		return user ? `${user.firstName} ${user.lastName}`.trim() : 'Okane Transfer';
	});

	public hydrateFromStorage(): void {
		if (!this._isBrowser || this._user()) {
			return;
		}
		const stored = this.readStoredUser();
		if (stored) {
			this._user.set(stored);
		}
	}

	public refreshCurrentUser(): Observable<SessionUser | null> {
		if (!this._isBrowser || !localStorage.getItem('okane_access_token')) {
			return of(null);
		}
		return this._http.get<CurrentUserResponse>('/api/auth/me').pipe(
			map((user) => this.enrichUser(user)),
			tap((user) => this.storeUser(user)),
			catchError(() => of(this._user()))
		);
	}

	public setUserFromLogin(user: CurrentUserResponse): void {
		if (!this._isBrowser) {
			return;
		}
		this.storeUser(this.enrichUser(user));
	}

	public updateCachedUser(patch: Partial<CurrentUserResponse>): void {
		const current = this._user();
		if (!current) {
			return;
		}
		this.storeUser(this.enrichUser({ ...current, ...patch }));
	}

	public logout(): Observable<void> {
		const refreshToken = this._isBrowser ? localStorage.getItem('okane_refresh_token') : null;
		if (!refreshToken) {
			this.clearSession();
			return of(void 0);
		}
		return this._http.post('/api/auth/logout', { refreshToken }).pipe(
			map(() => void 0),
			catchError(() => of(void 0)),
			tap(() => this.clearSession())
		);
	}

	public clearSession(): void {
		if (this._isBrowser) {
			localStorage.removeItem('okane_access_token');
			localStorage.removeItem('okane_refresh_token');
			localStorage.removeItem('okane_token_type');
			localStorage.removeItem('okane_user');
		}
		this._user.set(null);
	}

	private readStoredUser(): SessionUser | null {
		try {
			const raw = localStorage.getItem('okane_user');
			if (!raw) {
				return null;
			}
			return this.enrichUser(JSON.parse(raw) as CurrentUserResponse);
		} catch {
			return null;
		}
	}

	private storeUser(user: SessionUser): void {
		this._user.set(user);
		if (this._isBrowser) {
			localStorage.setItem('okane_user', JSON.stringify(user));
		}
	}

	private enrichUser(user: CurrentUserResponse): SessionUser {
		return {
			...user,
			avatar: '/assets/avatar.png',
		};
	}
}
