import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import type { UserActionItem } from './user-status.types';

@Component({
	selector: 'okane-user-actions-dropdown',
	standalone: true,
	imports: [NgIcon, HlmDropdownMenuImports],
	providers: [provideIcons({ lucideEllipsis })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button
			type="button"
			class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			[hlmDropdownMenuTrigger]="menu"
			align="end"
			side="bottom"
			aria-label="Ouvrir le menu d'actions"
		>
			<ng-icon name="lucideEllipsis" class="text-base" />
		</button>

		<ng-template #menu>
			<hlm-dropdown-menu class="w-52">
				@for (action of actions(); track action.label) {
					<button
						hlmDropdownMenuItem
						type="button"
						(click)="action.action()"
						[class.text-destructive]="action.variant === 'destructive'"
						[class.focus:text-destructive]="action.variant === 'destructive'"
					>
						<ng-icon [name]="action.icon" />
						{{ action.label }}
					</button>
				}
			</hlm-dropdown-menu>
		</ng-template>
	`,
})
export class UserActionsDropdownComponent {
	public readonly actions = input.required<UserActionItem[]>();
}
