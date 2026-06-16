import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	effect,
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
import { AdminAgenciesApiService, type ApiAgency, type ApiAgencyType } from './admin-agencies.api';

@Component({
	selector: 'okane-agency-create-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Nom
					<input hlmInput type="text" formControlName="name" placeholder="Agence centrale / sous-agence" />
					@if (showError('name')) {
						<span class="text-xs text-destructive">{{ fieldError('name') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Code
					<input hlmInput type="text" formControlName="code" placeholder="AG-CASA-01" class="uppercase" />
					@if (showError('code')) {
						<span class="text-xs text-destructive">{{ fieldError('code') }}</span>
					}
				</label>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Ville
					<input hlmInput type="text" formControlName="city" placeholder="Casablanca" />
					@if (showError('city')) {
						<span class="text-xs text-destructive">{{ fieldError('city') }}</span>
					}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Pays
					<input hlmInput type="text" formControlName="country" placeholder="Maroc" />
					@if (showError('country')) {
						<span class="text-xs text-destructive">{{ fieldError('country') }}</span>
					}
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Adresse
				<input hlmInput type="text" formControlName="address" placeholder="12 Rue Principale" />
				@if (showError('address')) {
					<span class="text-xs text-destructive">{{ fieldError('address') }}</span>
				}
			</label>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Téléphone
					<input hlmInput type="tel" formControlName="phone" placeholder="+212..." />
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Email
					<input hlmInput type="email" formControlName="email" placeholder="contact@okane.ma" />
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
				Base Balance (MAD)
				<input hlmInput type="number" formControlName="baseBalance" min="0" step="1000" />
				@if (showError('baseBalance')) {
					<span class="text-xs text-destructive">{{ fieldError('baseBalance') }}</span>
				}
			</label>

			@if (mode() === 'CENTRAL') {
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Manager responsable
					<select
						formControlName="managerId"
						class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					>
						<option [ngValue]="null">— Choisir un manager —</option>
						@for (manager of availableManagers(); track manager.id) {
							<option [ngValue]="manager.id">{{ manager.fullName }} ({{ manager.email }})</option>
						}
					</select>
					@if (loadingManagers()) {
						<span class="text-xs text-muted-foreground">Chargement des managers...</span>
					}
				</label>
			} @else {
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Agence centrale parente
					<select
						formControlName="centralAgencyId"
						class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					>
						<option [ngValue]="null">— Choisir une centrale —</option>
						@for (central of centralAgencies(); track central.id) {
							<option [ngValue]="central.id">{{ central.name }} ({{ central.code }})</option>
						}
					</select>
					@if (loadingCentral()) {
						<span class="text-xs text-muted-foreground">Chargement des agences centrales...</span>
					}
				</label>
			}

			@if (serverError()) {
				<div class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
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
					@if (mode() === 'CENTRAL') {
						Créer la centrale
					} @else {
						Créer la sous-agence
					}
				</button>
			</div>
		</form>
	`,
})
export class AgencyCreateFormComponent {
	private readonly _agencyApi = inject(AdminAgenciesApiService);
	private readonly _usersApi = inject(AdminUsersApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	public readonly mode = input<ApiAgencyType>('SUB');
	public readonly created = output<ApiAgency>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal<boolean>(false);
	protected readonly serverError = signal<string | null>(null);
	protected readonly availableManagers = signal<ApiUser[]>([]);
	protected readonly loadingManagers = signal<boolean>(false);
	protected readonly centralAgencies = signal<ApiAgency[]>([]);
	protected readonly loadingCentral = signal<boolean>(false);

	protected readonly form = this._fb.group({
		name: ['', [Validators.required, Validators.maxLength(150)]],
		code: ['', [Validators.required, Validators.maxLength(50)]],
		city: ['', [Validators.required, Validators.maxLength(100)]],
		country: ['', [Validators.required, Validators.maxLength(100)]],
		address: ['', [Validators.required, Validators.maxLength(255)]],
		phone: ['', [Validators.maxLength(30)]],
		email: ['', [Validators.email, Validators.maxLength(150)]],
		dailyLimit: [50000, [Validators.required, Validators.min(1)]],
		baseBalance: [50000, [Validators.required, Validators.min(0)]],
		managerId: [null as number | null],
		centralAgencyId: [null as number | null],
	});
	private readonly _modeEffect = effect(() => {
		this.mode();
		this.configureForMode();
	});

	private configureForMode(): void {
		this.form.controls.managerId.clearValidators();
		this.form.controls.centralAgencyId.clearValidators();
		this.form.controls.managerId.setValue(null);
		this.form.controls.centralAgencyId.setValue(null);

		if (this.mode() === 'CENTRAL') {
			this.form.controls.managerId.addValidators([Validators.required]);
			this.loadingManagers.set(true);
			this._usersApi.getAvailableManagers().subscribe({
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
		} else {
			this.form.controls.centralAgencyId.addValidators([Validators.required]);
			this.loadingCentral.set(true);
			this._agencyApi.listCentral().subscribe({
				next: (centrals) => {
					this.centralAgencies.set(centrals);
					this.loadingCentral.set(false);
					this._cdr.markForCheck();
				},
				error: () => {
					this.loadingCentral.set(false);
					this._cdr.markForCheck();
				},
			});
		}

		this.form.controls.managerId.updateValueAndValidity({ emitEvent: false });
		this.form.controls.centralAgencyId.updateValueAndValidity({ emitEvent: false });
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
		if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength as number} caracteres.`;
		return 'Valeur invalide.';
	}

	protected submit(): void {
		this.serverError.set(null);
		this.form.markAllAsTouched();
		if (this.form.invalid) return;

		const value = this.form.getRawValue();
		const payload = {
			name: (value.name ?? '').trim(),
			code: (value.code ?? '').trim().toUpperCase(),
			city: (value.city ?? '').trim(),
			country: (value.country ?? '').trim(),
			address: (value.address ?? '').trim(),
			phone: value.phone?.trim() || null,
			email: value.email?.trim() || null,
			dailyLimit: Number(value.dailyLimit ?? 50000),
			baseBalance: Number(value.baseBalance ?? 0),
			agencyType: this.mode(),
			centralAgencyId: this.mode() === 'SUB' ? Number(value.centralAgencyId ?? 0) : null,
			managerId: this.mode() === 'CENTRAL' ? Number(value.managerId ?? 0) : null,
		};

		this.submitting.set(true);
		const request$ = this.mode() === 'CENTRAL'
			? this._agencyApi.createCentral(payload)
			: this._agencyApi.create(payload);

		request$.subscribe({
			next: (agency) => {
				this.submitting.set(false);
				this.form.reset({
					name: '',
					code: '',
					city: '',
					country: '',
					address: '',
					phone: '',
					email: '',
					dailyLimit: 50000,
					baseBalance: 50000,
					managerId: null,
					centralAgencyId: null,
				});
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
		const fallback = 'La creation a echoue. Verifiez les champs et reessayez.';
		if (typeof err === 'object' && err !== null) {
			const e = err as { error?: { message?: string }; message?: string };
			return e.error?.message ?? e.message ?? fallback;
		}
		return fallback;
	}
}
