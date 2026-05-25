import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { StatutTransfert, Transfert } from '../../agent/models/agent-dashboard.models';
import {
	AGENT_CASH_SESSION_REQUIRED_MESSAGE,
	AgentCashSessionStoreService,
} from '../../agent/services/agent-cash-session-store.service';

@Component({
	selector: 'okane-agent-payout-transfer-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<section class="rounded-xl border bg-background p-4 shadow-sm no-print">
			@if (cashAlert) {
				<div class="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
					{{ cashAlert }}
				</div>
			}
			<h2 class="text-base font-semibold">Rechercher un transfert</h2>
			<form class="mt-4 grid gap-3 md:grid-cols-3" [formGroup]="searchForm">
				<label class="text-sm">
					<span class="text-muted-foreground">Code de retrait</span>
					<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="referenceCode" />
				</label>
				<label class="text-sm">
					<span class="text-muted-foreground">Telephone beneficiaire</span>
					<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverPhone" />
				</label>
				<div class="flex items-end">
					<button
						class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
						type="button"
						(click)="lookupTransfer()"
						[disabled]="!isSessionOpen"
					>
						Rechercher
					</button>
				</div>
			</form>
			@if (lookupMessage) {
				<p class="mt-2 text-sm text-muted-foreground">{{ lookupMessage }}</p>
			}
		</section>

		@if (selectedTransfer) {
			<section class="rounded-xl border bg-background p-4 shadow-sm no-print">
				<h2 class="text-base font-semibold">Details du transfert</h2>
				<div class="mt-4 grid gap-3 md:grid-cols-2">
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Reference</p>
						<p class="text-sm font-semibold">{{ selectedTransfer.codeReference }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Code retrait</p>
						<p class="text-sm font-semibold">{{ selectedTransfer.codeRetrait }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Statut</p>
						<p class="text-sm font-semibold">{{ formatStatut(selectedTransfer.statut) }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Pays destination</p>
						<p class="text-sm font-semibold">{{ selectedTransfer.paysDestination }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Expediteur</p>
						<p class="text-sm font-semibold">{{ selectedTransfer.nomExpediteur }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Beneficiaire</p>
						<p class="text-sm font-semibold">{{ selectedTransfer.nomBeneficiaire }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Montant</p>
						<p class="text-sm font-semibold">{{ formatMoney(selectedTransfer.montant, selectedTransfer.devise) }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Frais</p>
						<p class="text-sm font-semibold">{{ formatMoney(selectedTransfer.montantFrais, selectedTransfer.devise) }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Montant net recu</p>
						<p class="text-sm font-semibold">{{ formatMoney(selectedTransfer.montantNet, selectedTransfer.deviseDestination ?? selectedTransfer.devise) }}</p>
					</div>
					<div class="rounded-lg border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Date creation transfert</p>
						<p class="text-sm font-semibold">{{ formatDateTime(selectedTransfer.creeLe) }}</p>
					</div>
				</div>
			</section>

			<section class="rounded-xl border bg-background p-4 shadow-sm no-print">
				<h2 class="text-base font-semibold">Confirmer le paiement</h2>
				<form class="mt-4 grid gap-3 md:grid-cols-2" [formGroup]="payoutForm">
					<label class="text-sm">
						<span class="text-muted-foreground">Type de piece</span>
						<select class="mt-1 w-full rounded-md border px-3 py-2" formControlName="beneficiaryDocumentType">
							<option value="">Selectionner</option>
							<option value="CIN">CIN</option>
							<option value="Passeport">Passeport</option>
						</select>
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Numero de piece</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="beneficiaryDocumentNumber" />
					</label>
					<div class="flex items-end gap-3">
						<button
							class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
							type="button"
							(click)="confirmPayout()"
							[disabled]="!canPayout || !isSessionOpen"
						>
							Confirmer le paiement
						</button>
						<button
							class="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-50"
							type="button"
							(click)="printPayoutReceipt()"
							[disabled]="!canPrintReceipt || !isSessionOpen"
						>
							Imprimer le recu
						</button>
					</div>
				</form>
				@if (payoutAlert) {
					<div class="mt-3 rounded-md border px-3 py-2 text-sm" [class]="alertClass(payoutAlert.type)">
						<p class="font-semibold">{{ payoutAlert.message }}</p>
					</div>
				}
			</section>
		}

		<div class="print-receipt">
			<h1 class="text-lg font-semibold">Recu de retrait</h1>
			<div class="mt-4 grid gap-2 text-sm">
				<div><span class="text-muted-foreground">Reference :</span> {{ selectedTransfer?.codeReference }}</div>
				<div><span class="text-muted-foreground">Code retrait :</span> {{ selectedTransfer?.codeRetrait }}</div>
				<div><span class="text-muted-foreground">Expediteur :</span> {{ selectedTransfer?.nomExpediteur }}</div>
				<div><span class="text-muted-foreground">Beneficiaire :</span> {{ selectedTransfer?.nomBeneficiaire }}</div>
				<div><span class="text-muted-foreground">Numero piece beneficiaire :</span> {{ payoutReceipt?.receiverIdLabel }}</div>
				<div><span class="text-muted-foreground">Montant paye :</span> {{ formatMoney(selectedTransfer?.montantNet ?? 0, selectedTransfer?.deviseDestination ?? selectedTransfer?.devise ?? '') }}</div>
				<div><span class="text-muted-foreground">Devise :</span> {{ selectedTransfer?.deviseDestination ?? selectedTransfer?.devise }}</div>
				<div><span class="text-muted-foreground">Pays destination :</span> {{ selectedTransfer?.paysDestination }}</div>
				<div><span class="text-muted-foreground">Date / heure paiement :</span> {{ payoutReceipt?.paidAt }}</div>
				<div><span class="text-muted-foreground">Agent :</span> {{ payoutReceipt?.paidBy }}</div>
				<div><span class="text-muted-foreground">Nom agence :</span> {{ payoutReceipt?.agencyName }}</div>
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
export class AgentPayoutTransferPageComponent implements OnInit {
	private readonly _fb = inject(FormBuilder);
	private readonly _service = inject(AgentDashboardService);
	private readonly _cdr = inject(ChangeDetectorRef);
	private readonly _cashSessionStore = inject(AgentCashSessionStoreService);
	private readonly _destroyRef = inject(DestroyRef);

	public lookupMessage = '';
	public payoutAlert: { type: 'success' | 'error'; message: string } | null = null;
	public selectedTransfer: Transfert | null = null;
	public payoutReceipt: { paidAt: string; paidBy: string; agencyName: string; receiverIdLabel: string } | null = null;
	public isSessionOpen = false;
	public cashAlert = '';

	public readonly searchForm = this._fb.group({
		referenceCode: '',
		receiverPhone: '',
	});

	public readonly payoutForm = this._fb.group({
		beneficiaryDocumentType: ['', Validators.required],
		beneficiaryDocumentNumber: ['', Validators.required],
	});

	public ngOnInit(): void {
		this._cashSessionStore.ensureLoaded();
		this._cashSessionStore.isSessionOpen$
			.pipe(takeUntilDestroyed(this._destroyRef))
			.subscribe((isOpen) => {
				this.isSessionOpen = isOpen;
				this.cashAlert = isOpen ? '' : AGENT_CASH_SESSION_REQUIRED_MESSAGE;
				this._cdr.markForCheck();
			});
	}

	public get canPayout(): boolean {
		return this.isPendingStatus(this.selectedTransfer?.statut);
	}

	public get canPrintReceipt(): boolean {
		return !!this.payoutReceipt && this.isPaidStatus(this.selectedTransfer?.statut);
	}

	public lookupTransfer(): void {
		const referenceCode = this.searchForm.get('referenceCode')?.value ?? '';
		const receiverPhone = this.searchForm.get('receiverPhone')?.value ?? '';
		if (!this.isSessionOpen) {
			this.lookupMessage = AGENT_CASH_SESSION_REQUIRED_MESSAGE;
			return;
		}
		if (!referenceCode.trim() && !receiverPhone.trim()) {
			this.lookupMessage = 'Entrez un code de retrait ou un telephone.';
			return;
		}
		this.lookupMessage = 'Recherche en cours...';
		this._service.searchTransfer(referenceCode.trim() || undefined, receiverPhone.trim() || undefined).subscribe({
			next: (transfer) => {
				this.selectedTransfer = transfer;
				this.lookupMessage = 'Transfert trouve.';
				this.payoutAlert = null;
				this.payoutReceipt = null;
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.selectedTransfer = null;
				this.lookupMessage = error?.error?.message ?? 'Aucun transfert trouve.';
				this.payoutAlert = null;
				this.payoutReceipt = null;
				this._cdr.markForCheck();
			},
		});
	}

	public confirmPayout(): void {
		if (!this.selectedTransfer || !this.canPayout) {
			this.payoutAlert = {
				type: 'error',
				message: 'Paiement impossible. Le transfert n est pas en attente.',
			};
			return;
		}
		if (!this.isSessionOpen) {
			this.payoutAlert = { type: 'error', message: AGENT_CASH_SESSION_REQUIRED_MESSAGE };
			return;
		}
		this.payoutForm.markAllAsTouched();
		if (this.payoutForm.invalid) {
			this.payoutAlert = {
				type: 'error',
				message: 'Paiement impossible. Les informations du beneficiaire sont requises.',
			};
			return;
		}

		const payload = {
			transferId: this.selectedTransfer.id,
			reference: this.selectedTransfer.codeReference,
			codeRetrait: this.selectedTransfer.codeRetrait,
			withdrawCode: this.selectedTransfer.codeRetrait,
			beneficiaryDocumentType: this.payoutForm.get('beneficiaryDocumentType')?.value ?? '',
			beneficiaryDocumentNumber: this.payoutForm.get('beneficiaryDocumentNumber')?.value ?? '',
		};
		this._service.payTransfer(this.selectedTransfer.id, payload).subscribe({
			next: (response) => {
				this.selectedTransfer = response.transfer;
				this.payoutReceipt = response.receipt;
				this.payoutAlert = {
					type: 'success',
					message: 'Paiement confirme avec succes.',
				};
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.payoutAlert = {
					type: 'error',
					message: this.extractPayoutErrorMessage(error),
				};
				this._cdr.markForCheck();
			},
		});
	}

	public printPayoutReceipt(): void {
		if (!this.payoutReceipt || !this.isPaidStatus(this.selectedTransfer?.statut)) {
			this.payoutAlert = {
				type: 'error',
				message: 'Le recu est disponible apres confirmation du paiement.',
			};
			return;
		}
		window.print();
	}

	public formatMoney(amount: number, currency: string): string {
		if (!currency) {
			return '-';
		}
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatDateTime(dateIso: string): string {
		return new Intl.DateTimeFormat('fr-FR', {
			dateStyle: 'medium',
			timeStyle: 'short',
		}).format(new Date(dateIso));
	}

	public formatStatut(status: StatutTransfert): string {
		if (this.isPendingStatus(status)) {
			return 'EN_ATTENTE';
		}
		if (this.isPaidStatus(status)) {
			return 'PAYE';
		}
		if (status === 'CANCELLED' || status === 'ANNULE') {
			return 'ANNULE';
		}
		if (status === 'EXPIRED' || status === 'EXPIRE') {
			return 'EXPIRE';
		}
		return status;
	}

	public alertClass(type: 'success' | 'error'): string {
		return type === 'success'
			? 'bg-emerald-100 text-emerald-800 border-emerald-200'
			: 'bg-rose-100 text-rose-800 border-rose-200';
	}

	private extractPayoutErrorMessage(error: unknown): string {
		const apiMessage = this.readApiMessage(error);
		if (apiMessage && apiMessage !== 'Unexpected error') {
			return apiMessage;
		}
		return 'Erreur serveur lors du paiement.';
	}

	private readApiMessage(error: unknown): string | null {
		if (!error || typeof error !== 'object') {
			return null;
		}
		const response = error as { error?: unknown; message?: unknown };
		if (typeof response.error === 'string') {
			return response.error;
		}
		if (response.error && typeof response.error === 'object') {
			const body = response.error as { message?: unknown; error?: unknown };
			if (typeof body.message === 'string') {
				return body.message;
			}
			if (typeof body.error === 'string') {
				return body.error;
			}
		}
		return typeof response.message === 'string' ? response.message : null;
	}

	private isPendingStatus(status?: StatutTransfert): boolean {
		return status === 'PENDING' || status === 'EN_ATTENTE';
	}

	private isPaidStatus(status?: StatutTransfert): boolean {
		return status === 'PAID' || status === 'PAYE' || status === 'PAYÉ';
	}
}
