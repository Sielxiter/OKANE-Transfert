import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRightLeft, lucideDownload, lucideFilter, lucideSearch } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { ClientTransfersApiService } from './services/client-transfers.api';
import type { ClientTransferListItem, ClientTransferStatus, PageResponse } from './client.models';

const PAGE_SIZE = 10;

@Component({
	selector: 'okane-client-transfers-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		RouterLink,
		NgIcon,
		HlmButtonImports,
		HlmInputImports,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		DatePipe,
	],
	providers: [provideIcons({ lucideArrowRightLeft, lucideFilter, lucideSearch, lucideDownload })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro eyebrow="Espace Client" title="Mes transferts" subtitle="Consultez l'historique, filtrez et ouvrez les détails d'un transfert."></okane-agent-page-intro>

				<okane-agent-section-card title="Filtres" subtitle="Recherche par référence et période.">
					<div class="grid gap-4 lg:grid-cols-4">
						<label class="text-sm">
							<span class="text-muted-foreground">Référence</span>
							<input hlmInput class="mt-1 w-full" [(ngModel)]="reference" placeholder="TRX-2026-0001" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Statut</span>
							<select hlmInput class="mt-1 w-full" [(ngModel)]="status">
								<option value="">Tous</option>
								<option value="EN_ATTENTE">EN_ATTENTE</option>
								<option value="PAYE">PAYE</option>
								<option value="ANNULE">ANNULE</option>
								<option value="EXPIRE">EXPIRE</option>
							</select>
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Du</span>
							<input hlmInput type="date" class="mt-1 w-full" [(ngModel)]="fromDate" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Au</span>
							<input hlmInput type="date" class="mt-1 w-full" [(ngModel)]="toDate" />
						</label>
					</div>
					<div class="mt-4 flex flex-wrap gap-2">
						<button hlmBtn type="button" (click)="reload()"><ng-icon name="lucideFilter" /> Filtrer</button>
						<button hlmBtn variant="outline" type="button" (click)="resetFilters()"><ng-icon name="lucideSearch" /> Réinitialiser</button>
					</div>
				</okane-agent-section-card>

				<okane-agent-section-card title="Historique des transferts" subtitle="Page {{ pageIndex() + 1 }} / {{ totalPages() }}">
					<div class="overflow-x-auto">
						<table class="min-w-full text-left text-sm">
							<thead class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
								<tr>
									<th class="py-3 pr-4">Référence</th>
									<th class="py-3 pr-4">Bénéficiaire</th>
									<th class="py-3 pr-4">Envoyé</th>
									<th class="py-3 pr-4">Reçu</th>
									<th class="py-3 pr-4">Statut</th>
									<th class="py-3 pr-4">Date</th>
									<th class="py-3 pr-0">Actions</th>
								</tr>
							</thead>
							<tbody>
								@for (transfer of transfers(); track transfer.reference) {
									<tr class="border-t border-border/60">
										<td class="py-3 pr-4 font-medium text-foreground">{{ transfer.reference }}</td>
										<td class="py-3 pr-4 text-muted-foreground">{{ transfer.beneficiaryFullName }}</td>
										<td class="py-3 pr-4 text-muted-foreground">{{ transfer.sendAmount }} {{ transfer.sendCurrency }}</td>
										<td class="py-3 pr-4 text-muted-foreground">{{ transfer.receiveAmount }} {{ transfer.receiveCurrency }}</td>
										<td class="py-3 pr-4 text-muted-foreground">{{ transfer.status }}</td>
										<td class="py-3 pr-4 text-muted-foreground">{{ transfer.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
										<td class="py-3 pr-0">
											<div class="flex flex-wrap gap-2">
												<a hlmBtn size="sm" [routerLink]="['/client/transfers', transfer.reference]">Voir détails</a>
												<button hlmBtn size="sm" variant="outline" type="button" (click)="downloadReceipt(transfer.reference)">Télécharger reçu</button>
											</div>
										</td>
									</tr>
								}
							</tbody>
						</table>
					</div>

					<div class="mt-4 flex items-center justify-between gap-3">
						<p class="text-sm text-muted-foreground">{{ totalElements() }} transfert(s)</p>
						<div class="flex gap-2">
							<button hlmBtn variant="outline" size="sm" type="button" (click)="previousPage()" [disabled]="pageIndex() === 0">Précédent</button>
							<button hlmBtn variant="outline" size="sm" type="button" (click)="nextPage()" [disabled]="pageIndex() >= totalPages() - 1">Suivant</button>
						</div>
					</div>
				</okane-agent-section-card>
			</div>
	`,
})
export class ClientTransfersPageComponent {
	private readonly _api = inject(ClientTransfersApiService);

	protected reference = '';
	protected status = '';
	protected fromDate = '';
	protected toDate = '';
	protected readonly pageIndex = signal(0);
	protected readonly page = signal<PageResponse<ClientTransferListItem>>({ content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 1 });
	protected readonly transfers = computed(() => this.page().content ?? []);
	protected readonly totalPages = computed(() => this.page().totalPages || 1);
	protected readonly totalElements = computed(() => this.page().totalElements || 0);

	constructor() {
		this.reload();
	}

	public reload(): void {
		this._api
			.list({
				page: this.pageIndex(),
				size: PAGE_SIZE,
				sort: 'createdAt,desc',
				status: this.status || null,
				fromDate: this.fromDate || null,
				toDate: this.toDate || null,
				reference: this.reference || null,
			})
			.subscribe((response) => this.page.set(response));
	}

	public resetFilters(): void {
		this.reference = '';
		this.status = '';
		this.fromDate = '';
		this.toDate = '';
		this.pageIndex.set(0);
		this.reload();
	}

	public previousPage(): void {
		if (this.pageIndex() > 0) {
			this.pageIndex.update((value) => Math.max(0, value - 1));
			this.reload();
		}
	}

	public nextPage(): void {
		if (this.pageIndex() < this.totalPages() - 1) {
			this.pageIndex.update((value) => value + 1);
			this.reload();
		}
	}

	public downloadReceipt(reference: string): void {
		this._api.receipt(reference).subscribe(() => {
			// The backend currently returns a receipt DTO; the UI keeps the action stubbed.
		});
	}
}

