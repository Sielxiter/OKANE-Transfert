import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideBadgePercent,
	lucideBarChart3,
	lucideBookOpen,
	lucideBot,
	lucideBuilding2,
	lucideChevronRight,
	lucideClipboardList,
	lucideCoins,
	lucideLayoutDashboard,
	lucideSettings2,
	lucideShieldCheck,
	lucideSquareTerminal,
	lucideUsers,
	lucideWallet,
} from '@ng-icons/lucide';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
	selector: 'spartan-nav-main',
	imports: [HlmSidebarImports, NgIcon, HlmCollapsibleImports, RouterLink],
	providers: [
		provideIcons({
			lucideSquareTerminal,
			lucideBot,
			lucideBookOpen,
			lucideSettings2,
			lucideChevronRight,
			lucideLayoutDashboard,
			lucideUsers,
			lucideBuilding2,
			lucideArrowRightLeft,
			lucideWallet,
			lucideCoins,
			lucideBadgePercent,
			lucideShieldCheck,
			lucideBarChart3,
			lucideClipboardList,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<hlm-sidebar-group>
			<div hlmSidebarGroupLabel>Plateforme</div>
			<ul hlmSidebarMenu>
				@for (item of items(); track item.title) {
					<hlm-collapsible [expanded]="isItemExpanded(item)">
						<li hlmSidebarMenuItem>
							@if (item.url) {
								<a hlmSidebarMenuButton [routerLink]="item.url" [isActive]="isTopLevelItemActive(item)">
									<ng-icon [name]="item.icon" />
									{{ item.title }}
								</a>
							} @else {
								<button hlmSidebarMenuButton type="button" [isActive]="isTopLevelItemActive(item)">
									<ng-icon [name]="item.icon" />
									{{ item.title }}
								</button>
							}

							@if (item.items; as subItems) {
								<button hlmCollapsibleTrigger hlmSidebarMenuAction class="data-[state=open]:rotate-90">
									<ng-icon name="lucideChevronRight" />
								</button>
								<hlm-collapsible-content>
									<ul hlmSidebarMenuSub>
										@for (subItem of subItems; track subItem.title) {
											<li hlmSidebarMenuSubItem>
												@if (subItem.url) {
													<a hlmSidebarMenuSubButton [routerLink]="subItem.url" [isActive]="isRouteActive(subItem.url)">
														{{ subItem.title }}
													</a>
												} @else {
													<button hlmSidebarMenuSubButton type="button">{{ subItem.title }}</button>
												}
											</li>
										}
									</ul>
								</hlm-collapsible-content>
							}
						</li>
					</hlm-collapsible>
				}
			</ul>
		</hlm-sidebar-group>
	`,
})
export class NavMain {
	private readonly _router = inject(Router);
	private readonly _currentUrl = toSignal(
		this._router.events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			map((event) => event.urlAfterRedirects),
			startWith(this._router.url),
		),
		{ initialValue: this._router.url },
	);

	public readonly items = input.required<
		{
			title: string;
			url?: string;
			icon: string;
			isActive?: boolean;
			items?: {
				title: string;
				url?: string;
			}[];
		}[]
	>();

	protected isRouteActive(url: string): boolean {
		return this.normalizeUrl(this._currentUrl()) === this.normalizeUrl(url);
	}

	protected isTopLevelItemActive(item: { url?: string; isActive?: boolean; items?: { url?: string }[] }): boolean {
		if (item.items?.some((subItem) => subItem.url && this.isRouteActive(subItem.url))) {
			return true;
		}

		if (item.url) {
			return this.isRouteActive(item.url);
		}

		return item.isActive ?? false;
	}

	protected isItemExpanded(item: { url?: string; isActive?: boolean; items?: { url?: string }[] }): boolean {
		if (!item.items?.length) {
			return false;
		}

		if (item.items.some((subItem) => subItem.url && this.isRouteActive(subItem.url))) {
			return true;
		}

		if (item.url && this.isRouteActive(item.url)) {
			return true;
		}

		return item.isActive ?? false;
	}

	private normalizeUrl(url: string): string {
		const [pathWithoutQuery] = url.split('?');
		const [pathWithoutFragment] = pathWithoutQuery.split('#');
		const normalized = pathWithoutFragment.endsWith('/') && pathWithoutFragment.length > 1
			? pathWithoutFragment.slice(0, -1)
			: pathWithoutFragment;
		return normalized || '/';
	}
}
