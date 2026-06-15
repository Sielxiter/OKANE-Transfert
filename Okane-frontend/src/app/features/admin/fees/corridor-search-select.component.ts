import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideChevronDown, lucideSearch, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import type { ApiCorridor } from '../currency/admin-currency.api';

@Component({
	selector: 'okane-corridor-search-select',
	standalone: true,
	imports: [NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideCheck, lucideChevronDown, lucideSearch, lucideX })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="relative">
			<p class="mb-1 text-xs font-medium text-muted-foreground">{{ label() }}</p>
			<button
				type="button"
				hlmBtn
				variant="outline"
				class="flex h-10 w-full items-center justify-between gap-2 px-3"
				(click)="toggle()"
			>
				<span class="min-w-0 truncate text-left text-sm text-foreground">
					{{ selectedLabel() }}
				</span>
				<ng-icon
					name="lucideChevronDown"
					class="shrink-0 text-muted-foreground transition-transform"
					[class.rotate-180]="open()"
				/>
			</button>

			@if (open()) {
				<div class="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-lg">
					<div class="relative">
						<ng-icon
							name="lucideSearch"
							class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-base text-muted-foreground"
							[class.left-3]="!rtl()"
							[class.right-3]="rtl()"
						/>
						<input
							hlmInput
							type="search"
							[value]="query()"
							(input)="onQueryChange($any($event.target).value)"
							[placeholder]="placeholder()"
							class="h-9"
							[class.pl-9]="!rtl()"
							[class.pr-9]="rtl()"
						/>
					</div>

					<div class="mt-3 max-h-60 space-y-2 overflow-auto pr-1">
						@for (corridor of filteredCorridors(); track corridor.id) {
							<button
								type="button"
								class="flex w-full items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-accent/20"
								(click)="selectCorridor(corridor)"
							>
								<div class="min-w-0">
									<p class="truncate text-sm font-medium text-foreground">{{ corridorLabel(corridor) }}</p>
									<p class="font-mono text-xs uppercase text-muted-foreground">
										{{ corridor.sourceCountryCode }} -> {{ corridor.destinationCountryCode }}
									</p>
								</div>
								<div class="flex shrink-0 items-center gap-2">
									<span
										class="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground"
									>
										{{ formatPercent(corridor.estimatedFees) }}
									</span>
									@if (value() === corridor.id) {
										<ng-icon name="lucideCheck" class="text-primary" />
									}
								</div>
							</button>
						}

						@if (filteredCorridors().length === 0) {
							<div class="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
								Aucun corridor ne correspond.
							</div>
						}
					</div>
				</div>
			}
		</div>
	`,
})
export class CorridorSearchSelectComponent {
	public readonly label = input<string>('Corridor');
	public readonly placeholder = input<string>('Rechercher par nom ou code');
	public readonly corridors = input<ApiCorridor[]>([]);
	public readonly value = input<number | null>(null);
	public readonly rtl = input<boolean>(false);

	public readonly valueChange = output<number>();

	protected readonly open = signal(false);
	protected readonly query = signal('');

	protected readonly filteredCorridors = computed(() => {
		const term = this.query().trim().toLowerCase();
		const corridors = this.corridors().filter((corridor) => {
			if (!term) return true;
			return (
				(corridor.sourceCountry ?? '').toLowerCase().includes(term) ||
				(corridor.destinationCountry ?? '').toLowerCase().includes(term) ||
				(corridor.sourceCountryCode ?? '').toLowerCase().includes(term) ||
				(corridor.destinationCountryCode ?? '').toLowerCase().includes(term)
			);
		});
		return corridors.sort((a, b) => Number(Boolean(b.status === 'ACTIVE')) - Number(Boolean(a.status === 'ACTIVE')));
	});

	protected readonly selectedLabel = computed(() => {
		const selected = this.corridors().find((corridor) => corridor.id === this.value());
		return selected ? this.corridorLabel(selected) : 'Choisir un corridor';
	});

	protected toggle(): void {
		this.open.update((current) => !current);
		if (!this.open()) {
			this.query.set('');
		}
	}

	protected onQueryChange(value: string): void {
		this.query.set(value);
		this.open.set(true);
	}

	protected selectCorridor(corridor: ApiCorridor): void {
		this.valueChange.emit(corridor.id);
		this.query.set(this.corridorLabel(corridor));
		this.open.set(false);
	}

	protected corridorLabel(corridor: ApiCorridor): string {
		return `${corridor.sourceCountry ?? corridor.sourceCountryCode ?? '—'} → ${corridor.destinationCountry ?? corridor.destinationCountryCode ?? '—'}`;
	}

	protected formatPercent(value: number | null | undefined): string {
		if (value == null || Number.isNaN(value)) return '—';
		return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)}%`;
	}
}
