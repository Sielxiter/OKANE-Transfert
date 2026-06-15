import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHourglass, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
	selector: 'okane-users-placeholder-dialog',
	standalone: true,
	imports: [NgIcon, HlmButtonImports],
	providers: [provideIcons({ lucideHourglass, lucideX })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (open()) {
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm"
				role="dialog"
				aria-modal="true"
				(click)="close.emit()"
			>
				<div
					class="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-xl transition-colors"
					(click)="$event.stopPropagation()"
				>
					<button
						type="button"
						class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label="Fermer"
						(click)="close.emit()"
					>
						<ng-icon name="lucideX" />
					</button>

					<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border">
						<ng-icon name="lucideHourglass" class="text-lg" />
					</div>

					<h2 class="mt-4 text-lg font-semibold text-foreground">{{ title() }}</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Formulaire à implémenter dans une prochaine phase.
					</p>

					<div class="mt-6 flex justify-end gap-2">
						<button hlmBtn type="button" variant="outline" size="sm" (click)="close.emit()">
							Fermer
						</button>
					</div>
				</div>
			</div>
		}
	`,
})
export class UsersPlaceholderDialogComponent {
	public readonly open = input<boolean>(false);
	public readonly title = input<string>('Bientôt disponible');

	public readonly close = output<void>();
}
