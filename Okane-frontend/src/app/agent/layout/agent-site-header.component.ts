import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

@Component({
	selector: 'okane-agent-site-header',
	standalone: true,
	imports: [HlmSidebarImports, HlmSeparatorImports, HlmBreadcrumbImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<header class="flex h-16 shrink-0 items-center gap-2">
			<div class="flex items-center gap-2 px-4">
				<button hlmSidebarTrigger></button>
				<hlm-separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
				<nav hlmBreadcrumb>
					<ol hlmBreadcrumbList>
						<li class="hidden sm:block" hlmBreadcrumbItem>
							<a hlmBreadcrumbLink link="/agent/dashboard">Agent</a>
						</li>
						<li class="hidden sm:block" hlmBreadcrumbSeparator></li>
						<li hlmBreadcrumbItem>
							<a hlmBreadcrumbPage>{{ pageTitle() }}</a>
						</li>
					</ol>
				</nav>
			</div>
		</header>
	`,
})
export class AgentSiteHeaderComponent {
	public readonly pageTitle = input.required<string>();
}
