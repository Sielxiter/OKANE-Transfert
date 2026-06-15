import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideHistory,
	lucideShieldCheck,
	lucideTriangleAlert,
	lucideUser,
	lucideSearch,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ManagerAuditApiService, type ApiAuditLog } from './manager-audit.api';

@Component({
	selector: 'okane-manager-audit-page',
	standalone: true,
	imports: [NgClass, DatePipe, NgIcon, HlmButtonImports, HlmSkeletonImports, HlmInputImports],
	providers: [
		provideIcons({
			lucideHistory,
			lucideShieldCheck,
			lucideTriangleAlert,
			lucideUser,
			lucideSearch,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Traçabilite</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Journal d'audit</h1>
					<p class="mt-1 text-sm text-muted-foreground">Consultez l'historique des actions de vos sous-agences.</p>
				</div>
			</header>

			<div class="flex items-center gap-3">
				<div class="relative flex-1">
					<ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<input hlmInput type="text" placeholder="Rechercher une action..." class="pl-10" [value]="search()" (input)="search.set($any($event.target).value)" />
				</div>
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
								<th class="px-4 py-3 text-left">Date</th>
								<th class="px-4 py-3 text-left">Utilisateur</th>
								<th class="px-4 py-3 text-left">Role</th>
								<th class="px-4 py-3 text-left">Action</th>
								<th class="px-4 py-3 text-left">Module</th>
								<th class="px-4 py-3 text-left">Cible</th>
								<th class="px-4 py-3 text-left">IP</th>
								<th class="px-4 py-3 text-left">Risque</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							@for (log of filteredLogs(); track log.id) {
								<tr class="hover:bg-accent/40 transition-colors">
									<td class="px-4 py-3 text-muted-foreground">{{ log.createdAt | date:'short' }}</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
												{{ log.actorName.charAt(0) }}
											</div>
											<div>
												<p class="text-sm text-foreground">{{ log.actorName }}</p>
												<p class="text-xs text-muted-foreground">{{ log.actorEmail }}</p>
											</div>
										</div>
									</td>
									<td class="px-4 py-3 text-muted-foreground">{{ log.actorRole }}</td>
									<td class="px-4 py-3 text-foreground">{{ log.action }}</td>
									<td class="px-4 py-3 text-muted-foreground">{{ log.module }}</td>
									<td class="px-4 py-3 text-muted-foreground">{{ log.target }}</td>
									<td class="px-4 py-3 text-muted-foreground font-mono text-xs">{{ log.ipAddress }}</td>
									<td class="px-4 py-3">
										<span class="rounded-full px-2 py-0.5 text-xs font-medium" [ngClass]="riskClass(log.riskLevel)">
											{{ log.riskLevel }}
										</span>
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
export class ManagerAuditPageComponent implements OnInit {
	private readonly _api = inject(ManagerAuditApiService);

	protected readonly logs = signal<ApiAuditLog[]>([]);
	protected readonly loading = signal(true);
	protected readonly error = signal('');
	protected readonly search = signal('');

	protected readonly filteredLogs = () => {
		const term = this.search().trim().toLowerCase();
		if (!term) return this.logs();
		return this.logs().filter(l =>
			l.action.toLowerCase().includes(term) ||
			l.actorName.toLowerCase().includes(term) ||
			l.module.toLowerCase().includes(term)
		);
	};

	public ngOnInit(): void {
		this._api.getAuditLogs().subscribe({
			next: (data) => {
				this.logs.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger le journal d\'audit.');
				this.loading.set(false);
			},
		});
	}

	protected riskClass(risk: string): string {
		switch (risk) {
			case 'CRITICAL':
				return 'bg-destructive/10 text-destructive';
			case 'HIGH':
				return 'bg-rose-500/10 text-rose-600';
			case 'MEDIUM':
				return 'bg-amber-500/10 text-amber-600';
			default:
				return 'bg-emerald-500/10 text-emerald-600';
		}
	}
}
