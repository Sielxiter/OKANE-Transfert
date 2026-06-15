import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'okane-agent-table-shell',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="overflow-x-auto rounded-xl border border-border bg-background/60">
			<ng-content />
		</div>
	`,
})
export class AgentTableShellComponent {}

