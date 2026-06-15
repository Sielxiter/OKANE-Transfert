import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { Transfert } from '../../agent/models/agent-dashboard.models';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentStatusBadgeComponent } from '../../agent/ui/agent-status-badge.component';

@Component({
	selector: 'okane-agent-payout-transfer-page',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		HlmButtonImports,
		HlmInputImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentStatusBadgeComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Paiement d'un transfert">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Paiement d'un transfert"
					subtitle="Recherche locale du transfert puis confirmation du paiement."
				/>

				<okane-agent-section-card title="Rechercher un transfert">
					<form class="grid gap-3 md:gap-4 md:grid-cols-3" [formGroup]="searchForm">
						<label class="text-sm">
							<span class="text-muted-foreground">Code de retrait</span>
							<input hlmInput class="mt-1 w-full" formControlName="referenceCode" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Telephone beneficiaire</span>
							<input hlmInput class="mt-1 w-full" formControlName="receiverPhone" />
						</label>
						<div class="flex items-end">
							<button hlmBtn type="button" (click)="lookupTransfer()">Rechercher</button>
						</div>
					</form>
					@if (lookupMessage) {
						<p class="mt-2 text-sm text-muted-foreground">{{ lookupMessage }}</p>
					}
				</okane-agent-section-card>

				@if (selectedTransfer) {
					<okane-agent-section-card title="Details du transfert">
						<div class="grid gap-3 md:gap-4 md:grid-cols-2">
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Reference</p>
								<p class="text-sm font-semibold text-foreground">{{ selectedTransfer.codeReference }}</p>
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Statut</p>
								<okane-agent-status-badge kind="transfer" [status]="selectedTransfer.statut" />
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Expediteur</p>
								<p class="text-sm font-semibold text-foreground">{{ selectedTransfer.nomExpediteur }}</p>
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Beneficiaire</p>
								<p class="text-sm font-semibold text-foreground">{{ selectedTransfer.nomBeneficiaire }}</p>
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Montant</p>
								<p class="text-sm font-semibold text-foreground">
									{{ formatMoney(selectedTransfer.montant, selectedTransfer.devise) }}
								</p>
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<p class="text-xs text-muted-foreground">Frais</p>
								<p class="text-sm font-semibold text-foreground">
									{{ formatMoney(selectedTransfer.montantFrais, selectedTransfer.devise) }}
								</p>
							</div>
						</div>
					</okane-agent-section-card>

					<okane-agent-section-card title="Confirmer le paiement">
						<form class="grid gap-3 md:gap-4 md:grid-cols-2" [formGroup]="payoutForm">
							<label class="text-sm">
								<span class="text-muted-foreground">Numero de piece beneficiaire</span>
								<input hlmInput class="mt-1 w-full" formControlName="receiverId" />
							</label>
							<div class="flex items-end gap-2">
								<button hlmBtn type="button" (click)="confirmPayout()" [disabled]="!canPayout">
									Confirmer le paiement
								</button>
								<button hlmBtn variant="outline" type="button" (click)="printPayoutReceipt()">
									Imprimer le recu
								</button>
							</div>
						</form>
						@if (payoutMessage) {
							<p class="mt-3 text-sm text-muted-foreground">{{ payoutMessage }}</p>
						}
						@if (!canPayout) {
							<p class="mt-2 text-xs text-destructive">Paiement bloque. Le statut doit etre EN_ATTENTE.</p>
						}
					</okane-agent-section-card>
				}
			</div>
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
				this.lookupMessage = transfer ? 'Transfert trouve.' : 'Aucun transfert pour ce code.';
			});
			return;
		}

		if (receiverPhone.trim()) {
			this._service.findTransferByReceiverPhone(receiverPhone).subscribe((transfer) => {
				this.selectedTransfer = transfer ?? null;
				this.lookupMessage = transfer ? 'Transfert trouve.' : 'Aucun transfert pour ce telephone.';
			});
			return;
		}

		this.lookupMessage = 'Entrez un code de retrait ou un telephone.';
	}

	public confirmPayout(): void {
		if (!this.selectedTransfer || !this.canPayout) {
			this.payoutMessage = 'Paiement bloque.';
			return;
		}

		this._service.updateTransferStatus(this.selectedTransfer.id, 'PAID').subscribe((transfer) => {
			this.selectedTransfer = transfer ?? this.selectedTransfer;
			this.payoutMessage = 'Paiement confirme localement.';
		});
	}

	public printPayoutReceipt(): void {
		this.payoutMessage = 'Recu prepare pour impression.';
	}

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}
}
