import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { KycClientApiService, type ClientSearchResult } from '../services/kyc-client.api';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
	selector: 'okane-sender-search',
	standalone: true,
	imports: [FormsModule, HlmButtonImports, HlmInputImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<div class="relative flex-1">
					<input
						hlmInput
						class="w-full"
						type="text"
						placeholder="Rechercher un expéditeur (nom, téléphone, pièce)..."
						[ngModel]="query()"
						(ngModelChange)="onQueryChange($event)"
						(focus)="onFocus()"
					/>
					@if (showDropdown() && results().length > 0) {
						<div class="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
							@for (client of results(); track client.id) {
								<button
									type="button"
									class="flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/40"
									(click)="selectClient(client)"
								>
									<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-border">
										{{ initials(client.fullName) }}
									</div>
									<div class="min-w-0 flex-1 leading-tight">
										<p class="font-medium text-foreground">{{ client.fullName }}</p>
										<p class="text-xs text-muted-foreground">{{ client.phone ?? '—' }}</p>
										<p class="mt-0.5 text-xs text-muted-foreground">
											{{ client.identityType }} : {{ client.identityNumber }}
										</p>
									</div>
									@if (client.restricted) {
										<span class="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Restreint</span>
									}
								</button>
							}
						</div>
					}
					@if (showDropdown() && results().length === 0 && !loading() && query().length > 0) {
						<div class="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card p-4 text-center text-xs text-muted-foreground shadow-lg">
							Aucun client trouvé.
						</div>
					}
				</div>
				<button hlmBtn type="button" size="sm" (click)="addSender.emit()">
					Ajouter expéditeur
				</button>
			</div>

			@if (selected()) {
				<div class="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-600 ring-1 ring-border dark:text-emerald-300">
						{{ initials(selected()!.fullName) }}
					</div>
					<div class="flex-1 leading-tight">
						<p class="font-medium text-foreground">{{ selected()!.fullName }}</p>
						<p class="text-xs text-muted-foreground">{{ selected()!.phone ?? '—' }} • {{ selected()!.identityType }} : {{ selected()!.identityNumber }}</p>
						<p class="text-xs text-muted-foreground">{{ selected()!.country ?? '' }} {{ selected()!.nationality ? '(' + selected()!.nationality + ')' : '' }}</p>
						<div class="mt-2 flex flex-wrap items-center gap-2">
							<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
								[class]="kycBadgeClass(selected()!.kycStatus)">
								KYC : {{ kycLabel(selected()!.kycStatus) }}
							</span>
							<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
								[class]="amlBadgeClass(selected()!.amlRiskLevel)">
								AML : {{ amlLabel(selected()!.amlRiskLevel) }}
							</span>
							@if (!isKycVerified(selected()!.kycStatus)) {
								<button type="button" class="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
									(click)="verifyKyc.emit(selected()!)">
									Vérifier KYC
								</button>
							}
						</div>
					</div>
					<button type="button" class="text-xs text-destructive hover:underline" (click)="clearSelection()">
						Retirer
					</button>
				</div>
			}

			@if (loading()) {
				<p class="text-xs text-muted-foreground">Recherche en cours...</p>
			}
		</div>
	`,
})
export class SenderSearchComponent {
	private readonly _api = inject(KycClientApiService);
	private readonly _search$ = new Subject<string>();

	public readonly senderSelected = output<ClientSearchResult>();
	public readonly senderCleared = output<void>();
	public readonly addSender = output<void>();
	public readonly verifyKyc = output<ClientSearchResult>();

	protected readonly query = signal<string>('');
	protected readonly results = signal<ClientSearchResult[]>([]);
	protected readonly selected = signal<ClientSearchResult | null>(null);
	protected readonly loading = signal<boolean>(false);
	protected readonly showDropdown = signal<boolean>(false);

	constructor() {
		this._search$.pipe(
			debounceTime(300),
			distinctUntilChanged(),
			switchMap((q) => {
				this.loading.set(true);
				return this._api.searchClients(q);
			}),
		).subscribe({
			next: (data) => {
				this.results.set(data);
				this.loading.set(false);
				this.showDropdown.set(true);
			},
			error: () => {
				this.loading.set(false);
				this.results.set([]);
			},
		});
	}

	protected onQueryChange(value: string): void {
		this.query.set(value);
		this._search$.next(value);
	}

	/** Load initial results on focus if nothing loaded yet. */
	protected onFocus(): void {
		this.showDropdown.set(true);
		if (this.results().length === 0 && !this.selected()) {
			this._search$.next(this.query() || '');
		}
	}

	protected selectClient(client: ClientSearchResult): void {
		this.selected.set(client);
		this.showDropdown.set(false);
		this.query.set(client.fullName);
		this.results.set([]);
		this.senderSelected.emit(client);
	}

	protected clearSelection(): void {
		this.selected.set(null);
		this.query.set('');
		this.senderCleared.emit();
	}

	/** Select a client programmatically (e.g., after creation in modal). */
	public selectExternalClient(client: ClientSearchResult): void {
		this.selectClient(client);
	}

	protected initials(name: string): string {
		return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
	}

	protected isKycVerified(status: string | null | undefined): boolean {
		return status === 'VERIFIE' || status === 'VERIFIED';
	}

	protected kycLabel(status: string | null | undefined): string {
		const labels: Record<string, string> = {
			VERIFIE: 'Vérifié', VERIFIED: 'Vérifié',
			EN_ATTENTE: 'En attente', PENDING: 'En attente',
			NON_VERIFIE: 'Non vérifié',
			REJETE: 'Rejeté', REJECTED: 'Rejeté',
			A_REVOIR: 'À revoir',
		};
		return labels[status ?? ''] ?? 'Non vérifié';
	}

	protected kycBadgeClass(status: string | null | undefined): string {
		if (status === 'VERIFIE' || status === 'VERIFIED') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
		if (status === 'REJETE' || status === 'REJECTED') return 'bg-destructive/10 text-destructive border border-destructive/30';
		if (status === 'A_REVOIR') return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30';
		return 'bg-muted text-muted-foreground border border-border';
	}

	protected amlLabel(level: string | null | undefined): string {
		const labels: Record<string, string> = { LOW: 'Faible', MEDIUM: 'Moyen', HIGH: 'Élevé', NON_VERIFIE: 'Non vérifié' };
		return labels[level ?? ''] ?? 'Non vérifié';
	}

	protected amlBadgeClass(level: string | null | undefined): string {
		if (level === 'LOW') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
		if (level === 'MEDIUM') return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30';
		if (level === 'HIGH') return 'bg-destructive/10 text-destructive border border-destructive/30';
		return 'bg-muted text-muted-foreground border border-border';
	}
}
