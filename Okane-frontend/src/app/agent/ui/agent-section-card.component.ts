import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
	selector: 'okane-agent-section-card',
	standalone: true,
	host: {
		class: 'block',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<section class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors md:p-7">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h2 class="text-base font-semibold text-foreground">{{ title() }}</h2>
					@if (subtitle()) {
						<p class="mt-1 text-sm text-muted-foreground">{{ subtitle() }}</p>
					}
				</div>
				<div class="flex items-center gap-2">
					<ng-content select="[agentSectionActions]" />
				</div>
			</div>
			<div class="mt-5 md:mt-6">
				<ng-content />
			</div>
		</section>
	`,
})
export class AgentSectionCardComponent {
	public readonly title = input.required<string>();
	public readonly subtitle = input<string>('');
}
