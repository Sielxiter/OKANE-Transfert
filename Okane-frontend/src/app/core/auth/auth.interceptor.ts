import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { TokenStorageService } from './token.storage';

/**
 * Adds the Authorization header on calls to the backend API and clears local
 * tokens (then redirects to /login) on 401 responses. We intentionally avoid
 * touching the public auth endpoints (login / refresh / logout) to keep the
 * existing flow intact.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
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
			if (isApiCall && !isAuthEndpoint && error?.status === 401) {
				tokenStorage.clear();
				router.navigateByUrl('/login');
			}
			return throwError(() => error);
		}),
	);
};
