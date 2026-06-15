import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalculator, lucideLoaderCircle, lucideTriangleAlert } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AdminCurrencyApiService, type ApiCorridor } from '../currency/admin-currency.api';
import { AdminFeesApiService, type TariffSimulationResult } from './admin-fees.api';
import { CorridorSearchSelectComponent } from './corridor-search-select.component';

@Component({
	selector: 'okane-tariff-simulation-form',
	standalone: true,
	imports: [FormsModule, NgIcon, HlmButtonImports, HlmInputImports, CorridorSearchSelectComponent],
	providers: [provideIcons({ lucideCalculator, lucideLoaderCircle, lucideTriangleAlert })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground sm:col-span-2">
					Montant
					<input
						hlmInput
						type="number"
						min="0"
						[value]="amount()"
						(input)="amount.set(numberValue($any($event.target).value))"
					/>
				</label>

				<div class="sm:col-span-2">
					<okane-corridor-search-select
						label="Corridor"
						placeholder="Rechercher par nom ou code"
						[corridors]="corridors()"
						[value]="corridorId()"
						(valueChange)="corridorId.set($event)"
					/>
				</div>
			</div>

			@if (serverError()) {
				<div class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
					<ng-icon name="lucideTriangleAlert" class="text-base" />
					<span>{{ serverError() }}</span>
				</div>
			}

			<div class="flex justify-end gap-2">
				<button hlmBtn type="button" variant="outline" size="sm" (click)="cancelled.emit()">Annuler</button>
				<button hlmBtn type="button" size="sm" [disabled]="submitting() || !canSubmit()" (click)="simulate()">
					@if (submitting()) {
						<ng-icon name="lucideLoaderCircle" class="animate-spin" />
					}
					Simuler
				</button>
			</div>

			@if (result()) {
				<div class="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
					<div class="rounded-xl bg-card p-3 ring-1 ring-border">
						<p class="text-xs uppercase tracking-wide text-muted-foreground">Transfer fee de base</p>
						<p class="mt-1 font-mono text-foreground">{{ formatMoney(result()!.baseTransferFee) }} MAD</p>
					</div>
					<div class="rounded-xl bg-card p-3 ring-1 ring-border">
						<p class="text-xs uppercase tracking-wide text-muted-foreground">Pourcentage corridor</p>
						<p class="mt-1 font-mono text-foreground">{{ formatPercent(result()!.corridorPercent) }}</p>
					</div>
					<div class="rounded-xl bg-card p-3 ring-1 ring-border">
						<p class="text-xs uppercase tracking-wide text-muted-foreground">Supplement corridor</p>
						<p class="mt-1 font-mono text-foreground">{{ formatMoney(result()!.corridorFee) }} MAD</p>
					</div>
					<div class="rounded-xl bg-card p-3 ring-1 ring-border">
						<p class="text-xs uppercase tracking-wide text-muted-foreground">Total final</p>
						<p class="mt-1 font-mono text-foreground">{{ formatMoney(result()!.finalTransferFee) }} MAD</p>
					</div>
					<div class="rounded-xl bg-card p-3 ring-1 ring-border">
						<p class="text-xs uppercase tracking-wide text-muted-foreground">Commission agence</p>
						<p class="mt-1 font-mono text-foreground">{{ formatMoney(result()!.agencyCommission) }} MAD</p>
					</div>
					<div class="rounded-xl bg-card p-3 ring-1 ring-border">
						<p class="text-xs uppercase tracking-wide text-muted-foreground">Commission centrale</p>
						<p class="mt-1 font-mono text-foreground">{{ formatMoney(result()!.centralCommission) }} MAD</p>
					</div>
				</div>
			}
		</div>
	`,
})
export class TariffSimulationFormComponent implements OnInit {
	private readonly _feesApi = inject(AdminFeesApiService);
	private readonly _corridorApi = inject(AdminCurrencyApiService);
	private readonly _cdr = inject(ChangeDetectorRef);

	public readonly cancelled = output<void>();

	protected readonly amount = signal<number>(1000);
	protected readonly corridorId = signal<number | null>(null);
	protected readonly corridors = signal<ApiCorridor[]>([]);
	protected readonly result = signal<TariffSimulationResult | null>(null);
	protected readonly submitting = signal(false);
	protected readonly serverError = signal<string | null>(null);

	protected readonly canSubmit = computed(() => Number.isFinite(this.amount()) && this.amount() > 0 && this.corridorId() != null);

	public ngOnInit(): void {
		this._corridorApi.listCorridors().subscribe({
			next: (rows) => {
				this.corridors.set(rows);
				const active = rows.find((corridor) => corridor.status === 'ACTIVE') ?? rows[0] ?? null;
				this.corridorId.set(active ? active.id : null);
				this._cdr.markForCheck();
			},
			error: (err) => {
				this.serverError.set(this.extractMessage(err));
				this._cdr.markForCheck();
			},
		});
	}

	protected simulate(): void {
		if (!this.canSubmit()) {
			return;
		}
		this.serverError.set(null);
		this.submitting.set(true);
		this._feesApi.simulate({
			amount: this.amount(),
			corridorId: this.corridorId() as number,
		}).subscribe({
			next: (result) => {
				this.result.set(result);
				this.submitting.set(false);
				this._cdr.markForCheck();
			},
			error: (err) => {
				this.result.set(null);
				this.serverError.set(this.extractMessage(err));
				this.submitting.set(false);
				this._cdr.markForCheck();
			},
		});
	}

	protected numberValue(value: unknown): number {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}

	protected formatMoney(value: number): string {
		return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
	}

	protected formatPercent(value: number): string {
		return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0)}%`;
	}

	private extractMessage(err: unknown): string {
		const fallback = 'La simulation a échoué.';
		if (typeof err === 'object' && err !== null) {
			const error = err as { error?: { message?: string }; message?: string };
			return error.error?.message ?? error.message ?? fallback;
		}
		return fallback;
	}
}
