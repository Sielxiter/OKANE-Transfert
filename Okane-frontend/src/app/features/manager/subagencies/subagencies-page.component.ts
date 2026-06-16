import { NgClass, CurrencyPipe } from '@angular/common';
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
	lucidePencil,
	lucideUserPlus,
	lucideX,
	lucideCheck,
	lucideLoader2,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ManagerSubAgenciesApiService, type ApiSubAgency, type ApiAgentAssignable } from './manager-subagencies.api';

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
			lucidePencil,
			lucideUserPlus,
			lucideX,
			lucideCheck,
			lucideLoader2,
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
								<div class="flex items-center gap-1">
									<button hlmBtn variant="ghost" size="sm" (click)="openLimitModal(agency); $event.stopPropagation()" title="Modifier plafond">
										<ng-icon name="lucidePencil" class="text-xs" />
									</button>
									<button hlmBtn variant="ghost" size="sm" (click)="openAgentModal(agency); $event.stopPropagation()" title="Affecter agents">
										<ng-icon name="lucideUserPlus" class="text-xs" />
									</button>
									<a [routerLink]="['/manager/sub-agencies', agency.id]" hlmBtn variant="ghost" size="sm" class="gap-1">
										<ng-icon name="lucideEye" class="text-xs" />
										<ng-icon name="lucideChevronRight" class="text-xs" />
									</a>
								</div>
							</div>
						</div>
					}
				</div>
			}

			<!-- Modal: Modifier Plafond -->
			@if (limitModalOpen()) {
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-foreground">Modifier le plafond</h3>
							<button hlmBtn variant="ghost" size="sm" (click)="closeLimitModal()">
								<ng-icon name="lucideX" class="text-xs" />
							</button>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">{{ selectedAgency()?.name }}</p>
						<div class="mt-4">
							<label class="text-sm font-medium text-foreground">Nouveau plafond journalier (MAD)</label>
							<input hlmInput type="number" class="mt-1 w-full" [value]="newLimit()" (input)="newLimit.set($any($event.target).value)" />
						</div>
						<div class="mt-6 flex justify-end gap-2">
							<button hlmBtn variant="outline" size="sm" (click)="closeLimitModal()">Annuler</button>
							<button hlmBtn size="sm" [disabled]="limitSaving()" (click)="saveLimit()">
								@if (limitSaving()) {
									<ng-icon name="lucideLoader2" class="animate-spin text-xs" />
								} @else {
									<ng-icon name="lucideCheck" class="text-xs" />
								}
								Enregistrer
							</button>
						</div>
					</div>
				</div>
			}

			<!-- Modal: Affecter Agents -->
			@if (agentModalOpen()) {
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div class="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-foreground">Affecter des agents</h3>
							<button hlmBtn variant="ghost" size="sm" (click)="closeAgentModal()">
								<ng-icon name="lucideX" class="text-xs" />
							</button>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">{{ selectedAgency()?.name }}</p>

						<div class="relative mt-4">
							<ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
							<input hlmInput type="text" placeholder="Rechercher un agent..." class="pl-10 w-full" [value]="agentSearch()" (input)="agentSearch.set($any($event.target).value)" />
						</div>

						<div class="mt-4 max-h-64 overflow-y-auto space-y-2">
							@if (agentsLoading()) {
								@for (_ of [1,2,3]; track $index) {
									<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
										<div hlmSkeleton class="h-8 w-8 rounded-full"></div>
										<div class="flex-1 space-y-1">
											<div hlmSkeleton class="h-3 w-32 rounded-full"></div>
											<div hlmSkeleton class="h-2 w-24 rounded-full"></div>
										</div>
									</div>
								}
							} @else {
								@for (agent of filteredAgents(); track agent.id) {
									<div class="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent/10"
										[class.bg-emerald-500/5]="selectedAgentIds().has(agent.id)"
										(click)="toggleAgent(agent.id)">
										<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
											{{ agent.fullName.charAt(0) }}
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium text-foreground">{{ agent.fullName }}</p>
											<p class="text-xs text-muted-foreground">{{ agent.email }}</p>
										</div>
										@if (agent.currentlyAssigned) {
											<span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Deja affecte</span>
										}
										@if (selectedAgentIds().has(agent.id)) {
											<ng-icon name="lucideCheck" class="text-emerald-600" />
										}
									</div>
								}
							}
							<div class="mt-4 flex justify-end gap-2">
								<button hlmBtn variant="outline" size="sm" (click)="closeAgentModal()">Annuler</button>
								<button hlmBtn size="sm" [disabled]="agentsSaving() || selectedAgentIds().size === 0" (click)="saveAgents()">
									@if (agentsSaving()) {
										<ng-icon name="lucideLoader2" class="animate-spin text-xs" />
									} @else {
										<ng-icon name="lucideCheck" class="text-xs" />
									}
									Affecter {{ selectedAgentIds().size }} agent(s)
								</button>
							</div>
						</div>
					</div>
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

	// Limit modal state
	protected readonly limitModalOpen = signal(false);
	protected readonly selectedAgency = signal<ApiSubAgency | null>(null);
	protected readonly newLimit = signal('');
	protected readonly limitSaving = signal(false);

	// Agent modal state
	protected readonly agentModalOpen = signal(false);
	protected readonly agentsLoading = signal(false);
	protected readonly agentsList = signal<ApiAgentAssignable[]>([]);
	protected readonly agentSearch = signal('');
	protected readonly selectedAgentIds = signal<Set<number>>(new Set());
	protected readonly agentsSaving = signal(false);

	protected readonly filteredAgencies = () => {
		const term = this.search().trim().toLowerCase();
		if (!term) return this.agencies();
		return this.agencies().filter(a =>
			a.name.toLowerCase().includes(term) ||
			a.code.toLowerCase().includes(term) ||
			a.city.toLowerCase().includes(term)
		);
	};

	protected readonly filteredAgents = () => {
		const term = this.agentSearch().trim().toLowerCase();
		if (!term) return this.agentsList();
		return this.agentsList().filter(a =>
			a.fullName.toLowerCase().includes(term) ||
			a.email.toLowerCase().includes(term)
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

	// Limit modal
	protected openLimitModal(agency: ApiSubAgency): void {
		this.selectedAgency.set(agency);
		this.newLimit.set(agency.dailyLimit);
		this.limitModalOpen.set(true);
	}

	protected closeLimitModal(): void {
		this.limitModalOpen.set(false);
		this.selectedAgency.set(null);
		this.limitSaving.set(false);
	}

	protected saveLimit(): void {
		const agency = this.selectedAgency();
		if (!agency) return;
		this.limitSaving.set(true);
		this._api.updateDailyLimit(agency.id, this.newLimit()).subscribe({
			next: () => {
				// Update local data
				this.agencies.update(list =>
					list.map(a => a.id === agency.id ? { ...a, dailyLimit: this.newLimit() } : a)
				);
				this.closeLimitModal();
			},
			error: () => {
				this.limitSaving.set(false);
				this.error.set('Erreur lors de la mise a jour du plafond.');
			},
		});
	}

	// Agent modal
	protected openAgentModal(agency: ApiSubAgency): void {
		this.selectedAgency.set(agency);
		this.agentModalOpen.set(true);
		this.agentsLoading.set(true);
		this.selectedAgentIds.set(new Set());
		this.agentSearch.set('');
		this._api.getAssignableAgents(agency.id).subscribe({
			next: (data) => {
				this.agentsList.set(data);
				this.agentsLoading.set(false);
			},
			error: () => {
				this.agentsLoading.set(false);
				this.error.set('Impossible de charger les agents.');
			},
		});
	}

	protected closeAgentModal(): void {
		this.agentModalOpen.set(false);
		this.selectedAgency.set(null);
		this.selectedAgentIds.set(new Set());
		this.agentsSaving.set(false);
	}

	protected toggleAgent(agentId: number): void {
		this.selectedAgentIds.update(set => {
			const newSet = new Set(set);
			if (newSet.has(agentId)) {
				newSet.delete(agentId);
			} else {
				newSet.add(agentId);
			}
			return newSet;
		});
	}

	protected saveAgents(): void {
		const agency = this.selectedAgency();
		if (!agency) return;
		const ids = Array.from(this.selectedAgentIds());
		if (ids.length === 0) return;
		this.agentsSaving.set(true);
		this._api.assignAgents(agency.id, ids).subscribe({
			next: () => {
				// Update local agent count
				this.agencies.update(list =>
					list.map(a => a.id === agency.id ? { ...a, agentCount: a.agentCount + ids.length } : a)
				);
				this.closeAgentModal();
			},
			error: () => {
				this.agentsSaving.set(false);
				this.error.set('Erreur lors de l\'affectation des agents.');
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
