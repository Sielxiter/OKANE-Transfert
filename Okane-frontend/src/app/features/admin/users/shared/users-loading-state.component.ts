import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucideTriangleAlert } from '@ng-icons/lucide';

@Component({
	selector: 'okane-users-loading-state',
	standalone: true,
	imports: [NgIcon],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (error()) {
			<div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-border"
				>
					<ng-icon name="lucideTriangleAlert" class="text-xl" />
				</div>
				<div class="max-w-sm space-y-1">
					<p class="text-sm font-medium text-foreground">Impossible de charger les données</p>
					<p class="text-xs text-muted-foreground">{{ error() }}</p>
				</div>
			</div>
		} @else {
			<div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-border"
				>
					<ng-icon name="lucideLoaderCircle" class="animate-spin text-xl" />
				</div>
				<p class="text-xs text-muted-foreground">{{ message() }}</p>
			</div>
		}
	`,
})
export class UsersLoadingStateComponent {
	public readonly message = input<string>('Chargement en cours...');
	public readonly error = input<string | null>(null);
}
