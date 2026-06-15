import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const ACCESS_KEY = 'okane_access_token';
const REFRESH_KEY = 'okane_refresh_token';
const TYPE_KEY = 'okane_token_type';
const USER_KEY = 'okane_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
	private readonly _platformId = inject(PLATFORM_ID);

	private get isBrowser(): boolean {
		return isPlatformBrowser(this._platformId);
	}

	public getAccessToken(): string | null {
		if (!this.isBrowser) return null;
		return localStorage.getItem(ACCESS_KEY);
	}

	public getRefreshToken(): string | null {
		if (!this.isBrowser) return null;
		return localStorage.getItem(REFRESH_KEY);
	}

	public getTokenType(): string {
		if (!this.isBrowser) return 'Bearer';
		return localStorage.getItem(TYPE_KEY) ?? 'Bearer';
	}

	public clear(): void {
		if (!this.isBrowser) return;
		localStorage.removeItem(ACCESS_KEY);
		localStorage.removeItem(REFRESH_KEY);
		localStorage.removeItem(TYPE_KEY);
		localStorage.removeItem(USER_KEY);
	}
}
