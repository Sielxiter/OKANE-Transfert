import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { NotificationAffichage } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-notifications-page',
	standalone: true,
	imports: [CommonModule, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Notifications">
			<section class="rounded-xl border bg-background p-4 shadow-sm">
				<h2 class="text-base font-semibold">Notifications agent</h2>
				<div class="mt-4 space-y-3">
					@for (item of notifications; track item.id) {
						<div class="rounded-lg border bg-muted/40 p-4">
							<div class="flex items-center justify-between">
								<p class="text-sm font-semibold">{{ item.titre }}</p>
								<span class="rounded-full px-2 py-1 text-xs font-semibold" [class]="badgeClass(item.type)">{{ formatType(item.type) }}</span>
							</div>
							<p class="mt-1 text-sm text-muted-foreground">{{ item.message }}</p>
							<p class="mt-2 text-xs text-muted-foreground">{{ formatDate(item.creeLe) }}</p>
						</div>
					}
				</div>
			</section>
		</okane-agent-layout>
	`,
})
export class AgentNotificationsPageComponent {
	private readonly _service = inject(AgentDashboardService);

	public notifications: NotificationAffichage[] = [];

	constructor() {
		this._service.getNotifications().subscribe((items) => (this.notifications = items));
	}

	public badgeClass(type: NotificationAffichage['type']): string {
		switch (type) {
			case 'SUCCESS':
				return 'bg-emerald-100 text-emerald-800';
			case 'ALERT':
				return 'bg-rose-100 text-rose-800';
			case 'INFO':
			default:
				return 'bg-slate-200 text-slate-700';
		}
	}

	public formatType(type: NotificationAffichage['type']): string {
		switch (type) {
			case 'SUCCESS':
				return 'SUCCÈS';
			case 'ALERT':
				return 'ALERTE';
			case 'INFO':
			default:
				return 'INFO';
		}
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}
}
