import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { StatutTransfert, Transfert } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-payout-transfer-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Paiement d'un transfert">
			<section class="rounded-xl border bg-background p-4 shadow-sm">
				<h2 class="text-base font-semibold">Rechercher un transfert</h2>
				<form class="mt-4 grid gap-3 md:grid-cols-3" [formGroup]="searchForm">
					<label class="text-sm">
						<span class="text-muted-foreground">Code de retrait</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="referenceCode" />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Téléphone bénéficiaire</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverPhone" />
					</label>
					<div class="flex items-end">
						<button class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="button" (click)="lookupTransfer()">
							Rechercher
						</button>
					</div>
				</form>
				@if (lookupMessage) {
					<p class="mt-2 text-sm text-muted-foreground">{{ lookupMessage }}</p>
				}
			</section>

			@if (selectedTransfer) {
				<section class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Détails du transfert</h2>
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						<div class="rounded-lg border bg-muted/40 p-3">
							<p class="text-xs text-muted-foreground">Référence</p>
							<p class="text-sm font-semibold">{{ selectedTransfer.codeReference }}</p>
						</div>
						<div class="rounded-lg border bg-muted/40 p-3">
							<p class="text-xs text-muted-foreground">Statut</p>
							<p class="text-sm font-semibold">{{ formatStatut(selectedTransfer.statut) }}</p>
						</div>
						<div class="rounded-lg border bg-muted/40 p-3">
							<p class="text-xs text-muted-foreground">Expéditeur</p>
							<p class="text-sm font-semibold">{{ selectedTransfer.nomExpediteur }}</p>
						</div>
						<div class="rounded-lg border bg-muted/40 p-3">
							<p class="text-xs text-muted-foreground">Bénéficiaire</p>
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
					</div>
				</section>

				<section class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Confirmer le paiement</h2>
					<form class="mt-4 grid gap-3 md:grid-cols-2" [formGroup]="payoutForm">
						<label class="text-sm">
							<span class="text-muted-foreground">Numéro de pièce bénéficiaire</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverId" />
						</label>
						<div class="flex items-end gap-3">
							<button
								class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
								type="button"
								(click)="confirmPayout()"
								[disabled]="!canPayout"
							>
								Confirmer le paiement
							</button>
							<button class="rounded-md border px-4 py-2 text-sm font-semibold" type="button" (click)="printPayoutReceipt()">
								Imprimer le reçu
							</button>
						</div>
					</form>
					@if (payoutMessage) {
						<p class="mt-3 text-sm text-muted-foreground">{{ payoutMessage }}</p>
					}
					@if (!canPayout) {
						<p class="mt-2 text-xs text-rose-600">Paiement bloqué. Le statut doit être EN_ATTENTE.</p>
					}
				</section>
			}
		</okane-agent-layout>
	`,
})
export class AgentPayoutTransferPageComponent {
	private readonly _fb = inject(FormBuilder);
	private readonly _service = inject(AgentDashboardService);

	public lookupMessage = '';
	public payoutMessage = '';
	public selectedTransfer: Transfert | null = null;

	public readonly searchForm = this._fb.group({
		referenceCode: 'OK-903421',
		receiverPhone: '',
	});

	public readonly payoutForm = this._fb.group({
		receiverId: 'BK778899',
	});

	public get canPayout(): boolean {
		return this.selectedTransfer?.statut === 'PENDING';
	}

	public lookupTransfer(): void {
		const referenceCode = this.searchForm.get('referenceCode')?.value ?? '';
		const receiverPhone = this.searchForm.get('receiverPhone')?.value ?? '';

		if (referenceCode.trim()) {
			this._service.findTransferByReference(referenceCode).subscribe((transfer) => {
				this.selectedTransfer = transfer ?? null;
				this.lookupMessage = transfer ? 'Transfert trouvé.' : 'Aucun transfert pour ce code.';
			});
			return;
		}

		if (receiverPhone.trim()) {
			this._service.findTransferByReceiverPhone(receiverPhone).subscribe((transfer) => {
				this.selectedTransfer = transfer ?? null;
				this.lookupMessage = transfer ? 'Transfert trouvé.' : 'Aucun transfert pour ce téléphone.';
			});
			return;
		}

		this.lookupMessage = 'Entrez un code de retrait ou un téléphone.';
	}

	public confirmPayout(): void {
		if (!this.selectedTransfer || !this.canPayout) {
			this.payoutMessage = 'Paiement bloqué.';
			return;
		}

		this._service.updateTransferStatus(this.selectedTransfer.id, 'PAID').subscribe((transfer) => {
			this.selectedTransfer = transfer ?? this.selectedTransfer;
			this.payoutMessage = 'Paiement confirmé localement.';
		});
	}

	public printPayoutReceipt(): void {
		this.payoutMessage = 'Reçu préparé pour impression.';
	}

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatStatut(status: StatutTransfert): string {
		switch (status) {
			case 'PENDING':
				return 'EN_ATTENTE';
			case 'PAID':
				return 'PAYÉ';
			case 'CANCELLED':
				return 'ANNULÉ';
			case 'EXPIRED':
			default:
				return 'EXPIRÉ';
		}
	}
}
