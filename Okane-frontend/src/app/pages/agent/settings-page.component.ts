import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { ProfilAgent } from '../../agent/models/agent-dashboard.models';
import { AuthSessionService } from '../../shared/auth/auth-session.service';

@Component({
	selector: 'okane-agent-settings-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<section class="rounded-xl border bg-background p-4 shadow-sm">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-base font-semibold">Profil agent</h2>
				@if (!editing) {
					<button class="rounded-md border px-4 py-2 text-sm font-semibold" type="button" (click)="startEditing()" [disabled]="loading">
						Modifier profil
					</button>
				}
			</div>

			@if (errorMessage) {
				<p class="mt-4 text-sm text-destructive">{{ errorMessage }}</p>
			} @else if (loading && !profile) {
				<p class="mt-4 text-sm text-muted-foreground">Chargement du profil...</p>
			} @else if (profile) {
				<form class="mt-4 grid gap-3 md:grid-cols-2" [formGroup]="form">
					<label class="text-sm">
						<span class="text-muted-foreground">Nom complet</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="fullName" [readonly]="!editing" />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Courriel</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" [value]="profile.email" readonly />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Agence</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" [value]="profile.agencyName || '-'" readonly />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Rôle</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" [value]="profile.role || 'ROLE_AGENT'" readonly />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Langue</span>
						<select class="mt-1 w-full rounded-md border px-3 py-2" formControlName="preferredLanguage" [disabled]="!editing">
							<option value="FR">Français</option>
							<option value="EN">Anglais</option>
							<option value="AR">Arabe</option>
						</select>
					</label>
				</form>
			}
		</section>

		<section class="rounded-xl border bg-background p-4 shadow-sm">
			<h2 class="text-base font-semibold">Préférences de notification</h2>
			<form class="mt-4 grid gap-3 md:grid-cols-2" [formGroup]="form">
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" formControlName="transferPaid" [disabled]="!editing" />
					<span>Alertes de transfert payé</span>
				</label>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" formControlName="cashSession" [disabled]="!editing" />
					<span>Alertes de session de caisse</span>
				</label>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" formControlName="systemAlerts" [disabled]="!editing" />
					<span>Alertes système</span>
				</label>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" formControlName="kycAlerts" [disabled]="!editing" />
					<span>Alertes KYC</span>
				</label>
			</form>
			@if (editing) {
				<div class="mt-4 flex gap-3">
					<button class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" type="button" (click)="save()" [disabled]="saving">
						Sauvegarder
					</button>
					<button class="rounded-md border px-4 py-2 text-sm font-semibold" type="button" (click)="cancel()">
						Annuler
					</button>
				</div>
			}
			@if (feedbackMessage) {
				<p class="mt-3 text-sm" [class]="feedbackClass">{{ feedbackMessage }}</p>
			}
		</section>
	`,
})
export class AgentSettingsPageComponent implements OnInit {
	private readonly _service = inject(AgentDashboardService);
	private readonly _authSession = inject(AuthSessionService);
	private readonly _fb = inject(FormBuilder);
	private readonly _cdr = inject(ChangeDetectorRef);

	public profile: ProfilAgent | null = null;
	public loading = false;
	public saving = false;
	public editing = false;
	public errorMessage = '';
	public feedbackMessage = '';
	public feedbackClass = 'text-muted-foreground';

	public readonly form = this._fb.group({
		fullName: ['', Validators.required],
		preferredLanguage: ['FR' as 'FR' | 'EN' | 'AR', Validators.required],
		transferPaid: [true],
		cashSession: [true],
		systemAlerts: [true],
		kycAlerts: [true],
	});

	public ngOnInit(): void {
		this.loadProfile();
	}

	public startEditing(): void {
		this.editing = true;
		this.feedbackMessage = '';
		this._cdr.markForCheck();
	}

	public cancel(): void {
		this.editing = false;
		this.feedbackMessage = '';
		this.syncForm();
		this._cdr.markForCheck();
	}

	public save(): void {
		if (!this.profile) {
			return;
		}
		this.form.markAllAsTouched();
		if (this.form.invalid) {
			this.feedbackMessage = 'Le nom complet et la langue sont obligatoires.';
			this.feedbackClass = 'text-destructive';
			this._cdr.markForCheck();
			return;
		}

		this.saving = true;
		this.feedbackMessage = '';
		this._service.updateAgentProfile({
			fullName: (this.form.get('fullName')?.value ?? '').trim(),
			preferredLanguage: (this.form.get('preferredLanguage')?.value ?? 'FR') as 'FR' | 'EN' | 'AR',
			notificationPreferences: {
				transferPaid: !!this.form.get('transferPaid')?.value,
				cashSession: !!this.form.get('cashSession')?.value,
				systemAlerts: !!this.form.get('systemAlerts')?.value,
				kycAlerts: !!this.form.get('kycAlerts')?.value,
				cashDiscrepancy: this.profile.notificationPreferences.cashDiscrepancy,
			},
		}).subscribe({
			next: (profile) => {
				this.profile = profile;
				this.editing = false;
				this.saving = false;
				this.feedbackMessage = 'Profil mis à jour avec succès.';
				this.feedbackClass = 'text-emerald-700';
				this.syncForm();
				const [firstName, ...rest] = profile.fullName.split(' ');
				this._authSession.updateCachedUser({
					firstName: firstName ?? '',
					lastName: rest.join(' ') || '',
					email: profile.email,
					role: profile.role || 'ROLE_AGENT',
				});
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.saving = false;
				this.feedbackMessage = error?.error?.message ?? 'Impossible de sauvegarder le profil.';
				this.feedbackClass = 'text-destructive';
				this._cdr.markForCheck();
			},
		});
	}

	private loadProfile(): void {
		this.loading = true;
		this.errorMessage = '';
		this._service.getAgentProfile().subscribe({
			next: (profile) => {
				this.profile = profile;
				this.loading = false;
				this.syncForm();
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.loading = false;
				this.errorMessage = error?.error?.message ?? 'Impossible de charger le profil agent.';
				this._cdr.markForCheck();
			},
		});
	}

	private syncForm(): void {
		if (!this.profile) {
			return;
		}
		this.form.patchValue(
			{
				fullName: this.profile.fullName,
				preferredLanguage: this.profile.preferredLanguage,
				transferPaid: this.profile.notificationPreferences.transferPaid,
				cashSession: this.profile.notificationPreferences.cashSession,
				systemAlerts: this.profile.notificationPreferences.systemAlerts,
				kycAlerts: this.profile.notificationPreferences.kycAlerts,
			},
			{ emitEvent: false }
		);
	}
}
