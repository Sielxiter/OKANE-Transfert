import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';

@Component({
	selector: 'okane-agent-settings-page',
	standalone: true,
	imports: [CommonModule, FormsModule, HlmInputImports, AgentLayoutComponent, AgentPageIntroComponent, AgentSectionCardComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Parametres">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Parametres"
					subtitle="Configuration locale du profil agent et des preferences de notifications."
				/>

				<okane-agent-section-card title="Profil agent">
					<div class="grid gap-3 md:gap-4 md:grid-cols-2">
						<label class="text-sm">
							<span class="text-muted-foreground">Nom complet</span>
							<input hlmInput class="mt-1 w-full" [(ngModel)]="profile.name" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Courriel</span>
							<input hlmInput class="mt-1 w-full" [(ngModel)]="profile.email" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Agence</span>
							<input hlmInput class="mt-1 w-full" [(ngModel)]="profile.agency" />
						</label>
						<label class="text-sm">
							<span class="text-muted-foreground">Langue</span>
							<select
								class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
								[(ngModel)]="profile.language"
							>
								<option>Francais</option>
								<option>Anglais</option>
								<option>Arabe</option>
							</select>
						</label>
					</div>
				</okane-agent-section-card>

				<okane-agent-section-card title="Preferences de notification">
					<div class="grid gap-3 md:gap-4 md:grid-cols-2">
						<label class="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm text-foreground">
							<input type="checkbox" [(ngModel)]="preferences.transferPaid" />
							<span>Alertes de transfert paye</span>
						</label>
						<label class="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm text-foreground">
							<input type="checkbox" [(ngModel)]="preferences.cashAlerts" />
							<span>Alertes de session de caisse</span>
						</label>
						<label class="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm text-foreground">
							<input type="checkbox" [(ngModel)]="preferences.kycAlerts" />
							<span>Alertes KYC</span>
						</label>
						<label class="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm text-foreground">
							<input type="checkbox" [(ngModel)]="preferences.systemAlerts" />
							<span>Alertes systeme</span>
						</label>
					</div>
				</okane-agent-section-card>
			</div>
		</okane-agent-layout>
	`,
})
export class AgentSettingsPageComponent {
	public profile = {
		name: 'Agent Nora Benali',
		email: 'agent.nora@okane.test',
		agency: 'Okane Casablanca Centre',
		language: 'Francais',
	};

	public preferences = {
		transferPaid: true,
		cashAlerts: true,
		kycAlerts: true,
		systemAlerts: false,
	};
}

