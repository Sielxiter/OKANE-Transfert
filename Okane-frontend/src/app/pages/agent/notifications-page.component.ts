import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { NotificationAffichage } from '../../agent/models/agent-dashboard.models';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { AgentEmptyStateComponent } from '../../agent/ui/agent-empty-state.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentStatusBadgeComponent } from '../../agent/ui/agent-status-badge.component';

@Component({
	selector: 'okane-agent-notifications-page',
	standalone: true,
	imports: [
		CommonModule,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentStatusBadgeComponent,
		AgentEmptyStateComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Notifications">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Notifications"
					subtitle="Flux des evenements et alertes operationnelles de l'agent."
				/>

				<okane-agent-section-card title="Notifications agent">
					<div class="space-y-3">
						@for (item of notifications; track item.id) {
							<div class="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-accent/10">
								<div class="flex items-center justify-between gap-3">
									<p class="text-sm font-semibold text-foreground">{{ item.titre }}</p>
									<okane-agent-status-badge kind="notification" [status]="item.type" />
								</div>
								<p class="mt-1 text-sm text-muted-foreground">{{ item.message }}</p>
								<p class="mt-2 text-xs text-muted-foreground">{{ formatDate(item.creeLe) }}</p>
							</div>
						}
						@if (notifications.length === 0) {
							<okane-agent-empty-state
								title="Aucune notification"
								description="Les nouvelles notifications apparaitront ici."
							/>
						}
					</div>
				</okane-agent-section-card>
			</div>
		</okane-agent-layout>
	`,
})
export class AgentNotificationsPageComponent {
	private readonly _service = inject(AgentDashboardService);

	public notifications: NotificationAffichage[] = [];

	constructor() {
		this._service.getNotifications().subscribe((items) => (this.notifications = items));
	}

	public formatDate(value: string): string {
		return new Date(value).toLocaleString('fr-FR');
	}
}
