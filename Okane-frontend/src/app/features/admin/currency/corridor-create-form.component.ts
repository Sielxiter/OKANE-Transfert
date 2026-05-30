import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	inject,
	output,
	signal,
} from '@angular/core';
import {
	AbstractControl,
	FormBuilder,
	ReactiveFormsModule,
	ValidationErrors,
	Validators,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AdminCurrencyApiService, type ApiCorridor } from './admin-currency.api';

@Component({
	selector: 'okane-corridor-create-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Code pays source
					<input hlmInput type="text" formControlName="sourceCountryCode" maxlength="10" placeholder="MA" class="uppercase" />
					@if (showError('sourceCountryCode')) {
						<span class="text-xs text-destructive">{{ fieldError('sourceCountryCode') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Code pays destination
					<input hlmInput type="text" formControlName="destinationCountryCode" maxlength="10" placeholder="SN" class="uppercase" />
					@if (showError('destinationCountryCode')) {
						<span class="text-xs text-destructive">{{ fieldError('destinationCountryCode') }}</span>
					}
				</label>
			</div>

			@if (sameCountryError()) {
				<span class="text-xs text-destructive">Les pays source et destination doivent être différents.</span>
			}

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Frais estimés (%)
				<input hlmInput type="number" formControlName="estimatedFees" min="0" step="0.01" placeholder="1.50" />
				@if (showError('estimatedFees')) {
					<span class="text-xs text-destructive">{{ fieldError('estimatedFees') }}</span>
				}
			</label>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Statut
				<select
					formControlName="active"
					class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
				>
					<option [value]="true">Actif</option>
					<option [value]="false">Désactivé</option>
				</select>
			</label>

			@if (serverError()) {
				<div
					class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
				>
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<span>{{ serverError() }}</span>
				</div>
			}

			<div class="mt-2 flex justify-end gap-2">
				<button hlmBtn type="button" variant="outline" size="sm" (click)="cancelled.emit()">Annuler</button>
				<button
					hlmBtn
					type="submit"
					size="sm"
					[disabled]="submitting() || form.invalid || sameCountryError()"
				>
					@if (submitting()) {
						<ng-icon name="lucideLoaderCircle" class="animate-spin" />
					}
					Créer le corridor
				</button>
			</div>
		</form>
	`,
})
export class CorridorCreateFormComponent {
	private readonly _api = inject(AdminCurrencyApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	public readonly created = output<ApiCorridor>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal<boolean>(false);
	protected readonly serverError = signal<string | null>(null);

	protected readonly form = this._fb.group({
		sourceCountryCode: ['', [Validators.required, Validators.maxLength(10)]],
		destinationCountryCode: ['', [Validators.required, Validators.maxLength(10)]],
		estimatedFees: [1.5, [Validators.required, Validators.min(0)]],
		active: [true, [Validators.required]],
	});

	protected showError(field: keyof typeof this.form.controls): boolean {
		const control: AbstractControl | null = this.form.get(field);
		return !!control && control.touched && control.invalid;
	}

	protected fieldError(field: keyof typeof this.form.controls): string {
		const control = this.form.get(field);
		if (!control || !control.errors) return '';
		const errors: ValidationErrors = control.errors;
		if (errors['required']) return 'Champ obligatoire.';
		if (errors['min']) return `Valeur minimum : ${errors['min'].min}.`;
		if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength as number} caractères.`;
		return 'Valeur invalide.';
	}

	protected sameCountryError(): boolean {
		const src = (this.form.controls.sourceCountryCode.value ?? '').trim().toUpperCase();
		const dst = (this.form.controls.destinationCountryCode.value ?? '').trim().toUpperCase();
		const touched = this.form.controls.sourceCountryCode.touched || this.form.controls.destinationCountryCode.touched;
		return touched && src.length > 0 && src === dst;
	}

	protected submit(): void {
		this.serverError.set(null);
		this.form.markAllAsTouched();
		if (this.form.invalid || this.sameCountryError()) return;

		const v = this.form.getRawValue();
		this.submitting.set(true);
		this._api.createCorridor({
			sourceCountryCode: (v.sourceCountryCode ?? '').trim().toUpperCase(),
			destinationCountryCode: (v.destinationCountryCode ?? '').trim().toUpperCase(),
			estimatedFees: Number(v.estimatedFees ?? 1.5),
			active: Boolean(v.active),
		}).subscribe({
			next: (corridor) => {
				this.submitting.set(false);
				this.form.reset({ sourceCountryCode: '', destinationCountryCode: '', estimatedFees: 1.5, active: true });
				this.created.emit(corridor);
			},
			error: (err) => {
				this.submitting.set(false);
				this.serverError.set(this.extractMessage(err));
				this._cdr.markForCheck();
			},
		});
	}

	private extractMessage(err: unknown): string {
		const fallback = 'La création a échoué. Vérifiez les champs et réessayez.';
		if (typeof err === 'object' && err !== null) {
			const e = err as { error?: { message?: string }; message?: string };
			return e.error?.message ?? e.message ?? fallback;
		}
		return fallback;
	}
}
