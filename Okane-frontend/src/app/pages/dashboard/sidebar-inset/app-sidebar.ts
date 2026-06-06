import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCommand } from '@ng-icons/lucide';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { AuthSessionService } from '../../../shared/auth/auth-session.service';
import { DashboardRole, getSidebarData, resolveRoleFromPath } from '../shared/sidebar/data';
import { NavMain } from '../shared/sidebar/nav-main';
import { NavProjects } from '../shared/sidebar/nav-projects';
import { NavSecondary } from '../shared/sidebar/nav-secondary';
import { NavUser } from '../shared/sidebar/nav-user';

@Component({
	selector: 'spartan-app-sidebar-inset',
	imports: [HlmSidebarImports, NgIcon, NavMain, NavProjects, NavUser, NavSecondary],
	providers: [provideIcons({ lucideCommand })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div hlmSidebarWrapper>
			<hlm-sidebar variant="inset">
				<hlm-sidebar-header>
					<ul hlmSidebarMenu>
						<li hlmSidebarMenuItem>
							<a hlmSidebarMenuButton size="lg" href="#">
								<div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
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
					@if (data().projects.length) {
						<spartan-nav-projects [projects]="data().projects" />
					}
					@if (data().navSecondary.length) {
						<spartan-nav-secondary class="mt-auto" [items]="data().navSecondary" />
					}
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
	private readonly _authSession = inject(AuthSessionService);

	public readonly data = computed(() => {
		const user = this._authSession.user();
		const role = user?.role
			? (user.role as DashboardRole)
			: resolveRoleFromPath(this._router.url || '/client/dashboard');
		return getSidebarData(role, this.resolveSidebarUser());
	});

	constructor() {
		this._authSession.hydrateFromStorage();
		if (!this._authSession.user()) {
			this._authSession.refreshCurrentUser().subscribe();
		}
	}

	private resolveSidebarUser() {
		const user = this._authSession.user();
		if (!user) {
			return undefined;
		}
		return {
			name: `${user.firstName} ${user.lastName}`.trim(),
			email: user.email,
			avatar: user.avatar,
			roleLabel: user.role ? user.role.replace('ROLE_', '') : 'USER',
		};
	}
}
