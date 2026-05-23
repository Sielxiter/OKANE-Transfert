import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	computed,
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
import {
	AdminUsersApiService,
	type ApiAccountStatus,
	type ApiRoleName,
	type ApiUser,
	type CreateUserRequest,
} from './admin-users.api';

export type UserCreateRoleVariant = 'CLIENT' | 'ADMIN' | 'MANAGER' | 'AGENT';

interface RoleConfig {
	role: ApiRoleName;
	label: string;
	icon: string;
	showCountry: boolean;
	showAgency: boolean;
}

const ROLE_CONFIGS: Record<UserCreateRoleVariant, RoleConfig> = {
	CLIENT: {
		role: 'ROLE_CLIENT',
		label: 'Nouveau client',
		icon: 'lucideUserPlus',
		showCountry: true,
		showAgency: false,
	},
	ADMIN: {
		role: 'ROLE_ADMIN',
		label: 'Nouvel administrateur',
		icon: 'lucideShield',
		showCountry: false,
		showAgency: false,
	},
	MANAGER: {
		role: 'ROLE_MANAGER',
		label: 'Nouveau manager',
		icon: 'lucideBuilding2',
		showCountry: false,
		showAgency: true,
	},
	AGENT: {
		role: 'ROLE_AGENT',
		label: 'Nouvel agent',
		icon: 'lucideUserCheck',
		showCountry: false,
		showAgency: true,
	},
};

@Component({
	selector: 'okane-user-create-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Prénom
					<input hlmInput type="text" formControlName="firstName" autocomplete="given-name" />
					@if (showError('firstName')) {
						<span class="text-xs text-destructive">{{ fieldError('firstName') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Nom
					<input hlmInput type="text" formControlName="lastName" autocomplete="family-name" />
					@if (showError('lastName')) {
						<span class="text-xs text-destructive">{{ fieldError('lastName') }}</span>
					}
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Email
				<input hlmInput type="email" formControlName="email" autocomplete="email" />
				@if (showError('email')) {
					<span class="text-xs text-destructive">{{ fieldError('email') }}</span>
				}
			</label>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Téléphone
				<input hlmInput type="tel" formControlName="phone" autocomplete="tel" />
				@if (showError('phone')) {
					<span class="text-xs text-destructive">{{ fieldError('phone') }}</span>
				}
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Mot de passe
					<input hlmInput type="password" formControlName="password" autocomplete="new-password" />
					@if (showError('password')) {
						<span class="text-xs text-destructive">{{ fieldError('password') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Confirmation
					<input hlmInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
					@if (showError('confirmPassword') || mismatchError()) {
						<span class="text-xs text-destructive">{{ fieldError('confirmPassword') || 'Les mots de passe ne correspondent pas.' }}</span>
					}
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Statut compte
				<select
					formControlName="accountStatus"
					class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
				>
					<option value="ACTIVE">Actif</option>
					<option value="SUSPENDED">Suspendu</option>
					<option value="LOCKED">Verrouillé</option>
				</select>
			</label>

			@if (config().showCountry) {
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Pays
					<input hlmInput type="text" formControlName="country" placeholder="Maroc, France, …" />
					@if (showError('country')) {
						<span class="text-xs text-destructive">{{ fieldError('country') }}</span>
					}
				</label>
			}

			@if (config().showAgency) {
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Agence (optionnel)
					<input hlmInput type="number" formControlName="agencyId" min="1" placeholder="ID de l'agence" />
					@if (showError('agencyId')) {
						<span class="text-xs text-destructive">{{ fieldError('agencyId') }}</span>
					}
				</label>
			}

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
					[disabled]="submitting() || form.invalid || mismatchError()"
				>
					@if (submitting()) {
						<ng-icon name="lucideLoaderCircle" class="animate-spin" />
					}
					Créer
				</button>
			</div>
		</form>
	`,
})
export class UserCreateFormComponent {
	private readonly _api = inject(AdminUsersApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	public readonly variant = input.required<UserCreateRoleVariant>();
	public readonly created = output<ApiUser>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal<boolean>(false);
	protected readonly serverError = signal<string | null>(null);

	protected readonly config = computed<RoleConfig>(() => ROLE_CONFIGS[this.variant()]);

	protected readonly form = this._fb.group({
		firstName: ['', [Validators.required, Validators.maxLength(100)]],
		lastName: ['', [Validators.required, Validators.maxLength(100)]],
		email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
		phone: ['', [Validators.required, Validators.maxLength(30)]],
		password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
		confirmPassword: ['', [Validators.required]],
		accountStatus: ['ACTIVE' as ApiAccountStatus, [Validators.required]],
		country: [''],
		agencyId: [null as number | null],
	});

	protected mismatchError(): boolean {
		const password = this.form.controls.password.value ?? '';
		const confirm = this.form.controls.confirmPassword.value ?? '';
		const touched = this.form.controls.confirmPassword.touched;
		return touched && password !== confirm && confirm.length > 0;
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
		if (errors['email']) return 'Adresse email invalide.';
		if (errors['minlength']) {
			const required = errors['minlength'].requiredLength as number;
			return `Au moins ${required} caractères.`;
		}
		if (errors['maxlength']) {
			const max = errors['maxlength'].requiredLength as number;
			return `Maximum ${max} caractères.`;
		}
		return 'Valeur invalide.';
	}

	protected submit(): void {
		this.serverError.set(null);
		this.form.markAllAsTouched();
		if (this.form.invalid || this.mismatchError()) {
			return;
		}

		const cfg = this.config();
		const value = this.form.getRawValue();
		const payload: CreateUserRequest = {
			firstName: (value.firstName ?? '').trim(),
			lastName: (value.lastName ?? '').trim(),
			email: (value.email ?? '').trim(),
			phone: (value.phone ?? '').trim(),
			password: value.password ?? '',
			role: cfg.role,
			country: cfg.showCountry ? (value.country ?? '').trim() || null : null,
			agencyId: cfg.showAgency && value.agencyId ? Number(value.agencyId) : null,
		};

		this.submitting.set(true);
		this._api.create(payload).subscribe({
			next: (user) => {
				// Note: the backend currently leaves the new user with default
				// flags; the requested accountStatus is applied via a follow-up
				// PATCH if it is not ACTIVE. Most admins create active users
				// so this stays a single-call happy path.
				const desiredStatus = (value.accountStatus ?? 'ACTIVE') as ApiAccountStatus;
				if (desiredStatus !== 'ACTIVE') {
					this._api.changeStatus(user.id, desiredStatus).subscribe({
						next: (final) => this.finishSuccess(final),
						error: () => this.finishSuccess(user),
					});
				} else {
					this.finishSuccess(user);
				}
			},
			error: (err) => {
				this.submitting.set(false);
				this.serverError.set(this.extractMessage(err));
				this._cdr.markForCheck();
			},
		});
	}

	private finishSuccess(user: ApiUser): void {
		this.submitting.set(false);
		this.form.reset({
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			password: '',
			confirmPassword: '',
			accountStatus: 'ACTIVE',
			country: '',
			agencyId: null,
		});
		this.created.emit(user);
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
