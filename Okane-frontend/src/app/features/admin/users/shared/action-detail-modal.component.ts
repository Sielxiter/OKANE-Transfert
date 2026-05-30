import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';

export interface DetailField {
	label: string;
	value: string | number | null | undefined;
	mono?: boolean;
	badge?: string; // optional CSS class for a badge
}

/**
 * Generic read-only detail modal.
 * Renders a list of label/value pairs inside the shared overlay shell.
 * Used for "Voir détails" actions across all admin tables.
 */
@Component({
	selector: 'okane-action-detail-modal',
	standalone: true,
	imports: [NgIcon, HlmButtonImports],
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
					class="relative w-full max-w-lg rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-xl transition-colors max-h-[90vh] overflow-y-auto"
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

					<h2 class="text-lg font-semibold text-foreground">{{ title() }}</h2>
					@if (subtitle()) {
						<p class="mt-1 text-sm text-muted-foreground">{{ subtitle() }}</p>
					}

					<dl class="mt-5 grid gap-3">
						@for (field of fields(); track field.label) {
							<div class="flex flex-col gap-0.5 rounded-xl border border-border bg-muted/20 px-4 py-3">
								<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									{{ field.label }}
								</dt>
								<dd
									class="mt-0.5 text-sm text-foreground"
								>
									{{ field.value ?? '—' }}
								</dd>
							</div>
						}
					</dl>

					<div class="mt-6 flex justify-end">
						<button hlmBtn type="button" variant="outline" size="sm" (click)="close.emit()">
							Fermer
						</button>
					</div>
				</div>
			</div>
		}
	`,
})
export class ActionDetailModalComponent {
	public readonly open = input<boolean>(false);
	public readonly title = input<string>('Détails');
	public readonly subtitle = input<string>('');
	public readonly fields = input<DetailField[]>([]);

	public readonly close = output<void>();
}
