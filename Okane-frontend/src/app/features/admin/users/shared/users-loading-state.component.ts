import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucideTriangleAlert } from '@ng-icons/lucide';
import { I18nPipe } from '../../../../shared/i18n/i18n.pipe';

@Component({
	selector: 'okane-users-loading-state',
	standalone: true,
	imports: [NgIcon, I18nPipe],
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
					<p class="text-sm font-medium text-foreground">{{ 'Impossible de charger les données' | okaneI18n }}</p>
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
				<p class="text-xs text-muted-foreground">{{ message() | okaneI18n }}</p>
			</div>
		}
	`,
})
export class UsersLoadingStateComponent {
	public readonly message = input<string>('Chargement en cours...');
	public readonly error = input<string | null>(null);
}
