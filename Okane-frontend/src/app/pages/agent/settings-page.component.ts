import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';

@Component({
	selector: 'okane-agent-settings-page',
	standalone: true,
	imports: [CommonModule, FormsModule, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Paramètres">
			<section class="rounded-xl border bg-background p-4 shadow-sm">
				<h2 class="text-base font-semibold">Profil agent</h2>
				<div class="mt-4 grid gap-3 md:grid-cols-2">
					<label class="text-sm">
						<span class="text-muted-foreground">Nom complet</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="profile.name" />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Courriel</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="profile.email" />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Agence</span>
						<input class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="profile.agency" />
					</label>
					<label class="text-sm">
						<span class="text-muted-foreground">Langue</span>
						<select class="mt-1 w-full rounded-md border px-3 py-2" [(ngModel)]="profile.language">
							<option>Français</option>
							<option>Anglais</option>
							<option>Arabe</option>
						</select>
					</label>
				</div>
			</section>

			<section class="rounded-xl border bg-background p-4 shadow-sm">
				<h2 class="text-base font-semibold">Préférences de notification</h2>
				<div class="mt-4 grid gap-3 md:grid-cols-2">
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" [(ngModel)]="preferences.transferPaid" />
						<span>Alertes de transfert payé</span>
					</label>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" [(ngModel)]="preferences.cashAlerts" />
						<span>Alertes de session de caisse</span>
					</label>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" [(ngModel)]="preferences.kycAlerts" />
						<span>Alertes KYC</span>
					</label>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" [(ngModel)]="preferences.systemAlerts" />
						<span>Alertes système</span>
					</label>
				</div>
			</section>
		</okane-agent-layout>
	`,
})
export class AgentSettingsPageComponent {
	public profile = {
		name: 'Agent Nora Benali',
		email: 'agent.nora@okane.test',
		agency: 'Okane Casablanca Centre',
		language: 'Français',
	};

	public preferences = {
		transferPaid: true,
		cashAlerts: true,
		kycAlerts: true,
		systemAlerts: false,
	};
}
