import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ApiRecentActivity {
	id: number;
	title: string;
	type: string;
	module: string;
	createdAt: string;
}

export interface ApiSystemAlert {
	id: number;
	title: string;
	description: string;
	severity: AlertSeverity;
}

export interface ApiTrendPoint {
	label: string;
	value: number;
}

export interface ApiManagerDashboard {
	updatedAt: string;
	kpis: Array<{
		title: string;
		value: string;
		icon: string;
		accent: string;
		note: string;
	}>;
	activities: ApiRecentActivity[];
	alerts: ApiSystemAlert[];
	analytics: Array<{
		title: string;
		description: string;
		accent: string;
		preview: number[];
	}>;
}

const MOCK_DASHBOARD: ApiManagerDashboard = {
	updatedAt: new Date().toISOString(),
	kpis: [
		{ title: 'Sous-agences actives', value: '3', icon: 'lucideBuilding2', accent: 'bg-primary/10 text-primary', note: 'Toutes supervisées' },
		{ title: 'Agents actifs', value: '18', icon: 'lucideUsers', accent: 'bg-emerald-500/10 text-emerald-600', note: 'Dernière présence il y a 6 min' },
		{ title: 'Transferts du jour', value: '142', icon: 'lucideArrowRightLeft', accent: 'bg-blue-500/10 text-blue-600', note: '+12% vs hier' },
		{ title: 'Caisse attendue', value: '87 400 MAD', icon: 'lucideWallet', accent: 'bg-amber-500/10 text-amber-600', note: 'Conformité caisse en cours' },
	],
	activities: [
		{ id: 1, title: 'Nouveau transfert créé à Sous-Agence Casa Centre', type: 'TRANSFER_CREATED', module: 'transfers', createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
		{ id: 2, title: 'Paiement validé pour un transfert Sénégal', type: 'TRANSFER_PAID', module: 'payments', createdAt: new Date(Date.now() - 11 * 60_000).toISOString() },
		{ id: 3, title: 'Agent ajouté sur Sous-Agence Rabat Agdal', type: 'AGENT_CREATED', module: 'agents', createdAt: new Date(Date.now() - 24 * 60_000).toISOString() },
		{ id: 4, title: 'Alerte conformité en revue', type: 'ALERT', module: 'compliance', createdAt: new Date(Date.now() - 41 * 60_000).toISOString() },
	],
	alerts: [
		{ id: 1, title: '2 transferts suspects', description: 'Analyse AML en attente de validation managériale.', severity: 'HIGH' },
		{ id: 2, title: '1 sous-agence à faible activité', description: 'Volume inférieur au seuil journalier attendu.', severity: 'MEDIUM' },
		{ id: 3, title: '3 agents sans mise à jour caisse', description: 'Session de caisse à vérifier avant clôture.', severity: 'LOW' },
	],
	analytics: [
		{ title: 'Transfer Trend', description: 'Evolution journalière des transferts.', accent: 'bg-primary', preview: [12, 18, 15, 24, 21, 28] },
		{ title: 'Revenue Trend', description: 'Commissions collectées sur 7 jours.', accent: 'bg-emerald-500', preview: [9, 11, 10, 15, 18, 20] },
		{ title: 'User Growth', description: 'Croissance des agents et sous-agences.', accent: 'bg-blue-500', preview: [4, 6, 7, 8, 10, 12] },
	],
};

@Injectable({ providedIn: 'root' })
export class ManagerDashboardApiService {
	public loadDashboard(): Observable<ApiManagerDashboard> {
		return of(MOCK_DASHBOARD);
	}
}
