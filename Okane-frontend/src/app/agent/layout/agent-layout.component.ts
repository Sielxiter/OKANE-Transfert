import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucideLock, lucideLogOut, lucidePlay } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { TokenStorageService } from '../../core/auth/token.storage';
import { AppSidebarInset } from '../../pages/dashboard/sidebar-inset/app-sidebar';
import { AgentCashSessionApiService } from '../services/agent-cash-session.api';
import { AgentSiteHeaderComponent } from './agent-site-header.component';

@Component({
	selector: 'okane-agent-layout',
	standalone: true,
	imports: [HlmSidebarImports, HlmButtonImports, NgIcon, AppSidebarInset, AgentSiteHeaderComponent],
	providers: [provideIcons({ lucideLoaderCircle, lucideLock, lucideLogOut, lucidePlay })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="relative min-h-screen">
			<spartan-app-sidebar-inset>
				<main hlmSidebarInset>
					<okane-agent-site-header [pageTitle]="pageTitle()" />
					<div
						class="flex flex-1 flex-col gap-6 p-4 md:p-6 transition duration-200"
						[class.blur-sm]="sessionLocked()"
						[class.pointer-events-none]="sessionLocked()"
						[class.select-none]="sessionLocked()"
					>
						<ng-content />
					</div>
				</main>
			</spartan-app-sidebar-inset>

			@if (sessionLocked()) {
				<div class="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-background/80 p-4 backdrop-blur-md">
					<div class="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-2xl">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<ng-icon name="lucideLock" />
						</div>
						<h2 class="mt-4 text-xl font-semibold text-foreground">No cash session is currently open.</h2>
						<p class="mt-2 text-sm text-muted-foreground">
							Please open a session before accessing the dashboard.
						</p>
						<div class="mt-6 flex flex-wrap items-center justify-center gap-2">
							<button hlmBtn variant="outline" type="button" (click)="logout()">
								<ng-icon name="lucideLogOut" />
								Logout
							</button>
							<button hlmBtn type="button" (click)="openSession()">
								@if (opening()) {
									<ng-icon name="lucideLoaderCircle" class="animate-spin" />
								}
								<ng-icon name="lucidePlay" />
								Open Session
							</button>
						</div>
						@if (error()) {
							<p class="mt-4 text-sm text-destructive">{{ error() }}</p>
						}
					</div>
				</div>
			}
		</div>
	`,
})
export class AgentLayoutComponent implements OnInit {
	private readonly _api = inject(AgentCashSessionApiService);
	private readonly _router = inject(Router);
	private readonly _tokens = inject(TokenStorageService);

	public readonly pageTitle = input<string>('Tableau de bord');
	protected readonly sessionLocked = signal(false);
	protected readonly opening = signal(false);
	protected readonly error = signal('');

	public ngOnInit(): void {
		this.refreshLockState();
	}

	protected openSession(): void {
		this.opening.set(true);
		this.error.set('');
		this._api.openSession().subscribe({
			next: () => {
				this.opening.set(false);
				this.sessionLocked.set(false);
			},
			error: () => {
				this.opening.set(false);
				this.error.set("Impossible d'ouvrir la session.");
			},
		});
	}

	protected logout(): void {
		this._tokens.clear();
		this._router.navigateByUrl('/login');
	}

	private refreshLockState(): void {
		this._api.getStatus().subscribe({
			next: (status) => {
				this.sessionLocked.set(!status.hasActiveSession);
			},
			error: () => {
				this.sessionLocked.set(true);
			},
		});
	}
}
