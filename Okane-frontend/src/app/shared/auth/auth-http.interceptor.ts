import { HttpInterceptorFn } from '@angular/common/http';

const API_PREFIX = '/api';
const AUTH_PREFIX = '/api/auth';

function getAccessToken(): string | null {
	if (typeof window === 'undefined') {
		return null;
	}
	return window.localStorage.getItem('okane_access_token');
}

export const authHttpInterceptor: HttpInterceptorFn = (req, next) => {
	const url = req.url ?? '';
	const isApiCall = url.startsWith(API_PREFIX) || url.includes(`${API_PREFIX}/`);
	const isAuthCall = url.startsWith(AUTH_PREFIX) || url.includes(`${AUTH_PREFIX}/`);

	if (!isApiCall || isAuthCall) {
		return next(req);
	}

	const token = getAccessToken();
	if (!token) {
		return next(req);
	}

	return next(
		req.clone({
			setHeaders: {
				Authorization: `Bearer ${token}`,
			},
		})
	);
};
