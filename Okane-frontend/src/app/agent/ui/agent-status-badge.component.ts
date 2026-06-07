import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type StatusKind = 'transfer' | 'session' | 'kyc' | 'notification';

@Component({
	selector: 'okane-agent-status-badge',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" [class]="badgeClass()">
			{{ text() }}
		</span>
	`,
})
export class AgentStatusBadgeComponent {
	public readonly kind = input.required<StatusKind>();
	public readonly status = input.required<string>();
	public readonly label = input<string>('');

	protected readonly text = computed(() => this.label() || this.resolveLabel(this.kind(), this.status()));
	protected readonly badgeClass = computed(() => this.resolveClass(this.kind(), this.status()));

	private resolveLabel(kind: StatusKind, statusRaw: string): string {
		const status = (statusRaw || '').toUpperCase();
		if (kind === 'transfer') {
			if (status === 'PENDING') return 'EN_ATTENTE';
			if (status === 'PAID') return 'PAYE';
			if (status === 'CANCELLED') return 'ANNULE';
			return 'EXPIRE';
		}
		if (kind === 'session') {
			return status === 'OPEN' ? 'OUVERTE' : 'FERMEE';
		}
		if (kind === 'kyc') {
			if (status === 'APPROVED') return 'VALIDE';
			if (status === 'REJECTED') return 'REJETE';
			return 'EN_ATTENTE';
		}
		if (status === 'SUCCESS') return 'SUCCES';
		if (status === 'ALERT') return 'ALERTE';
		return 'INFO';
	}

	private resolveClass(kind: StatusKind, statusRaw: string): string {
		const status = (statusRaw || '').toUpperCase();
		if (kind === 'transfer') {
			if (status === 'PAID') return 'border-primary/25 bg-primary/10 text-primary';
			if (status === 'PENDING') return 'border-border bg-muted text-muted-foreground';
			if (status === 'CANCELLED') return 'border-destructive/25 bg-destructive/10 text-destructive';
			return 'border-border bg-muted/60 text-muted-foreground';
		}
		if (kind === 'session') {
			return status === 'OPEN'
				? 'border-primary/25 bg-primary/10 text-primary'
				: 'border-border bg-muted text-muted-foreground';
		}
		if (kind === 'kyc') {
			if (status === 'APPROVED') return 'border-primary/25 bg-primary/10 text-primary';
			if (status === 'REJECTED') return 'border-destructive/25 bg-destructive/10 text-destructive';
			return 'border-border bg-muted text-muted-foreground';
		}
		if (status === 'SUCCESS') return 'border-primary/25 bg-primary/10 text-primary';
		if (status === 'ALERT') return 'border-destructive/25 bg-destructive/10 text-destructive';
		return 'border-border bg-muted text-muted-foreground';
	}
}

