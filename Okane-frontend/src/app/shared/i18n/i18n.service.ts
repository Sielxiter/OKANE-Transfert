import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { I18N_TRANSLATIONS, type LocaleCode } from './i18n.translations';

const STORAGE_KEY = 'okane-language';

@Injectable({ providedIn: 'root' })
export class I18nService {
	private readonly _document = inject(DOCUMENT);
	private readonly _platformId = inject(PLATFORM_ID);
	private readonly _locale = signal<LocaleCode>(this.readInitialLocale());

	public readonly locale = this._locale.asReadonly();
	public readonly isRtl = computed(() => this._locale() === 'ar');

	constructor() {
		effect(() => {
			const locale = this._locale();

			if (!isPlatformBrowser(this._platformId)) {
				return;
			}

			this._document.documentElement.lang = locale;
			this._document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
			this._document.defaultView?.localStorage.setItem(STORAGE_KEY, locale);
		});
	}

	public setLocale(locale: LocaleCode): void {
		this._locale.set(locale);
	}

	public toggleDirection(): void {
		this.setLocale(this._locale() === 'ar' ? 'fr' : 'ar');
	}

	public translate(key: string, params?: Record<string, string | number>): string {
		const locale = this._locale();
		const catalog = locale === 'fr' ? undefined : I18N_TRANSLATIONS[locale];
		const translated = catalog?.[key] ?? key;
		return this.interpolate(translated, params);
	}

	public localeLabel(locale: LocaleCode): string {
		return this.translate(`locale.${locale}`);
	}

	private readInitialLocale(): LocaleCode {
		if (!isPlatformBrowser(this._platformId)) {
			return 'fr';
		}

		const stored = this._document.defaultView?.localStorage.getItem(STORAGE_KEY);
		if (stored === 'fr' || stored === 'en' || stored === 'ar') {
			return stored;
		}

		return 'fr';
	}

	private interpolate(value: string, params?: Record<string, string | number>): string {
		if (!params) {
			return value;
		}

		return Object.entries(params).reduce((result, [key, replacement]) => {
			return result.replaceAll(`{${key}}`, String(replacement));
		}, value);
	}
}
