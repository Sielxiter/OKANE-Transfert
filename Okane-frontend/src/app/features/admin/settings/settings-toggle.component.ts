import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
	selector: 'okane-settings-toggle',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgClass],
	template: `
		<button
			type="button"
			role="switch"
			class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
			[attr.aria-checked]="checked()"
			[attr.aria-label]="label()"
			[class.bg-primary]="checked()"
			[class.bg-input]="!checked()"
			(click)="toggle()"
		>
			<span
				class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-md ring-0 transition-transform"
				[ngClass]="thumbClasses()"
			></span>
		</button>
	`,
	host: {
		class: 'inline-block',
	},
})
export class SettingsToggleComponent {
	public readonly checked = input.required<boolean>();
	public readonly label = input<string>('Toggle');

	public readonly checkedChange = output<boolean>();

	protected readonly thumbClasses = computed(() => (this.checked() ? 'translate-x-5' : 'translate-x-0.5'));

	protected toggle(): void {
		this.checkedChange.emit(!this.checked());
	}
}
