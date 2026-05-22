import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
	Client,
	MouvementCaisse,
	NotificationAffichage,
	SessionCaisse,
	StatistiquesTableauDeBord,
	StatutTransfert,
	Transfert,
	VerificationKyc,
} from '../models/agent-dashboard.models';

@Injectable({ providedIn: 'root' })
export class AgentDashboardService {
	private readonly _currency = 'MAD';
	private readonly _transfers: Transfert[] = [
		{
			id: 'trf-1001',
			codeReference: 'OK-903421',
			nomExpediteur: 'Amina El Idrissi',
			telephoneExpediteur: '+212612345678',
			nomBeneficiaire: 'Mamadou Diallo',
			telephoneBeneficiaire: '+221771234567',
			montant: 1500,
			montantFrais: 35,
			statut: 'PENDING',
			creeLe: '2026-05-22T09:12:00Z',
			devise: this._currency,
		},
		{
			id: 'trf-1002',
			codeReference: 'OK-903422',
			nomExpediteur: 'Yassine Ben Ali',
			telephoneExpediteur: '+212611223344',
			nomBeneficiaire: 'Fatou Ndiaye',
			telephoneBeneficiaire: '+221781234999',
			montant: 3200,
			montantFrais: 60,
			statut: 'PAID',
			creeLe: '2026-05-22T08:45:00Z',
			devise: this._currency,
		},
		{
			id: 'trf-1003',
			codeReference: 'OK-903423',
			nomExpediteur: 'Khadija Rahmani',
			telephoneExpediteur: '+212699998877',
			nomBeneficiaire: 'Ousmane Ba',
			telephoneBeneficiaire: '+221701112233',
			montant: 500,
			montantFrais: 15,
			statut: 'EXPIRED',
			creeLe: '2026-05-21T15:35:00Z',
			devise: this._currency,
		},
		{
			id: 'trf-1004',
			codeReference: 'OK-903424',
			nomExpediteur: 'Salma El Amrani',
			telephoneExpediteur: '+212633334444',
			nomBeneficiaire: 'Ibrahim Gueye',
			telephoneBeneficiaire: '+221762223333',
			montant: 4200,
			montantFrais: 75,
			statut: 'CANCELLED',
			creeLe: '2026-05-21T12:20:00Z',
			devise: this._currency,
		},
		{
			id: 'trf-1005',
			codeReference: 'OK-903425',
			nomExpediteur: 'Hamza Ouali',
			telephoneExpediteur: '+212655550001',
			nomBeneficiaire: 'Aicha Sow',
			telephoneBeneficiaire: '+221775550001',
			montant: 980,
			montantFrais: 25,
			statut: 'PENDING',
			creeLe: '2026-05-22T10:05:00Z',
			devise: this._currency,
		},
	];

	private readonly _cashSession: SessionCaisse = {
		id: 'cash-001',
		soldeOuverture: 10000,
		soldeActuel: 15420,
		totalEntrees: 7500,
		totalSorties: 2080,
		ecart: -20,
		statut: 'OPEN',
		ouverteLe: '2026-05-22T08:00:00Z',
		devise: this._currency,
	};

	private readonly _movements: MouvementCaisse[] = [
		{ id: 'mov-01', typeMouvement: 'IN', montant: 1200, motif: 'Frais de transfert', creeLe: '2026-05-22T09:20:00Z' },
		{ id: 'mov-02', typeMouvement: 'OUT', montant: 800, motif: 'Paiement transfert OK-903422', creeLe: '2026-05-22T09:40:00Z' },
		{ id: 'mov-03', typeMouvement: 'IN', montant: 900, motif: 'Nouveau transfert OK-903421', creeLe: '2026-05-22T10:15:00Z' },
	];

	private readonly _customers: Client[] = [
		{
			id: 'cus-01',
			prenom: 'Amina',
			nom: 'El Idrissi',
			telephone: '+212612345678',
			pays: 'Maroc',
			statutKyc: 'APPROVED',
			creeLe: '2026-05-12T13:20:00Z',
		},
		{
			id: 'cus-02',
			prenom: 'Yassine',
			nom: 'Ben Ali',
			telephone: '+212611223344',
			pays: 'Maroc',
			statutKyc: 'PENDING',
			creeLe: '2026-05-18T10:40:00Z',
		},
		{
			id: 'cus-03',
			prenom: 'Khadija',
			nom: 'Rahmani',
			telephone: '+212699998877',
			pays: 'Maroc',
			statutKyc: 'REJECTED',
			creeLe: '2026-05-20T09:05:00Z',
		},
	];

	private readonly _kycItems: VerificationKyc[] = [
		{
			id: 'kyc-01',
			nomClient: 'Yassine Ben Ali',
			typeDocument: 'Passeport',
			numeroDocument: 'MA-1234567',
			statut: 'PENDING',
			notes: 'Photo à clarifier',
			creeLe: '2026-05-22T07:10:00Z',
		},
		{
			id: 'kyc-02',
			nomClient: 'Khadija Rahmani',
			typeDocument: 'CNI',
			numeroDocument: 'BK778899',
			statut: 'REJECTED',
			notes: 'Document expiré',
			creeLe: '2026-05-21T16:15:00Z',
		},
	];

	private readonly _notifications: NotificationAffichage[] = [
		{
			id: 'notif-01',
			titre: 'Transfert payé',
			message: 'OK-903422 a été payé avec succès.',
			type: 'SUCCESS',
			creeLe: '2026-05-22T09:45:00Z',
		},
		{
			id: 'notif-02',
			titre: 'Alerte de caisse',
			message: 'Écart de caisse détecté : -20 MAD.',
			type: 'ALERT',
			creeLe: '2026-05-22T10:05:00Z',
		},
		{
			id: 'notif-03',
			titre: 'Vérification KYC requise',
			message: 'Client Yassine Ben Ali à vérifier.',
			type: 'INFO',
			creeLe: '2026-05-22T10:12:00Z',
		},
	];

	getDashboardStats(): Observable<StatistiquesTableauDeBord> {
		return of({
			soldeCaisse: this._cashSession.soldeActuel,
			transfertsJour: 18,
			paiementsJour: 11,
			transfertsEnAttente: this._transfers.filter((transfer) => transfer.statut === 'PENDING').length,
			devise: this._currency,
		});
	}

	getRecentTransfers(): Observable<Transfert[]> {
		return of(this._transfers.slice(0, 4));
	}

	getTransferHistory(): Observable<Transfert[]> {
		return of(this._transfers);
	}

	getCashSession(): Observable<SessionCaisse> {
		return of(this._cashSession);
	}

	getCashMovements(): Observable<MouvementCaisse[]> {
		return of(this._movements);
	}

	getAlerts(): Observable<string[]> {
		return of([
			'Session de caisse non ouverte',
			'Tentatives de code de retrait invalide',
			'Transfert expiré',
			'Écart de caisse détecté',
		]);
	}

	getCustomers(): Observable<Client[]> {
		return of(this._customers);
	}

	getKycVerifications(): Observable<VerificationKyc[]> {
		return of(this._kycItems);
	}

	getNotifications(): Observable<NotificationAffichage[]> {
		return of(this._notifications);
	}

	findTransferByReference(referenceCode: string): Observable<Transfert | undefined> {
		const normalized = referenceCode.trim().toUpperCase();
		return of(this._transfers.find((transfer) => transfer.codeReference.toUpperCase() === normalized));
	}

	findTransferByReceiverPhone(phone: string): Observable<Transfert | undefined> {
		const normalized = phone.trim();
		return of(this._transfers.find((transfer) => transfer.telephoneBeneficiaire === normalized));
	}

	updateTransferStatus(transferId: string, status: StatutTransfert): Observable<Transfert | undefined> {
		const transfer = this._transfers.find((item) => item.id === transferId);
		if (transfer) {
			transfer.statut = status;
		}
		return of(transfer);
	}
}
