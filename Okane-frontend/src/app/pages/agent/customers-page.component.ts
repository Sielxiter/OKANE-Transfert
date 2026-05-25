import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { Client, CreateCustomerRequest, Transfert } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-customers-page',
	standalone: true,
	imports: [CommonModule, FormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<section class="rounded-xl border bg-background p-4 shadow-sm">
				<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<h2 class="text-base font-semibold">Liste des clients</h2>
					<div class="flex flex-1 gap-2 md:max-w-md">
						<input class="w-full rounded-md border px-3 py-2 text-sm" placeholder="Rechercher un client" [(ngModel)]="search" />
						<button
							class="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
							type="button"
							(click)="openCreateModal()"
						>
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
								<button class="rounded-md border px-3 py-2 text-xs font-semibold" type="button" (click)="showDetails()">
									Voir détails
								</button>
								<button class="rounded-md border px-3 py-2 text-xs font-semibold" type="button" (click)="showHistory()">
									Historique
								</button>
							</div>

							@if (panelMode === 'details') {
								<div class="mt-4 grid gap-2 text-xs text-muted-foreground">
									<div class="flex items-center justify-between gap-3">
										<span>Nom complet</span>
										<span class="text-foreground">{{ selectedCustomer.prenom }} {{ selectedCustomer.nom }}</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span>Téléphone</span>
										<span class="text-foreground">{{ selectedCustomer.telephone }}</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span>Pays</span>
										<span class="text-foreground">{{ selectedCustomer.pays }}</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span>Type de pièce</span>
										<span class="text-foreground">{{ selectedCustomer.typePiece }}</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span>Numéro de pièce</span>
										<span class="text-foreground">{{ maskDocumentNumber(selectedCustomer.numeroPiece) }}</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span>Statut KYC</span>
										<span class="text-foreground">{{ formatStatutKyc(selectedCustomer.statutKyc) }}</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span>Date création</span>
										<span class="text-foreground">{{ formatDate(selectedCustomer.creeLe) }}</span>
									</div>
								</div>
							}

							@if (panelMode === 'history') {
								<div class="mt-4 space-y-2 text-xs text-muted-foreground">
									@if (relatedTransfers.length) {
										@for (item of relatedTransfers; track item.id) {
											<div class="rounded-md border bg-background p-2">
												<p class="text-xs text-muted-foreground">{{ item.reference }}</p>
												<div class="mt-1 flex items-center justify-between gap-3 text-sm text-foreground">
													<span>{{ item.type }}</span>
													<span>{{ formatMoney(item.amount, item.currency) }}</span>
												</div>
												<p class="mt-1 text-xs text-muted-foreground">{{ item.destination }} • {{ formatStatutTransfer(item.status) }}</p>
												<p class="mt-1 text-[11px] text-muted-foreground">{{ formatDate(item.createdAt) }}</p>
											</div>
										}
									} @else {
										<p>Aucun transfert lié pour ce client.</p>
									}
								</div>
							}
						} @else {
							<p class="text-sm text-muted-foreground">Sélectionnez un client pour voir ses détails.</p>
						}
					</div>
				</div>
			</section>

			@if (isCreateOpen) {
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div class="w-full max-w-lg rounded-xl border bg-background p-4 shadow-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-sm font-semibold">Créer un client</h3>
							<button class="text-xs text-muted-foreground" type="button" (click)="closeCreateModal()">Fermer</button>
						</div>
						<div class="mt-4 grid gap-3 md:grid-cols-2">
							<label class="text-sm">
								<span class="text-muted-foreground">Prénom</span>
								<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="createForm.prenom" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Nom</span>
								<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="createForm.nom" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Téléphone</span>
								<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="createForm.telephone" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Pays</span>
								<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="createForm.pays" />
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Type de pièce</span>
								<select class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="createForm.typePiece">
									<option value="">Sélectionner</option>
									<option value="CIN">CIN</option>
									<option value="Passeport">Passeport</option>
								</select>
							</label>
							<label class="text-sm">
								<span class="text-muted-foreground">Numéro de pièce</span>
								<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="createForm.numeroPiece" />
							</label>
						</div>
						@if (createError) {
							<p class="mt-3 text-xs text-rose-600">{{ createError }}</p>
						}
						<div class="mt-4 flex justify-end gap-2">
							<button class="rounded-md border px-3 py-2 text-xs font-semibold" type="button" (click)="closeCreateModal()">
								Annuler
							</button>
							<button class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground" type="button" (click)="createCustomer()">
								Créer
							</button>
						</div>
					</div>
				</div>
		}
	`,
})
export class AgentCustomersPageComponent implements OnInit {
	private readonly _service = inject(AgentDashboardService);
	private readonly _platformId = inject(PLATFORM_ID);
	private readonly _cdr = inject(ChangeDetectorRef);

	public customers: Client[] = [];
	public transfers: Transfert[] = [];
	public search = '';
	public selectedCustomer: Client | null = null;
	public panelMode: 'details' | 'history' | null = null;
	public isCreateOpen = false;
	public createError = '';
	public createForm = {
		prenom: '',
		nom: '',
		telephone: '',
		pays: '',
		typePiece: '',
		numeroPiece: '',
	};

	constructor() {
		this._service.getTransferHistory().subscribe((transfers) => (this.transfers = transfers));
	}

	public ngOnInit(): void {
		if (!isPlatformBrowser(this._platformId)) {
			return;
		}
		this.loadCustomers();
	}

	public get filteredCustomers(): Client[] {
		const searchValue = this.search.trim().toLowerCase();
		if (!searchValue) {
			return this.customers;
		}
		return this.customers.filter((customer) =>
			`${customer.prenom} ${customer.nom}`.toLowerCase().includes(searchValue) ||
			customer.telephone.toLowerCase().includes(searchValue) ||
			customer.numeroPiece.toLowerCase().includes(searchValue)
		);
	}

	public get relatedTransfers(): Array<{
		id: string;
		reference: string;
		type: 'ENVOI' | 'RETRAIT';
		amount: number;
		currency: string;
		destination: string;
		status: Transfert['statut'];
		createdAt: string;
	}> {
		if (!this.selectedCustomer) {
			return [];
		}
		const phone = this.selectedCustomer.telephone;
		return this.transfers
			.filter(
				(transfer) =>
					transfer.telephoneExpediteur === phone || transfer.telephoneBeneficiaire === phone,
			)
			.map((transfer) => {
				const isSender = transfer.telephoneExpediteur === phone;
				const sourceCurrency = transfer.deviseSource ?? transfer.devise;
				const destinationCurrency = transfer.deviseDestination ?? transfer.devise;
				const amountSentWithFees = transfer.montant + transfer.montantFrais;
				return {
					id: transfer.id,
					reference: transfer.codeReference,
					type: isSender ? 'ENVOI' : 'RETRAIT',
					amount: isSender ? amountSentWithFees : transfer.montantNet,
					currency: isSender ? sourceCurrency : destinationCurrency,
					destination: transfer.paysDestination,
					status: transfer.statut,
					createdAt: transfer.creeLe,
				};
			});
	}

	public selectCustomer(customer: Client): void {
		this.selectedCustomer = customer;
		this.panelMode = null;
	}

	public showDetails(): void {
		this.panelMode = 'details';
	}

	public showHistory(): void {
		this.panelMode = 'history';
	}

	public openCreateModal(): void {
		this.createError = '';
		this.isCreateOpen = true;
	}

	public closeCreateModal(): void {
		this.isCreateOpen = false;
		this.createError = '';
	}

	public createCustomer(): void {
		this.createError = '';
		const { prenom, nom, telephone, pays, typePiece, numeroPiece } = this.createForm;
		if (!prenom || !nom || !telephone || !pays || !typePiece || !numeroPiece) {
			this.createError = 'Veuillez remplir tous les champs.';
			return;
		}
		const payload: CreateCustomerRequest = {
			prenom,
			nom,
			telephone,
			pays,
			typePiece: typePiece as CreateCustomerRequest['typePiece'],
			numeroPiece,
		};
		this._service.createCustomer(payload).subscribe({
			next: (created) => {
				this.loadCustomers(created.id);
				this.resetCreateForm();
				this.isCreateOpen = false;
			},
			error: () => {
				this.createError = "Impossible de créer le client pour le moment.";
			},
		});
	}

	public maskDocumentNumber(value: string): string {
		const trimmed = value.trim();
		if (trimmed.length <= 4) {
			return `${trimmed.slice(0, 1)}****`;
		}
		const start = trimmed.slice(0, 2);
		const end = trimmed.slice(-2);
		return `${start}****${end}`;
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

	public formatMoney(amount: number, currency: string): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
	}

	public formatStatutTransfer(status: Transfert['statut']): string {
		switch (status) {
			case 'PAID':
				return 'PAYÉ';
			case 'CANCELLED':
				return 'ANNULÉ';
			case 'EXPIRED':
				return 'EXPIRÉ';
			case 'PENDING':
			default:
				return 'EN_ATTENTE';
		}
	}

	private resetCreateForm(): void {
		this.createForm = {
			prenom: '',
			nom: '',
			telephone: '',
			pays: '',
			typePiece: '',
			numeroPiece: '',
		};
	}

	private loadCustomers(selectId?: string): void {
		this._service.getCustomers().subscribe({
			next: (customers) => {
				this.customers = customers;
				if (selectId) {
					this.selectedCustomer = customers.find((item) => item.id === selectId) ?? null;
					this.panelMode = null;
				}
				this._cdr.markForCheck();
			},
			error: () => {
				this._cdr.markForCheck();
			},
		});
	}
}
