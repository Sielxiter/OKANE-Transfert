import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnInit,
	inject,
	input,
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
import { AdminUsersApiService, type ApiUser } from '../users/shared/admin-users.api';
import { AdminAgenciesApiService, type ApiAgency, type UpdateAgencyRequest } from './admin-agencies.api';

@Component({
	selector: 'okane-agency-edit-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Nom de l'agence
				<input hlmInput type="text" formControlName="name" />
				@if (showError('name')) {
					<span class="text-xs text-destructive">{{ fieldError('name') }}</span>
				}
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Ville
					<input hlmInput type="text" formControlName="city" />
					@if (showError('city')) {
						<span class="text-xs text-destructive">{{ fieldError('city') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Pays
					<input hlmInput type="text" formControlName="country" />
					@if (showError('country')) {
						<span class="text-xs text-destructive">{{ fieldError('country') }}</span>
					}
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Adresse
				<input hlmInput type="text" formControlName="address" />
				@if (showError('address')) {
					<span class="text-xs text-destructive">{{ fieldError('address') }}</span>
				}
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Téléphone
					<input hlmInput type="tel" formControlName="phone" />
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Email
					<input hlmInput type="email" formControlName="email" />
					@if (showError('email')) {
						<span class="text-xs text-destructive">{{ fieldError('email') }}</span>
					}
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Plafond journalier (MAD)
				<input hlmInput type="number" formControlName="dailyLimit" min="1" step="1000" />
				@if (showError('dailyLimit')) {
					<span class="text-xs text-destructive">{{ fieldError('dailyLimit') }}</span>
				}
			</label>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Manager assigné
				<select
					formControlName="managerId"
					class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
				>
					<option [value]="null">— Aucun manager —</option>
					@for (m of availableManagers(); track m.id) {
						<option [value]="m.id">{{ m.fullName }} ({{ m.email }})</option>
					}
				</select>
				@if (loadingManagers()) {
					<span class="text-xs text-muted-foreground">Chargement des managers...</span>
				}
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
				<button hlmBtn type="button" variant="outline" size="sm" (click)="cancelled.emit()">
					Annuler
				</button>
				<button hlmBtn type="submit" size="sm" [disabled]="submitting() || form.invalid">
					@if (submitting()) {
						<ng-icon name="lucideLoaderCircle" class="animate-spin" />
					}
					Enregistrer
				</button>
			</div>
		</form>
	`,
})
export class AgencyEditFormComponent implements OnInit {
	private readonly _agencyApi = inject(AdminAgenciesApiService);
	private readonly _usersApi = inject(AdminUsersApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	/** The agency to edit — passed in by the parent. */
	public readonly agency = input.required<ApiAgency>();

	public readonly updated = output<ApiAgency>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal<boolean>(false);
	protected readonly serverError = signal<string | null>(null);
	protected readonly availableManagers = signal<ApiUser[]>([]);
	protected readonly loadingManagers = signal<boolean>(true);

	protected readonly form = this._fb.group({
		name: ['', [Validators.required, Validators.maxLength(150)]],
		city: ['', [Validators.required, Validators.maxLength(100)]],
		country: ['', [Validators.required, Validators.maxLength(100)]],
		address: ['', [Validators.required, Validators.maxLength(255)]],
		phone: ['', [Validators.maxLength(30)]],
		email: ['', [Validators.email, Validators.maxLength(150)]],
		dailyLimit: [50000, [Validators.required, Validators.min(1)]],
		managerId: [null as number | null],
	});

	public ngOnInit(): void {
		const a = this.agency();
		this.form.patchValue({
			name: a.name,
			city: a.city,
			country: a.country,
			address: a.address,
			phone: a.phone ?? '',
			email: a.email ?? '',
			dailyLimit: a.dailyLimit,
			managerId: a.managerId ?? null,
		});

		// Load available managers (not assigned to other agencies, or assigned to this one)
		this._usersApi.getAvailableManagers(a.id).subscribe({
			next: (managers) => {
				this.availableManagers.set(managers);
				this.loadingManagers.set(false);
				this._cdr.markForCheck();
			},
			error: () => {
				// Fallback: load all managers
				this._usersApi.getManagers().subscribe({
					next: (managers) => {
						this.availableManagers.set(managers);
						this.loadingManagers.set(false);
						this._cdr.markForCheck();
					},
					error: () => {
						this.loadingManagers.set(false);
						this._cdr.markForCheck();
					},
				});
			},
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
		const payload: UpdateAgencyRequest = {
			name: (v.name ?? '').trim(),
			city: (v.city ?? '').trim(),
			country: (v.country ?? '').trim(),
			address: (v.address ?? '').trim(),
			phone: v.phone?.trim() || null,
			email: v.email?.trim() || null,
			dailyLimit: Number(v.dailyLimit ?? 50000),
			managerId: v.managerId ? Number(v.managerId) : null,
		};

		this.submitting.set(true);
		this._agencyApi.update(this.agency().id, payload).subscribe({
			next: (agency) => {
				this.submitting.set(false);
				this.updated.emit(agency);
			},
			error: (err) => {
				this.submitting.set(false);
				this.serverError.set(this.extractMessage(err));
				this._cdr.markForCheck();
			},
		});
	}

	private extractMessage(err: unknown): string {
		const fallback = 'La mise à jour a échoué. Vérifiez les champs et réessayez.';
		if (typeof err === 'object' && err !== null) {
			const e = err as { error?: { message?: string }; message?: string };
			return e.error?.message ?? e.message ?? fallback;
		}
		return fallback;
	}
}
