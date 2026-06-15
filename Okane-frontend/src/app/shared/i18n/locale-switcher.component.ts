import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { I18nService } from './i18n.service';
import type { LocaleCode } from './i18n.translations';

const LOCALES: LocaleCode[] = ['fr', 'en', 'ar'];

@Component({
	selector: 'okane-locale-switcher',
	standalone: true,
	imports: [HlmButtonImports, HlmDropdownMenuImports, NgIcon],
	providers: [provideIcons({ lucideCheck })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<button hlmBtn variant="outline" size="sm" [hlmDropdownMenuTrigger]="menu" align="end" side="bottom">
			{{ i18n.localeLabel(i18n.locale()) }}
		</button>

		<ng-template #menu>
			<hlm-dropdown-menu class="w-44">
				@for (locale of locales; track locale) {
					<button hlmDropdownMenuItem type="button" (click)="setLocale(locale)">
						<span class="flex-1 text-start">{{ i18n.localeLabel(locale) }}</span>
						@if (i18n.locale() === locale) {
							<ng-icon name="lucideCheck" class="text-sm" />
						}
					</button>
				}
			</hlm-dropdown-menu>
		</ng-template>
	`,
})
export class LocaleSwitcherComponent {
	protected readonly locales = LOCALES;
	public readonly i18n = inject(I18nService);

	public setLocale(locale: LocaleCode): void {
		this.i18n.setLocale(locale);
	}
}
