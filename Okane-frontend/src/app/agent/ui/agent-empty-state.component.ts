import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
	selector: 'okane-agent-empty-state',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
			<p class="text-sm font-medium text-foreground">{{ title() }}</p>
			@if (description()) {
				<p class="mt-1 text-xs text-muted-foreground">{{ description() }}</p>
			}
			<div class="mt-3 flex items-center justify-center gap-2">
				<ng-content />
			</div>
		</div>
	`,
})
export class AgentEmptyStateComponent {
	public readonly title = input.required<string>();
	public readonly description = input<string>('');
}

