import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'okane-admin-placeholder-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<section class="rounded-xl border bg-background p-6 shadow-sm">
			<h1 class="text-2xl font-semibold">{{ title() }}</h1>
			<p class="mt-2 text-sm text-muted-foreground">Bientôt disponible</p>
		</section>
	`,
})
export class AdminPlaceholderPageComponent {
	private readonly _route = inject(ActivatedRoute);
	protected readonly title = computed(() => (this._route.snapshot.data['title'] as string) ?? 'Admin');
}
