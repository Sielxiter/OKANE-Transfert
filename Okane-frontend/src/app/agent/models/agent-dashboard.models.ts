export type StatutTransfert = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
export type StatutSessionCaisse = 'OPEN' | 'CLOSED';
export type TypeMouvementCaisse = 'IN' | 'OUT';
export type StatutKyc = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TypeNotification = 'INFO' | 'ALERT' | 'SUCCESS';

export interface StatistiquesTableauDeBord {
	soldeCaisse: number;
	transfertsJour: number;
	paiementsJour: number;
	transfertsEnAttente: number;
	paiementsEnAttente: number;
	revenus: number;
	devise: string;
}

export interface Transfert {
	id: string;
	codeReference: string;
	nomExpediteur: string;
	telephoneExpediteur: string;
	nomBeneficiaire: string;
	telephoneBeneficiaire: string;
	montant: number;
	montantFrais: number;
	commissionAgence: number;
	statut: StatutTransfert;
	creeLe: string;
	devise: string;
}

export interface SessionCaisse {
	id: string;
	soldeOuverture: number;
	soldeActuel: number;
	totalEntrees: number;
	totalSorties: number;
	ecart: number;
	statut: StatutSessionCaisse;
	ouverteLe: string;
	devise: string;
}

export interface MouvementCaisse {
	id: string;
	typeMouvement: TypeMouvementCaisse;
	montant: number;
	motif: string;
	creeLe: string;
}

export interface Client {
	id: string;
	prenom: string;
	nom: string;
	telephone: string;
	pays: string;
	statutKyc: StatutKyc;
	creeLe: string;
}

export interface VerificationKyc {
	id: string;
	nomClient: string;
	typeDocument: string;
	numeroDocument: string;
	statut: StatutKyc;
	notes: string;
	creeLe: string;
}

export interface NotificationAffichage {
	id: string;
	titre: string;
	message: string;
	type: TypeNotification;
	creeLe: string;
}
