import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight, lucideBanknote, lucideSend } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { catchError, debounceTime, finalize, merge, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentEmptyStateComponent } from '../../agent/ui/agent-empty-state.component';
import { SenderSearchComponent } from './components/sender-search.component';
import { AddSenderModalComponent } from './components/add-sender-modal.component';
import { CountrySearchSelectComponent } from '../../features/admin/currency/country-search-select.component';
import type { CountryOption } from '../../features/admin/currency/country-directory';
import { CurrencySearchSelectComponent } from '../../features/admin/currency/currency-search-select.component';
import type { CurrencyOption } from '../../features/admin/currency/currency-directory';
import { AgentTransferApiService, type AgentTransferQuoteResponse, type CreateAgentTransferRequest } from './services/agent-transfer.api';
import type { ClientSearchResult } from './services/kyc-client.api';

@Component({
	selector: 'okane-agent-new-transfer-page',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		NgIcon,
		HlmButtonImports,
		HlmInputImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentEmptyStateComponent,
		SenderSearchComponent,
		AddSenderModalComponent,
		CountrySearchSelectComponent,
		CurrencySearchSelectComponent,
	],
	providers: [provideIcons({ lucideSend, lucideArrowLeft, lucideArrowRight, lucideBanknote })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Nouvel envoi">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Nouvel envoi"
					subtitle="Assistant de saisie du transfert. Les frais et le corridor se calculent automatiquement selon les pays et le montant."
				>
					<button hlmBtn variant="outline" size="sm" type="button" (click)="jumpToStep(0)">
						<ng-icon name="lucideSend" />
						Recommencer
					</button>
				</okane-agent-page-intro>

				<div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
					<div class="flex flex-col gap-6 md:gap-8">
						<okane-agent-section-card title="Progression du dossier" subtitle="Remplissez les 3 étapes pour préparer le transfert.">
							<div class="grid gap-3 sm:grid-cols-3">
								@for (step of steps; track step.index) {
									<div class="rounded-2xl border p-4 transition-colors"
										[class.border-primary]="activeStep() === step.index"
										[class.bg-primary/5]="activeStep() === step.index"
										[class.border-border]="activeStep() !== step.index"
									>
										<p class="text-xs uppercase tracking-[0.24em] text-muted-foreground">Étape {{ step.index + 1 }}</p>
										<p class="mt-2 text-sm font-semibold text-foreground">{{ step.label }}</p>
										<p class="mt-1 text-xs text-muted-foreground">{{ step.helper }}</p>
									</div>
								}
							</div>
						</okane-agent-section-card>

						@if (activeStep() === 0) {
							<okane-agent-section-card title="Informations du transfert" subtitle="Montant, devises et conditions de calcul.">
								<div [formGroup]="transferForm" class="grid gap-4 md:grid-cols-2">
									<label class="text-sm md:col-span-2">
										<span class="text-muted-foreground">Montant envoyé</span>
										<input hlmInput class="mt-1 w-full" type="number" min="0" step="0.01" formControlName="amount" />
									</label>
									<okane-currency-search-select
										label="Devise source"
										placeholder="Rechercher par nom ou symbole"
										[currencies]="currencies()"
										[value]="transferForm.controls.sourceCurrencyCode.value"
										(valueChange)="transferForm.patchValue({ sourceCurrencyCode: $event })"
									/>
									<okane-currency-search-select
										label="Devise destination"
										placeholder="Rechercher par nom ou symbole"
										[currencies]="currencies()"
										[value]="transferForm.controls.destinationCurrencyCode.value"
										(valueChange)="transferForm.patchValue({ destinationCurrencyCode: $event })"
									/>
									<label class="text-sm md:col-span-2">
										<span class="text-muted-foreground">Taux de change</span>
										<input hlmInput class="mt-1 w-full" type="number" min="0" step="0.000001" formControlName="exchangeRate" />
									</label>
									<label class="text-sm md:col-span-2">
										<span class="text-muted-foreground">Mode de paiement</span>
										<select
											class="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground"
											formControlName="paymentMethod"
										>
											<option value="Espèces">Espèces</option>
										</select>
									</label>
								</div>
							</okane-agent-section-card>
						}

						@if (activeStep() === 1) {
							<okane-agent-section-card title="Informations du bénéficiaire" subtitle="Les pays sont recherchés dans la table des pays.">
								<div [formGroup]="beneficiaryForm" class="grid gap-4 md:grid-cols-2">
									<label class="text-sm">
										<span class="text-muted-foreground">Prénom</span>
										<input hlmInput class="mt-1 w-full" formControlName="firstName" />
									</label>
									<label class="text-sm">
										<span class="text-muted-foreground">Nom</span>
										<input hlmInput class="mt-1 w-full" formControlName="lastName" />
									</label>
									<label class="text-sm">
										<span class="text-muted-foreground">Numéro CIN / Passeport</span>
										<input hlmInput class="mt-1 w-full" formControlName="identityNumber" />
									</label>
									<div class="md:col-span-2">
										<okane-country-search-select
											label="Pays"
											placeholder="Rechercher par nom ou code"
											[countries]="countries()"
											[value]="beneficiaryForm.controls.countryCode.value"
											(valueChange)="beneficiaryForm.patchValue({ countryCode: $event })"
										/>
									</div>
									<label class="text-sm md:col-span-2">
										<span class="text-muted-foreground">Téléphone</span>
										<div class="mt-1 flex h-10 overflow-hidden rounded-md border border-input bg-background">
											<div class="flex min-w-24 items-center border-r border-input px-3 text-sm text-muted-foreground">
												{{ beneficiaryPhonePrefix() || 'Indicatif' }}
											</div>
											<input
												hlmInput
												class="h-full flex-1 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
												inputmode="tel"
												formControlName="phoneNumber"
												placeholder="612345678"
											/>
										</div>
									</label>
								</div>
							</okane-agent-section-card>
						}

						@if (activeStep() === 2) {
							<okane-agent-section-card title="Informations de l'expéditeur" subtitle="Sélectionnez l'expéditeur existant puis son pays de départ.">
								<div class="space-y-4">
									<okane-sender-search
										(senderSelected)="onSenderSelected($event)"
										(senderCleared)="onSenderCleared()"
										(addSender)="addSenderOpen.set(true)"
										(verifyKyc)="onVerifyKyc($event)"
									/>

									<div [formGroup]="senderForm" class="grid gap-4 md:grid-cols-2">
										<div class="md:col-span-2">
											<okane-country-search-select
												label="Pays"
												placeholder="Rechercher par nom ou code"
												[countries]="countries()"
												[value]="senderForm.controls.countryCode.value"
												(valueChange)="senderForm.patchValue({ countryCode: $event })"
											/>
										</div>
									</div>

									@if (selectedSender()) {
										<div class="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
											<p class="font-medium text-foreground">{{ selectedSender()?.fullName }}</p>
											<p class="mt-1 text-muted-foreground">{{ selectedSender()?.phone || 'Téléphone non renseigné' }}</p>
											<p class="mt-1 text-muted-foreground">{{ selectedSender()?.identityNumber || 'Pièce non renseignée' }}</p>
										</div>
									}
							</div>
						</okane-agent-section-card>
						}

						<div class="flex flex-wrap gap-3">
							<button hlmBtn type="button" variant="outline" (click)="previousStep()" [disabled]="activeStep() === 0">
								<ng-icon name="lucideArrowLeft" />
								Précédent
							</button>
							@if (activeStep() < 2) {
								<button hlmBtn type="button" (click)="nextStep()">
									Suivant
									<ng-icon name="lucideArrowRight" />
								</button>
							} @else {
								<button hlmBtn type="button" (click)="submitTransfer()" [disabled]="isSubmitting()">
									Créer le transfert
								</button>
							}
						</div>

						@if (statusMessage) {
							<div class="rounded-2xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">
								{{ statusMessage }}
							</div>
						}
					</div>

					<okane-agent-section-card title="Simulation automatique" subtitle="Le calcul se met à jour dès que le montant et les pays sont renseignés.">
						@if (quoteLoading()) {
							<div class="space-y-3">
								<div class="h-12 rounded-2xl border border-border bg-muted/30 animate-pulse"></div>
								<div class="h-12 rounded-2xl border border-border bg-muted/30 animate-pulse"></div>
								<div class="h-12 rounded-2xl border border-border bg-muted/30 animate-pulse"></div>
							</div>
						} @else if (quoteError()) {
							<okane-agent-empty-state [title]="'Erreur de simulation'" [description]="quoteError()" />
						} @else if (quote(); as currentQuote) {
							<div class="space-y-3 text-sm">
								<div class="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/80 px-3 py-2">
									<span class="text-muted-foreground">Frais de base</span>
									<span class="font-medium text-foreground">{{ formatMoney(currentQuote.baseTransferFee) }}</span>
								</div>
								<div class="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/80 px-3 py-2">
									<span class="text-muted-foreground">Supplément corridor</span>
									<span class="font-medium text-foreground">{{ formatMoney(currentQuote.corridorFee) }}</span>
								</div>
								<div class="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/80 px-3 py-2">
									<span class="text-muted-foreground">Frais totaux</span>
									<span class="font-semibold text-foreground">{{ formatMoney(currentQuote.finalTransferFee) }}</span>
								</div>
								<div class="grid gap-2 rounded-2xl border border-border bg-muted/20 p-3">
									<div class="flex items-center justify-between gap-4">
										<span class="text-muted-foreground">Commission agence</span>
										<span class="font-medium text-foreground">{{ formatMoney(currentQuote.agencyCommission) }}</span>
									</div>
									<div class="flex items-center justify-between gap-4">
										<span class="text-muted-foreground">Commission centrale</span>
										<span class="font-medium text-foreground">{{ formatMoney(currentQuote.centralCommission) }}</span>
									</div>
								</div>
								<div class="rounded-2xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
									<p>Corridor: {{ currentQuote.corridorId ? 'appliqué automatiquement' : 'aucun corridor actif' }}</p>
									<p class="mt-1">Tranche tarifaire: #{{ currentQuote.matchedLineId }}</p>
								</div>
							</div>
						} @else {
							<okane-agent-empty-state
								title="Simulation prête"
								description="Renseignez le montant ainsi que les pays de l'expéditeur et du bénéficiaire pour afficher le calcul automatique."
							/>
						}
					</okane-agent-section-card>
				</div>
			</div>

			<okane-add-sender-modal
				[open]="addSenderOpen()"
				[existingClientId]="verifyingClientId()"
				[countries]="countries()"
				(closed)="onModalClosed()"
				(created)="onSenderCreated($event)"
			/>
		</okane-agent-layout>
	`,
})
export class AgentNewTransferPageComponent {
	private readonly _fb = inject(FormBuilder);
	private readonly _api = inject(AgentTransferApiService);
	private readonly _destroyRef = inject(DestroyRef);

	public statusMessage = '';
	protected readonly addSenderOpen = signal<boolean>(false);
	protected readonly selectedSender = signal<ClientSearchResult | null>(null);
	protected readonly verifyingClientId = signal<number | null>(null);
	protected readonly activeStep = signal(0);
	protected readonly quote = signal<AgentTransferQuoteResponse | null>(null);
	protected readonly quoteLoading = signal(false);
	protected readonly quoteError = signal('');
	protected readonly isSubmitting = signal(false);

	@ViewChild(SenderSearchComponent) senderSearch!: SenderSearchComponent;

	public readonly steps = [
		{ index: 0, label: 'Transfert', helper: 'Montant, devises et paiement' },
		{ index: 1, label: 'Bénéficiaire', helper: 'Identité et pays' },
		{ index: 2, label: 'Expéditeur', helper: 'Recherche client et pays' },
	];

	public readonly countries = toSignal(this._api.listCountries(), { initialValue: [] as CountryOption[] });
	public readonly currencies = toSignal(this._api.listCurrencies(), { initialValue: [] as CurrencyOption[] });

	public readonly transferForm = this._fb.nonNullable.group({
		amount: [1000, [Validators.required, Validators.min(0.01)]],
		sourceCurrencyCode: ['MAD', [Validators.required, Validators.minLength(3)]],
		destinationCurrencyCode: ['XOF', [Validators.required, Validators.minLength(3)]],
		exchangeRate: [65, [Validators.required, Validators.min(0.000001)]],
		paymentMethod: ['Espèces', [Validators.required]],
	});

	public readonly beneficiaryForm = this._fb.nonNullable.group({
		firstName: ['', [Validators.required]],
		lastName: ['', [Validators.required]],
		phoneNumber: ['', [Validators.required]],
		identityNumber: ['', [Validators.required]],
		countryCode: ['', [Validators.required]],
	});

	public readonly senderForm = this._fb.nonNullable.group({
		countryCode: ['', [Validators.required]],
	});

	constructor() {
		merge(
			this.transferForm.valueChanges,
			this.beneficiaryForm.controls.countryCode.valueChanges,
			this.senderForm.controls.countryCode.valueChanges,
		)
			.pipe(debounceTime(250), takeUntilDestroyed(this._destroyRef))
			.subscribe(() => this.refreshQuote());
	}

	protected onSenderSelected(client: ClientSearchResult): void {
		this.selectedSender.set(client);
		this.senderForm.patchValue({
			countryCode: this.resolveCountryCode(client.country),
		});
		this.statusMessage = '';
		this.refreshQuote();
	}

	protected onSenderCleared(): void {
		this.selectedSender.set(null);
		this.senderForm.patchValue({ countryCode: '' });
		this.refreshQuote();
	}

	protected onSenderCreated(client: ClientSearchResult): void {
		this.addSenderOpen.set(false);
		this.verifyingClientId.set(null);
		this.onSenderSelected(client);
		if (this.senderSearch) {
			this.senderSearch.selectExternalClient(client);
		}
		this.statusMessage = 'Expéditeur créé et sélectionné.';
	}

	protected onModalClosed(): void {
		this.addSenderOpen.set(false);
		this.verifyingClientId.set(null);
	}

	protected onVerifyKyc(client: ClientSearchResult): void {
		this.verifyingClientId.set(client.id);
		this.addSenderOpen.set(true);
	}

	public jumpToStep(index: number): void {
		this.activeStep.set(Math.max(0, Math.min(index, 2)));
	}

	public nextStep(): void {
		if (this.activeStep() === 0 && this.transferForm.invalid) {
			this.transferForm.markAllAsTouched();
			this.statusMessage = 'Complétez les informations du transfert.';
			return;
		}
		if (this.activeStep() === 1 && this.beneficiaryForm.invalid) {
			this.beneficiaryForm.markAllAsTouched();
			this.statusMessage = 'Complétez les informations du bénéficiaire.';
			return;
		}
		if (this.activeStep() < 2) {
			this.activeStep.update((step) => step + 1);
		}
	}

	public previousStep(): void {
		if (this.activeStep() > 0) {
			this.activeStep.update((step) => step - 1);
		}
	}

	public submitTransfer(): void {
		if (this.transferForm.invalid || this.beneficiaryForm.invalid || this.senderForm.invalid || !this.selectedSender()) {
			this.transferForm.markAllAsTouched();
			this.beneficiaryForm.markAllAsTouched();
			this.senderForm.markAllAsTouched();
			this.statusMessage = 'Veuillez compléter toutes les étapes avant la création.';
			return;
		}

		const payload = this.buildCreateRequest();
		if (!payload) {
			this.statusMessage = 'Impossible de préparer la demande de transfert.';
			return;
		}

		this.isSubmitting.set(true);
		this._api
			.createTransfer(payload)
			.pipe(
				finalize(() => this.isSubmitting.set(false)),
				catchError((error: unknown) => {
					this.statusMessage = this.extractErrorMessage(error) || 'Création du transfert impossible.';
					return of(null);
				}),
			)
			.subscribe((response) => {
				if (!response) {
					return;
				}
				this.statusMessage = `Transfert ${response.reference} créé avec succès.`;
				this.activeStep.set(0);
				this.transferForm.patchValue({ amount: 1000 });
				this.selectedSender.set(null);
				if (this.senderSearch) {
					this.senderSearch.clearSelection();
				}
				this.senderForm.reset({ countryCode: '' });
				this.beneficiaryForm.reset({
					firstName: '',
					lastName: '',
					phoneNumber: '',
					identityNumber: '',
					countryCode: '',
				});
				this.refreshQuote();
			});
	}

	public formatMoney(amount: number | null | undefined): string {
		const value = Number(amount ?? 0);
		return new Intl.NumberFormat('fr-MA', {
			style: 'currency',
			currency: this.transferForm.controls.sourceCurrencyCode.value || 'MAD',
		}).format(value);
	}

	private refreshQuote(): void {
		const payload = this.buildQuoteRequest();
		if (!payload) {
			this.quote.set(null);
			this.quoteError.set('');
			return;
		}

		this.quoteLoading.set(true);
		this.quoteError.set('');
		this._api
			.quote(payload)
			.pipe(
				finalize(() => this.quoteLoading.set(false)),
				catchError((error: unknown) => {
					this.quote.set(null);
					this.quoteError.set(this.extractErrorMessage(error) || 'Impossible de calculer les frais.');
					return of(null);
				}),
			)
			.subscribe((response) => {
				if (response) {
					this.quote.set(response);
				}
			});
	}

	private buildQuoteRequest(): { amount: number; senderCountryCode: string; beneficiaryCountryCode: string } | null {
		const amount = Number(this.transferForm.controls.amount.value ?? 0);
		const senderCountryCode = this.senderForm.controls.countryCode.value.trim();
		const beneficiaryCountryCode = this.beneficiaryForm.controls.countryCode.value.trim();

		if (!amount || amount <= 0 || !senderCountryCode || !beneficiaryCountryCode) {
			return null;
		}

		return { amount, senderCountryCode, beneficiaryCountryCode };
	}

	private buildCreateRequest(): CreateAgentTransferRequest | null {
		const sender = this.selectedSender();
		if (!sender) {
			return null;
		}
		const beneficiaryCountryCode = this.beneficiaryForm.controls.countryCode.value.trim();
		const beneficiaryPhone = this.composePhoneNumber(
			beneficiaryCountryCode,
			this.beneficiaryForm.controls.phoneNumber.value.trim(),
		);

		return {
			senderClientId: sender.id,
			senderCountryCode: this.senderForm.controls.countryCode.value.trim(),
			beneficiaryFirstName: this.beneficiaryForm.controls.firstName.value.trim(),
			beneficiaryLastName: this.beneficiaryForm.controls.lastName.value.trim(),
			beneficiaryPhone,
			beneficiaryIdentityType: 'CIN',
			beneficiaryIdentityNumber: this.beneficiaryForm.controls.identityNumber.value.trim(),
			beneficiaryCountryCode,
			sourceCurrencyCode: this.transferForm.controls.sourceCurrencyCode.value.trim(),
			destinationCurrencyCode: this.transferForm.controls.destinationCurrencyCode.value.trim(),
			amount: Number(this.transferForm.controls.amount.value ?? 0),
			exchangeRate: Number(this.transferForm.controls.exchangeRate.value ?? 1),
			paymentMethod: this.transferForm.controls.paymentMethod.value.trim(),
		};
	}

	private resolveCountryCode(countryName: string | null | undefined): string {
		const normalized = (countryName ?? '').trim().toLowerCase();
		if (!normalized) {
			return '';
		}
		const match = this.countries().find((country: CountryOption) => country.name.trim().toLowerCase() === normalized);
		return match?.code ?? '';
	}

	protected beneficiaryPhonePrefix(): string {
		const countryCode = this.beneficiaryForm.controls.countryCode.value.trim();
		return this.phonePrefixForCountry(countryCode);
	}

	private phonePrefixForCountry(countryCode: string | null | undefined): string {
		const normalized = (countryCode ?? '').trim().toUpperCase();
		if (!normalized) {
			return '';
		}
		const phoneCode = this.countries().find((country) => country.code === normalized)?.phoneCode?.trim();
		return phoneCode ?? '';
	}

	private composePhoneNumber(countryCode: string, localNumber: string): string {
		const local = localNumber.replace(/\s+/g, '').trim();
		if (!local) {
			return '';
		}
		if (local.startsWith('+') || local.startsWith('00')) {
			return local;
		}
		const prefix = this.phonePrefixForCountry(countryCode);
		if (!prefix) {
			return local;
		}
		return `${prefix}${local}`;
	}

	private extractErrorMessage(error: unknown): string {
		if (error && typeof error === 'object' && 'error' in error) {
			const payload = (error as { error?: { message?: string; error?: string } }).error;
			return payload?.message ?? payload?.error ?? '';
		}
		return '';
	}
}
