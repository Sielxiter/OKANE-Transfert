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

export interface ManagerAgentRequest {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  actif: boolean;
}

export interface ManagerAgentUpdateRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  actif: boolean;
}

export interface ManagerAgentResponse {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  actif: boolean;
  role: string;
  agencyName: string;
  creeLe: string;
  modifieLe: string;
}

export interface ManagerDashboardData {
  agencyOpeningBalance: number;
  agencyCurrentBalance: number;
  todayTransfersCount: number;
  todayTransfersAmount: number;
  todayFeesAmount: number;
  agencyCommission: number;
  centralShare: number;
  pendingPayoutsCount: number;
  pendingPayoutsAmount: number;
  activeAgentsCount: number;
  totalAgentsCount: number;
  unresolvedDiscrepanciesCount: number;
}
//Gestion de caisse
export interface AgencyCashSummary {
  totalOpeningBalance: number;
  totalEntries: number;
  totalExits: number;
  totalCurrentBalance: number;
}

export interface AgentCashSummary {
  agentId: number;
  agentName: string;
  openingBalance: number;
  entries: number;
  exits: number;
  currentBalance: number;
  sessionStatus: string;
}

export interface ManagerCashSummary {
  date: string;
  agencySummary: AgencyCashSummary;
  agentsSummary: AgentCashSummary[];
  openSessionsCount: number;
  pendingDiscrepanciesCount: number;
}

export interface ManagerCashSession {
  id: number;
  agentId: string;
  agentName: string;
  agentEmail: string;
  sessionDate: string;
  openingBalance: number;
  totalEntries: number;
  totalExits: number;
  currentBalance: number;
  status: string;
  openedAt: string;
  closedAt: string | null;
}

export interface ManagerCashMovementDetail {
  movementId: number;
  movementType: string;
  amount: number;
  currency: string;
  createdAt: string;
  processedBy: string;
  transferReference: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderCountry: string | null;
  beneficiaryName: string | null;
  beneficiaryPhone: string | null;
  beneficiaryIdType: string | null;
  beneficiaryIdNumber: string | null;
  transferStatus: string | null;
}

export interface ManagerCashClosure {
  id: number;
  sessionId: number;
  agentName: string;
  closedBy: string;
  closedAt: string;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  note: string;
}

export interface ManagerCashDiscrepancy {
  id: number;
  sessionId: number;
  agentName: string;
  agentEmail: string;
  reportedAt: string;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  discrepancyType: string;
  status: string;
  description: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

