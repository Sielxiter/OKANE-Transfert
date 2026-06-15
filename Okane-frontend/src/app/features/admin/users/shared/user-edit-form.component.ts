import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	inject,
	input,
	OnInit,
	output,
	signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AdminUsersApiService, type ApiUser, type UpdateUserRequest } from './admin-users.api';

@Component({
	selector: 'okane-user-edit-form',
	standalone: true,
	imports: [ReactiveFormsModule, NgIcon, HlmButtonImports, HlmInputImports],
	providers: [provideIcons({ lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Prénom
					<input hlmInput type="text" formControlName="firstName" />
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
					Nom
					<input hlmInput type="text" formControlName="lastName" />
				</label>
			</div>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Téléphone
				<input hlmInput type="tel" formControlName="phone" placeholder="+212 6 00 00 00 00" />
			</label>

			<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
				Pays
				<input hlmInput type="text" formControlName="country" placeholder="Maroc" />
			</label>

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
					Enregistrer
				</button>
			</div>
		</form>
	`,
})
export class UserEditFormComponent implements OnInit {
	private readonly _api = inject(AdminUsersApiService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	/** The user to edit — passed from the parent page. */
	public readonly user = input.required<ApiUser>();

	public readonly saved = output<ApiUser>();
	public readonly cancelled = output<void>();

	protected readonly submitting = signal<boolean>(false);
	protected readonly serverError = signal<string | null>(null);

	protected readonly form = this._fb.group({
		firstName: ['', [Validators.required, Validators.maxLength(100)]],
		lastName: ['', [Validators.required, Validators.maxLength(100)]],
		phone: ['', [Validators.maxLength(30)]],
		country: ['', [Validators.maxLength(100)]],
	});

	public ngOnInit(): void {
		const u = this.user();
		this.form.patchValue({
			firstName: u.firstName ?? '',
			lastName: u.lastName ?? '',
			phone: u.phone ?? '',
			country: u.country ?? '',
		});
	}

	protected submit(): void {
		this.serverError.set(null);
		this.form.markAllAsTouched();
		if (this.form.invalid) return;

		const v = this.form.getRawValue();
		const payload: UpdateUserRequest = {
			firstName: (v.firstName ?? '').trim(),
			lastName: (v.lastName ?? '').trim(),
			phone: v.phone?.trim() || null,
			country: v.country?.trim() || null,
			agencyId: this.user().agencyId ?? null,
		};

		this.submitting.set(true);
		this._api.update(this.user().id, payload).subscribe({
			next: (updated) => {
				this.submitting.set(false);
				this.saved.emit(updated);
			},
			error: (err) => {
				this.submitting.set(false);
				this.serverError.set(this.extractMessage(err));
				this._cdr.markForCheck();
			},
		});
	}

	private extractMessage(err: unknown): string {
		const fallback = 'La modification a échoué. Vérifiez les champs et réessayez.';
		if (typeof err === 'object' && err !== null) {
			const e = err as { error?: { message?: string }; message?: string };
			return e.error?.message ?? e.message ?? fallback;
		}
		return fallback;
	}
}
