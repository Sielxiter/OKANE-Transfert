import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCommand } from '@ng-icons/lucide';
import { Router } from '@angular/router';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { getSidebarData, resolveRoleFromPath, DashboardRole } from '../shared/sidebar/data';
import { NavMain } from '../shared/sidebar/nav-main';
import { NavUser } from '../shared/sidebar/nav-user';
import { I18nService } from '../../../shared/i18n/i18n.service';
import { ClientNotificationBadgeService } from '../../client/services/client-notification-badge.service';

@Component({
	selector: 'spartan-app-sidebar-inset',
	imports: [HlmSidebarImports, NgIcon, NavMain, NavUser],
	providers: [provideIcons({ lucideCommand })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div hlmSidebarWrapper class="flex min-h-svh w-full">
			<hlm-sidebar variant="inset">
				<hlm-sidebar-header>
					<ul hlmSidebarMenu>
						<li hlmSidebarMenuItem>
							<a hlmSidebarMenuButton size="lg" href="#">
								<div
									class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
								>
									<ng-icon name="lucideCommand" class="text-base" />
								</div>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">Okane Transfer</span>
									<span class="truncate text-xs">Enterprise</span>
								</div>
							</a>
						</li>
					</ul>
				</hlm-sidebar-header>

				<hlm-sidebar-content>
					<spartan-nav-main [items]="data().navMain" />
				</hlm-sidebar-content>
				<hlm-sidebar-footer>
					<spartan-nav-user [user]="data().user" />
				</hlm-sidebar-footer>
			</hlm-sidebar>
			<ng-content />
		</div>
	`,
})
export class AppSidebarInset {
	private readonly _router = inject(Router);
	private readonly _platformId = inject(PLATFORM_ID);
	private readonly _notificationBadge = inject(ClientNotificationBadgeService);
	public readonly i18n = inject(I18nService);
	public readonly data = signal(this.buildSidebarData());

	constructor() {
		if (this.resolveRole() === 'ROLE_CLIENT' && isPlatformBrowser(this._platformId)) {
			this._notificationBadge.refresh();
		}

		effect(() => {
			const unreadCount = this.resolveRole() === 'ROLE_CLIENT' ? this._notificationBadge.unreadCount() : null;
			this.data.update((current) => ({
				...current,
				navMain: current.navMain.map((item) =>
					item.url === '/client/notifications'
						? { ...item, badge: unreadCount && unreadCount > 0 ? unreadCount : undefined }
						: item,
				),
			}));
		});
	}

	private buildSidebarData() {
		const role = this.resolveRole();
		const user = this.resolveUser();
		return getSidebarData(role, user);
	}

	private resolveRole(): DashboardRole {
		const pathRole = resolveRoleFromPath(this._router.url || '/client/dashboard');
		if (pathRole) {
			return pathRole;
		}

		return 'ROLE_CLIENT';
	}

	private resolveUser() {
		if (!isPlatformBrowser(this._platformId)) {
			return undefined;
		}

		try {
			const raw = localStorage.getItem('okane_user');
			if (!raw) {
				return undefined;
			}

			const user = JSON.parse(raw) as {
				firstName?: string;
				lastName?: string;
				email?: string;
				role?: string;
			};

			return {
				name: `${user.firstName ?? 'Okane'} ${user.lastName ?? 'Transfer'}`.trim(),
				email: user.email ?? 'hello@okane.com',
				avatar: '/assets/avatar.png',
				roleLabel: user.role ? user.role.replace('ROLE_', '') : 'USER',
			};
		} catch {
			return undefined;
		}
	}
}
