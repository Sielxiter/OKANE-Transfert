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
import {
	AdminCurrencyApiService,
	type ApiCurrency,
	type ApiCurrencyStatus,
} from './admin-currency.api';

interface CreateCurrencyPayload {
	code: string;
	name: string;
	symbol: string;
	mainCountry: string;
	rateToMad: number;
	status: ApiCurrencyStatus;
}

@Component({
	selector: 'okane-currency-create-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Code devise
					<input
						hlmInput
						type="text"
						formControlName="code"
						maxlength="10"
						placeholder="MAD, EUR, USD…"
						class="uppercase"
					/>
					@if (showError('code')) {
						<span class="text-xs text-destructive">{{ fieldError('code') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Symbole
					<input hlmInput type="text" formControlName="symbol" maxlength="10" placeholder="DH, €, $" />
					@if (showError('symbol')) {
						<span class="text-xs text-destructive">{{ fieldError('symbol') }}</span>
					}
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Nom devise
				<input hlmInput type="text" formControlName="name" placeholder="Dirham marocain, Euro…" />
				@if (showError('name')) {
					<span class="text-xs text-destructive">{{ fieldError('name') }}</span>
				}
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Pays principal
					<input hlmInput type="text" formControlName="mainCountry" placeholder="Maroc, Union européenne…" />
					@if (showError('mainCountry')) {
						<span class="text-xs text-destructive">{{ fieldError('mainCountry') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Taux vers MAD
					<input
						hlmInput
						type="number"
						formControlName="rateToMad"
						step="0.0001"
						min="0.000001"
						placeholder="10.92"
					/>
					@if (showError('rateToMad')) {
						<span class="text-xs text-destructive">{{ fieldError('rateToMad') }}</span>
					}
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Statut
				<select
					formControlName="status"
					class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
				>
					<option value="ACTIVE">Active</option>
					<option value="SUSPENDED">Suspendue</option>
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
				<button hlmBtn type="submit" size="sm" [disabled]="submitting() || form.invalid">
					@if (submitting()) {
						<ng-icon name="lucideLoaderCircle" class="animate-spin" />
					}
					Créer la devise
				</button>
			</div>
		</form>
	`,
})
export class CurrencyCreateFormComponent {
	private readonly _api = inject(AdminCurrencyApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	public readonly created = output<ApiCurrency>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal<boolean>(false);
	protected readonly serverError = signal<string | null>(null);

	protected readonly form = this._fb.group({
		code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10), Validators.pattern(/^[A-Za-z]+$/)]],
		name: ['', [Validators.required, Validators.maxLength(100)]],
		symbol: ['', [Validators.required, Validators.maxLength(10)]],
		mainCountry: ['', [Validators.required, Validators.maxLength(100)]],
		rateToMad: [null as number | null, [Validators.required, Validators.min(0.000001)]],
		status: ['ACTIVE' as ApiCurrencyStatus, [Validators.required]],
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
		if (errors['min']) return 'La valeur doit être positive.';
		if (errors['minlength']) {
			const required = errors['minlength'].requiredLength as number;
			return `Au moins ${required} caractères.`;
		}
		if (errors['maxlength']) {
			const max = errors['maxlength'].requiredLength as number;
			return `Maximum ${max} caractères.`;
		}
		if (errors['pattern']) return 'Lettres uniquement.';
		return 'Valeur invalide.';
	}

	protected submit(): void {
		this.serverError.set(null);
		this.form.markAllAsTouched();
		if (this.form.invalid) return;

		const value = this.form.getRawValue();
		const payload: CreateCurrencyPayload = {
			code: (value.code ?? '').trim().toUpperCase(),
			name: (value.name ?? '').trim(),
			symbol: (value.symbol ?? '').trim(),
			mainCountry: (value.mainCountry ?? '').trim(),
			rateToMad: Number(value.rateToMad ?? 0),
			status: value.status ?? 'ACTIVE',
		};

		this.submitting.set(true);
		this._api.createCurrency(payload).subscribe({
			next: (currency) => {
				this.submitting.set(false);
				this.form.reset({
					code: '',
					name: '',
					symbol: '',
					mainCountry: '',
					rateToMad: null,
					status: 'ACTIVE',
				});
				this.created.emit(currency);
			},
			error: (err) => {
				this.submitting.set(false);
				this.serverError.set(this.extractMessage(err));
				this._cdr.markForCheck();
			},
		});
	}

	private extractMessage(err: unknown): string {
		const fallback = "La création a échoué. Vérifiez les champs et réessayez.";
		if (typeof err === 'object' && err !== null) {
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
