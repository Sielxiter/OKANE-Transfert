import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LocaleSwitcherComponent } from '../../../shared/i18n/locale-switcher.component';
import { I18nPipe } from '../../../shared/i18n/i18n.pipe';
import { I18nService } from '../../../shared/i18n/i18n.service';

@Component({
	selector: 'spartan-site-header-inset',
	standalone: true,
	imports: [HlmSidebarImports, HlmSeparatorImports, HlmBreadcrumbImports, LocaleSwitcherComponent, I18nPipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<header class="flex h-16 shrink-0 items-center gap-2">
			<div class="flex w-full items-center gap-2 px-4">
				<button hlmSidebarTrigger></button>
				<hlm-separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
				<nav hlmBreadcrumb>
					<ol hlmBreadcrumbList>
						<li class="hidden sm:block" hlmBreadcrumbItem>
							<a hlmBreadcrumbLink link="/">{{ 'Okane Transfer' | okaneI18n }}</a>
						</li>
						<li class="hidden sm:block" hlmBreadcrumbSeparator></li>
						<li hlmBreadcrumbItem>
							<a hlmBreadcrumbPage>{{ pageTitle() | okaneI18n }}</a>
						</li>
					</ol>
				</nav>
				<div class="flex items-center gap-2" style="margin-inline-start: auto;">
					<okane-locale-switcher />
				</div>
			</div>
		</header>
	`,
})
export class SiteHeader {
	public readonly i18n = inject(I18nService);
	private readonly _router = inject(Router);
	protected readonly pageTitle = toSignal(
		this._router.events.pipe(
			filter((event): event is NavigationEnd => event instanceof NavigationEnd),
			startWith(null),
			map(() => this.resolveRouteTitle()),
		),
		{ initialValue: this.resolveRouteTitle() },
	);

	private resolveRouteTitle(): string {
		return this.findDeepestTitle(this._router.routerState.root) ?? 'Tableau de bord';
	}

	private findDeepestTitle(route: ActivatedRoute | null | undefined): string | undefined {
		if (!route) {
			return undefined;
		}

		let current: ActivatedRoute | null | undefined = route;
		while (current?.firstChild) {
			current = current.firstChild;
		}

		return current?.snapshot?.data?.['title'] as string | undefined;
	}
}
