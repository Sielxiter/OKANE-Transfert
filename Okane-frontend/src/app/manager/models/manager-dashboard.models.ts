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
  statutCompte: string;
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

export interface ManagerReportSummary {
  date: string;
  totalTransferts: number;
  transfertsPaies: number;
  transfertsEnAttente: number;
  transfertsAnnules: number;
  transfertsExpires: number;
  totalMontantEnvoye: number;
  totalFraisCollectes: number;
  commissionAgence: number;
  commissionCentrale: number;
  chiffreAffaires: number;
  devise: string;
}

export interface ManagerTransferReportLine {
  id: string;
  codeReference: string;
  nomExpediteur: string;
  telephoneExpediteur: string;
  nomBeneficiaire: string;
  telephoneBeneficiaire: string;
  paysDestination: string | null;
  montant: number;
  frais: number;
  montantNet: number;
  tauxChange: number;
  deviseSource: string;
  deviseDestination: string;
  statut: string;
  creeLe: string;
  agentCreateur: string | null;
}

export interface ManagerDailyReport {
  summary: ManagerReportSummary;
  transfers: ManagerTransferReportLine[];
}

export interface ManagerRevenueDayLine {
  date: string;
  transfertsPaies: number;
  fraisCollectes: number;
  commissionAgence: number;
  commissionCentrale: number;
  chiffreAffaires: number;
}

export interface ManagerRevenueReport {
  periodStart: string;
  periodEnd: string;
  totalChiffreAffaires: number;
  totalCommissionAgence: number;
  totalCommissionCentrale: number;
  totalFraisCollectes: number;
  totalTransfertsPaies: number;
  devise: string;
  byDay: ManagerRevenueDayLine[];
}
