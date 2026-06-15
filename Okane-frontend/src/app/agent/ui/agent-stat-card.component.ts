import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
	selector: 'okane-agent-stat-card',
	standalone: true,
	imports: [NgClass],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<article
			class="group rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-md"
		>
			<div class="flex items-start justify-between gap-3">
				<div
					class="flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-border/60"
					[ngClass]="iconTone()"
				>
					<ng-content select="[statIcon]" />
				</div>
			</div>
			<div class="mt-5">
				<p class="text-sm font-medium text-muted-foreground">{{ title() }}</p>
				<p class="mt-2 text-2xl font-semibold tracking-tight text-foreground">{{ value() }}</p>
				@if (note()) {
					<p class="mt-2 text-xs text-muted-foreground">{{ note() }}</p>
				}
			</div>
		</article>
	`,
})
export class AgentStatCardComponent {
	public readonly title = input.required<string>();
	public readonly value = input.required<string>();
	public readonly note = input<string>('');
	public readonly iconTone = input<string>('bg-primary/10 text-primary');
}
