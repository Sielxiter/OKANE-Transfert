import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { Client } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-customers-page',
	standalone: true,
	imports: [CommonModule, FormsModule, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Clients">
			<section class="rounded-xl border bg-background p-4 shadow-sm">
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<h2 class="text-base font-semibold">Liste des clients</h2>
					<div class="flex flex-1 gap-2 md:max-w-md">
						<input class="w-full rounded-md border px-3 py-2 text-sm" placeholder="Rechercher un client" [(ngModel)]="search" />
						<button class="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" type="button">
							Créer un client
						</button>
					</div>
				</div>
				<div class="mt-4 grid gap-3 lg:grid-cols-3">
					<div class="lg:col-span-2">
						<div class="divide-y rounded-lg border">
							@for (customer of filteredCustomers; track customer.id) {
								<button class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50" type="button" (click)="selectCustomer(customer)">
									<div>
										<p class="text-sm font-semibold">{{ customer.prenom }} {{ customer.nom }}</p>
										<p class="text-xs text-muted-foreground">{{ customer.telephone }} | {{ customer.pays }}</p>
									</div>
									<span class="text-xs text-muted-foreground">{{ formatStatutKyc(customer.statutKyc) }}</span>
								</button>
							}
						</div>
					</div>
					<div class="rounded-lg border bg-muted/30 p-4">
						@if (selectedCustomer) {
							<h3 class="text-sm font-semibold">Détails du client</h3>
							<p class="mt-2 text-sm">{{ selectedCustomer.prenom }} {{ selectedCustomer.nom }}</p>
							<p class="text-xs text-muted-foreground">{{ selectedCustomer.telephone }}</p>
							<p class="mt-2 text-xs text-muted-foreground">KYC : {{ formatStatutKyc(selectedCustomer.statutKyc) }}</p>
							<p class="mt-2 text-xs text-muted-foreground">Créé le : {{ formatDate(selectedCustomer.creeLe) }}</p>
							<div class="mt-3 flex gap-2">
								<button class="rounded-md border px-3 py-2 text-xs font-semibold" type="button">Voir détails</button>
								<button class="rounded-md border px-3 py-2 text-xs font-semibold" type="button">Historique</button>
							</div>
						} @else {
							<p class="text-sm text-muted-foreground">Sélectionnez un client pour voir ses détails.</p>
						}
					</div>
				</div>
			</section>
		</okane-agent-layout>
	`,
})
export class AgentCustomersPageComponent {
	private readonly _service = inject(AgentDashboardService);

	public customers: Client[] = [];
	public search = '';
	public selectedCustomer: Client | null = null;

	constructor() {
		this._service.getCustomers().subscribe((customers) => (this.customers = customers));
	}

	public get filteredCustomers(): Client[] {
		const searchValue = this.search.toLowerCase();
		return this.customers.filter((customer) =>
			`${customer.prenom} ${customer.nom}`.toLowerCase().includes(searchValue)
		);
	}

	public selectCustomer(customer: Client): void {
		this.selectedCustomer = customer;
	}

	public formatStatutKyc(status: Client['statutKyc']): string {
		switch (status) {
			case 'APPROVED':
				return 'VALIDÉ';
			case 'REJECTED':
				return 'REJETÉ';
			case 'PENDING':
			default:
				return 'EN_ATTENTE';
		}
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}
}
