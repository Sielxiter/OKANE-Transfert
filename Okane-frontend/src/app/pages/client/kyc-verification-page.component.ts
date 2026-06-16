import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileUp, lucideShieldCheck } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import type { ClientKycVerificationResponse, ClientProfile } from './client.models';
import { ClientKycApiService } from './services/client-kyc.api';
import { ClientProfileApiService } from './services/client-profile.api';
import { toSignal as rxToSignal } from '@angular/core/rxjs-interop';

@Component({
	selector: 'okane-client-kyc-verification-page',
	standalone: true,
	imports: [
		CommonModule,
		NgIcon,
		HlmButtonImports,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
	],
	providers: [provideIcons({ lucideFileUp, lucideShieldCheck })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6 md:gap-8">
			<okane-agent-page-intro
				eyebrow="Espace Client"
				title="Vérification KYC / AML"
				subtitle="Déposez votre pièce d’identité pour lancer l’analyse côté serveur."
			/>

			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
					<p class="text-sm text-muted-foreground">Statut KYC</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ labelForKycStatus(activeKycStatus()) }}</p>
					<p class="mt-2 text-sm text-muted-foreground">{{ kycHint(activeKycStatus()) }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
					<p class="text-sm text-muted-foreground">Niveau AML</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ labelForAmlLevel(activeAmlLevel()) }}</p>
					<p class="mt-2 text-sm text-muted-foreground">{{ amlHint(activeAmlLevel()) }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
					<p class="text-sm text-muted-foreground">Document actuel</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ kycDocumentType() }}</p>
					<p class="mt-2 text-sm text-muted-foreground">CIN ou passeport</p>
				</div>
				<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
					<p class="text-sm text-muted-foreground">Confiance OCR</p>
					<p class="mt-2 text-2xl font-semibold text-foreground">{{ confidenceLabel(kycResult()?.confidence ?? null) }}</p>
					<p class="mt-2 text-sm text-muted-foreground">Dernière analyse</p>
				</div>
			</div>

			<okane-agent-section-card title="Soumettre un document" subtitle="Le fichier est stocké en base puis soumis au contrôle AML côté serveur.">
				<div class="space-y-4">
					<div class="flex flex-wrap gap-2">
						<button
							hlmBtn
							type="button"
							variant="outline"
							size="sm"
							[class.bg-primary]="kycDocumentType() === 'CIN'"
							[class.text-primary-foreground]="kycDocumentType() === 'CIN'"
							(click)="kycDocumentType.set('CIN')"
						>
							CIN
						</button>
						<button
							hlmBtn
							type="button"
							variant="outline"
							size="sm"
							[class.bg-primary]="kycDocumentType() === 'PASSEPORT'"
							[class.text-primary-foreground]="kycDocumentType() === 'PASSEPORT'"
							(click)="kycDocumentType.set('PASSEPORT')"
						>
							Passeport
						</button>
					</div>

					<div class="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
							<input #kycFileInput type="file" accept="image/*" class="hidden" (change)="onKycFileSelected($event)" />
							<button hlmBtn type="button" variant="outline" (click)="kycFileInput.click()">
								<ng-icon name="lucideFileUp" />
								Choisir un fichier
							</button>
							@if (kycFileName()) {
								<span class="text-sm text-muted-foreground">{{ kycFileName() }}</span>
							} @else {
								<span class="text-sm text-muted-foreground">Aucun fichier sélectionné</span>
							}
						</div>

						@if (kycError()) {
							<div class="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								{{ kycError() }}
							</div>
						}

						<div class="mt-4 flex flex-wrap items-center gap-3">
							<button hlmBtn type="button" [disabled]="kycLoading() || !kycImageBase64()" (click)="submitKycVerification()">
								@if (kycLoading()) {
									<span class="mr-2 inline-block animate-spin">⟳</span>
								}
								Lancer la vérification
							</button>
							<p class="text-sm text-muted-foreground">Le document est enregistré en base et le contrôle AML est fait côté serveur.</p>
						</div>
					</div>
				</div>
			</okane-agent-section-card>

			<okane-agent-section-card title="Dernier résultat" subtitle="Réponse serveur la plus récente.">
				@if (kycResult()) {
					<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						<div class="rounded-xl border border-border bg-background/70 p-4">
							<p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Statut</p>
							<p class="mt-1 font-semibold text-foreground">{{ labelForKycStatus(kycResult()!.kycStatus) }}</p>
						</div>
						<div class="rounded-xl border border-border bg-background/70 p-4">
							<p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">AML</p>
							<p class="mt-1 font-semibold text-foreground">{{ labelForAmlLevel(kycResult()!.amlRiskLevel) }}</p>
						</div>
						<div class="rounded-xl border border-border bg-background/70 p-4">
							<p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Confiance OCR</p>
							<p class="mt-1 font-semibold text-foreground">{{ confidenceLabel(kycResult()!.confidence) }}</p>
						</div>
					</div>

					<div class="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
						<p><span class="font-medium text-foreground">Document :</span> {{ kycResult()!.documentType }}</p>
						<p class="mt-1"><span class="font-medium text-foreground">Numéro extrait :</span> {{ kycResult()!.extractedNumeroPiece || '—' }}</p>
						<p class="mt-1"><span class="font-medium text-foreground">Nationalité :</span> {{ kycResult()!.extractedNationalite || '—' }}</p>
						@if (kycResult()!.amlMatched) {
							<p class="mt-1"><span class="font-medium text-foreground">Correspondance AML :</span> {{ kycResult()!.matchedEntityName || '—' }}</p>
						}
						<p class="mt-3 rounded-lg border border-border bg-background/70 p-3 text-foreground">{{ kycResult()!.message }}</p>
					</div>
				} @else {
					<div class="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
						Aucun document vérifié pour le moment.
					</div>
				}
			</okane-agent-section-card>
		</div>
	`,
})
export class ClientKycVerificationPageComponent {
	private readonly _kycApi = inject(ClientKycApiService);
	private readonly _profileApi = inject(ClientProfileApiService);

	protected readonly profile = rxToSignal(this._profileApi.getProfile(), {
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
			kycStatus: 'EN_ATTENTE',
			amlRiskLevel: 'LOW',
		} as ClientProfile,
	});

	protected readonly kycDocumentType = signal<'CIN' | 'PASSEPORT'>('CIN');
	protected readonly kycFileName = signal<string>('');
	protected readonly kycImageBase64 = signal<string>('');
	protected readonly kycMimeType = signal<string>('');
	protected readonly kycLoading = signal<boolean>(false);
	protected readonly kycError = signal<string | null>(null);
	protected readonly kycResult = signal<ClientKycVerificationResponse | null>(null);

	protected readonly activeKycStatus = computed(() => this.kycResult()?.kycStatus ?? this.profile().kycStatus ?? 'EN_ATTENTE');
	protected readonly activeAmlLevel = computed(() => this.kycResult()?.amlRiskLevel ?? this.profile().amlRiskLevel ?? 'LOW');

	protected onKycFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}

		if (!file.type.startsWith('image/')) {
			this.kycError.set('Seules les images sont acceptées.');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			this.kycError.set('Fichier trop volumineux (max 5 Mo).');
			return;
		}

		this.kycError.set(null);
		this.kycFileName.set(file.name);
		this.kycMimeType.set(file.type);

		const reader = new FileReader();
		reader.onload = () => {
			const result = typeof reader.result === 'string' ? reader.result : '';
			this.kycImageBase64.set(result);
		};
		reader.onerror = () => this.kycError.set('Impossible de lire le fichier sélectionné.');
		reader.readAsDataURL(file);
	}

	protected submitKycVerification(): void {
		const imageBase64 = this.kycImageBase64();
		if (!imageBase64) {
			this.kycError.set('Veuillez sélectionner une pièce d’identité.');
			return;
		}

		this.kycLoading.set(true);
		this.kycError.set(null);

		this._kycApi.submitVerification({
			documentType: this.kycDocumentType(),
			imageBase64,
			fileName: this.kycFileName() || null,
			mimeType: this.kycMimeType() || null,
		}).subscribe({
			next: (result) => {
				this.kycResult.set(result);
				this.kycLoading.set(false);
			},
			error: (err) => {
				this.kycLoading.set(false);
				this.kycError.set(this.extractErrorMessage(err));
			},
		});
	}

	protected labelForKycStatus(status: string | null | undefined): string {
		const value = (status ?? '').toUpperCase();
		if (value === 'VERIFIE') return 'Vérifié';
		if (value === 'A_REVOIR') return 'À revoir';
		if (value === 'REJETE') return 'Rejeté';
		return 'En attente';
	}

	protected labelForAmlLevel(level: string | null | undefined): string {
		const value = (level ?? '').toUpperCase();
		if (value === 'HIGH') return 'Élevé';
		if (value === 'MEDIUM') return 'Moyen';
		return 'Faible';
	}

	protected kycHint(status: string | null | undefined): string {
		const value = (status ?? '').toUpperCase();
		if (value === 'VERIFIE') return 'Le dossier est validé.';
		if (value === 'A_REVOIR') return 'Le dossier attend une revue complémentaire.';
		if (value === 'REJETE') return 'Le dossier est rejeté.';
		return 'Aucun contrôle finalisé.';
	}

	protected amlHint(level: string | null | undefined): string {
		const value = (level ?? '').toUpperCase();
		if (value === 'HIGH') return 'Risque élevé détecté.';
		if (value === 'MEDIUM') return 'Vérification renforcée recommandée.';
		return 'Aucun signal majeur détecté.';
	}

	protected confidenceLabel(value: number | null | undefined): string {
		const confidence = value ?? 0;
		return `${Math.round(confidence * 100)}%`;
	}

	private extractErrorMessage(err: unknown): string {
		if (typeof err === 'object' && err && 'error' in err) {
			const error = (err as { error?: { message?: string } }).error;
			if (error?.message) {
				return error.message;
			}
		}
		return 'La vérification KYC/AML a échoué.';
	}
}
