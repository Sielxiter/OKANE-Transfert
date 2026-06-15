import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
	selector: 'okane-agent-page-intro',
	standalone: true,
	host: {
		class: 'block',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<header class="relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors md:p-7">
			<div class="pointer-events-none absolute -right-16 top-0 size-40 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="pointer-events-none absolute left-0 top-12 size-32 rounded-full bg-muted/70 blur-3xl"></div>
			<div class="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-5">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{{ eyebrow() }}</p>
					<h1 class="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{{ title() }}</h1>
					@if (subtitle()) {
						<p class="mt-2 text-sm text-muted-foreground">{{ subtitle() }}</p>
					}
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<ng-content select="[agentIntroActions]" />
				</div>
			</div>
		</header>
	`,
})
export class AgentPageIntroComponent {
	public readonly title = input.required<string>();
	public readonly subtitle = input<string>('');
	public readonly eyebrow = input<string>('Espace Agent');
}
