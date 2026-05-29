// src/app/manager/models/manager-dashboard.models.ts

export interface ManagerClient {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  pays: string;
  typePiece: string;
  numeroPiece: string;
  statutKyc: string;
  creeLe: string;
}

export interface ManagerClientTransaction {
  transferId: string;
  codeReference: string;
  codeRetrait: string;
  type: 'ENVOI' | 'RETRAIT';
  montant: number;
  frais: number;
  montantNet: number;
  deviseSource: string;
  deviseDestination: string;
  paysDestination: string | null;
  statut: string;
  creeLe: string;
}

export interface ManagerClientDetail {
  client: ManagerClient;
  transactions: ManagerClientTransaction[];
}

export interface ManagerPayment {
  id: string;
  transferReference: string;
  withdrawalCode: string;
  nomExpediteur: string;
  nomBeneficiaire: string;
  telephoneBeneficiaire: string;
  montantPaye: number;
  devise: string;
  agencePaiement: string;
  payePar: string | null;
  payeLe: string | null;
  transferStatut: string;
}

export interface CancelPayoutRequest {
  raison: string;
}
