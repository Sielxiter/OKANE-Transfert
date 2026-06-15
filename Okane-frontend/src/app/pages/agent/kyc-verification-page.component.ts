import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { VerificationKyc } from '../../agent/models/agent-dashboard.models';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { AgentEmptyStateComponent } from '../../agent/ui/agent-empty-state.component';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { AgentStatusBadgeComponent } from '../../agent/ui/agent-status-badge.component';
import { AgentTableShellComponent } from '../../agent/ui/agent-table-shell.component';

@Component({
	selector: 'okane-agent-kyc-verification-page',
	standalone: true,
	imports: [
		CommonModule,
		HlmButtonImports,
		AgentLayoutComponent,
		AgentPageIntroComponent,
		AgentSectionCardComponent,
		AgentStatusBadgeComponent,
		AgentTableShellComponent,
		AgentEmptyStateComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Verification KYC">
			<div class="flex flex-col gap-6 md:gap-8">
				<okane-agent-page-intro
					title="Verification KYC"
					subtitle="Validation locale des dossiers en attente."
				/>

				<okane-agent-section-card title="File de verification KYC">
					<okane-agent-table-shell>
						<table class="w-full text-sm">
							<thead class="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th class="px-4 py-3 text-left">Client</th>
									<th class="px-4 py-3 text-left">Type document</th>
									<th class="px-4 py-3 text-left">Numero document</th>
									<th class="px-4 py-3 text-left">Statut</th>
									<th class="px-4 py-3 text-left">Notes</th>
									<th class="px-4 py-3 text-left">Action</th>
								</tr>
							</thead>
							<tbody>
								@for (item of kycItems; track item.id) {
									<tr class="border-t border-border transition-colors hover:bg-accent/10">
										<td class="px-4 py-3 font-medium text-foreground">{{ item.nomClient }}</td>
										<td class="px-4 py-3 text-foreground">{{ item.typeDocument }}</td>
										<td class="px-4 py-3 text-muted-foreground">{{ item.numeroDocument }}</td>
										<td class="px-4 py-3">
											<okane-agent-status-badge kind="kyc" [status]="item.statut" />
										</td>
										<td class="px-4 py-3 text-muted-foreground">{{ item.notes }}</td>
										<td class="px-4 py-3">
											<div class="flex gap-2">
												<button hlmBtn variant="outline" size="sm" type="button" (click)="approve(item)">Valider</button>
												<button hlmBtn variant="outline" size="sm" type="button" (click)="reject(item)">Rejeter</button>
											</div>
										</td>
									</tr>
								}
								@if (kycItems.length === 0) {
									<tr>
										<td colspan="6" class="px-4 py-4">
											<okane-agent-empty-state
												title="Aucun dossier KYC"
												description="Les nouveaux dossiers apparaissent ici."
											/>
										</td>
									</tr>
								}
							</tbody>
						</table>
					</okane-agent-table-shell>
				</okane-agent-section-card>
			</div>
		</okane-agent-layout>
	`,
})
export class AgentKycVerificationPageComponent {
	private readonly _service = inject(AgentDashboardService);

	public kycItems: VerificationKyc[] = [];

	constructor() {
		this._service.getKycVerifications().subscribe((items) => (this.kycItems = items));
	}

	public approve(item: VerificationKyc): void {
		item.statut = 'APPROVED';
		item.notes = 'Validation locale.';
	}

	public reject(item: VerificationKyc): void {
		item.statut = 'REJECTED';
		item.notes = 'Rejet local.';
	}
}

