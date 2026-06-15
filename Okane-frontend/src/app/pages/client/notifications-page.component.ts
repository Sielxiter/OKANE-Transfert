import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheckCheck, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { ClientLayoutComponent } from './client-layout.component';
import { ClientNotificationBadgeService } from './services/client-notification-badge.service';
import { ClientNotificationsApiService } from './services/client-notifications.api';
import type { ClientNotification, PageResponse } from './client.models';

@Component({
	selector: 'okane-client-notifications-page',
	standalone: true,
	imports: [CommonModule, NgClass, RouterLink, NgIcon, HlmButtonImports, DatePipe, ClientLayoutComponent, AgentPageIntroComponent, AgentSectionCardComponent],
	providers: [provideIcons({ lucideCheckCheck, lucideTrash2 })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-client-layout>
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro eyebrow="Espace Client" title="Notifications" subtitle="Retrouvez les alertes liées à vos transferts.">
					<div agentIntroActions class="flex flex-wrap gap-2">
						<button hlmBtn variant="outline" type="button" (click)="markAllRead()">Marquer tout comme lu</button>
					</div>
				</okane-agent-page-intro>

				<okane-agent-section-card title="Boîte de réception" subtitle="Les notifications non lues sont mises en évidence.">
					<div class="space-y-3">
						@for (notification of notifications(); track notification.id) {
							<div class="rounded-2xl border p-4 transition-colors" [ngClass]="!notification.read ? 'border-primary bg-primary/5' : 'border-border'">
								<div class="flex items-start justify-between gap-4">
									<div class="min-w-0">
										<p class="font-medium text-foreground">{{ notification.title }}</p>
										<p class="mt-1 text-sm text-muted-foreground">{{ notification.message }}</p>
										<p class="mt-2 text-xs text-muted-foreground">{{ notification.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
									</div>
									<div class="flex shrink-0 flex-col gap-2">
										@if (notification.transferReference) {
											<a hlmBtn variant="outline" size="sm" [routerLink]="['/client/transfers', notification.transferReference]">Ouvrir</a>
										}
										@if (!notification.read) {
											<button hlmBtn size="sm" type="button" (click)="markRead(notification.id)"><ng-icon name="lucideCheckCheck" /> Lu</button>
										}
										<button hlmBtn variant="outline" size="sm" type="button" (click)="remove(notification.id)"><ng-icon name="lucideTrash2" /> Supprimer</button>
									</div>
								</div>
							</div>
						}
						@if (notifications().length === 0) {
							<div class="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucune notification pour le moment.</div>
						}
					</div>
				</okane-agent-section-card>
			</div>
		</okane-client-layout>
	`,
})
export class ClientNotificationsPageComponent {
	private readonly _api = inject(ClientNotificationsApiService);
	private readonly _badge = inject(ClientNotificationBadgeService);
	protected readonly page = signal<PageResponse<ClientNotification>>({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 1 });
	protected readonly notifications = computed(() => this.page().content ?? []);

	constructor() {
		this.reload();
	}

	public reload(): void {
		this._api.list({ page: 0, size: 10, sort: 'createdAt,desc' }).subscribe((response) => this.page.set(response));
	}

	public markRead(id: number): void {
		this._api.markRead(id).subscribe(() => {
			this.reload();
			this._badge.refresh();
		});
	}

	public markAllRead(): void {
		this._api.markAllRead().subscribe(() => {
			this.reload();
			this._badge.refresh();
		});
	}

	public remove(id: number): void {
		this._api.delete(id).subscribe(() => {
			this.reload();
			this._badge.refresh();
		});
	}
}
