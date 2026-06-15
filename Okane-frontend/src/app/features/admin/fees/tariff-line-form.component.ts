import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import {
	AdminFeesApiService,
	type ApiTariffLine,
	type CreateTariffLinePayload,
	type TariffValueType,
	type UpdateTariffLinePayload,
} from './admin-fees.api';

const DEFAULT_FORM = {
	minAmount: 0,
	maxAmount: 500,
	transferFeeType: 'FIXED' as TariffValueType,
	transferFeeValue: 10,
	agencyCommissionType: 'FIXED' as TariffValueType,
	agencyCommissionValue: 4,
	centralCommissionType: 'FIXED' as TariffValueType,
	centralCommissionValue: 6,
};

@Component({
	selector: 'okane-tariff-line-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Montant min
					<input hlmInput type="number" formControlName="minAmount" min="0" step="0.01" />
					@if (showError('minAmount')) {
						<span class="text-xs text-destructive">{{ fieldError('minAmount') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Montant max
					<input hlmInput type="number" formControlName="maxAmount" min="0" step="0.01" />
					@if (showError('maxAmount')) {
						<span class="text-xs text-destructive">{{ fieldError('maxAmount') }}</span>
					}
				</label>
			</div>
			@if (rangeError()) {
				<span class="text-xs text-destructive">Le montant maximum doit être supérieur au minimum.</span>
			}

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Transfer Fee type
					<select
						formControlName="transferFeeType"
						class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					>
						<option value="FIXED">Montant</option>
						<option value="PERCENT">Pourcentage</option>
					</select>
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Transfer Fee value
					<input hlmInput type="number" formControlName="transferFeeValue" min="0" step="0.01" />
					@if (showError('transferFeeValue')) {
						<span class="text-xs text-destructive">{{ fieldError('transferFeeValue') }}</span>
					}
				</label>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Agency Commission type
					<select
						formControlName="agencyCommissionType"
						class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					>
						<option value="FIXED">Montant</option>
						<option value="PERCENT">Pourcentage</option>
					</select>
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Agency Commission value
					<input hlmInput type="number" formControlName="agencyCommissionValue" min="0" step="0.01" />
					@if (showError('agencyCommissionValue')) {
						<span class="text-xs text-destructive">{{ fieldError('agencyCommissionValue') }}</span>
					}
				</label>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Central Commission type
					<select
						formControlName="centralCommissionType"
						class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					>
						<option value="FIXED">Montant</option>
						<option value="PERCENT">Pourcentage</option>
					</select>
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Central Commission value
					<input hlmInput type="number" formControlName="centralCommissionValue" min="0" step="0.01" />
					@if (showError('centralCommissionValue')) {
						<span class="text-xs text-destructive">{{ fieldError('centralCommissionValue') }}</span>
					}
				</label>
			</div>

			@if (commissionTypeError()) {
				<span class="text-xs text-destructive">{{ commissionTypeError() }}</span>
			}

			@if (splitError()) {
				<span class="text-xs text-destructive">{{ splitError() }}</span>
			}

			@if (serverError()) {
				<div class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
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
					[disabled]="submitting() || form.invalid || rangeError() || commissionTypeError() !== null || splitError() !== null"
				>
					@if (submitting()) {
						<ng-icon name="lucideLoaderCircle" class="animate-spin" />
					}
					{{ line() ? 'Mettre à jour la grille' : 'Créer la grille' }}
				</button>
			</div>
		</form>
	`,
})
export class TariffLineFormComponent {
	private readonly _api = inject(AdminFeesApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	public readonly line = input<ApiTariffLine | null>(null);
	public readonly saved = output<ApiTariffLine>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal(false);
	protected readonly serverError = signal<string | null>(null);

	protected readonly form = this._fb.group({
		minAmount: [DEFAULT_FORM.minAmount, [Validators.required, Validators.min(0)]],
		maxAmount: [DEFAULT_FORM.maxAmount, [Validators.required, Validators.min(0)]],
		transferFeeType: [DEFAULT_FORM.transferFeeType, [Validators.required]],
		transferFeeValue: [DEFAULT_FORM.transferFeeValue, [Validators.required, Validators.min(0)]],
		agencyCommissionType: [DEFAULT_FORM.agencyCommissionType, [Validators.required]],
		agencyCommissionValue: [DEFAULT_FORM.agencyCommissionValue, [Validators.required, Validators.min(0)]],
		centralCommissionType: [DEFAULT_FORM.centralCommissionType, [Validators.required]],
		centralCommissionValue: [DEFAULT_FORM.centralCommissionValue, [Validators.required, Validators.min(0)]],
	});

	constructor() {
		effect(() => {
			const line = this.line();
			if (line) {
				this.form.reset({
					minAmount: Number(line.minAmount ?? 0),
					maxAmount: Number(line.maxAmount ?? 0),
					transferFeeType: line.transferFeeType ?? 'FIXED',
					transferFeeValue: Number(line.transferFeeValue ?? 0),
					agencyCommissionType: line.agencyCommissionType ?? 'FIXED',
					agencyCommissionValue: Number(line.agencyCommissionValue ?? 0),
					centralCommissionType: line.centralCommissionType ?? 'FIXED',
					centralCommissionValue: Number(line.centralCommissionValue ?? 0),
				});
			} else {
				this.form.reset(DEFAULT_FORM);
			}
			this.serverError.set(null);
		});
	}

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
		if (errors['max']) return `Valeur maximum : ${errors['max'].max}.`;
		return 'Valeur invalide.';
	}

	protected rangeError(): boolean {
		const min = Number(this.form.controls.minAmount.value ?? 0);
		const max = Number(this.form.controls.maxAmount.value ?? 0);
		const touched = this.form.controls.minAmount.touched || this.form.controls.maxAmount.touched;
		return touched && Number.isFinite(min) && Number.isFinite(max) && max <= min;
	}

	protected commissionTypeError(): string | null {
		const transferType = this.form.controls.transferFeeType.value as TariffValueType;
		const agencyType = this.form.controls.agencyCommissionType.value as TariffValueType;
		const centralType = this.form.controls.centralCommissionType.value as TariffValueType;

		if (agencyType !== centralType) {
			return 'La commission agence et la commission centrale doivent utiliser le même type.';
		}
		if (transferType === 'PERCENT' && agencyType !== 'PERCENT') {
			return 'Quand le transfer fee est en pourcentage, les commissions doivent aussi être en pourcentage.';
		}
		return null;
	}

	protected splitError(): string | null {
		if (this.commissionTypeError()) {
			return null;
		}

		const transferType = this.form.controls.transferFeeType.value as TariffValueType;
		const transferValue = Number(this.form.controls.transferFeeValue.value ?? 0);
		const agencyType = this.form.controls.agencyCommissionType.value as TariffValueType;
		const agencyValue = Number(this.form.controls.agencyCommissionValue.value ?? 0);
		const centralValue = Number(this.form.controls.centralCommissionValue.value ?? 0);

		if (transferType === 'PERCENT') {
			const total = agencyValue + centralValue;
			return Math.abs(total - 100) > 0.0001 ? 'La somme des commissions doit être égale à 100%.' : null;
		}

		if (agencyType === 'FIXED') {
			const total = agencyValue + centralValue;
			return Math.abs(total - transferValue) > 0.0001
				? 'La somme des commissions doit être égale au frais de transfert.'
				: null;
		}

		const total = agencyValue + centralValue;
		return Math.abs(total - 100) > 0.0001 ? 'La somme des commissions doit être égale à 100%.' : null;
	}

	protected submit(): void {
		this.serverError.set(null);
		this.form.markAllAsTouched();
		if (this.form.invalid || this.rangeError() || this.commissionTypeError() || this.splitError()) {
			return;
		}

		const value = this.form.getRawValue();
		const payload: CreateTariffLinePayload = {
			minAmount: Number(value.minAmount ?? 0),
			maxAmount: Number(value.maxAmount ?? 0),
			transferFeeType: (value.transferFeeType ?? 'FIXED') as TariffValueType,
			transferFeeValue: Number(value.transferFeeValue ?? 0),
			agencyCommissionType: (value.agencyCommissionType ?? 'FIXED') as TariffValueType,
			agencyCommissionValue: Number(value.agencyCommissionValue ?? 0),
			centralCommissionType: (value.centralCommissionType ?? 'FIXED') as TariffValueType,
			centralCommissionValue: Number(value.centralCommissionValue ?? 0),
		};

		this.submitting.set(true);
		const request$ = this.line()
			? this._api.updateTariff(this.line()!.id, payload as UpdateTariffLinePayload)
			: this._api.createTariff(payload);

		request$.subscribe({
			next: (saved) => {
				this.submitting.set(false);
				this.saved.emit(saved);
				if (!this.line()) {
					this.form.reset(DEFAULT_FORM);
				}
			},
			error: (err) => {
				this.submitting.set(false);
				this.serverError.set(this.extractMessage(err));
				this._cdr.markForCheck();
			},
		});
	}

	private extractMessage(err: unknown): string {
		const fallback = 'La sauvegarde a échoué. Vérifiez les champs et réessayez.';
		if (typeof err === 'object' && err !== null) {
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
