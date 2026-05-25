import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { NotificationAffichage } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-notifications-page',
	standalone: true,
	imports: [CommonModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<section class="rounded-xl border bg-background p-4 shadow-sm">
			<h2 class="text-base font-semibold">Notifications agent</h2>
			@if (errorMessage) {
				<p class="mt-4 text-sm text-destructive">{{ errorMessage }}</p>
			} @else if (loading) {
				<p class="mt-4 text-sm text-muted-foreground">Chargement des notifications...</p>
			} @else if (!notifications.length) {
				<p class="mt-4 text-sm text-muted-foreground">Aucune notification pour le moment.</p>
			} @else {
				<div class="mt-4 space-y-3">
					@for (item of notifications; track item.id) {
						<div class="rounded-lg border bg-muted/40 p-4">
							<div class="flex items-start justify-between gap-3">
								<div>
									<div class="flex flex-wrap items-center gap-2">
										<p class="text-sm font-semibold">{{ formatTitle(item.titre) }}</p>
										<span class="rounded-full px-2 py-1 text-xs font-semibold" [class]="badgeClass(item.type)">
											{{ formatType(item.type) }}
										</span>
										<span class="rounded-full px-2 py-1 text-[11px] font-semibold" [class]="readBadgeClass(item.statut)">
											{{ item.statut === 'READ' ? 'LU' : 'NON LU' }}
										</span>
									</div>
									<p class="mt-1 text-sm text-muted-foreground">{{ formatMessage(item.message) }}</p>
									@if (item.referenceLiee) {
										<p class="mt-2 text-xs text-muted-foreground">Référence liée : {{ item.referenceLiee }}</p>
									}
									<p class="mt-1 text-xs text-muted-foreground">{{ formatDate(item.creeLe) }}</p>
								</div>
								@if (item.statut !== 'READ') {
									<button class="rounded-md border px-3 py-1 text-xs font-semibold" type="button" (click)="markAsRead(item)">
										Marquer comme lu
									</button>
								}
							</div>
						</div>
					}
				</div>
			}
		</section>
	`,
})
export class AgentNotificationsPageComponent implements OnInit {
	private readonly _service = inject(AgentDashboardService);
	private readonly _cdr = inject(ChangeDetectorRef);

	public notifications: NotificationAffichage[] = [];
	public loading = false;
	public errorMessage = '';

	public ngOnInit(): void {
		this.loadNotifications();
	}

	public markAsRead(item: NotificationAffichage): void {
		this._service.markNotificationAsRead(item.id).subscribe({
			next: () => {
				this.notifications = this.notifications.map((notification) =>
					notification.id === item.id ? { ...notification, statut: 'READ' } : notification
				);
				this._cdr.markForCheck();
			},
		});
	}

	public badgeClass(type: NotificationAffichage['type']): string {
		switch (type) {
			case 'SUCCESS':
				return 'bg-emerald-100 text-emerald-800';
			case 'ALERT':
				return 'bg-amber-100 text-amber-800';
			case 'ERROR':
				return 'bg-rose-100 text-rose-800';
			case 'INFO':
			default:
				return 'bg-slate-200 text-slate-700';
		}
	}

	public readBadgeClass(status: NotificationAffichage['statut']): string {
		return status === 'READ'
			? 'bg-slate-200 text-slate-700'
			: 'bg-primary/10 text-primary';
	}

	public formatType(type: NotificationAffichage['type']): string {
		switch (type) {
			case 'SUCCESS':
				return 'SUCCÈS';
			case 'ALERT':
				return 'ALERTE';
			case 'ERROR':
				return 'ERREUR';
			case 'INFO':
			default:
				return 'INFO';
		}
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}

	public formatTitle(value: string): string {
		return value
			.replaceAll('Transfert cree', 'Transfert créé')
			.replaceAll('Paiement confirme', 'Paiement confirmé')
			.replaceAll('Paiement echoue', 'Paiement échoué')
			.replaceAll('Session de caisse cloturee', 'Session de caisse clôturée')
			.replaceAll('Ecart de caisse detecte', 'Écart de caisse détecté')
			.replaceAll('Transfert expire', 'Transfert expiré');
	}

	public formatMessage(value: string): string {
		return value
			.replaceAll('cree', 'créé')
			.replaceAll('succes', 'succès')
			.replaceAll('paye', 'payé')
			.replaceAll('echouee', 'échouée')
			.replaceAll('echoue', 'échoué')
			.replaceAll('confirme', 'confirmé')
			.replaceAll('retrait invalide', 'retrait invalide')
			.replaceAll('ouvert', 'ouvert')
			.replaceAll('cloturee', 'clôturée')
			.replaceAll('detecte', 'détecté')
			.replaceAll('expire', 'expiré')
			.replaceAll('Reference', 'Référence')
			.replaceAll('reel', 'réel');
	}

	private loadNotifications(): void {
		this.loading = true;
		this.errorMessage = '';
		this._service.getNotifications().subscribe({
			next: (items) => {
				this.notifications = items;
				this.loading = false;
				this._cdr.markForCheck();
			},
			error: (error) => {
				this.notifications = [];
				this.loading = false;
				this.errorMessage = error?.error?.message ?? 'Impossible de charger les notifications.';
				this._cdr.markForCheck();
			},
		});
	}
}
