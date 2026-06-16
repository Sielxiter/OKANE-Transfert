import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideUsers,
	lucideSearch,
	lucideFilter,
	lucideEye,
	lucideUserCheck,
	lucideUserX,
	lucideBuilding2,
	lucideTriangleAlert,
	lucideX,
	lucidePhone,
	lucideMail,
	lucideShield,
	lucideClock,
	lucideCalendar,
	lucideIdCard,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ManagerAgentsApiService, type ApiAgent } from './manager-agents.api';

@Component({
	selector: 'okane-manager-agents-page',
	standalone: true,
	imports: [NgClass, DatePipe, NgIcon, HlmButtonImports, HlmSkeletonImports, HlmInputImports],
	providers: [
		provideIcons({
			lucideUsers,
			lucideSearch,
			lucideFilter,
			lucideEye,
			lucideUserCheck,
			lucideUserX,
			lucideBuilding2,
			lucideTriangleAlert,
			lucideX,
			lucidePhone,
			lucideMail,
			lucideShield,
			lucideClock,
			lucideCalendar,
			lucideIdCard,
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
											<button hlmBtn variant="ghost" size="sm" (click)="openAgentModal(agent)">
												<ng-icon name="lucideEye" class="text-xs" />
												Voir
											</button>
										</div>
									</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			}

			<!-- Modal: Agent Details -->
			@if (selectedAgent()) {
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="closeAgentModal()">
					<div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg" (click)="$event.stopPropagation()">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-foreground">Details de l'agent</h3>
							<button hlmBtn variant="ghost" size="sm" (click)="closeAgentModal()">
								<ng-icon name="lucideX" class="text-xs" />
							</button>
						</div>

						@let agent = selectedAgent();
						<div class="mt-6 flex items-center gap-4">
							<div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
								{{ agent!.fullName.charAt(0) }}
							</div>
							<div>
								<p class="text-lg font-semibold text-foreground">{{ agent!.fullName }}</p>
								<p class="text-sm text-muted-foreground">{{ agent!.email }}</p>
							</div>
						</div>

						<div class="mt-6 space-y-4">
							<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
								<ng-icon name="lucideIdCard" class="text-muted-foreground" />
								<div>
									<p class="text-xs text-muted-foreground">ID Agent</p>
									<p class="text-sm font-medium text-foreground">{{ agent!.id }}</p>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
								<ng-icon name="lucidePhone" class="text-muted-foreground" />
								<div>
									<p class="text-xs text-muted-foreground">Telephone</p>
									<p class="text-sm font-medium text-foreground">{{ agent!.phone || 'Non renseigne' }}</p>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
								<ng-icon name="lucideBuilding2" class="text-muted-foreground" />
								<div>
									<p class="text-xs text-muted-foreground">Agence</p>
									<p class="text-sm font-medium text-foreground">{{ agent!.agencyName }} ({{ agent!.agencyCode }})</p>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
								<ng-icon name="lucideShield" class="text-muted-foreground" />
								<div>
									<p class="text-xs text-muted-foreground">Statut du compte</p>
									<span class="rounded-full px-2 py-0.5 text-xs font-medium" [ngClass]="statusClass(agent!.accountStatus)">
										{{ agent!.accountStatus }}
									</span>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
								<ng-icon name="lucideShield" class="text-muted-foreground" />
								<div>
									<p class="text-xs text-muted-foreground">KYC</p>
									<p class="text-sm font-medium text-foreground">{{ agent!.kycStatus || 'Non verifie' }}</p>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
								<ng-icon name="lucideClock" class="text-muted-foreground" />
								<div>
									<p class="text-xs text-muted-foreground">Derniere connexion</p>
									<p class="text-sm font-medium text-foreground">{{ agent!.lastLoginAt ? (agent!.lastLoginAt | date:'medium') : 'Jamais connecte' }}</p>
								</div>
							</div>

							<div class="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
								<ng-icon name="lucideCalendar" class="text-muted-foreground" />
								<div>
									<p class="text-xs text-muted-foreground">Date de creation</p>
									<p class="text-sm font-medium text-foreground">{{ agent!.createdAt | date:'medium' }}</p>
								</div>
							</div>
						</div>

						<div class="mt-6 flex justify-end">
							<button hlmBtn variant="outline" size="sm" (click)="closeAgentModal()">Fermer</button>
						</div>
					</div>
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
	protected readonly selectedAgent = signal<ApiAgent | null>(null);

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

	protected openAgentModal(agent: ApiAgent): void {
		this.selectedAgent.set(agent);
	}

	protected closeAgentModal(): void {
		this.selectedAgent.set(null);
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
