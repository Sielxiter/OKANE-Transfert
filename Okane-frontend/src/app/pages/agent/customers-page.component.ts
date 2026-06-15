import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { Client } from '../../agent/models/agent-dashboard.models';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { AgentEmptyStateComponent } from '../../agent/ui/agent-empty-state.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentStatusBadgeComponent } from '../../agent/ui/agent-status-badge.component';

@Component({
	selector: 'okane-agent-customers-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		HlmButtonImports,
		HlmInputImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentStatusBadgeComponent,
		AgentEmptyStateComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Clients">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Clients"
					subtitle="Recherche et consultation rapide des clients rattaches a l'agent."
				>
					<button hlmBtn size="sm" type="button" agentIntroActions>Ajouter client</button>
				</okane-agent-page-intro>

				<okane-agent-section-card title="Liste des clients">
					<div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
						<input
							hlmInput
							class="w-full md:max-w-md"
							placeholder="Rechercher un client"
							[(ngModel)]="search"
						/>
					</div>

					<div class="grid gap-4 md:gap-6 lg:grid-cols-3">
						<div class="lg:col-span-2">
							<div class="divide-y rounded-xl border border-border bg-background/70">
								@for (customer of filteredCustomers; track customer.id) {
									<button
										class="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-accent/10"
										type="button"
										(click)="selectCustomer(customer)"
									>
										<div>
											<p class="text-sm font-semibold text-foreground">{{ customer.prenom }} {{ customer.nom }}</p>
											<p class="text-xs text-muted-foreground">{{ customer.telephone }} | {{ customer.pays }}</p>
										</div>
										<okane-agent-status-badge kind="kyc" [status]="customer.statutKyc" />
									</button>
								}
								@if (filteredCustomers.length === 0) {
									<div class="p-4">
										<okane-agent-empty-state
											title="Aucun client trouve"
											description="Essayez un autre terme de recherche."
										/>
									</div>
								}
							</div>
						</div>

						<div class="rounded-xl border border-border bg-muted/30 p-4">
							@if (selectedCustomer) {
								<h3 class="text-sm font-semibold text-foreground">Details client</h3>
								<p class="mt-2 text-sm font-medium text-foreground">
									{{ selectedCustomer.prenom }} {{ selectedCustomer.nom }}
								</p>
								<p class="text-xs text-muted-foreground">{{ selectedCustomer.telephone }}</p>
								<div class="mt-3">
									<okane-agent-status-badge kind="kyc" [status]="selectedCustomer.statutKyc" />
								</div>
								<p class="mt-3 text-xs text-muted-foreground">Cree le : {{ formatDate(selectedCustomer.creeLe) }}</p>
								<div class="mt-4 flex gap-2">
									<button hlmBtn variant="outline" size="sm" type="button">Voir details</button>
									<button hlmBtn variant="outline" size="sm" type="button">Historique</button>
								</div>
							} @else {
								<okane-agent-empty-state
									title="Selectionnez un client"
									description="Les details client s'afficheront ici."
								/>
							}
						</div>
					</div>
				</okane-agent-section-card>
			</div>
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
		return this.customers.filter((customer) => `${customer.prenom} ${customer.nom}`.toLowerCase().includes(searchValue));
	}

	public selectCustomer(customer: Client): void {
		this.selectedCustomer = customer;
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}
}

