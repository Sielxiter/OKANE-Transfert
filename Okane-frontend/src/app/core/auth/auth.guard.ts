import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { TokenStorageService } from './token.storage';

/**
 * Protects routes that require authentication.
 * Redirects to /login if no access token is found in localStorage.
 * On the server (SSR), always allows through — the client-side guard
 * will handle the redirect once the browser hydrates.
 */
export const authGuard: CanActivateFn = () => {
	const platformId = inject(PLATFORM_ID);
	const tokenStorage = inject(TokenStorageService);
	const router = inject(Router);

	// During SSR there is no localStorage — let the page render,
	// the browser-side guard will redirect if needed after hydration.
	if (!isPlatformBrowser(platformId)) {
		return true;
	}

	const token = tokenStorage.getAccessToken();
	if (token) {
		return true;
	}

	return router.createUrlTree(['/login']);
};
