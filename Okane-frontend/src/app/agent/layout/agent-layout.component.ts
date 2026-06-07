import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { AppSidebarInset } from '../../pages/dashboard/sidebar-inset/app-sidebar';
import { AgentSiteHeaderComponent } from './agent-site-header.component';

@Component({
	selector: 'okane-agent-layout',
	standalone: true,
	imports: [HlmSidebarImports, AppSidebarInset, AgentSiteHeaderComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<spartan-app-sidebar-inset>
			<main hlmSidebarInset>
				<okane-agent-site-header [pageTitle]="pageTitle()" />
				<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
					<ng-content />
				</div>
			</main>
		</spartan-app-sidebar-inset>
	`,
})
export class AgentLayoutComponent {
	public readonly pageTitle = input<string>('Tableau de bord');
}
