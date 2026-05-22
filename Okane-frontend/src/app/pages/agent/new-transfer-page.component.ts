import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';

@Component({
	selector: 'okane-agent-new-transfer-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Nouvel envoi">
			<form class="grid gap-4" [formGroup]="form">
				<section class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Informations de l'expéditeur</h2>
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						<label class="text-sm">
							<span class="text-muted-foreground">Prénom</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderFirstName" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Nom</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderLastName" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">CIN / Passeport</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderId" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Téléphone</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderPhone" />
						</label>
						<label class="text-sm md:col-span-2">
							<span class="text-muted-foreground">Pays</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="senderCountry" />
						</label>
					</div>
				</section>

				<section class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Informations du bénéficiaire</h2>
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						<label class="text-sm">
							<span class="text-muted-foreground">Prénom</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverFirstName" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Nom</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverLastName" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Téléphone</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverPhone" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Pays de réception</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="receiverCountry" />
						</label>
					</div>
				</section>

				<section class="rounded-xl border bg-background p-4 shadow-sm">
					<h2 class="text-base font-semibold">Informations du transfert</h2>
					<div class="mt-4 grid gap-3 md:grid-cols-3">
						<label class="text-sm">
							<span class="text-muted-foreground">Devise source</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="sourceCurrency" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Devise de destination</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="destinationCurrency" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Mode de paiement</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" formControlName="paymentMethod" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Montant envoyé</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="amountSent" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Taux de change</span>
							<input class="mt-1 w-full rounded-md border px-3 py-2" type="number" formControlName="exchangeRate" />
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
						<button class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="button" (click)="calculateFees()">
							Calculer les frais
						</button>
						<button class="rounded-md border px-4 py-2 text-sm font-semibold" type="button" (click)="validateTransfer()">
							Valider l'envoi
						</button>
						<button class="rounded-md border px-4 py-2 text-sm font-semibold" type="button" (click)="printReceipt()">
							Imprimer le reçu
						</button>
					</div>
					@if (statusMessage) {
						<p class="mt-3 text-sm text-muted-foreground">{{ statusMessage }}</p>
					}
				</section>
			</form>
		</okane-agent-layout>
	`,
})
export class AgentNewTransferPageComponent {
	private readonly _fb = inject(FormBuilder);

	public statusMessage = '';

	public readonly form = this._fb.group({
		senderFirstName: 'Amina',
		senderLastName: 'El Idrissi',
		senderId: 'BK778899',
		senderPhone: '+212612345678',
		senderCountry: 'Maroc',
		receiverFirstName: 'Mamadou',
		receiverLastName: 'Diallo',
		receiverPhone: '+221771234567',
		receiverCountry: 'Sénégal',
		sourceCurrency: 'MAD',
		destinationCurrency: 'XOF',
		amountSent: 1000,
		exchangeRate: 65,
		fees: 0,
		amountReceived: 0,
		paymentMethod: 'Espèces',
	});

	public calculateFees(): void {
		const amount = Number(this.form.get('amountSent')?.value ?? 0);
		const rate = Number(this.form.get('exchangeRate')?.value ?? 1);
		const fee = Math.max(5, amount * 0.02);
		const received = Math.max(0, (amount - fee) * rate);

		this.form.patchValue({
			fees: this.round(fee),
			amountReceived: this.round(received),
		});
		this.statusMessage = 'Frais recalculés localement.';
	}

	public validateTransfer(): void {
		this.statusMessage = 'Envoi validé localement. Prêt pour envoi API.';
	}

	public printReceipt(): void {
		this.statusMessage = 'Reçu préparé pour impression.';
	}

	private round(value: number): number {
		return Math.round(value * 100) / 100;
	}
}
