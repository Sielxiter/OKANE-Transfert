import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { TokenStorageService } from './token.storage';

/**
 * Adds the Authorization header on calls to the backend API and clears local
 * tokens (then redirects to /login) on 401 responses. We intentionally avoid
 * touching the public auth endpoints (login / refresh / logout) to keep the
 * existing flow intact.
 *
 * During SSR (server-side rendering) localStorage is unavailable, so we skip
 * the 401 redirect — the auth guard handles that on the client side.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
	const platformId = inject(PLATFORM_ID);
	const tokenStorage = inject(TokenStorageService);
	const router = inject(Router);

	const isApiCall = request.url.startsWith(API_BASE_URL);
	const isAuthEndpoint = request.url.startsWith(`${API_BASE_URL}/auth/`);
	const accessToken = tokenStorage.getAccessToken();

	let authorized = request;
	if (isApiCall && !isAuthEndpoint && accessToken) {
		authorized = request.clone({
			setHeaders: {
				Authorization: `${tokenStorage.getTokenType() ?? 'Bearer'} ${accessToken}`,
			},
		});
	}

	return next(authorized).pipe(
		catchError((error) => {
			// Only redirect on 401 in the browser — during SSR localStorage is
			// unavailable so the token is always null and every API call returns 401.
			if (isPlatformBrowser(platformId) && isApiCall && !isAuthEndpoint && error?.status === 401) {
				tokenStorage.clear();
				router.navigateByUrl('/login');
			}
			return throwError(() => error);
		}),
	);
};
