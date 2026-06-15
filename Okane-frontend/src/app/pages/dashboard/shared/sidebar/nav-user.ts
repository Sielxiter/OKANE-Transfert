import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBadgeCheck,
	lucideBell,
	lucideChevronsUpDown,
	lucideCreditCard,
	lucideLogOut,
	lucideSparkles,
} from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmSidebarImports, HlmSidebarService } from '@spartan-ng/helm/sidebar';
import { I18nPipe } from '../../../../shared/i18n/i18n.pipe';
import { I18nService } from '../../../../shared/i18n/i18n.service';

@Component({
	selector: 'spartan-nav-user',
	imports: [HlmSidebarImports, HlmAvatarImports, NgIcon, HlmDropdownMenuImports, I18nPipe],
	providers: [
		provideIcons({
			lucideChevronsUpDown,
			lucideSparkles,
			lucideBadgeCheck,
			lucideCreditCard,
			lucideBell,
			lucideLogOut,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@let u = user();
		<ul hlmSidebarMenu>
			<li hlmSidebarMenuItem>
				<button hlmSidebarMenuButton size="lg" [hlmDropdownMenuTrigger]="menu" [side]="_menuSide()" align="end">
					<hlm-avatar class="rounded-lg">
						<img [src]="u.avatar" [alt]="u.name" hlmAvatarImage />
						<span class="rounded-lg bg-[#FD005B] text-white" hlmAvatarFallback>RG</span>
					</hlm-avatar>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-medium">{{ u.name }}</span>
						<span class="truncate text-xs">{{ u.email }}</span>
					</div>
					<ng-icon name="lucideChevronsUpDown" class="ms-auto text-base" />
				</button>
			</li>
		</ul>

		<ng-template #menu>
			<hlm-dropdown-menu class="min-w-56 rounded-lg">
				<hlm-dropdown-menu-label>
					<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
						<hlm-avatar class="rounded-lg">
							<img [src]="u.avatar" [alt]="u.name" hlmAvatarImage />
							<span class="rounded-lg bg-[#FD005B] text-white" hlmAvatarFallback>RG</span>
						</hlm-avatar>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{{ u.name }}</span>
							<span class="truncate text-xs">{{ u.email }}</span>
						</div>
					</div>
				</hlm-dropdown-menu-label>
				<hlm-dropdown-menu-separator />
				<hlm-dropdown-menu-group>
					<button hlmDropdownMenuItem>
						<ng-icon name="lucideSparkles" />
						{{ 'Passer à Pro' | okaneI18n }}
					</button>
				</hlm-dropdown-menu-group>
				<hlm-dropdown-menu-separator />
				<hlm-dropdown-menu-group>
					<button hlmDropdownMenuItem>
						<ng-icon name="lucideBadgeCheck" />
						{{ 'Profil' | okaneI18n }}
					</button>
					<button hlmDropdownMenuItem>
						<ng-icon name="lucideCreditCard" />
						{{ 'Facturation' | okaneI18n }}
					</button>
					<button hlmDropdownMenuItem>
						<ng-icon name="lucideBell" />
						{{ 'Notifications' | okaneI18n }}
					</button>
				</hlm-dropdown-menu-group>
				<hlm-dropdown-menu-separator />
				<button hlmDropdownMenuItem type="button" (click)="signOut()">
					<ng-icon name="lucideLogOut" />
					{{ 'Déconnexion' | okaneI18n }}
				</button>
			</hlm-dropdown-menu>
		</ng-template>
	`,
})
export class NavUser {
	private readonly _router = inject(Router);
	private readonly _platformId = inject(PLATFORM_ID);
	private readonly _sidebarService = inject(HlmSidebarService);
	private readonly _i18n = inject(I18nService);
	protected readonly _menuSide = computed(() =>
		this._sidebarService.isMobile() ? 'top' : this._i18n.isRtl() ? 'left' : 'right',
	);

	public readonly user = input.required<{
		name: string;
		email: string;
		avatar: string;
	}>();

	public signOut(): void {
		if (isPlatformBrowser(this._platformId)) {
			localStorage.removeItem('okane_access_token');
			localStorage.removeItem('okane_refresh_token');
			localStorage.removeItem('okane_token_type');
			localStorage.removeItem('okane_user');
		}

		void this._router.navigateByUrl('/login');
	}
}
