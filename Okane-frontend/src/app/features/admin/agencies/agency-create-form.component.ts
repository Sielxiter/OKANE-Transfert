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
import { AdminAgenciesApiService, type ApiAgency, type CreateAgencyRequest } from './admin-agencies.api';

@Component({
	selector: 'okane-agency-create-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Nom de l'agence
				<input hlmInput type="text" formControlName="name" placeholder="Casablanca Centre" />
				@if (showError('name')) {
					<span class="text-xs text-destructive">{{ fieldError('name') }}</span>
				}
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Code agence
					<input hlmInput type="text" formControlName="code" placeholder="AG-CASA-01" class="uppercase" />
					@if (showError('code')) {
						<span class="text-xs text-destructive">{{ fieldError('code') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Ville
					<input hlmInput type="text" formControlName="city" placeholder="Casablanca" />
					@if (showError('city')) {
						<span class="text-xs text-destructive">{{ fieldError('city') }}</span>
					}
				</label>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Pays
					<input hlmInput type="text" formControlName="country" placeholder="Maroc" />
					@if (showError('country')) {
						<span class="text-xs text-destructive">{{ fieldError('country') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Téléphone
					<input hlmInput type="tel" formControlName="phone" placeholder="+212 5 22 00 00 00" />
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Adresse
				<input hlmInput type="text" formControlName="address" placeholder="123 Boulevard Mohammed V" />
				@if (showError('address')) {
					<span class="text-xs text-destructive">{{ fieldError('address') }}</span>
				}
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Email
					<input hlmInput type="email" formControlName="email" placeholder="agence@okane.ma" />
					@if (showError('email')) {
						<span class="text-xs text-destructive">{{ fieldError('email') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Plafond journalier (MAD)
					<input hlmInput type="number" formControlName="dailyLimit" min="1" step="1000" />
					@if (showError('dailyLimit')) {
						<span class="text-xs text-destructive">{{ fieldError('dailyLimit') }}</span>
					}
				</label>
			</div>

			@if (serverError()) {
				<div
					class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
				>
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<span>{{ serverError() }}</span>
				</div>
			}

			<div class="mt-2 flex justify-end gap-2">
				<button hlmBtn type="button" variant="outline" size="sm" (click)="cancelled.emit()">
					Annuler
				</button>
				<button
					hlmBtn
					type="submit"
					size="sm"
					[disabled]="submitting() || form.invalid"
				>
					@if (submitting()) {
						<ng-icon name="lucideLoaderCircle" class="animate-spin" />
					}
					Créer l'agence
				</button>
			</div>
		</form>
	`,
})
export class AgencyCreateFormComponent {
	private readonly _api = inject(AdminAgenciesApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	public readonly created = output<ApiAgency>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal<boolean>(false);
	protected readonly serverError = signal<string | null>(null);

	protected readonly form = this._fb.group({
		name: ['', [Validators.required, Validators.maxLength(150)]],
		code: ['', [Validators.required, Validators.maxLength(50)]],
		city: ['', [Validators.required, Validators.maxLength(100)]],
		country: ['', [Validators.required, Validators.maxLength(100)]],
		address: ['', [Validators.required, Validators.maxLength(255)]],
		phone: ['', [Validators.maxLength(30)]],
		email: ['', [Validators.email, Validators.maxLength(150)]],
		dailyLimit: [50000, [Validators.required, Validators.min(1)]],
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
		if (errors['email']) return 'Email invalide.';
		if (errors['min']) return `Valeur minimum : ${errors['min'].min}.`;
		if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength as number} caractères.`;
		return 'Valeur invalide.';
	}

	protected submit(): void {
		this.serverError.set(null);
		this.form.markAllAsTouched();
		if (this.form.invalid) return;

		const v = this.form.getRawValue();
		const payload: CreateAgencyRequest = {
			name: (v.name ?? '').trim(),
			code: (v.code ?? '').trim().toUpperCase(),
			city: (v.city ?? '').trim(),
			country: (v.country ?? '').trim(),
			address: (v.address ?? '').trim(),
			phone: v.phone?.trim() || null,
			email: v.email?.trim() || null,
			dailyLimit: Number(v.dailyLimit ?? 50000),
			managerId: null,
		};

		this.submitting.set(true);
		this._api.create(payload).subscribe({
			next: (agency) => {
				this.submitting.set(false);
				this.form.reset({ name: '', code: '', city: '', country: '', address: '', phone: '', email: '', dailyLimit: 50000 });
				this.created.emit(agency);
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
