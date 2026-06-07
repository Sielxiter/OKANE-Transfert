import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { KycClientApiService, type AmlResult, type ClientSearchResult, type OcrResult } from '../services/kyc-client.api';

type Step = 'upload' | 'ocr-result' | 'creating';
type DocType = 'CIN' | 'PASSEPORT';

@Component({
	selector: 'okane-add-sender-modal',
	standalone: true,
	imports: [FormsModule, NgClass, HlmButtonImports, HlmInputImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (open()) {
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="closeModal()">
				<div class="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" (click)="$event.stopPropagation()">
					<div class="mb-4 flex items-center justify-between">
						<div>
							<h2 class="text-lg font-semibold text-foreground">Ajouter un expéditeur</h2>
							<p class="text-xs text-muted-foreground">Vérification KYC par OCR et screening AML</p>
						</div>
						<button type="button" class="text-muted-foreground hover:text-foreground" (click)="closeModal()">✕</button>
					</div>

					@if (step() === 'upload') {
						<!-- Step 1: Document upload -->
						<div class="flex flex-col gap-4">
							<div class="flex items-center gap-3">
								<label class="text-sm font-medium text-muted-foreground">Type de pièce :</label>
								<div class="flex rounded-lg border border-border">
									<button type="button" class="rounded-l-lg px-4 py-2 text-sm font-medium transition-colors"
										[ngClass]="docType() === 'CIN' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'"
										(click)="docType.set('CIN')">CIN</button>
									<button type="button" class="rounded-r-lg px-4 py-2 text-sm font-medium transition-colors"
										[ngClass]="docType() === 'PASSEPORT' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'"
										(click)="docType.set('PASSEPORT')">Passeport</button>
								</div>
							</div>

							@if (docType() === 'CIN') {
								<div class="grid gap-4 md:grid-cols-2">
									<div class="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50"
										(dragover)="$event.preventDefault()" (drop)="onDrop($event, 'recto')">
										<p class="text-sm font-medium text-foreground">CIN Recto</p>
										<p class="text-xs text-muted-foreground">Glisser-déposer ou cliquer</p>
										<input type="file" accept="image/*" class="hidden" #rectoInput (change)="onFileSelect($event, 'recto')" />
										<button hlmBtn variant="outline" size="sm" type="button" (click)="rectoInput.click()">Choisir un fichier</button>
										@if (rectoFile()) { <p class="text-xs text-emerald-600">✓ {{ rectoFile()!.name }}</p> }
									</div>
									<div class="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50"
										(dragover)="$event.preventDefault()" (drop)="onDrop($event, 'verso')">
										<p class="text-sm font-medium text-foreground">CIN Verso</p>
										<p class="text-xs text-muted-foreground">Glisser-déposer ou cliquer</p>
										<input type="file" accept="image/*" class="hidden" #versoInput (change)="onFileSelect($event, 'verso')" />
										<button hlmBtn variant="outline" size="sm" type="button" (click)="versoInput.click()">Choisir un fichier</button>
										@if (versoFile()) { <p class="text-xs text-emerald-600">✓ {{ versoFile()!.name }}</p> }
									</div>
								</div>
							} @else {
								<div class="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50"
									(dragover)="$event.preventDefault()" (drop)="onDrop($event, 'passport')">
									<p class="text-sm font-medium text-foreground">Page d'identité du passeport</p>
									<p class="text-xs text-muted-foreground">Glisser-déposer ou cliquer</p>
									<input type="file" accept="image/*" class="hidden" #passportInput (change)="onFileSelect($event, 'passport')" />
									<button hlmBtn variant="outline" size="sm" type="button" (click)="passportInput.click()">Choisir un fichier</button>
									@if (passportFile()) { <p class="text-xs text-emerald-600">✓ {{ passportFile()!.name }}</p> }
								</div>
							}

							@if (uploadError()) {
								<div class="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
									{{ uploadError() }}
								</div>
							}

							<button hlmBtn type="button" [disabled]="!canRunOcr() || ocrLoading()" (click)="runOcr()">
								@if (ocrLoading()) { <span class="mr-2 animate-spin">⟳</span> }
								Lancer l'extraction OCR
							</button>
						</div>
					}

					@if (step() === 'ocr-result') {
						<!-- Step 2: OCR results + form side by side -->
						<div class="grid gap-4 lg:grid-cols-2">
							<!-- OCR Card -->
							<div class="rounded-xl border border-border bg-muted/20 p-4">
								<h3 class="text-sm font-semibold text-foreground">Données extraites par OCR</h3>
								<div class="mt-3 space-y-2">
									<div class="flex items-center justify-between">
										<span class="text-xs text-muted-foreground">Nom</span>
										<span class="font-mono text-sm text-foreground" [ngClass]="ocrData().nom ? '' : 'text-amber-500'">{{ ocrData().nom || '—' }}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-xs text-muted-foreground">Prénom</span>
										<span class="font-mono text-sm text-foreground" [ngClass]="ocrData().prenom ? '' : 'text-amber-500'">{{ ocrData().prenom || '—' }}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-xs text-muted-foreground">N° Pièce</span>
										<span class="font-mono text-sm text-foreground" [ngClass]="ocrData().numeroPiece ? '' : 'text-amber-500'">{{ ocrData().numeroPiece || '—' }}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-xs text-muted-foreground">Nationalité</span>
										<span class="font-mono text-sm text-foreground" [ngClass]="ocrData().nationalite ? '' : 'text-amber-500'">{{ ocrData().nationalite || '—' }}</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-xs text-muted-foreground">Confiance</span>
										<span class="font-mono text-sm" [ngClass]="ocrData().confidence > 0.5 ? 'text-emerald-600' : 'text-amber-500'">{{ (ocrData().confidence * 100).toFixed(0) }}%</span>
									</div>
								</div>
								<details class="mt-3">
									<summary class="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Texte OCR brut</summary>
									<pre class="mt-2 max-h-32 overflow-auto rounded-lg bg-muted p-2 text-xs text-muted-foreground">{{ ocrData().rawText || 'Aucun texte extrait.' }}</pre>
								</details>
							</div>

							<!-- Form Card -->
							<div class="rounded-xl border border-border p-4">
								<h3 class="text-sm font-semibold text-foreground">Formulaire de création expéditeur</h3>
								<div class="mt-3 flex flex-col gap-3">
									<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
										Nom
										<input hlmInput type="text" [(ngModel)]="formNom" />
									</label>
									<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
										Prénom
										<input hlmInput type="text" [(ngModel)]="formPrenom" />
									</label>
									<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
										Type de pièce
										<select class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground" [(ngModel)]="formIdentityType">
											<option value="CIN">CIN</option>
											<option value="PASSEPORT">Passeport</option>
										</select>
									</label>
									<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
										Numéro de pièce
										<input hlmInput type="text" [(ngModel)]="formIdentityNumber" class="uppercase" />
									</label>
									<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
										Nationalité
										<input hlmInput type="text" [(ngModel)]="formNationality" />
									</label>
									<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
										Téléphone
										<input hlmInput type="tel" [(ngModel)]="formPhone" placeholder="+212 6 00 00 00 00" />
									</label>
								</div>

								@if (formError()) {
									<div class="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
										{{ formError() }}
									</div>
								}

								@if (amlResult()) {
									<div class="mt-3 rounded-xl border p-3 text-xs"
										[ngClass]="amlResult()!.riskLevel === 'HIGH' ? 'border-destructive/30 bg-destructive/5 text-destructive' :
											amlResult()!.riskLevel === 'MEDIUM' ? 'border-amber-500/30 bg-amber-500/5 text-amber-700' :
											'border-emerald-500/30 bg-emerald-500/5 text-emerald-700'">
										<p class="font-semibold">Résultat AML : {{ amlResult()!.riskLevel }}</p>
										@if (amlResult()!.matched) {
											<p class="mt-1">Correspondance : {{ amlResult()!.matchedEntityName }} (score: {{ (amlResult()!.matchScore * 100).toFixed(0) }}%)</p>
										}
										@if (amlResult()!.riskLevel === 'HIGH') {
											<p class="mt-1 font-semibold">Risque AML élevé. Ce client nécessite une vérification par l'administrateur.</p>
										}
									</div>
								}

								<div class="mt-4 flex justify-end gap-2">
									<button hlmBtn variant="outline" size="sm" type="button" (click)="step.set('upload')">Retour</button>
									<button hlmBtn size="sm" type="button" [disabled]="creating()" (click)="createSender()">
										@if (creating()) { <span class="mr-2 animate-spin">⟳</span> }
										Créer expéditeur
									</button>
								</div>
							</div>
						</div>
					}

					@if (step() === 'creating') {
						<div class="flex flex-col items-center gap-4 py-10">
							@if (!amlDone()) {
								<div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
									<svg class="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
										<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
									</svg>
								</div>
								<p class="text-sm font-medium text-foreground">Vérification AML en cours...</p>
								<p class="text-xs text-muted-foreground">Screening contre les listes de sanctions internationales</p>
							} @else if (amlResult()?.riskLevel === 'LOW') {
								<div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
									<svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
									</svg>
								</div>
								<p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Vérification réussie</p>
								<p class="text-xs text-muted-foreground">Aucune correspondance suspecte détectée. Création en cours...</p>
							} @else {
								<div class="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300">
									<svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
									</svg>
								</div>
								<p class="text-sm font-semibold text-amber-700 dark:text-amber-300">Correspondance suspecte détectée</p>
								<p class="text-xs text-muted-foreground">Risque : {{ amlResult()?.riskLevel }} — Score : {{ ((amlResult()?.matchScore ?? 0) * 100).toFixed(0) }}%</p>
							}
						</div>
					}
				</div>
			</div>
		}
	`,
})
export class AddSenderModalComponent {
	private readonly _api = inject(KycClientApiService);

	public readonly open = input.required<boolean>();
	public readonly existingClientId = input<number | null>(null);
	public readonly closed = output<void>();
	public readonly created = output<ClientSearchResult>();

	protected readonly step = signal<Step>('upload');
	protected readonly docType = signal<DocType>('CIN');
	protected readonly rectoFile = signal<File | null>(null);
	protected readonly versoFile = signal<File | null>(null);
	protected readonly passportFile = signal<File | null>(null);
	protected readonly uploadError = signal<string | null>(null);
	protected readonly ocrLoading = signal<boolean>(false);
	protected readonly ocrData = signal<OcrResult>({ rawText: '', nom: '', prenom: '', numeroPiece: '', nationalite: '', confidence: 0 });
	protected readonly amlResult = signal<AmlResult | null>(null);
	protected readonly amlDone = signal<boolean>(false);
	protected readonly formError = signal<string | null>(null);
	protected readonly creating = signal<boolean>(false);

	// Form fields
	protected formNom = '';
	protected formPrenom = '';
	protected formIdentityType = 'CIN';
	protected formIdentityNumber = '';
	protected formNationality = '';
	protected formPhone = '';

	protected canRunOcr(): boolean {
		if (this.docType() === 'CIN') return this.rectoFile() !== null;
		return this.passportFile() !== null;
	}

	protected onFileSelect(event: Event, slot: 'recto' | 'verso' | 'passport'): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		this.setFile(file, slot);
	}

	protected onDrop(event: DragEvent, slot: 'recto' | 'verso' | 'passport'): void {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		if (!file) return;
		this.setFile(file, slot);
	}

	private setFile(file: File, slot: 'recto' | 'verso' | 'passport'): void {
		this.uploadError.set(null);
		if (!file.type.startsWith('image/')) {
			this.uploadError.set('Seules les images sont acceptées.');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			this.uploadError.set('Fichier trop volumineux (max 5 Mo).');
			return;
		}
		if (slot === 'recto') this.rectoFile.set(file);
		else if (slot === 'verso') this.versoFile.set(file);
		else this.passportFile.set(file);
	}

	protected runOcr(): void {
		const file = this.docType() === 'CIN' ? this.rectoFile() : this.passportFile();
		if (!file) return;

		this.ocrLoading.set(true);
		this.uploadError.set(null);

		const reader = new FileReader();
		reader.onload = () => {
			const base64 = reader.result as string;
			this._api.performOcr(base64, this.docType()).subscribe({
				next: (result) => {
					this.ocrLoading.set(false);
					if (result.error) {
						this.uploadError.set(result.error);
						return;
					}
					this.ocrData.set(result);
					// Pre-fill form
					this.formNom = result.nom || '';
					this.formPrenom = result.prenom || '';
					this.formIdentityType = this.docType();
					this.formIdentityNumber = result.numeroPiece || '';
					this.formNationality = result.nationalite || '';
					this.step.set('ocr-result');
				},
				error: (err) => {
					this.ocrLoading.set(false);
					this.uploadError.set('Service OCR indisponible. Veuillez réessayer.');
				},
			});
		};
		reader.readAsDataURL(file);
	}

	protected createSender(): void {
		this.formError.set(null);

		if (!this.formNom.trim() || !this.formPrenom.trim()) {
			this.formError.set('Nom et prénom sont obligatoires.');
			return;
		}
		if (!this.formIdentityNumber.trim()) {
			this.formError.set('Le numéro de pièce est obligatoire.');
			return;
		}
		if (!this.formPhone.trim() && !this.existingClientId()) {
			this.formError.set('Le téléphone est obligatoire.');
			return;
		}

		// Step 1: Show AML loading animation
		this.creating.set(true);
		this.amlDone.set(false);
		this.step.set('creating');

		// Step 2: AML check with 2s minimum display time
		const amlStart = Date.now();
		this._api.amlCheck(this.formPrenom.trim(), this.formNom.trim(), this.formNationality.trim()).subscribe({
			next: (aml) => {
				const elapsed = Date.now() - amlStart;
				const remaining = Math.max(0, 2000 - elapsed);

				setTimeout(() => {
					this.amlResult.set(aml);
					this.amlDone.set(true);

					// Determine KYC status based on AML result
					let kycStatus = 'VERIFIE';
					if (aml.riskLevel === 'MEDIUM') kycStatus = 'A_REVOIR';
					if (aml.riskLevel === 'HIGH') kycStatus = 'REJETE';

					if (aml.riskLevel === 'HIGH') {
						// Show result for 2s then go back to form
						setTimeout(() => {
							this.creating.set(false);
							this.step.set('ocr-result');
							this.formError.set('Risque AML élevé. Ce client nécessite une vérification par l\'administrateur.');
						}, 2000);
						return;
					}

					// Step 3: Create or update client after 1.5s success display
					setTimeout(() => {
						this.performClientSave(kycStatus, aml.riskLevel);
					}, 1500);
				}, remaining);
			},
			error: () => {
				// AML service unavailable — allow creation with LOW risk after delay
				setTimeout(() => {
					this.amlDone.set(true);
					this.amlResult.set({ riskLevel: 'LOW', matchScore: 0, matchedEntityName: '', source: '', matched: false, error: 'Service indisponible' });
					setTimeout(() => {
						this.performClientSave('VERIFIE', 'LOW');
					}, 1500);
				}, 2000);
			},
		});
	}

	private performClientSave(kycStatus: string, amlRiskLevel: string): void {
		const clientId = this.existingClientId();
		const payload = {
			firstName: this.formPrenom.trim(),
			lastName: this.formNom.trim(),
			phone: this.formPhone.trim(),
			identityType: this.formIdentityType,
			identityNumber: this.formIdentityNumber.trim().toUpperCase(),
			nationality: this.formNationality.trim(),
			kycStatus,
			amlRiskLevel,
			rawOcrText: this.ocrData().rawText,
			documentType: this.formIdentityType,
		};

		const request$ = clientId
			? this._api.updateClientKyc(clientId, payload)
			: this._api.createClient(payload);

		request$.subscribe({
			next: (client) => {
				this.creating.set(false);
				this.created.emit({
					id: client.id,
					fullName: client.fullName,
					phone: client.phone,
					identityType: client.identityType,
					identityNumber: client.identityNumber,
					country: client.country,
					nationality: client.nationality,
					kycStatus: client.kycStatus,
					amlRiskLevel: client.amlRiskLevel,
					restricted: client.restricted,
				});
				this.resetModal();
			},
			error: (err) => {
				this.creating.set(false);
				this.step.set('ocr-result');
				const msg = err?.error?.message ?? 'La création a échoué. Veuillez réessayer.';
				this.formError.set(msg);
			},
		});
	}

	protected closeModal(): void {
		this.resetModal();
		this.closed.emit();
	}

	private resetModal(): void {
		this.step.set('upload');
		this.rectoFile.set(null);
		this.versoFile.set(null);
		this.passportFile.set(null);
		this.uploadError.set(null);
		this.ocrLoading.set(false);
		this.ocrData.set({ rawText: '', nom: '', prenom: '', numeroPiece: '', nationalite: '', confidence: 0 });
		this.amlResult.set(null);
		this.amlDone.set(false);
		this.formError.set(null);
		this.creating.set(false);
		this.formNom = '';
		this.formPrenom = '';
		this.formIdentityType = 'CIN';
		this.formIdentityNumber = '';
		this.formNationality = '';
		this.formPhone = '';
	}
}
