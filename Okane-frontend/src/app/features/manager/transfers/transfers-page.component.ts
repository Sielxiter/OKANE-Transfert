import { NgClass, DatePipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideSearch,
	lucideFilter,
	lucideEye,
	lucideChevronRight,
	lucideTriangleAlert,
	lucideBadgeCheck,
	lucideClock,
	lucideXCircle,
	lucideAlertTriangle,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ManagerTransfersApiService, type ApiTransfer } from './manager-transfers.api';

@Component({
	selector: 'okane-manager-transfers-page',
	standalone: true,
	imports: [NgClass, CurrencyPipe, RouterLink, NgIcon, HlmButtonImports, HlmSkeletonImports, HlmInputImports],
	providers: [
		provideIcons({
			lucideArrowRightLeft,
			lucideSearch,
			lucideFilter,
			lucideEye,
			lucideChevronRight,
			lucideTriangleAlert,
			lucideBadgeCheck,
			lucideClock,
			lucideXCircle,
			lucideAlertTriangle,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Operations</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Transferts</h1>
					<p class="mt-1 text-sm text-muted-foreground">Suivez les transferts de vos sous-agences.</p>
				</div>
			</header>

			<div class="flex items-center gap-3">
				<div class="relative flex-1">
					<ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<input hlmInput type="text" placeholder="Rechercher par reference, nom..." class="pl-10" [value]="search()" (input)="search.set($any($event.target).value)" />
				</div>
				<button hlmBtn variant="outline" size="sm">
					<ng-icon name="lucideFilter" />
					Filtrer
				</button>
			</div>

			@if (loading()) {
				<div class="rounded-2xl border border-border bg-muted/20 p-4">
					@for (_ of [1,2,3,4,5]; track $index) {
						<div class="flex items-center gap-4 py-3">
							<div hlmSkeleton class="h-10 w-10 rounded-full"></div>
							<div class="flex-1 space-y-2">
								<div hlmSkeleton class="h-4 w-48 rounded-full"></div>
								<div hlmSkeleton class="h-3 w-32 rounded-full"></div>
							</div>
						</div>
					}
				</div>
			} @else if (error()) {
				<div class="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<p class="text-sm font-semibold">Erreur de chargement</p>
					<p class="mt-1 text-xs">{{ error() }}</p>
				</div>
			} @else {
				<div class="rounded-2xl border border-border bg-card shadow-sm">
					<table class="w-full text-sm">
						<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
							<tr>
								<th class="px-4 py-3 text-left">Reference</th>
								<th class="px-4 py-3 text-left">Expediteur</th>
								<th class="px-4 py-3 text-left">Beneficiaire</th>
								<th class="px-4 py-3 text-left">Montant</th>
								<th class="px-4 py-3 text-left">Agence</th>
								<th class="px-4 py-3 text-left">Statut</th>
								<th class="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							@for (transfer of filteredTransfers(); track transfer.id) {
								<tr class="hover:bg-accent/40 transition-colors">
									<td class="px-4 py-3">
										<p class="font-mono text-xs font-medium text-foreground">{{ transfer.referenceCode }}</p>
										<p class="text-xs text-muted-foreground">{{ transfer.withdrawalCode }}</p>
									</td>
									<td class="px-4 py-3">
										<p class="text-sm text-foreground">{{ transfer.senderFullName }}</p>
										<p class="text-xs text-muted-foreground">{{ transfer.senderPhone }}</p>
									</td>
									<td class="px-4 py-3">
										<p class="text-sm text-foreground">{{ transfer.beneficiaryFullName }}</p>
										<p class="text-xs text-muted-foreground">{{ transfer.beneficiaryPhone }}</p>
									</td>
									<td class="px-4 py-3">
										<p class="text-sm font-medium text-foreground">{{ transfer.amount | currency:transfer.currency:'symbol':'1.2-2' }}</p>
										<p class="text-xs text-muted-foreground">Frais: {{ transfer.feeAmount | currency:transfer.currency:'symbol':'1.2-2' }}</p>
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{{ transfer.sourceAgencyName }}
									</td>
									<td class="px-4 py-3">
										<span class="rounded-full px-2 py-0.5 text-xs font-medium" [ngClass]="statusClass(transfer.status)">
											{{ transfer.status }}
										</span>
									</td>
									<td class="px-4 py-3 text-right">
										<a [routerLink]="['/manager/transfers', transfer.id]" hlmBtn variant="ghost" size="sm">
											<ng-icon name="lucideEye" class="text-xs" />
											Voir
										</a>
									</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			}
		</div>
	`,
})
export class ManagerTransfersPageComponent implements OnInit {
	private readonly _api = inject(ManagerTransfersApiService);

	protected readonly transfers = signal<ApiTransfer[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal('');
	protected readonly search = signal('');

	protected readonly filteredTransfers = () => {
		const term = this.search().trim().toLowerCase();
		if (!term) return this.transfers();
		return this.transfers().filter(t =>
			t.referenceCode.toLowerCase().includes(term) ||
			t.senderFullName.toLowerCase().includes(term) ||
			t.beneficiaryFullName.toLowerCase().includes(term)
		);
	};

	public ngOnInit(): void {
		this._api.getTransfers().subscribe({
			next: (data) => {
				this.transfers.set(data.content || data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger les transferts.');
				this.loading.set(false);
			},
		});
	}

	protected statusClass(status: string): string {
		switch (status) {
			case 'PENDING':
				return 'bg-amber-500/10 text-amber-600';
			case 'PAID':
				return 'bg-emerald-500/10 text-emerald-600';
			case 'CANCELLED':
				return 'bg-destructive/10 text-destructive';
			case 'EXPIRED':
				return 'bg-muted text-muted-foreground';
			case 'BLOCKED':
				return 'bg-rose-500/10 text-rose-600';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}
}
