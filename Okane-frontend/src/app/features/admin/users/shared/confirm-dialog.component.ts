import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTriangleAlert, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { I18nPipe } from '../../../../shared/i18n/i18n.pipe';

/**
 * Reusable confirmation dialog.
 * Shows a message and two buttons: confirm (destructive) and cancel.
 * Used for Suspendre/Activer, Annuler, Marquer bloqué, etc.
 */
@Component({
	selector: 'okane-confirm-dialog',
	standalone: true,
	imports: [NgIcon, HlmButtonImports, I18nPipe],
	providers: [provideIcons({ lucideTriangleAlert, lucideX })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (open()) {
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm"
				role="alertdialog"
				aria-modal="true"
				(click)="cancel.emit()"
			>
				<div
					class="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-xl transition-colors"
					(click)="$event.stopPropagation()"
				>
					<button
						type="button"
						class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						[attr.aria-label]="'Annuler' | okaneI18n"
						(click)="cancel.emit()"
					>
						<ng-icon name="lucideX" />
					</button>

					<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/30">
						<ng-icon name="lucideTriangleAlert" class="text-lg" />
					</div>

					<h2 class="mt-4 text-lg font-semibold text-foreground">{{ title() | okaneI18n }}</h2>
					<p class="mt-2 text-sm text-muted-foreground">{{ message() | okaneI18n }}</p>

					<div class="mt-6 flex justify-end gap-2">
						<button hlmBtn type="button" variant="outline" size="sm" (click)="cancel.emit()">
							{{ 'Annuler' | okaneI18n }}
						</button>
						<button
							hlmBtn
							type="button"
							variant="destructive"
							size="sm"
							(click)="confirm.emit()"
						>
							{{ confirmLabel() | okaneI18n }}
						</button>
					</div>
				</div>
			</div>
		}
	`,
})
export class ConfirmDialogComponent {
	public readonly open = input<boolean>(false);
	public readonly title = input<string>('Confirmer l\'action');
	public readonly message = input<string>('Êtes-vous sûr de vouloir effectuer cette action ?');
	public readonly confirmLabel = input<string>('Confirmer');

	public readonly confirm = output<void>();
	public readonly cancel = output<void>();
}
