import { NgClass, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideUser,
	lucideBuilding2,
	lucideUsers,
	lucideMail,
	lucidePhone,
	lucideShield,
	lucideKey,
	lucideSave,
	lucideCheck,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ManagerProfileApiService, type ApiManagerProfile } from './manager-profile.api';

@Component({
	selector: 'okane-manager-profile-page',
	standalone: true,
	imports: [DatePipe, NgIcon, HlmButtonImports, HlmSkeletonImports, HlmInputImports],
	providers: [
		provideIcons({
			lucideUser,
			lucideBuilding2,
			lucideUsers,
			lucideMail,
			lucidePhone,
			lucideShield,
			lucideKey,
			lucideSave,
			lucideCheck,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-6">
			<header>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Compte</p>
				<h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground">Profil Manager</h1>
				<p class="mt-1 text-sm text-muted-foreground">Gerez vos informations personnelles.</p>
			</header>

			@if (loading()) {
				<div class="space-y-4">
					<div hlmSkeleton class="h-32 rounded-2xl"></div>
					<div hlmSkeleton class="h-64 rounded-2xl"></div>
				</div>
			} @else if (error()) {
				<div class="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
					<p class="text-sm font-semibold">Erreur</p>
					<p class="mt-1 text-xs">{{ error() }}</p>
				</div>
			} @else if (profile()) {
				<div class="space-y-6">
					<div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<div class="flex items-start gap-4">
							<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<ng-icon name="lucideUser" class="text-2xl" />
							</div>
							<div>
								<h2 class="text-xl font-semibold text-foreground">{{ profile()!.fullName }}</h2>
								<p class="text-sm text-muted-foreground">{{ profile()!.role }}</p>
								<div class="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
									<div class="flex items-center gap-1">
										<ng-icon name="lucideMail" class="text-xs" />
										{{ profile()!.email }}
									</div>
									<div class="flex items-center gap-1">
										<ng-icon name="lucidePhone" class="text-xs" />
										{{ profile()!.phone }}
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
							<p class="text-sm text-muted-foreground">Agence centrale</p>
							<p class="mt-2 text-lg font-semibold text-foreground">{{ profile()!.centralAgencyName }}</p>
						</div>
						<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
							<p class="text-sm text-muted-foreground">Sous-agences</p>
							<p class="mt-2 text-lg font-semibold text-foreground">{{ profile()!.subAgencyCount }}</p>
						</div>
						<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
							<p class="text-sm text-muted-foreground">Agents</p>
							<p class="mt-2 text-lg font-semibold text-foreground">{{ profile()!.totalAgentCount }}</p>
						</div>
						<div class="rounded-2xl border border-border bg-card p-4 shadow-sm">
							<p class="text-sm text-muted-foreground">Derniere connexion</p>
							<p class="mt-2 text-lg font-semibold text-foreground">{{ profile()!.lastLoginAt | date:'short' }}</p>
						</div>
					</div>

					<div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<h3 class="text-lg font-semibold text-foreground">Modifier le profil</h3>
						<div class="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<label class="text-sm font-medium text-foreground">Prenom</label>
								<input hlmInput type="text" [value]="profile()!.firstName" class="mt-1 w-full" />
							</div>
							<div>
								<label class="text-sm font-medium text-foreground">Nom</label>
								<input hlmInput type="text" [value]="profile()!.lastName" class="mt-1 w-full" />
							</div>
							<div>
								<label class="text-sm font-medium text-foreground">Telephone</label>
								<input hlmInput type="text" [value]="profile()!.phone" class="mt-1 w-full" />
							</div>
							<div>
								<label class="text-sm font-medium text-foreground">Email</label>
								<input hlmInput type="email" [value]="profile()!.email" disabled class="mt-1 w-full bg-muted" />
							</div>
						</div>
						<div class="mt-4 flex justify-end">
							<button hlmBtn>
								<ng-icon name="lucideSave" class="text-xs" />
								Enregistrer
							</button>
						</div>
					</div>
				</div>
			}
		</div>
	`,
})
export class ManagerProfilePageComponent implements OnInit {
	private readonly _api = inject(ManagerProfileApiService);

	protected readonly profile = signal<ApiManagerProfile | null>(null);
	protected readonly loading = signal(true);
	protected readonly error = signal('');

	public ngOnInit(): void {
		this._api.getProfile().subscribe({
			next: (data) => {
				this.profile.set(data);
				this.loading.set(false);
			},
			error: () => {
				this.error.set('Impossible de charger le profil.');
				this.loading.set(false);
			},
		});
	}
}
