import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideChartPie,
	lucideEllipsis,
	lucideFolder,
	lucideFrame,
	lucideMap,
	lucideShare,
	lucideTrash2,
} from '@ng-icons/lucide';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmSidebarImports, HlmSidebarService } from '@spartan-ng/helm/sidebar';
import { I18nPipe } from '../../../../shared/i18n/i18n.pipe';
import { I18nService } from '../../../../shared/i18n/i18n.service';

@Component({
	selector: 'spartan-nav-projects',
	imports: [HlmSidebarImports, NgIcon, RouterLink, HlmDropdownMenuImports, I18nPipe],
	providers: [
		provideIcons({ lucideFrame, lucideChartPie, lucideMap, lucideEllipsis, lucideFolder, lucideShare, lucideTrash2 }),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<hlm-sidebar-group>
			<div hlmSidebarGroupLabel>{{ 'Projets' | okaneI18n }}</div>
			<ul hlmSidebarMenu>
				@for (project of projects(); track $index) {
					<li hlmSidebarMenuItem>
						<a hlmSidebarMenuButton [routerLink]="project.url">
							<ng-icon [name]="project.icon" />
							{{ project.name | okaneI18n }}
						</a>
						<button
							hlmSidebarMenuAction
							showOnHover
							[hlmDropdownMenuTrigger]="menu"
							[hlmDropdownMenuTriggerData]="{ $implicit: { project } }"
							[side]="_menuSide()"
							[align]="_menuAlign()"
						>
							<ng-icon name="lucideEllipsis" />
							<span class="sr-only">{{ 'Plus' | okaneI18n }}</span>
						</button>
					</li>
				}
				<li hlmSidebarMenuItem>
					<button hlmSidebarMenuButton>
						<ng-icon name="lucideEllipsis" />
						{{ 'Plus' | okaneI18n }}
					</button>
				</li>
			</ul>
		</hlm-sidebar-group>

		<ng-template #menu let-ctx>
			<hlm-dropdown-menu class="w-48">
				<hlm-dropdown-menu-group>
					<hlm-dropdown-menu-label>{{ ctx.project.name | okaneI18n }}</hlm-dropdown-menu-label>
				</hlm-dropdown-menu-group>
				<hlm-dropdown-menu-separator />
				<button hlmDropdownMenuItem>
					<ng-icon name="lucideFolder" />
					{{ 'Voir le projet' | okaneI18n }}
				</button>
				<button hlmDropdownMenuItem>
					<ng-icon name="lucideShare" />
					{{ 'Partager le projet' | okaneI18n }}
				</button>
				<hlm-dropdown-menu-separator />
				<button hlmDropdownMenuItem>
					<ng-icon name="lucideTrash2" />
					{{ 'Supprimer le projet' | okaneI18n }}
				</button>
			</hlm-dropdown-menu>
		</ng-template>
	`,
})
export class NavProjects {
	private readonly _sidebarService = inject(HlmSidebarService);
	private readonly _i18n = inject(I18nService);
	protected readonly _menuSide = computed(() =>
		this._sidebarService.isMobile() ? 'bottom' : this._i18n.isRtl() ? 'left' : 'right',
	);
	protected readonly _menuAlign = computed(() => (this._sidebarService.isMobile() ? 'end' : 'start'));

	public readonly projects = input.required<
		{
			name: string;
			url: string;
			icon: string;
		}[]
	>();
}
