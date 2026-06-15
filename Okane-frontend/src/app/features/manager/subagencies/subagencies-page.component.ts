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
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ManagerSubAgenciesApiService, type ApiSubAgency } from './manager-subagencies.api';

@Component({
	selector: 'okane-manager-subagencies-page',
	standalone: true,
	imports: [NgClass, RouterLink, NgIcon, HlmButtonImports, HlmSkeletonImports, HlmInputImports],
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
			lucideSearch,
			lucideFilter,
			lucideEye,
			lucideChevronRight,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Supervision</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Sous-Agences</h1>
					<p class="mt-1 text-sm text-muted-foreground">Gerez et supervisez vos sous-agences.</p>
				</div>
			</header>

			<div class="flex items-center gap-3">
				<div class="relative flex-1">
					<ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<input hlmInput type="text" placeholder="Rechercher une sous-agence..." class="pl-10" [value]="search()" (input)="search.set($any($event.target).value)" />
				</div>
				<button hlmBtn variant="outline" size="sm">
					<ng-icon name="lucideFilter" />
					Filtrer
				</button>
			</div>

			@if (loading()) {
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					@for (_ of [1,2,3]; track $index) {
						<div class="h-48 rounded-2xl border border-border bg-muted/20 p-4">
							<div hlmSkeleton class="h-5 w-32 rounded-full"></div>
							<div hlmSkeleton class="mt-3 h-4 w-24 rounded-full"></div>
							<div hlmSkeleton class="mt-6 h-8 w-20 rounded-full"></div>
						</div>
					}
				</div>
			} @else if (error()) {
				<div class="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<p class="text-sm font-semibold">Erreur de chargement</p>
					<p class="mt-1 text-xs">{{ error() }}</p>
				</div>
			} @else {
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					@for (agency of filteredAgencies(); track agency.id) {
						<div class="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
							<div class="flex items-start justify-between">
								<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<ng-icon name="lucideBuilding2" />
								</div>
								<span class="rounded-full px-2.5 py-1 text-xs font-medium" [ngClass]="statusClass(agency.status)">
									{{ agency.status }}
								</span>
							</div>
							<h3 class="mt-3 text-lg font-semibold text-foreground">{{ agency.name }}</h3>
							<p class="text-sm text-muted-foreground">{{ agency.code }}</p>
							<div class="mt-3 space-y-1">
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<ng-icon name="lucideMapPin" class="text-xs" />
									{{ agency.city }}, {{ agency.country }}
								</div>
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<ng-icon name="lucideUsers" class="text-xs" />
									{{ agency.agentCount }} agents
								</div>
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<ng-icon name="lucideArrowRightLeft" class="text-xs" />
									{{ agency.transferCountToday }} transferts aujourd'hui
								</div>
							</div>
							<div class="mt-4 flex items-center justify-between">
								<span class="text-xs text-muted-foreground">Plafond: {{ agency.dailyLimit }} MAD</span>
								<a [routerLink]="['/manager/sub-agencies', agency.id]" hlmBtn variant="ghost" size="sm" class="gap-1">
									<ng-icon name="lucideEye" class="text-xs" />
									Voir
									<ng-icon name="lucideChevronRight" class="text-xs" />
								</a>
							</div>
						</div>
					}
				</div>
			}
		</div>
	`,
})
export class ManagerSubAgenciesPageComponent implements OnInit {
	private readonly _api = inject(ManagerSubAgenciesApiService);

	protected readonly agencies = signal<ApiSubAgency[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal('');
	protected readonly search = signal('');

	protected readonly filteredAgencies = () => {
		const term = this.search().trim().toLowerCase();
		if (!term) return this.agencies();
		return this.agencies().filter(a =>
			a.name.toLowerCase().includes(term) ||
			a.code.toLowerCase().includes(term) ||
			a.city.toLowerCase().includes(term)
		);
	};

	public ngOnInit(): void {
		this._api.getSubAgencies().subscribe({
			next: (data) => {
				this.agencies.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger les sous-agences.');
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
