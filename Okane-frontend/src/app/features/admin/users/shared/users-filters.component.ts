import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { HlmInputImports } from '@spartan-ng/helm/input';
import type { SelectOption } from './user-status.types';

export interface FilterDefinition {
	key: string;
	label: string;
	value: string;
	options: SelectOption[];
}

@Component({
	selector: 'okane-users-filters',
	standalone: true,
	imports: [FormsModule, NgIcon, HlmInputImports],
	providers: [provideIcons({ lucideSearch })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div
			class="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors lg:flex-row lg:items-center lg:justify-between"
		>
			<div class="relative w-full lg:max-w-sm">
				<ng-icon
					name="lucideSearch"
					class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground"
				/>
				<input
					hlmInput
					type="search"
					[ngModel]="searchValue()"
					(ngModelChange)="searchChange.emit($event)"
					[placeholder]="searchPlaceholder()"
					class="pl-9"
				/>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				@for (filter of filters(); track filter.key) {
					<label class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
						<span class="hidden md:inline">{{ filter.label }}</span>
						<select
							class="h-9 min-w-[10rem] rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[ngModel]="filter.value"
							(ngModelChange)="filterChange.emit({ key: filter.key, value: $event })"
						>
							@for (opt of filter.options; track opt.value) {
								<option [value]="opt.value">{{ opt.label }}</option>
							}
						</select>
					</label>
				}
			</div>
		</div>
	`,
})
export class UsersFiltersComponent {
	public readonly searchPlaceholder = input<string>('Rechercher...');
	public readonly searchValue = input<string>('');
	public readonly filters = input<FilterDefinition[]>([]);

	public readonly searchChange = output<string>();
	public readonly filterChange = output<{ key: string; value: string }>();
}
