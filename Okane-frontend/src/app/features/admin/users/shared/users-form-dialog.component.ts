import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

/**
 * Reusable Spartan-themed modal shell for "Add" forms. The modal owns the
 * overlay, header (icon + title), content slot and footer slot but does not
 * impose any input layout — each feature provides its own form via projected
 * content. The shell stays open until the parent flips {@code open} back to
 * {@code false}, so async submit flows can keep it visible during the network
 * roundtrip.
 */
@Component({
	selector: 'okane-users-form-dialog',
	standalone: true,
	imports: [NgIcon],
	providers: [provideIcons({ lucideX })],
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
					class="relative w-full max-w-xl rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-xl transition-colors max-h-[90vh] overflow-y-auto"
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

					<div class="flex items-start gap-3">
						<div
							class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border"
						>
							<ng-icon [name]="icon()" class="text-lg" />
						</div>
						<div class="flex-1 leading-tight">
							<h2 class="text-lg font-semibold text-foreground">{{ title() }}</h2>
							@if (subtitle()) {
								<p class="mt-1 text-sm text-muted-foreground">{{ subtitle() }}</p>
							}
						</div>
					</div>

					<div class="mt-5">
						<ng-content />
					</div>
				</div>
			</div>
		}
	`,
})
export class UsersFormDialogComponent {
	public readonly open = input<boolean>(false);
	public readonly title = input.required<string>();
	public readonly subtitle = input<string>('');
	public readonly icon = input<string>('lucidePlus');

	public readonly close = output<void>();
}
