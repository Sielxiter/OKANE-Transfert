import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { CorridorDestinationResponse } from '../../agent/models/agent-dashboard.models';
import {
	AGENT_CASH_SESSION_REQUIRED_MESSAGE,
	AgentCashSessionStoreService,
} from '../../agent/services/agent-cash-session-store.service';

type AlertType = 'success' | 'info' | 'error';

interface TransferReceipt {
	reference: string;
	withdrawalCode: string;
	status: 'EN_ATTENTE';
	createdAt: string;
	senderFullName: string;
	senderPhone: string;
	receiverFullName: string;
	receiverPhone: string;
	receiverDocumentType: string;
	receiverDocumentNumber: string;
	amountSent: number;
	fees: number;
	amountReceived: number;
	sourceCurrency: string;
	destinationCurrency: string;
	destinationCountry: string;
	paymentMethod: string;
	agentName: string;
	agencyName: string;
}

@Component({
	selector: 'okane-agent-new-transfer-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<form class="grid gap-4 no-print" [formGroup]="form">
			@if (cashAlert) {
				<div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
					{{ cashAlert }}
				</div>
			}
				<section class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Informations de l'expéditeur</h2>
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						<label class="text-sm">
							<span class="text-muted-foreground">Prénom</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderFirstName" />
							@if (showError('senderFirstName')) {
								<p class="mt-1 text-xs text-rose-600">Le prénom est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Nom</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderLastName" />
							@if (showError('senderLastName')) {
								<p class="mt-1 text-xs text-rose-600">Le nom est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Type de pièce</span>
							<select class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderIdType">
								<option value="">Sélectionner</option>
								<option value="CIN">CIN</option>
								<option value="Passeport">Passeport</option>
							</select>
							@if (showError('senderIdType')) {
								<p class="mt-1 text-xs text-rose-600">Le type de pièce est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Numéro de pièce</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderIdNumber" />
							@if (showError('senderIdNumber')) {
								<p class="mt-1 text-xs text-rose-600">Le numéro de pièce est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Téléphone</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderPhone" />
							@if (showError('senderPhone')) {
								<p class="mt-1 text-xs text-rose-600">Entrez un téléphone valide.</p>
							}
						</label>
						<label class="text-sm md:col-span-2">
							<span class="text-muted-foreground">Pays</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderCountry" readonly />
							@if (showError('senderCountry')) {
								<p class="mt-1 text-xs text-rose-600">Le pays est obligatoire.</p>
							}
						</label>
					</div>
				</section>

				<section class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Informations du bénéficiaire</h2>
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						<label class="text-sm">
							<span class="text-muted-foreground">Prénom</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverFirstName" />
							@if (showError('receiverFirstName')) {
								<p class="mt-1 text-xs text-rose-600">Le prénom est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Nom</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverLastName" />
							@if (showError('receiverLastName')) {
								<p class="mt-1 text-xs text-rose-600">Le nom est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Téléphone</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverPhone" />
							@if (showError('receiverPhone')) {
								<p class="mt-1 text-xs text-rose-600">Le téléphone est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Pays de réception</span>
							<select class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverCountry">
								<option value="">Sélectionner</option>
								@for (destination of destinations; track destination.countryCode) {
									<option [value]="destination.countryName">{{ destination.countryName }}</option>
								}
							</select>
							@if (showError('receiverCountry')) {
								<p class="mt-1 text-xs text-rose-600">Le pays de réception est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Type de pièce</span>
							<select class="mt-1 w-full rounded-md border px-3 py-2" formControlName="beneficiaryDocumentType">
								<option value="">Sélectionner</option>
								<option value="CIN">CIN</option>
								<option value="Passeport">Passeport</option>
							</select>
							@if (showError('beneficiaryDocumentType')) {
								<p class="mt-1 text-xs text-rose-600">Le type de pièce est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Numéro de pièce</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="beneficiaryDocumentNumber" />
							@if (showError('beneficiaryDocumentNumber')) {
								<p class="mt-1 text-xs text-rose-600">Le numéro de pièce est obligatoire.</p>
							}
						</label>
					</div>
				</section>

				<section class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Informations du transfert</h2>
					<div class="mt-4 grid gap-3 md:grid-cols-3">
						<label class="text-sm">
							<span class="text-muted-foreground">Devise source</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="sourceCurrency" readonly />
							@if (showError('sourceCurrency')) {
								<p class="mt-1 text-xs text-rose-600">La devise source est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Devise de destination</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="destinationCurrency" readonly />
							@if (showError('destinationCurrency')) {
								<p class="mt-1 text-xs text-rose-600">La devise destination est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Mode de paiement</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="paymentMethod" readonly />
							@if (showError('paymentMethod')) {
								<p class="mt-1 text-xs text-rose-600">Le mode de paiement est obligatoire.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Montant envoyé</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="amountSent" />
							@if (showError('amountSent')) {
								<p class="mt-1 text-xs text-rose-600">Le montant envoyé doit être supérieur à 0.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Taux de change</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="exchangeRate" readonly />
							@if (showError('exchangeRate')) {
								<p class="mt-1 text-xs text-rose-600">Le taux de change doit être supérieur à 0.</p>
							}
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Frais</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="fees" readonly />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Montant net reçu</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="amountReceived" readonly />
						</label>
					</div>
					<div class="mt-4 flex flex-wrap gap-3">
						<button
							class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
							type="button"
							(click)="calculateFees()"
							[disabled]="isValidated || !isSessionOpen"
						>
							Calculer les frais
						</button>
						<button
							class="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-50"
							type="button"
							(click)="validateTransfer()"
							[disabled]="!canValidate || !isSessionOpen"
						>
							Valider l'envoi
						</button>
						<button
							class="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-50"
							type="button"
							(click)="printReceipt()"
							[disabled]="!canPrint"
						>
							Imprimer le reçu
						</button>
					</div>
					@if (alert) {
						<div class="mt-3 rounded-md border px-3 py-2 text-sm" [class]="alertClass(alert.type)">
							<p class="font-semibold">{{ alert.message }}</p>
							@if (alertDetails.length) {
								<ul class="mt-1 space-y-1 text-xs">
									@for (detail of alertDetails; track detail) {
										<li>{{ detail }}</li>
									}
								</ul>
							}
						</div>
					}
				</section>
		</form>

		<div class="print-receipt">
				<h1 class="text-lg font-semibold">Reçu d'envoi</h1>
				<div class="mt-4 grid gap-2 text-sm">
					<div><span class="text-muted-foreground">Référence :</span> {{ validatedTransfer?.reference }}</div>
					<div><span class="text-muted-foreground">Code retrait :</span> {{ validatedTransfer?.withdrawalCode }}</div>
					<div><span class="text-muted-foreground">Expéditeur :</span> {{ validatedTransfer?.senderFullName }}</div>
					<div><span class="text-muted-foreground">Téléphone expéditeur :</span> {{ validatedTransfer?.senderPhone }}</div>
					<div><span class="text-muted-foreground">Bénéficiaire :</span> {{ validatedTransfer?.receiverFullName }}</div>
					<div><span class="text-muted-foreground">Téléphone bénéficiaire :</span> {{ validatedTransfer?.receiverPhone }}</div>
					<div><span class="text-muted-foreground">Pièce bénéficiaire :</span> {{ validatedTransfer?.receiverDocumentType }} {{ validatedTransfer?.receiverDocumentNumber }}</div>
					<div><span class="text-muted-foreground">Montant envoyé :</span> {{ formatMoney(validatedTransfer?.amountSent, validatedTransfer?.sourceCurrency) }}</div>
					<div><span class="text-muted-foreground">Frais :</span> {{ formatMoney(validatedTransfer?.fees, validatedTransfer?.sourceCurrency) }}</div>
					<div><span class="text-muted-foreground">Montant net reçu :</span> {{ formatMoney(validatedTransfer?.amountReceived, validatedTransfer?.destinationCurrency) }}</div>
					<div><span class="text-muted-foreground">Devise source :</span> {{ validatedTransfer?.sourceCurrency }}</div>
					<div><span class="text-muted-foreground">Devise destination :</span> {{ validatedTransfer?.destinationCurrency }}</div>
					<div><span class="text-muted-foreground">Pays destination :</span> {{ validatedTransfer?.destinationCountry }}</div>
					<div><span class="text-muted-foreground">Date / heure :</span> {{ validatedTransfer?.createdAt }}</div>
					<div><span class="text-muted-foreground">Mode de paiement :</span> {{ validatedTransfer?.paymentMethod }}</div>
					<div><span class="text-muted-foreground">Agent connecté :</span> {{ validatedTransfer?.agentName }}</div>
					<div><span class="text-muted-foreground">Nom agence :</span> {{ validatedTransfer?.agencyName }}</div>
				</div>
		</div>
	`,
	styles: [
		`
			.print-receipt {
				display: none;
			}
			@media print {
				.no-print {
					display: none !important;
				}
				.print-receipt {
					display: block;
					padding: 24px;
				}
			}
		`,
	],
})
export class AgentNewTransferPageComponent implements OnInit {
	private readonly _fb = inject(FormBuilder);
	private readonly _service = inject(AgentDashboardService);
	private readonly _cdr = inject(ChangeDetectorRef);
	private readonly _cashSessionStore = inject(AgentCashSessionStoreService);
	private readonly _destroyRef = inject(DestroyRef);
	private readonly _phoneRegex = /^\+?[0-9\s-]{6,20}$/;
	private _suspendReset = false;

	public readonly agentName = 'Agent Nora Benali';
	public readonly agencyName = 'Okane Casablanca Centre';

	public alert: { type: AlertType; message: string } | null = null;
	public alertDetails: string[] = [];
	public validatedTransfer: TransferReceipt | null = null;
	public hasCalculated = false;
	public isValidated = false;
	public isSessionOpen = false;
	public cashAlert = '';
	public destinations: CorridorDestinationResponse[] = [];
	public sourceCountry = '';
	public sourceCurrency = '';

	public readonly form = this._fb.group({
		senderFirstName: ['', Validators.required],
		senderLastName: ['', Validators.required],
		senderIdType: ['', [Validators.required, Validators.pattern(/^(CIN|Passeport)$/i)]],
		senderIdNumber: ['', Validators.required],
		senderPhone: ['', [Validators.required, Validators.pattern(this._phoneRegex)]],
		senderCountry: ['', Validators.required],
		receiverFirstName: ['', Validators.required],
		receiverLastName: ['', Validators.required],
		receiverPhone: ['', [Validators.required, Validators.pattern(this._phoneRegex)]],
		receiverCountry: ['', Validators.required],
		beneficiaryDocumentType: ['', [Validators.required, Validators.pattern(/^(CIN|Passeport)$/i)]],
		beneficiaryDocumentNumber: ['', Validators.required],
		sourceCurrency: ['', Validators.required],
		destinationCurrency: ['', Validators.required],
		amountSent: [null as number | null, [Validators.required, Validators.min(0.01)]],
		exchangeRate: [null as number | null, [Validators.required, Validators.min(0.0001)]],
		fees: [{ value: 0, disabled: false }],
		amountReceived: [{ value: 0, disabled: false }],
		paymentMethod: ['Espèces', Validators.required],
	});

	constructor() {
		this.form.valueChanges.subscribe(() => {
			if (this._suspendReset) {
				return;
			}
			this.hasCalculated = false;
			this.isValidated = false;
			this.validatedTransfer = null;
			this.alert = null;
			this.alertDetails = [];
		});
	}

	public ngOnInit(): void {
		this._cashSessionStore.ensureLoaded();
		this._cashSessionStore.isSessionOpen$
			.pipe(takeUntilDestroyed(this._destroyRef))
			.subscribe((isOpen) => {
				this.isSessionOpen = isOpen;
				this.cashAlert = isOpen ? '' : AGENT_CASH_SESSION_REQUIRED_MESSAGE;
				this._cdr.markForCheck();
			});
		this.loadFxContext();
		this.loadCorridorDestinations();
		this.form.get('receiverCountry')?.valueChanges
			.pipe(takeUntilDestroyed(this._destroyRef))
			.subscribe((value) => {
				this.onDestinationCountryChanged(value ?? '');
			});
	}

	public get canValidate(): boolean {
		return this.hasCalculated && !this.isValidated;
	}

	public get canPrint(): boolean {
		return this.isValidated && !!this.validatedTransfer;
	}

	public calculateFees(): void {
		if (!this.isSessionOpen) {
			this.setAlert('error', AGENT_CASH_SESSION_REQUIRED_MESSAGE);
			return;
		}
		this.clearAlert();
		this.form.markAllAsTouched();
		if (this.form.invalid) {
			this.setAlert('error', 'Impossible de calculer les frais.');
			return;
		}

		const amount = Number(this.form.get('amountSent')?.value ?? 0);
		const rate = Number(this.form.get('exchangeRate')?.value ?? 1);
		if (rate <= 0) {
			this.setAlert('error', 'Aucun taux de change actif pour ce corridor.');
			return;
		}
		const fee = Math.max(5, amount * 0.02);
		const received = Math.max(0, amount * rate);

		this._suspendReset = true;
		this.form.patchValue({
			fees: this.round(fee),
			amountReceived: this.round(received),
		});
		this._suspendReset = false;
		this.hasCalculated = true;
		this.isValidated = false;
		this.setAlert('info', 'Frais recalculés avec succès.');
	}

	private loadFxContext(): void {
		this._service.getFxContext().subscribe({
			next: (context) => {
				this.sourceCountry = context.sourceCountryName;
				this.sourceCurrency = context.sourceCurrencyCode;
				this._suspendReset = true;
				this.form.patchValue({
					senderCountry: context.sourceCountryName,
					sourceCurrency: context.sourceCurrencyCode,
				});
				this._suspendReset = false;
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.setAlert('error', error?.error?.message ?? "Impossible de charger le pays source.");
				this._cdr.markForCheck();
			},
		});
	}

	private loadCorridorDestinations(): void {
		this._service.getCorridorDestinations().subscribe({
			next: (destinations) => {
				this.destinations = destinations ?? [];
				if (!this.destinations.length) {
					this.setAlert('error', 'Aucun corridor actif pour cette agence.');
				}
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.setAlert('error', error?.error?.message ?? 'Impossible de charger les corridors.');
				this._cdr.markForCheck();
			},
		});
	}

	private onDestinationCountryChanged(countryName: string): void {
		this.clearAlert();
		const trimmed = countryName?.trim() ?? '';
		if (!trimmed) {
			this._suspendReset = true;
			this.form.patchValue({
				destinationCurrency: '',
				exchangeRate: null,
				amountReceived: 0,
			});
			this._suspendReset = false;
			return;
		}

		const destination = this.destinations.find((item) => item.countryName === trimmed);
		const destinationCurrency = destination?.currencyCode ?? '';
		this._suspendReset = true;
		this.form.patchValue({
			destinationCurrency,
			exchangeRate: null,
			amountReceived: 0,
		});
		this._suspendReset = false;

		if (!destinationCurrency || !this.sourceCurrency) {
			this.setAlert('error', 'Aucun taux de change actif pour ce corridor.');
			return;
		}

		this._service.getExchangeRate(this.sourceCurrency, destinationCurrency).subscribe({
			next: (rate) => {
				this._suspendReset = true;
				this.form.patchValue({
					exchangeRate: rate.rate,
				});
				this._suspendReset = false;
				this._cdr.markForCheck();
			},
			error: (error) => {
				this._suspendReset = true;
				this.form.patchValue({
					exchangeRate: null,
				});
				this._suspendReset = false;
				this.setAlert('error', error?.error?.message ?? 'Aucun taux de change actif pour ce corridor.');
				this._cdr.markForCheck();
			},
		});
	}

	public validateTransfer(): void {
		if (!this.isSessionOpen) {
			this.setAlert('error', AGENT_CASH_SESSION_REQUIRED_MESSAGE);
			return;
		}
		this.clearAlert();
		this.form.markAllAsTouched();
		if (!this.hasCalculated) {
			this.setAlert('error', 'Impossible de valider le transfert.');
			return;
		}
		if (this.form.invalid) {
			this.setAlert('error', 'Impossible de valider le transfert.');
			return;
		}

		const payload = {
			senderFirstName: this.form.get('senderFirstName')?.value ?? '',
			senderLastName: this.form.get('senderLastName')?.value ?? '',
			senderPhone: this.form.get('senderPhone')?.value ?? '',
			senderCountry: this.form.get('senderCountry')?.value ?? '',
			senderIdType: this.form.get('senderIdType')?.value ?? '',
			senderIdNumber: this.form.get('senderIdNumber')?.value ?? '',
			receiverFirstName: this.form.get('receiverFirstName')?.value ?? '',
			receiverLastName: this.form.get('receiverLastName')?.value ?? '',
			receiverPhone: this.form.get('receiverPhone')?.value ?? '',
			receiverCountry: this.form.get('receiverCountry')?.value ?? '',
			beneficiaryDocumentType: this.form.get('beneficiaryDocumentType')?.value ?? '',
			beneficiaryDocumentNumber: this.form.get('beneficiaryDocumentNumber')?.value ?? '',
			destinationCountry: this.form.get('receiverCountry')?.value ?? '',
			sourceCurrency: this.form.get('sourceCurrency')?.value ?? '',
			destinationCurrency: this.form.get('destinationCurrency')?.value ?? '',
			amountSent: Number(this.form.get('amountSent')?.value ?? 0),
			fees: Number(this.form.get('fees')?.value ?? 0),
			amountReceived: Number(this.form.get('amountReceived')?.value ?? 0),
			exchangeRate: Number(this.form.get('exchangeRate')?.value ?? 0),
		};

		this._service.createTransfer(payload).subscribe({
			next: (transfer) => {
				this.validatedTransfer = {
					reference: transfer.codeReference,
					withdrawalCode: transfer.codeRetrait,
					status: 'EN_ATTENTE',
					createdAt: transfer.creeLe,
					senderFullName: this.formatFullName('senderFirstName', 'senderLastName'),
					senderPhone: transfer.telephoneExpediteur,
					receiverFullName: this.formatFullName('receiverFirstName', 'receiverLastName'),
					receiverPhone: transfer.telephoneBeneficiaire,
					receiverDocumentType: transfer.beneficiaryDocumentType ?? this.form.get('beneficiaryDocumentType')?.value ?? '',
					receiverDocumentNumber: transfer.beneficiaryDocumentNumber ?? this.form.get('beneficiaryDocumentNumber')?.value ?? '',
					amountSent: transfer.montant,
					fees: transfer.montantFrais,
					amountReceived: transfer.montantNet,
					sourceCurrency: transfer.deviseSource ?? transfer.devise,
					destinationCurrency: transfer.deviseDestination ?? this.form.get('destinationCurrency')?.value ?? '',
					destinationCountry: transfer.paysDestination,
					paymentMethod: this.form.get('paymentMethod')?.value ?? '',
					agentName: this.agentName,
					agencyName: this.agencyName,
				};
				this.isValidated = true;
				this.hasCalculated = true;
				this.setAlert('success', 'Transfert validé avec succès.');
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.setAlert('error', error?.error?.message ?? 'Impossible de valider le transfert.');
				this._cdr.markForCheck();
			},
		});
	}

	public alertClass(type: AlertType): string {
		switch (type) {
			case 'success':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200';
			case 'info':
				return 'bg-amber-100 text-amber-800 border-amber-200';
			case 'error':
			default:
				return 'bg-rose-100 text-rose-800 border-rose-200';
		}
	}

	public showError(controlName: string): boolean {
		const control = this.form.get(controlName);
		return !!control && control.invalid && (control.dirty || control.touched);
	}

	public printReceipt(): void {
		if (!this.canPrint) {
			this.setAlert('error', 'Validez le transfert avant d\'imprimer le reçu.');
			return;
		}
		window.print();
	}

	public formatMoney(amount?: number, currency?: string): string {
		if (amount === undefined || !currency) {
			return '-';
		}
		if (currency === 'XOF') {
			const formatted = new Intl.NumberFormat('fr-FR').format(amount);
			return `${formatted} XOF`;
		}
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	private round(value: number): number {
		return Math.round(value * 100) / 100;
	}

	private setAlert(type: AlertType, message: string, details: string[] = []): void {
		this.alert = { type, message };
		this.alertDetails = details;
	}

	private clearAlert(): void {
		this.alert = null;
		this.alertDetails = [];
	}

	private formatFullName(firstNameKey: string, lastNameKey: string): string {
		const firstName = this.form.get(firstNameKey)?.value ?? '';
		const lastName = this.form.get(lastNameKey)?.value ?? '';
		return `${firstName} ${lastName}`.trim();
	}

	private formatDateTime(date: Date): string {
		return new Intl.DateTimeFormat('fr-FR', {
			dateStyle: 'medium',
			timeStyle: 'short',
		}).format(date);
	}
}
