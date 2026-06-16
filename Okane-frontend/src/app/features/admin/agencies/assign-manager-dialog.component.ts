import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBuilding2, lucideLoaderCircle, lucideSearch, lucideUserCheck, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AdminUsersApiService, type ApiUser } from '../users/shared/admin-users.api';

@Component({
	selector: 'okane-assign-manager-dialog',
	standalone: true,
	imports: [CommonModule, FormsModule, NgIcon, HlmButtonImports],
	providers: [provideIcons({ lucideBuilding2, lucideLoaderCircle, lucideSearch, lucideUserCheck, lucideX })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (open()) {
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm"
				role="dialog"
				aria-modal="true"
				(click)="close.emit()"
			>
				<div
					class="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-xl transition-colors"
					(click)="$event.stopPropagation()"
				>
					<button
						type="button"
						class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label="Fermer"
						(click)="close.emit()"
					>
						<ng-icon name="lucideX" />
					</button>

					<div class="flex items-start gap-3">
						<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border">
							<ng-icon name="lucideUserCheck" class="text-lg" />
						</div>
						<div class="flex-1 leading-tight">
							<h2 class="text-lg font-semibold text-foreground">Affecter un manager</h2>
							<p class="mt-1 text-sm text-muted-foreground">
								{{ agencyName() }} — Choisissez un manager disponible
							</p>
						</div>
					</div>

					<div class="mt-5 space-y-4">
						<!-- Search input -->
						<div class="relative">
							<ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
							<input
								type="text"
								[(ngModel)]="searchTerm"
								placeholder="Rechercher un manager..."
								class="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							/>
						</div>

						<!-- Manager list -->
						<div class="max-h-60 overflow-y-auto rounded-lg border border-border">
							@if (loading()) {
								<div class="flex items-center justify-center py-8">
									<ng-icon name="lucideLoaderCircle" class="animate-spin text-primary" />
								</div>
							} @else if (filteredManagers().length === 0) {
								<div class="py-6 text-center text-sm text-muted-foreground">
									@if (searchTerm()) {
										Aucun manager ne correspond à votre recherche.
									} @else {
										Aucun manager disponible.
									}
								</div>
							} @else {
								@for (manager of filteredManagers(); track manager.id) {
									<button
										type="button"
										class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
										[class.bg-primary/10]="selectedManagerId() === manager.id"
										(click)="selectManager(manager.id)"
									>
										<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
											<span class="text-xs font-semibold">
												{{ manager.firstName[0] }}{{ manager.lastName[0] }}
											</span>
										</div>
										<div class="flex-1 leading-tight">
											<p class="text-sm font-medium text-foreground">{{ manager.fullName }}</p>
											<p class="text-xs text-muted-foreground">{{ manager.email }}</p>
										</div>
										@if (selectedManagerId() === manager.id) {
											<ng-icon name="lucideUserCheck" class="text-sm text-primary" />
										}
									</button>
								}
							}
						</div>

						<!-- Current manager info -->
						@if (currentManagerName()) {
							<div class="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
								Manager actuel : <span class="font-medium text-foreground">{{ currentManagerName() }}</span>
							</div>
						}

						<!-- Error -->
						@if (error()) {
							<p class="text-xs text-destructive">{{ error() }}</p>
						}

						<!-- Actions -->
						<div class="flex justify-end gap-2 pt-2">
							<button hlmBtn type="button" variant="outline" size="sm" (click)="close.emit()">
								Annuler
							</button>
							<button
								hlmBtn
								type="button"
								size="sm"
								[disabled]="!selectedManagerId() || submitting()"
								(click)="confirm()"
							>
								@if (submitting()) {
									<ng-icon name="lucideLoaderCircle" class="animate-spin" />
								}
								Affecter
							</button>
						</div>
					</div>
				</div>
			</div>
		}
	`,
})
export class AssignManagerDialogComponent implements OnInit {
	private readonly _usersApi = inject(AdminUsersApiService);

	public readonly open = input<boolean>(false);
	public readonly agencyId = input.required<number>();
	public readonly agencyName = input<string>('');
	public readonly currentManagerName = input<string | null>(null);

	public readonly assigned = output<number>(); // emits managerId
	public readonly close = output<void>();

	protected readonly loading = signal(false);
	protected readonly submitting = signal(false);
	protected readonly error = signal<string | null>(null);
	protected readonly managers = signal<ApiUser[]>([]);
	protected readonly searchTerm = signal('');
	protected readonly selectedManagerId = signal<number | null>(null);

	protected readonly filteredManagers = computed(() => {
		const term = this.searchTerm().trim().toLowerCase();
		if (!term) return this.managers();
		return this.managers().filter(
			(m) =>
				m.fullName.toLowerCase().includes(term) ||
				m.email.toLowerCase().includes(term) ||
				(m.phone ?? '').toLowerCase().includes(term),
		);
	});

	public ngOnInit(): void {
		this.loadManagers();
	}

	protected selectManager(id: number): void {
		this.selectedManagerId.set(id);
	}

	protected confirm(): void {
		const managerId = this.selectedManagerId();
		if (!managerId) return;
		this.submitting.set(true);
		this.error.set(null);
		this.assigned.emit(managerId);
	}

	private loadManagers(): void {
		this.loading.set(true);
		this._usersApi.getAvailableManagers(this.agencyId()).subscribe({
			next: (rows) => {
				this.managers.set(rows);
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(this.extractMessage(err));
				this.loading.set(false);
			},
		});
	}

	private extractMessage(err: unknown): string {
		const fallback = 'Erreur réseau. Vérifiez votre connexion.';
		if (typeof err === 'object' && err !== null) {
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
