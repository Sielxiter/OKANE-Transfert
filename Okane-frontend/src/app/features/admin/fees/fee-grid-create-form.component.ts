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
	AdminFeesApiService,
	type ApiFeeGrid,
	type ApiFeeGridStatus,
	type CreateFeeGridPayload,
} from './admin-fees.api';

@Component({
	selector: 'okane-fee-grid-create-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Nom de la grille
				<input hlmInput type="text" formControlName="name" placeholder="Standard MA → SN" />
				@if (showError('name')) {
					<span class="text-xs text-destructive">{{ fieldError('name') }}</span>
				}
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Pays source
					<input hlmInput type="text" formControlName="sourceCountry" maxlength="10" placeholder="MA" class="uppercase" />
					@if (showError('sourceCountry')) {
						<span class="text-xs text-destructive">{{ fieldError('sourceCountry') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Pays destination
					<input hlmInput type="text" formControlName="destinationCountry" maxlength="10" placeholder="SN" class="uppercase" />
					@if (showError('destinationCountry')) {
						<span class="text-xs text-destructive">{{ fieldError('destinationCountry') }}</span>
					}
				</label>
			</div>

			@if (sameCountryError()) {
				<span class="text-xs text-destructive">Les pays source et destination doivent différer.</span>
			}

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Devise
				<select
					formControlName="currency"
					class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
				>
					<option value="MAD">MAD</option>
					<option value="EUR">EUR</option>
					<option value="USD">USD</option>
					<option value="XOF">XOF</option>
				</select>
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Montant min
					<input hlmInput type="number" formControlName="minAmount" min="0" step="1" />
					@if (showError('minAmount')) {
						<span class="text-xs text-destructive">{{ fieldError('minAmount') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Montant max
					<input hlmInput type="number" formControlName="maxAmount" min="0" step="1" />
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
					Frais fixes
					<input hlmInput type="number" formControlName="fixedFee" min="0" step="0.01" />
					@if (showError('fixedFee')) {
						<span class="text-xs text-destructive">{{ fieldError('fixedFee') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Pourcentage frais (%)
					<input hlmInput type="number" formControlName="percentageFee" min="0" max="100" step="0.01" />
					@if (showError('percentageFee')) {
						<span class="text-xs text-destructive">{{ fieldError('percentageFee') }}</span>
					}
				</label>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Commission agence (%)
					<input hlmInput type="number" formControlName="agencyCommissionRate" min="0" max="100" step="0.01" />
					@if (showError('agencyCommissionRate')) {
						<span class="text-xs text-destructive">{{ fieldError('agencyCommissionRate') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Commission centrale (%)
					<input hlmInput type="number" formControlName="centralCommissionRate" min="0" max="100" step="0.01" />
					@if (showError('centralCommissionRate')) {
						<span class="text-xs text-destructive">{{ fieldError('centralCommissionRate') }}</span>
					}
				</label>
			</div>
			@if (commissionsExceed()) {
				<span class="text-xs text-destructive">La somme des commissions ne peut pas dépasser 100%.</span>
			}

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Statut
				<select
					formControlName="status"
					class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
				>
					<option value="DRAFT">Brouillon</option>
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
				<button
					hlmBtn
					type="submit"
					size="sm"
					[disabled]="submitting() || form.invalid || rangeError() || sameCountryError() || commissionsExceed()"
				>
					@if (submitting()) {
						<ng-icon name="lucideLoaderCircle" class="animate-spin" />
					}
					Créer la grille
				</button>
			</div>
		</form>
	`,
})
export class FeeGridCreateFormComponent {
	private readonly _api = inject(AdminFeesApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	public readonly created = output<ApiFeeGrid>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal<boolean>(false);
	protected readonly serverError = signal<string | null>(null);

	protected readonly form = this._fb.group({
		name: ['', [Validators.required, Validators.maxLength(150)]],
		sourceCountry: ['', [Validators.required, Validators.maxLength(10)]],
		destinationCountry: ['', [Validators.required, Validators.maxLength(10)]],
		currency: ['MAD', [Validators.required]],
		minAmount: [0, [Validators.required, Validators.min(0)]],
		maxAmount: [1000, [Validators.required, Validators.min(0)]],
		fixedFee: [0, [Validators.required, Validators.min(0)]],
		percentageFee: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
		agencyCommissionRate: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
		centralCommissionRate: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
		status: ['DRAFT' as ApiFeeGridStatus, [Validators.required]],
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
		if (errors['max']) return `Valeur maximum : ${errors['max'].max}.`;
		if (errors['maxlength']) {
			const max = errors['maxlength'].requiredLength as number;
			return `Maximum ${max} caractères.`;
		}
		return 'Valeur invalide.';
	}

	protected rangeError(): boolean {
		const min = Number(this.form.controls.minAmount.value ?? 0);
		const max = Number(this.form.controls.maxAmount.value ?? 0);
		const minTouched = this.form.controls.minAmount.touched;
		const maxTouched = this.form.controls.maxAmount.touched;
		return (minTouched || maxTouched) && Number.isFinite(min) && Number.isFinite(max) && max <= min;
	}

	protected sameCountryError(): boolean {
		const src = (this.form.controls.sourceCountry.value ?? '').trim().toUpperCase();
		const dst = (this.form.controls.destinationCountry.value ?? '').trim().toUpperCase();
		const touched =
			this.form.controls.sourceCountry.touched || this.form.controls.destinationCountry.touched;
		return touched && src.length > 0 && src === dst;
	}

	protected commissionsExceed(): boolean {
		const a = Number(this.form.controls.agencyCommissionRate.value ?? 0);
		const c = Number(this.form.controls.centralCommissionRate.value ?? 0);
		return Number.isFinite(a) && Number.isFinite(c) && a + c > 100;
	}

	protected submit(): void {
		this.serverError.set(null);
		this.form.markAllAsTouched();
		if (this.form.invalid || this.rangeError() || this.sameCountryError() || this.commissionsExceed()) {
			return;
		}

		const value = this.form.getRawValue();
		const payload: CreateFeeGridPayload = {
			name: (value.name ?? '').trim(),
			sourceCountry: (value.sourceCountry ?? '').trim().toUpperCase(),
			destinationCountry: (value.destinationCountry ?? '').trim().toUpperCase(),
			currency: (value.currency ?? 'MAD').trim().toUpperCase(),
			minAmount: Number(value.minAmount ?? 0),
			maxAmount: Number(value.maxAmount ?? 0),
			fixedFee: Number(value.fixedFee ?? 0),
			percentageFee: Number(value.percentageFee ?? 0),
			agencyCommissionRate: Number(value.agencyCommissionRate ?? 0),
			centralCommissionRate: Number(value.centralCommissionRate ?? 0),
			status: (value.status ?? 'DRAFT') as ApiFeeGridStatus,
		};

		this.submitting.set(true);
		this._api.createGrid(payload).subscribe({
			next: (grid) => {
				this.submitting.set(false);
				this.form.reset({
					name: '',
					sourceCountry: '',
					destinationCountry: '',
					currency: 'MAD',
					minAmount: 0,
					maxAmount: 1000,
					fixedFee: 0,
					percentageFee: 0,
					agencyCommissionRate: 30,
					centralCommissionRate: 70,
					status: 'DRAFT',
				});
				this.created.emit(grid);
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
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
