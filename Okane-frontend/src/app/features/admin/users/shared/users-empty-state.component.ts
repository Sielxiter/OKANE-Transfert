import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearchX, lucideUsers } from '@ng-icons/lucide';

@Component({
	selector: 'okane-users-empty-state',
	standalone: true,
	imports: [NgIcon],
	providers: [provideIcons({ lucideSearchX, lucideUsers })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
				<ng-icon [name]="icon()" class="text-xl" />
			</div>
			<div class="max-w-sm space-y-1">
				<p class="text-sm font-medium text-foreground">{{ title() }}</p>
				<p class="text-xs text-muted-foreground">{{ description() }}</p>
			</div>
		</div>
	`,
})
export class UsersEmptyStateComponent {
	public readonly title = input<string>('Aucun résultat');
	public readonly description = input<string>('Ajustez vos filtres ou votre recherche.');
	public readonly icon = input<string>('lucideSearchX');
}
