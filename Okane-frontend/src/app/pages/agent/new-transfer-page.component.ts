import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { SenderSearchComponent } from './components/sender-search.component';
import { AddSenderModalComponent } from './components/add-sender-modal.component';
import type { ClientSearchResult } from './services/kyc-client.api';

@Component({
	selector: 'okane-agent-new-transfer-page',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		HlmButtonImports,
		HlmInputImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		SenderSearchComponent,
		AddSenderModalComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Nouvel envoi">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Nouvel envoi"
					subtitle="Saisie locale du transfert. Les validations metier API seront branchees plus tard."
				/>

				<form class="grid gap-4 md:gap-6" [formGroup]="form">
					<okane-agent-section-card title="Informations de l'expéditeur">
						<okane-sender-search
							(senderSelected)="onSenderSelected($event)"
							(senderCleared)="onSenderCleared()"
							(addSender)="addSenderOpen.set(true)"
							(verifyKyc)="onVerifyKyc($event)"
						/>
					</okane-agent-section-card>

					<okane-agent-section-card title="Informations du beneficiaire">
						<div class="grid gap-3 md:gap-4 md:grid-cols-2">
							<label class="text-sm">
								<span class="text-muted-foreground">Prenom</span>
								<input hlmInput class="mt-1 w-full" formControlName="receiverFirstName" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Nom</span>
								<input hlmInput class="mt-1 w-full" formControlName="receiverLastName" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Telephone</span>
								<input hlmInput class="mt-1 w-full" formControlName="receiverPhone" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Pays de reception</span>
								<input hlmInput class="mt-1 w-full" formControlName="receiverCountry" />
							</label>
						</div>
					</okane-agent-section-card>

					<okane-agent-section-card title="Informations du transfert">
						<div class="grid gap-3 md:gap-4 md:grid-cols-3">
							<label class="text-sm">
								<span class="text-muted-foreground">Devise source</span>
								<input hlmInput class="mt-1 w-full" formControlName="sourceCurrency" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Devise destination</span>
								<input hlmInput class="mt-1 w-full" formControlName="destinationCurrency" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Mode de paiement</span>
								<input hlmInput class="mt-1 w-full" formControlName="paymentMethod" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Montant envoye</span>
								<input hlmInput class="mt-1 w-full" type="number" formControlName="amountSent" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Taux de change</span>
								<input hlmInput class="mt-1 w-full" type="number" formControlName="exchangeRate" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Frais</span>
								<input hlmInput class="mt-1 w-full" type="number" formControlName="fees" readonly />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Montant net recu</span>
								<input hlmInput class="mt-1 w-full" type="number" formControlName="amountReceived" readonly />
							</label>
						</div>

						<div class="mt-4 flex flex-wrap gap-2">
							<button hlmBtn type="button" (click)="calculateFees()">Calculer les frais</button>
							<button hlmBtn variant="outline" type="button" (click)="validateTransfer()">Valider l'envoi</button>
							<button hlmBtn variant="outline" type="button" (click)="printReceipt()">Imprimer le recu</button>
						</div>
						@if (statusMessage) {
							<p class="mt-3 text-sm text-muted-foreground">{{ statusMessage }}</p>
						}
					</okane-agent-section-card>
				</form>
			</div>

			<okane-add-sender-modal
				[open]="addSenderOpen()"
				[existingClientId]="verifyingClientId()"
				(closed)="onModalClosed()"
				(created)="onSenderCreated($event)"
			/>
		</okane-agent-layout>
	`,
})
export class AgentNewTransferPageComponent {
	private readonly _fb = inject(FormBuilder);

	public statusMessage = '';
	protected readonly addSenderOpen = signal<boolean>(false);
	protected readonly selectedSender = signal<ClientSearchResult | null>(null);
	protected readonly verifyingClientId = signal<number | null>(null);

	@ViewChild(SenderSearchComponent) senderSearch!: SenderSearchComponent;

	public readonly form = this._fb.group({
		senderFirstName: '',
		senderLastName: '',
		senderId: '',
		senderPhone: '',
		senderCountry: '',
		receiverFirstName: 'Mamadou',
		receiverLastName: 'Diallo',
		receiverPhone: '+221771234567',
		receiverCountry: 'Senegal',
		sourceCurrency: 'MAD',
		destinationCurrency: 'XOF',
		amountSent: 1000,
		exchangeRate: 65,
		fees: 0,
		amountReceived: 0,
		paymentMethod: 'Especes',
	});

	protected onSenderSelected(client: ClientSearchResult): void {
		this.selectedSender.set(client);
		const [first, ...rest] = (client.fullName ?? '').split(' ');
		this.form.patchValue({
			senderFirstName: first ?? '',
			senderLastName: rest.join(' ') ?? '',
			senderId: client.identityNumber ?? '',
			senderPhone: client.phone ?? '',
			senderCountry: client.country ?? '',
		});
		this.statusMessage = '';
	}

	protected onSenderCleared(): void {
		this.selectedSender.set(null);
		this.form.patchValue({
			senderFirstName: '',
			senderLastName: '',
			senderId: '',
			senderPhone: '',
			senderCountry: '',
		});
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

	protected onVerifyKyc(_client: ClientSearchResult): void {
		// Open the add sender modal in KYC verification mode for existing client
		this.verifyingClientId.set(_client.id);
		this.addSenderOpen.set(true);
	}

	public calculateFees(): void {
		const amount = Number(this.form.get('amountSent')?.value ?? 0);
		const rate = Number(this.form.get('exchangeRate')?.value ?? 1);
		const fee = Math.max(5, amount * 0.02);
		const received = Math.max(0, (amount - fee) * rate);

		this.form.patchValue({
			fees: this.round(fee),
			amountReceived: this.round(received),
		});
		this.statusMessage = 'Frais recalcules localement.';
	}

	public validateTransfer(): void {
		this.statusMessage = "Envoi valide localement. Pret pour envoi API.";
	}

	public printReceipt(): void {
		this.statusMessage = 'Recu prepare pour impression.';
	}

	private round(value: number): number {
		return Math.round(value * 100) / 100;
	}
}

