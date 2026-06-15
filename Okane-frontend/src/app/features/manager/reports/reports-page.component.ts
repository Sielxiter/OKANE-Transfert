import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBarChart3,
	lucideFileText,
	lucideDownload,
	lucideEye,
	lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ManagerReportsApiService, type ApiReport } from './manager-reports.api';

@Component({
	selector: 'okane-manager-reports-page',
	standalone: true,
	imports: [NgClass, DatePipe, NgIcon, HlmButtonImports, HlmSkeletonImports],
	providers: [
		provideIcons({
			lucideBarChart3,
			lucideFileText,
			lucideDownload,
			lucideEye,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Rapports</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Rapports Manager</h1>
					<p class="mt-1 text-sm text-muted-foreground">Generez et consultez les rapports de vos sous-agences.</p>
				</div>
			</header>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				@for (reportType of reportTypes; track reportType.type) {
					<div class="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer" (click)="generateReport(reportType.type)">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<ng-icon name="lucideFileText" />
						</div>
						<h3 class="mt-3 text-sm font-semibold text-foreground">{{ reportType.name }}</h3>
						<p class="mt-1 text-xs text-muted-foreground">{{ reportType.description }}</p>
						<button hlmBtn variant="outline" size="sm" class="mt-3 w-full">
							<ng-icon name="lucideDownload" class="text-xs" />
							Generer
						</button>
					</div>
				}
			</div>

			@if (loading()) {
				<div class="rounded-2xl border border-border bg-muted/20 p-4">
					@for (_ of [1,2]; track $index) {
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
					<p class="text-sm font-semibold">Erreur</p>
					<p class="mt-1 text-xs">{{ error() }}</p>
				</div>
			} @else if (reports().length > 0) {
				<div class="rounded-2xl border border-border bg-card shadow-sm">
					<table class="w-full text-sm">
						<thead class="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
							<tr>
								<th class="px-4 py-3 text-left">Nom</th>
								<th class="px-4 py-3 text-left">Type</th>
								<th class="px-4 py-3 text-left">Periode</th>
								<th class="px-4 py-3 text-left">Format</th>
								<th class="px-4 py-3 text-left">Statut</th>
								<th class="px-4 py-3 text-left">Genere le</th>
								<th class="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							@for (report of reports(); track report.id) {
								<tr class="hover:bg-accent/40 transition-colors">
									<td class="px-4 py-3 text-foreground">{{ report.name }}</td>
									<td class="px-4 py-3 text-muted-foreground">{{ report.type }}</td>
									<td class="px-4 py-3 text-muted-foreground">{{ report.period }}</td>
									<td class="px-4 py-3 text-muted-foreground">{{ report.format }}</td>
									<td class="px-4 py-3">
										<span class="rounded-full px-2 py-0.5 text-xs font-medium" [ngClass]="report.status === 'GENERATED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'">
											{{ report.status }}
										</span>
									</td>
									<td class="px-4 py-3 text-muted-foreground">{{ report.generatedAt | date:'short' }}</td>
									<td class="px-4 py-3 text-right">
										<button hlmBtn variant="ghost" size="sm">
											<ng-icon name="lucideDownload" class="text-xs" />
											Telecharger
										</button>
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
export class ManagerReportsPageComponent implements OnInit {
	private readonly _api = inject(ManagerReportsApiService);

	protected readonly reports = signal<ApiReport[]>([]);
	protected readonly loading = signal(false);
	protected readonly error = signal('');

	protected readonly reportTypes = [
		{ type: 'PERFORMANCE', name: 'Performance agence', description: 'Rapport de performance des sous-agences' },
		{ type: 'COMMISSION', name: 'Commissions', description: 'Rapport des commissions collectees' },
		{ type: 'VOLUME', name: 'Volume transferts', description: 'Rapport du volume des transferts' },
		{ type: 'COMPLIANCE', name: 'Conformite', description: 'Rapport de conformite AML/KYC' },
	];

	public ngOnInit(): void {
		this._api.getReports().subscribe({
			next: (data) => {
				this.reports.set(data);
			},
			error: () => {
				this.error.set('Impossible de charger les rapports.');
			},
		});
	}

	protected generateReport(type: string): void {
		this.loading.set(true);
		this._api.generateReport(type).subscribe({
			next: (report) => {
				this.reports.update(r => [report, ...r]);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Erreur lors de la generation du rapport');
				this.loading.set(false);
			},
		});
	}
}
