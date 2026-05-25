import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgentLayoutComponent } from './agent-layout.component';
import { AgentCashSessionStoreService } from '../services/agent-cash-session-store.service';

@Component({
	selector: 'okane-agent-layout-shell',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, AgentLayoutComponent, RouterOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout [pageTitle]="pageTitle">
			<div class="relative">
				<div
					class="transition duration-200"
					[class.pointer-events-none]="shouldLockContent"
					[class.select-none]="shouldLockContent"
					[class.blur-[2px]]="shouldLockContent"
					[class.opacity-60]="shouldLockContent"
				>
					<router-outlet />
				</div>

				@if (shouldShowMandatoryOpenModal) {
					<div class="absolute inset-0 z-20 rounded-2xl bg-background/65 backdrop-blur-sm"></div>
					<div class="absolute inset-0 z-30 flex items-start justify-center px-4 py-6 pointer-events-none">
						<div class="pointer-events-auto w-full max-w-md rounded-2xl border bg-background p-5 shadow-xl">
							<p class="text-sm font-semibold text-foreground">Ouvrir la session de caisse du jour</p>
							<p class="mt-2 text-sm text-muted-foreground">
								Saisissez le solde d'ouverture pour activer les opérations sensibles.
							</p>

							@if (openSessionError) {
								<div class="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
									{{ openSessionError }}
								</div>
							}

							<form class="mt-4 grid gap-3" [formGroup]="openForm">
								<label class="text-sm">
									<span class="text-muted-foreground">Solde d'ouverture</span>
									<input
										class="mt-1 w-full rounded-md border px-3 py-2"
										type="number"
										formControlName="openingBalance"
									/>
								</label>
								@if (showOpeningBalanceError) {
									<p class="text-xs text-rose-600">Le solde d'ouverture doit être supérieur ou égal à 0.</p>
								}
								<button
									class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
									type="button"
									(click)="openSessionFromModal()"
									[disabled]="isSubmittingOpenSession"
								>
									Ouvrir session
								</button>
							</form>
						</div>
					</div>
				}

				@if (shouldShowReopenModal) {
					<div class="absolute inset-0 z-20 rounded-2xl bg-background/65 backdrop-blur-sm"></div>
					<div class="absolute inset-0 z-30 flex items-start justify-center px-4 py-6 pointer-events-none">
						<div class="pointer-events-auto w-full max-w-md rounded-2xl border bg-background p-5 shadow-xl">
							<p class="text-sm font-semibold text-foreground">Rouvrir la session de caisse du jour</p>
							<p class="mt-2 text-sm text-muted-foreground">
								La session du jour est fermee. Vous pouvez la rouvrir sans changer le solde d'ouverture.
							</p>

							@if (openSessionError) {
								<div class="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
									{{ openSessionError }}
								</div>
							}

							<div class="mt-4 grid gap-3">
								<label class="text-sm">
									<span class="text-muted-foreground">Solde d'ouverture</span>
									<input
										class="mt-1 w-full rounded-md border px-3 py-2"
										type="number"
										[readonly]="true"
										[value]="openingBalanceSnapshot"
									/>
								</label>
								<button
									class="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
									type="button"
									(click)="reopenSessionFromModal()"
									[disabled]="isSubmittingOpenSession"
								>
									Rouvrir session
								</button>
							</div>
						</div>
					</div>
				}
			</div>
		</okane-agent-layout>
	`,
})
export class AgentLayoutShellComponent implements OnInit {
	private readonly _router = inject(Router);
	private readonly _route = inject(ActivatedRoute);
	private readonly _destroyRef = inject(DestroyRef);
	private readonly _fb = inject(FormBuilder);
	private readonly _cashSessionStore = inject(AgentCashSessionStoreService);
	private readonly _cdr = inject(ChangeDetectorRef);

	public pageTitle = 'Agent';
	public isAgentRoute = false;
	public shouldLockContent = false;
	public shouldShowMandatoryOpenModal = false;
	public shouldShowReopenModal = false;
	public isSubmittingOpenSession = false;
	public openSessionError = '';
	public openingBalanceSnapshot = 0;
	public readonly openForm = this._fb.group({
		openingBalance: [0, [Validators.required, Validators.min(0)]],
	});

	constructor() {
		this._router.events
			.pipe(
				filter((event): event is NavigationEnd => event instanceof NavigationEnd),
				startWith(null),
				takeUntilDestroyed(this._destroyRef)
			)
			.subscribe(() => {
				this.pageTitle = this.getPageTitle() ?? 'Agent';
				this.isAgentRoute = this._router.url.startsWith('/agent');
				this._cdr.markForCheck();
			});

		this._cashSessionStore.state$
			.pipe(takeUntilDestroyed(this._destroyRef))
			.subscribe((state) => {
				const hasSession = !!state.session.id;
				const isOpen = state.session.statut === 'OPEN';
				const isClosed = state.session.statut === 'CLOSED';
				this.openingBalanceSnapshot = state.session.soldeOuverture ?? 0;
				this.shouldShowMandatoryOpenModal = this.isAgentRoute && state.ready && !hasSession;
				this.shouldShowReopenModal = this.isAgentRoute && state.ready && hasSession && isClosed;
				this.shouldLockContent = this.shouldShowMandatoryOpenModal || this.shouldShowReopenModal;
				this.isSubmittingOpenSession = state.loading;
				if (!state.loading && isOpen) {
					this.openSessionError = '';
				}
				this._cdr.markForCheck();
			});
	}

	public ngOnInit(): void {
		this._cashSessionStore.ensureLoaded();
	}

	public get showOpeningBalanceError(): boolean {
		const control = this.openForm.get('openingBalance');
		return !!control && control.invalid && (control.dirty || control.touched);
	}

	public openSessionFromModal(): void {
		this.openForm.markAllAsTouched();
		if (this.openForm.invalid) {
			return;
		}
		const openingBalance = Number(this.openForm.get('openingBalance')?.value ?? 0);
		this.openSessionError = '';
		this._cashSessionStore.openSession({ soldeOuverture: openingBalance }).subscribe({
			next: () => {
				this.openSessionError = '';
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.openSessionError = error?.error?.message ?? 'Impossible d\'ouvrir la session.';
				this._cdr.markForCheck();
			},
		});
	}

	public reopenSessionFromModal(): void {
		const openingBalance = Number(this.openingBalanceSnapshot ?? 0);
		this.openSessionError = '';
		this._cashSessionStore.openSession({ soldeOuverture: openingBalance }).subscribe({
			next: () => {
				this.openSessionError = '';
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.openSessionError = error?.error?.message ?? 'Impossible de rouvrir la session.';
				this._cdr.markForCheck();
			},
		});
	}

	private getPageTitle(): string | null {
		let current: ActivatedRoute | null = this._route;
		while (current?.firstChild) {
			current = current.firstChild;
		}
		const snapshot = current?.snapshot;
		if (!snapshot) {
			return null;
		}
		return (snapshot.data?.['pageTitle'] as string | undefined) ?? null;
	}
}
