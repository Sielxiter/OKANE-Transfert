import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';
import { AgentDashboardService } from '../../agent/services/agent-dashboard.service';
import { VerificationKyc } from '../../agent/models/agent-dashboard.models';

@Component({
	selector: 'okane-agent-kyc-verification-page',
	standalone: true,
	imports: [CommonModule, AgentLayoutComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<okane-agent-layout pageTitle="Vérification KYC">
			<section class="rounded-xl border bg-background p-4 shadow-sm">
				<h2 class="text-base font-semibold">File de vérification KYC</h2>
				<div class="mt-4 overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="text-xs uppercase text-muted-foreground">
							<tr>
								<th class="px-3 py-2 text-left">Client</th>
								<th class="px-3 py-2 text-left">Type de document</th>
								<th class="px-3 py-2 text-left">Numéro de document</th>
								<th class="px-3 py-2 text-left">Statut</th>
								<th class="px-3 py-2 text-left">Notes</th>
								<th class="px-3 py-2 text-left">Action</th>
							</tr>
						</thead>
						<tbody>
							@for (item of kycItems; track item.id) {
								<tr class="border-t">
									<td class="px-3 py-3 font-medium">{{ item.nomClient }}</td>
									<td class="px-3 py-3">{{ item.typeDocument }}</td>
									<td class="px-3 py-3">{{ item.numeroDocument }}</td>
									<td class="px-3 py-3">{{ formatStatutKyc(item.statut) }}</td>
									<td class="px-3 py-3 text-muted-foreground">{{ item.notes }}</td>
									<td class="px-3 py-3">
										<div class="flex gap-2">
											<button class="rounded-md border px-3 py-1 text-xs font-semibold" type="button" (click)="approve(item)">Valider</button>
											<button class="rounded-md border px-3 py-1 text-xs font-semibold" type="button" (click)="reject(item)">Rejeter</button>
										</div>
									</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			</section>
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

	public formatStatutKyc(status: VerificationKyc['statut']): string {
		switch (status) {
			case 'APPROVED':
				return 'VALIDÉ';
			case 'REJECTED':
				return 'REJETÉ';
			case 'PENDING':
			default:
				return 'EN_ATTENTE';
		}
	}
}
