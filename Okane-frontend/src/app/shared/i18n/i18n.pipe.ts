import { ChangeDetectorRef, Pipe, PipeTransform, effect, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
	name: 'okaneI18n',
	standalone: true,
	pure: false,
})
export class I18nPipe implements PipeTransform {
	private readonly _i18n = inject(I18nService);
	private readonly _cdr = inject(ChangeDetectorRef);

	constructor() {
		effect(() => {
			this._i18n.locale();
			this._cdr.markForCheck();
		});
	}

	transform(value: string | null | undefined, params?: Record<string, string | number>): string {
		return value ? this._i18n.translate(value, params) : '';
	}
}
