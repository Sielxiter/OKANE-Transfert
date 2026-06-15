import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { StatusVariant } from './user-status.types';
import { I18nPipe } from '../../../../shared/i18n/i18n.pipe';

const VARIANT_CLASSES: Record<StatusVariant, string> = {
	success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
	warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
	destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
	info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
	muted: 'border-border bg-muted text-muted-foreground',
};

@Component({
	selector: 'okane-user-status-badge',
	standalone: true,
	imports: [NgClass, I18nPipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<span
			class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
			[ngClass]="classes()"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-current opacity-80"></span>
			{{ label() | okaneI18n }}
		</span>
	`,
})
export class UserStatusBadgeComponent {
	public readonly label = input.required<string>();
	public readonly variant = input<StatusVariant>('muted');

	protected readonly classes = computed(() => VARIANT_CLASSES[this.variant()]);
}
