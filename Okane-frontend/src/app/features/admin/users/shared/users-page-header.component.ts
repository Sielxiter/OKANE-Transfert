import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDownload, lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
	selector: 'okane-users-page-header',
	standalone: true,
	imports: [NgIcon, HlmButtonImports],
	providers: [provideIcons({ lucidePlus, lucideDownload })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<header
			class="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors md:flex-row md:items-end md:justify-between"
		>
			<div class="space-y-1">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{{ eyebrow() }}</p>
				<h1 class="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{{ title() }}</h1>
				<p class="text-sm text-muted-foreground">{{ description() }}</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<button hlmBtn [variant]="actionVariant()" size="sm" type="button" (click)="addClicked.emit()">
					<ng-icon [name]="actionIcon()" />
					{{ addLabel() }}
				</button>
				<ng-content select="[okaneHeaderActions]" />
			</div>
		</header>
	`,
})
export class UsersPageHeaderComponent {
	public readonly eyebrow = input<string>('Okane Transfer');
	public readonly title = input.required<string>();
	public readonly description = input<string>('');
	public readonly addLabel = input.required<string>();
	public readonly actionIcon = input<string>('lucidePlus');
	public readonly actionVariant = input<'default' | 'outline' | 'ghost'>('default');

	public readonly addClicked = output<void>();
}
