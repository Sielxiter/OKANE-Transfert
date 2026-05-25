import { PLATFORM_ID, Injectable, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, catchError, finalize, map, switchMap, tap, throwError } from 'rxjs';
import { AgentDashboardService } from './agent-dashboard.service';
import {
	CloseCashSessionRequest,
	OpenCashSessionRequest,
	SessionCaisse,
} from '../models/agent-dashboard.models';

export const AGENT_CASH_SESSION_REQUIRED_MESSAGE =
	'Veuillez ouvrir une session de caisse avant d\'effectuer cette opération.';

interface AgentCashSessionState {
	session: SessionCaisse;
	ready: boolean;
	loading: boolean;
	error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AgentCashSessionStoreService {
	private readonly _service = inject(AgentDashboardService);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly _state = new BehaviorSubject<AgentCashSessionState>({
		session: this.createEmptySession(),
		ready: false,
		loading: false,
		error: null,
	});
	private _hasLoadedFromBrowser = false;

	public readonly state$ = this._state.asObservable();
	public readonly session$ = this.state$.pipe(map((state) => state.session));
	public readonly isSessionOpen$ = this.session$.pipe(map((session) => session.statut === 'OPEN'));

	public get snapshot(): AgentCashSessionState {
		return this._state.value;
	}

	public ensureLoaded(): void {
		if (this._isBrowser && !this._hasLoadedFromBrowser && !this.snapshot.loading) {
			this.refreshSession();
			return;
		}
		if (!this.snapshot.ready && !this.snapshot.loading) {
			this.refreshSession();
		}
	}

	public refreshSession(): void {
		this.patchState({ loading: true, error: null });
		this._service.getCashSession().subscribe({
			next: (session) => {
				this._hasLoadedFromBrowser = this._isBrowser;
				this.setSession(session);
			},
			error: (error) => {
				this._hasLoadedFromBrowser = this._isBrowser;
				this._state.next({
					session: this.createEmptySession(),
					ready: true,
					loading: false,
					error: this.extractErrorMessage(error),
				});
			},
		});
	}

	public openSession(payload: OpenCashSessionRequest): Observable<SessionCaisse> {
		this.patchState({ loading: true, error: null });
		return this._service.openCashSession(payload).pipe(
			switchMap(() => this._service.getCashSession()),
			tap((session) => {
				this._hasLoadedFromBrowser = this._isBrowser;
				this.setSession(session);
			}),
			catchError((error) => {
				if (this.isAlreadyOpenError(error)) {
					return this._service.getCashSession().pipe(
						tap((session) => {
							this._hasLoadedFromBrowser = this._isBrowser;
							this.setSession(session);
						}),
						catchError(() => {
							this.patchState({
								ready: true,
								loading: false,
								error: null,
							});
							return throwError(() => error);
						})
					);
				}
				this.patchState({
					ready: true,
					loading: false,
					error: this.extractErrorMessage(error),
				});
				return throwError(() => error);
			}),
			finalize(() => {
				if (this.snapshot.loading) {
					this.patchState({ loading: false });
				}
			})
		);
	}

	public closeSession(payload: CloseCashSessionRequest): Observable<SessionCaisse> {
		this.patchState({ loading: true, error: null });
		return this._service.closeCashSession(payload).pipe(
			tap((session) => this.setSession(session)),
			catchError((error) => {
				this.patchState({
					ready: true,
					loading: false,
					error: this.extractErrorMessage(error),
				});
				return throwError(() => error);
			}),
			finalize(() => {
				if (this.snapshot.loading) {
					this.patchState({ loading: false });
				}
			})
		);
	}

	public canPerformSensitiveAction(): boolean {
		return this.snapshot.session.statut === 'OPEN';
	}

	private setSession(session: SessionCaisse): void {
		this._state.next({
			session,
			ready: true,
			loading: false,
			error: null,
		});
	}

	private patchState(patch: Partial<AgentCashSessionState>): void {
		this._state.next({
			...this.snapshot,
			...patch,
		});
	}

	private extractErrorMessage(error: unknown): string {
		if (!error || typeof error !== 'object') {
			return 'Impossible de charger la session de caisse.';
		}
		const response = error as { error?: unknown; message?: unknown };
		if (response.error && typeof response.error === 'object') {
			const body = response.error as { message?: unknown; error?: unknown };
			if (typeof body.message === 'string') {
				return body.message;
			}
			if (typeof body.error === 'string') {
				return body.error;
			}
		}
		if (typeof response.error === 'string') {
			return response.error;
		}
		return typeof response.message === 'string'
			? response.message
			: 'Impossible de charger la session de caisse.';
	}

	private isAlreadyOpenError(error: unknown): boolean {
		const message = this.extractErrorMessage(error)
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
		return message.includes('session de caisse deja ouverte');
	}

	private createEmptySession(): SessionCaisse {
		return {
			id: '',
			soldeOuverture: 0,
			soldeActuel: 0,
			totalEntrees: 0,
			totalSorties: 0,
			montantAttendu: 0,
			montantReel: null,
			ecart: 0,
			statut: 'CLOSED',
			ouverteLe: '',
			clotureeLe: null,
			devise: 'MAD',
			commentaireCloture: null,
		};
	}
}
