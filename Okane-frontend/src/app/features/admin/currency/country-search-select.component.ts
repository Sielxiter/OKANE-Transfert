import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideChevronDown, lucideSearch, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { formatCountryLabel, searchCountryOptions, type CountryOption } from './country-directory';

@Component({
	selector: 'okane-country-search-select',
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
				<ng-icon name="lucideChevronDown" class="shrink-0 text-muted-foreground transition-transform" [class.rotate-180]="open()" />
			</button>

			@if (open()) {
				<div
					class="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-lg"
				>
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

					<div class="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
						@for (country of filteredCountries(); track country.code) {
							<button
								type="button"
								class="flex w-full items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-accent/20"
								(click)="selectCountry(country)"
							>
								<div class="min-w-0">
									<p class="truncate text-sm font-medium text-foreground">{{ country.name }}</p>
									<p class="font-mono text-xs uppercase text-muted-foreground">{{ country.code }}</p>
								</div>
								@if (value() === country.code) {
									<ng-icon name="lucideCheck" class="shrink-0 text-primary" />
								}
							</button>
						}

						@if (filteredCountries().length === 0) {
							<div class="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
								Aucun pays ne correspond.
							</div>
						}
					</div>
				</div>
			}
		</div>
	`,
})
export class CountrySearchSelectComponent {
	public readonly label = input<string>('Pays');
	public readonly placeholder = input<string>('Rechercher par nom ou code');
	public readonly countries = input<CountryOption[]>([]);
	public readonly value = input<string | null>(null);
	public readonly rtl = input<boolean>(false);

	public readonly valueChange = output<string>();

	protected readonly open = signal<boolean>(false);
	protected readonly query = signal<string>('');

	protected readonly filteredCountries = computed(() => searchCountryOptions(this.countries(), this.query(), 3));
	protected readonly selectedLabel = computed(() => {
		const selected = this.countries().find((country) => country.code === this.value());
		return selected ? formatCountryLabel(selected) : 'Choisir un pays';
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

	protected selectCountry(country: CountryOption): void {
		this.valueChange.emit(country.code);
		this.query.set(country.name);
		this.open.set(false);
	}
}
