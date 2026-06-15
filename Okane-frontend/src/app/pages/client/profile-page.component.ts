import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { ClientLayoutComponent } from './client-layout.component';
import { ClientProfileApiService } from './services/client-profile.api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
	selector: 'okane-client-profile-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, HlmButtonImports, HlmInputImports, ClientLayoutComponent, AgentPageIntroComponent, AgentSectionCardComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-client-layout>
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro eyebrow="Espace Client" title="Profil" subtitle="Modifiez vos informations personnelles et vos préférences."></okane-agent-page-intro>

				<okane-agent-section-card title="Informations personnelles" subtitle="Nom, téléphone, pays et langue préférée.">
					<form [formGroup]="profileForm" class="grid gap-4 md:grid-cols-2" (ngSubmit)="saveProfile()">
						<label class="text-sm">
							<span class="text-muted-foreground">Prénom</span>
							<input hlmInput class="mt-1 w-full" formControlName="firstName" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Nom</span>
							<input hlmInput class="mt-1 w-full" formControlName="lastName" />
						</label>
						<label class="text-sm md:col-span-2">
							<span class="text-muted-foreground">Téléphone</span>
							<input hlmInput class="mt-1 w-full" formControlName="phone" />
						</label>
						<label class="text-sm md:col-span-2">
							<span class="text-muted-foreground">Pays</span>
							<input hlmInput class="mt-1 w-full" formControlName="country" />
						</label>
						<label class="text-sm md:col-span-2">
							<span class="text-muted-foreground">Langue préférée</span>
							<select hlmInput class="mt-1 w-full" formControlName="preferredLanguage">
								<option value="fr">Français</option>
								<option value="en">English</option>
								<option value="ar">العربية</option>
							</select>
						</label>
						<div class="md:col-span-2 flex gap-2">
							<button hlmBtn type="submit" [disabled]="savingProfile()">Enregistrer</button>
						</div>
					</form>
				</okane-agent-section-card>

				<okane-agent-section-card title="Sécurité" subtitle="Changer le mot de passe du compte.">
					<form [formGroup]="passwordForm" class="grid gap-4 md:grid-cols-2" (ngSubmit)="changePassword()">
						<label class="text-sm md:col-span-2">
							<span class="text-muted-foreground">Mot de passe actuel</span>
							<input hlmInput type="password" class="mt-1 w-full" formControlName="currentPassword" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Nouveau mot de passe</span>
							<input hlmInput type="password" class="mt-1 w-full" formControlName="newPassword" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Confirmation</span>
							<input hlmInput type="password" class="mt-1 w-full" formControlName="confirmPassword" />
						</label>
						<div class="md:col-span-2 flex gap-2">
							<button hlmBtn type="submit" [disabled]="savingPassword()">Modifier le mot de passe</button>
						</div>
					</form>
				</okane-agent-section-card>

				<okane-agent-section-card title="Préférences de notifications" subtitle="Choisissez vos canaux de notification.">
					<form [formGroup]="preferencesForm" class="grid gap-4 md:grid-cols-2" (ngSubmit)="savePreferences()">
						<label class="flex items-center gap-2 text-sm text-foreground">
							<input type="checkbox" formControlName="emailNotificationsEnabled" />
							Notifications email
						</label>
						<label class="flex items-center gap-2 text-sm text-foreground">
							<input type="checkbox" formControlName="smsNotificationsEnabled" />
							Notifications SMS
						</label>
						<div class="md:col-span-2 flex gap-2">
							<button hlmBtn type="submit" [disabled]="savingPreferences()">Enregistrer les préférences</button>
						</div>
					</form>
				</okane-agent-section-card>

				@if (message()) {
					<div class="rounded-2xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">{{ message() }}</div>
				}
			</div>
		</okane-client-layout>
	`,
})
export class ClientProfilePageComponent {
	private readonly _fb = inject(FormBuilder);
	private readonly _api = inject(ClientProfileApiService);

	protected readonly profile = toSignal(this._api.getProfile(), {
		initialValue: {
			id: 0,
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			country: '',
			preferredLanguage: 'fr',
			emailNotificationsEnabled: true,
			smsNotificationsEnabled: true,
		},
	});
	protected readonly profileForm = this._fb.nonNullable.group({
		firstName: ['', [Validators.required]],
		lastName: ['', [Validators.required]],
		phone: ['', [Validators.required]],
		country: ['', [Validators.required]],
		preferredLanguage: ['fr' as 'fr' | 'en' | 'ar', [Validators.required]],
	});
	protected readonly passwordForm = this._fb.nonNullable.group({
		currentPassword: ['', [Validators.required]],
		newPassword: ['', [Validators.required, Validators.minLength(8)]],
		confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
	});
	protected readonly preferencesForm = this._fb.nonNullable.group({
		emailNotificationsEnabled: [true],
		smsNotificationsEnabled: [true],
	});
	protected readonly savingProfile = signal(false);
	protected readonly savingPassword = signal(false);
	protected readonly savingPreferences = signal(false);
	protected readonly message = signal('');

	constructor() {
		effect(() => {
			const profile = this.profile();
			this.profileForm.patchValue(
				{
					firstName: profile.firstName,
					lastName: profile.lastName,
					phone: profile.phone,
					country: profile.country,
					preferredLanguage: profile.preferredLanguage,
				},
				{ emitEvent: false },
			);
			this.preferencesForm.patchValue(
				{
					emailNotificationsEnabled: profile.emailNotificationsEnabled,
					smsNotificationsEnabled: profile.smsNotificationsEnabled,
				},
				{ emitEvent: false },
			);
		});
	}

	public saveProfile(): void {
		if (this.profileForm.invalid) {
			this.profileForm.markAllAsTouched();
			return;
		}
		this.savingProfile.set(true);
		this._api.updateProfile(this.profileForm.getRawValue()).subscribe({
			next: (profile) => {
				this.savingProfile.set(false);
				this.message.set('Profil mis à jour.');
				this.profileForm.patchValue({
					firstName: profile.firstName,
					lastName: profile.lastName,
					phone: profile.phone,
					country: profile.country,
					preferredLanguage: profile.preferredLanguage,
				});
			},
			error: () => this.savingProfile.set(false),
		});
	}

	public changePassword(): void {
		if (this.passwordForm.invalid) {
			this.passwordForm.markAllAsTouched();
			return;
		}
		this.savingPassword.set(true);
		this._api.changePassword(this.passwordForm.getRawValue()).subscribe({
			next: (response) => {
				this.savingPassword.set(false);
				this.message.set(response.message);
				this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
			},
			error: () => this.savingPassword.set(false),
		});
	}

	public savePreferences(): void {
		this.savingPreferences.set(true);
		this._api.updateNotificationPreferences(this.preferencesForm.getRawValue()).subscribe({
			next: (profile) => {
				this.savingPreferences.set(false);
				this.message.set('Préférences mises à jour.');
				this.preferencesForm.patchValue({
					emailNotificationsEnabled: profile.emailNotificationsEnabled,
					smsNotificationsEnabled: profile.smsNotificationsEnabled,
				});
			},
			error: () => this.savingPreferences.set(false),
		});
	}
}
