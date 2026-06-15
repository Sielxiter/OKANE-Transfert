import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

interface StoredUser {
	role?: string;
}

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
	const platformId = inject(PLATFORM_ID);
	const router = inject(Router);

	if (!isPlatformBrowser(platformId)) {
		return true;
	}

	const requiredRoles = (route.data?.['roles'] as string[] | undefined) ?? [];
	if (requiredRoles.length === 0) {
		return true;
	}

	try {
		const raw = localStorage.getItem('okane_user');
		if (!raw) {
			return router.createUrlTree(['/login']);
		}
		const user = JSON.parse(raw) as StoredUser;
		if (user.role && requiredRoles.includes(user.role)) {
			return true;
		}
	} catch {
		// fall through to redirect
	}

	return router.createUrlTree(['/login']);
};
