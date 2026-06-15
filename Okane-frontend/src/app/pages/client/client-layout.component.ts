import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { AppSidebarInset } from '../dashboard/sidebar-inset/app-sidebar';
import { SiteHeader } from '../dashboard/sidebar-inset/site-header';

@Component({
	selector: 'okane-client-layout',
	standalone: true,
	imports: [HlmSidebarImports, RouterOutlet, AppSidebarInset, SiteHeader],
	template: `
		<spartan-app-sidebar-inset>
			<main hlmSidebarInset>
				<spartan-site-header-inset />
				<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
					<router-outlet />
				</div>
			</main>
		</spartan-app-sidebar-inset>
	`,
})
export class ClientLayoutComponent {}
