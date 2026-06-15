import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBuilding2,
	lucideMapPin,
	lucidePhone,
	lucideMail,
	lucideUsers,
	lucideArrowRightLeft,
	lucideTrendingUp,
	lucideTriangleAlert,
	lucideSearch,
	lucideFilter,
	lucideEye,
	lucideChevronRight,
	lucideArrowLeft,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ManagerSubAgenciesApiService, type ApiSubAgencyDetails } from './manager-subagencies.api';

@Component({
	selector: 'okane-manager-subagency-details',
	standalone: true,
	imports: [NgClass, RouterLink, NgIcon, HlmButtonImports, HlmSkeletonImports],
	providers: [
		provideIcons({
			lucideBuilding2,
			lucideMapPin,
			lucidePhone,
			lucideMail,
			lucideUsers,
			lucideArrowRightLeft,
			lucideTrendingUp,
			lucideTriangleAlert,
			lucideEye,
			lucideChevronRight,
			lucideArrowLeft,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<div class="flex items-center gap-2">
				<a routerLink="/manager/sub-agencies" hlmBtn variant="ghost" size="sm" class="gap-1">
					<ng-icon name="lucideArrowLeft" class="text-xs" />
					Retour
				</a>
			</div>

			@if (loading()) {
				<div class="space-y-4">
					<div hlmSkeleton class="h-8 w-64 rounded-full"></div>
					<div hlmSkeleton class="h-4 w-48 rounded-full"></div>
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						@for (_ of [1,2,3,4]; track $index) {
							<div class="h-24 rounded-2xl border border-border bg-muted/20 p-4">
								<div hlmSkeleton class="h-4 w-20 rounded-full"></div>
								<div hlmSkeleton class="mt-3 h-8 w-16 rounded-full"></div>
							</div>
						}
					</div>
				</div>
			} @else if (error()) {
				<div class="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<p class="text-sm font-semibold">Erreur</p>
					<p class="mt-1 text-xs">{{ error() }}</p>
				</div>
			} @else if (agency()) {
				<div class="space-y-6">
					<div class="flex items-start gap-4">
						<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<ng-icon name="lucideBuilding2" class="text-xl" />
						</div>
						<div>
							<h1 class="text-2xl font-semibold text-foreground">{{ agency()!.name }}</h1>
							<p class="text-sm text-muted-foreground">{{ agency()!.code }} — {{ agency()!.city }}, {{ agency()!.country }}</p>
						</div>
						<span class="ml-auto rounded-full px-3 py-1 text-xs font-medium" [ngClass]="statusClass(agency()!.status)">
							{{ agency()!.status }}
						</span>
					</div>

					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
							<p class="text-sm text-muted-foreground">Agents</p>
							<p class="mt-2 text-2xl font-semibold text-foreground">{{ agency()!.agentCount }}</p>
						</div>
						<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
							<p class="text-sm text-muted-foreground">Agents actifs</p>
							<p class="mt-2 text-2xl font-semibold text-foreground">{{ agency()!.activeAgentCount }}</p>
						</div>
						<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
							<p class="text-sm text-muted-foreground">Transferts aujourd'hui</p>
							<p class="mt-2 text-2xl font-semibold text-foreground">{{ agency()!.transferCountToday }}</p>
						</div>
						<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
							<p class="text-sm text-muted-foreground">Volume aujourd'hui</p>
							<p class="mt-2 text-2xl font-semibold text-foreground">{{ agency()!.volumeToday }} MAD</p>
						</div>
					</div>

					<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
						<h2 class="text-lg font-semibold text-foreground">Agents de l'agence</h2>
						<div class="mt-4 divide-y divide-border">
							@for (agent of agency()!.agents; track agent.id) {
								<div class="flex items-center justify-between py-3">
									<div class="flex items-center gap-3">
										<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
											{{ agent.fullName.charAt(0) }}
										</div>
										<div>
											<p class="text-sm font-medium text-foreground">{{ agent.fullName }}</p>
											<p class="text-xs text-muted-foreground">{{ agent.email }} — {{ agent.phone }}</p>
										</div>
									</div>
									<span class="rounded-full px-2 py-0.5 text-xs font-medium" [ngClass]="agent.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'">
										{{ agent.active ? 'Actif' : 'Inactif' }}
									</span>
								</div>
							}
						</div>
					</div>
				</div>
			}
		</div>
	`,
})
export class ManagerSubAgencyDetailsComponent implements OnInit {
	private readonly _api = inject(ManagerSubAgenciesApiService);

	protected readonly agency = signal<ApiSubAgencyDetails | null>(null);
	protected readonly loading = signal(true);
	protected readonly error = signal('');

	public ngOnInit(): void {
		const id = window.location.pathname.split('/').pop();
		if (!id || isNaN(+id)) {
			this.error.set('ID de sous-agence invalide');
			this.loading.set(false);
			return;
		}
		this._api.getSubAgencyDetails(+id).subscribe({
			next: (data) => {
				this.agency.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger les details de la sous-agence.');
				this.loading.set(false);
			},
		});
	}

	protected statusClass(status: string): string {
		switch (status) {
			case 'ACTIVE':
				return 'bg-emerald-500/10 text-emerald-600';
			case 'SUSPENDED':
				return 'bg-amber-500/10 text-amber-600';
			case 'CLOSED':
				return 'bg-destructive/10 text-destructive';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}
}
