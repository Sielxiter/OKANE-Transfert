import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideUsers,
	lucideSearch,
	lucideFilter,
	lucideEye,
	lucideChevronRight,
	lucideUserCheck,
	lucideUserX,
	lucideBuilding2,
	lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ManagerAgentsApiService, type ApiAgent } from './manager-agents.api';

@Component({
	selector: 'okane-manager-agents-page',
	standalone: true,
	imports: [NgClass, DatePipe, RouterLink, NgIcon, HlmButtonImports, HlmSkeletonImports, HlmInputImports],
	providers: [
		provideIcons({
			lucideUsers,
			lucideSearch,
			lucideFilter,
			lucideEye,
			lucideChevronRight,
			lucideUserCheck,
			lucideUserX,
			lucideBuilding2,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Equipe</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Agents</h1>
					<p class="mt-1 text-sm text-muted-foreground">Supervisez les agents de vos sous-agences.</p>
				</div>
			</header>

			<div class="flex items-center gap-3">
				<div class="relative flex-1">
					<ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<input hlmInput type="text" placeholder="Rechercher un agent..." class="pl-10" [value]="search()" (input)="search.set($any($event.target).value)" />
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
								<div hlmSkeleton class="h-4 w-40 rounded-full"></div>
								<div hlmSkeleton class="h-3 w-24 rounded-full"></div>
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
								<th class="px-4 py-3 text-left">Agent</th>
								<th class="px-4 py-3 text-left">Agence</th>
								<th class="px-4 py-3 text-left">Statut</th>
								<th class="px-4 py-3 text-left">Derniere connexion</th>
								<th class="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							@for (agent of filteredAgents(); track agent.id) {
								<tr class="hover:bg-accent/40 transition-colors">
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
												{{ agent.fullName.charAt(0) }}
											</div>
											<div>
												<p class="font-medium text-foreground">{{ agent.fullName }}</p>
												<p class="text-xs text-muted-foreground">{{ agent.email }}</p>
											</div>
										</div>
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										<div class="flex items-center gap-1">
											<ng-icon name="lucideBuilding2" class="text-xs" />
											{{ agent.agencyName }}
										</div>
									</td>
									<td class="px-4 py-3">
										<span class="rounded-full px-2 py-0.5 text-xs font-medium" [ngClass]="statusClass(agent.accountStatus)">
											{{ agent.accountStatus }}
										</span>
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{{ agent.lastLoginAt ? (agent.lastLoginAt | date:'short') : 'Jamais' }}
									</td>
									<td class="px-4 py-3 text-right">
										<div class="flex items-center justify-end gap-2">
											@if (agent.accountStatus === 'SUSPENDED') {
												<button hlmBtn variant="ghost" size="sm" (click)="activateAgent(agent.id)">
													<ng-icon name="lucideUserCheck" class="text-xs" />
													Activer
												</button>
											} @else {
												<button hlmBtn variant="ghost" size="sm" (click)="suspendAgent(agent.id)">
													<ng-icon name="lucideUserX" class="text-xs" />
													Suspendre
												</button>
											}
											<a [routerLink]="['/manager/agents', agent.id]" hlmBtn variant="ghost" size="sm">
												<ng-icon name="lucideEye" class="text-xs" />
												Voir
											</a>
										</div>
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
export class ManagerAgentsPageComponent implements OnInit {
	private readonly _api = inject(ManagerAgentsApiService);

	protected readonly agents = signal<ApiAgent[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal('');
	protected readonly search = signal('');

	protected readonly filteredAgents = () => {
		const term = this.search().trim().toLowerCase();
		if (!term) return this.agents();
		return this.agents().filter(a =>
			a.fullName.toLowerCase().includes(term) ||
			a.email.toLowerCase().includes(term) ||
			a.agencyName.toLowerCase().includes(term)
		);
	};

	public ngOnInit(): void {
		this._api.getAgents().subscribe({
			next: (data) => {
				this.agents.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger les agents.');
				this.loading.set(false);
			},
		});
	}

	protected activateAgent(id: number): void {
		this._api.changeAgentStatus(id, 'ACTIVE').subscribe({
			next: () => this.ngOnInit(),
			error: () => this.error.set('Erreur lors de l\'activation'),
		});
	}

	protected suspendAgent(id: number): void {
		this._api.changeAgentStatus(id, 'SUSPENDED').subscribe({
			next: () => this.ngOnInit(),
			error: () => this.error.set('Erreur lors de la suspension'),
		});
	}

	protected statusClass(status: string): string {
		switch (status) {
			case 'ACTIVE':
				return 'bg-emerald-500/10 text-emerald-600';
			case 'SUSPENDED':
				return 'bg-amber-500/10 text-amber-600';
			case 'LOCKED':
				return 'bg-destructive/10 text-destructive';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}
}
