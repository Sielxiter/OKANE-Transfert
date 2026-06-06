// src/app/pages/manager/manager-cash-page.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ManagerDashboardService } from '../../manager/services/manager-dashboard.service';
import {
  ManagerCashSummary,
  AgentCashSummary,
  ManagerCashSession,
  ManagerCashClosure,
  ManagerCashDiscrepancy,
  ManagerCashMovementDetail,
} from '../../manager/models/manager-dashboard.models';

@Component({
  selector: 'okane-manager-cash-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Gestion de caisse</h1>
          <p class="text-muted-foreground text-sm">
            Suivi des caisses des agents et réconciliation
          </p>
        </div>
        <div class="text-right text-sm text-muted-foreground">
          Dernière mise à jour : {{ lastUpdate | date: 'HH:mm:ss' }}
        </div>
      </div>

      <!-- Navigation entre onglets -->
      <div class="flex gap-2 border-b pb-2">
        <button
          type="button"
          class="rounded-t-md px-4 py-2 text-sm font-semibold transition"
          [class.border-b-2]="activeTab === 'dashboard'"
          [class.border-primary]="activeTab === 'dashboard'"
          [class.text-primary]="activeTab === 'dashboard'"
          (click)="activeTab = 'dashboard'"
        >
          Caisse du jour
        </button>
        <button
          type="button"
          class="rounded-t-md px-4 py-2 text-sm font-semibold transition"
          [class.border-b-2]="activeTab === 'sessions'"
          [class.border-primary]="activeTab === 'sessions'"
          [class.text-primary]="activeTab === 'sessions'"
          (click)="activeTab = 'sessions'; loadSessions()"
        >
          Sessions de caisse
        </button>
        <button
          type="button"
          class="rounded-t-md px-4 py-2 text-sm font-semibold transition"
          [class.border-b-2]="activeTab === 'closures'"
          [class.border-primary]="activeTab === 'closures'"
          [class.text-primary]="activeTab === 'closures'"
          (click)="activeTab = 'closures'; loadClosures()"
        >
          Clôtures
        </button>
        <button
          type="button"
          class="rounded-t-md px-4 py-2 text-sm font-semibold transition"
          [class.border-b-2]="activeTab === 'discrepancies'"
          [class.border-primary]="activeTab === 'discrepancies'"
          [class.text-primary]="activeTab === 'discrepancies'"
          (click)="activeTab = 'discrepancies'; loadDiscrepancies()"
        >
          Écarts
          @if (dashboardData?.pendingDiscrepanciesCount) {
            <span class="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
              {{ dashboardData?.pendingDiscrepanciesCount }}
            </span>
          }
        </button>
      </div>

      @if (loading) {
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="mb-2 text-lg font-semibold">Chargement...</div>
          </div>
        </div>
      } @else if (error) {
        <div class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <p class="font-semibold">Erreur</p>
          <p class="text-sm">{{ error }}</p>
          <button
            class="mt-2 rounded-md bg-rose-100 px-3 py-1 text-sm"
            (click)="refreshCurrentTab()"
          >
            Réessayer
          </button>
        </div>
      } @else {
        <!-- ==================== ONGLET TABLEAU DE BORD ==================== -->
        @if (activeTab === 'dashboard' && dashboardData) {
          <div class="space-y-6">
            <!-- Cartes récapitulatives -->
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div class="rounded-lg border bg-background p-5 shadow-sm">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-muted-foreground">Solde total agence</span>
                  <span class="mt-2 text-2xl font-bold">
                    {{ formatMoney(dashboardData?.agencySummary?.totalCurrentBalance, 'MAD') }}
                  </span>
                  <span class="mt-1 text-xs text-muted-foreground">
                    Ouverture:
                    {{ formatMoney(dashboardData?.agencySummary?.totalOpeningBalance, 'MAD') }}
                  </span>
                </div>
              </div>
              <div class="rounded-lg border bg-background p-5 shadow-sm">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-muted-foreground"
                    >Encaissements du jour</span
                  >
                  <span class="mt-2 text-2xl font-bold text-emerald-600">
                    +{{ formatMoney(dashboardData?.agencySummary?.totalEntries, 'MAD') }}
                  </span>
                </div>
              </div>
              <div class="rounded-lg border bg-background p-5 shadow-sm">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-muted-foreground"
                    >Décaissements du jour</span
                  >
                  <span class="mt-2 text-2xl font-bold text-rose-600">
                    -{{ formatMoney(dashboardData?.agencySummary?.totalExits, 'MAD') }}
                  </span>
                </div>
              </div>
              <div class="rounded-lg border bg-background p-5 shadow-sm">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-muted-foreground">Sessions ouvertes</span>
                  <span class="mt-2 text-2xl font-bold">{{
                    dashboardData?.openSessionsCount
                  }}</span>
                  <span class="mt-1 text-xs text-muted-foreground"
                    >Écarts: {{ dashboardData?.pendingDiscrepanciesCount }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Tableau des agents -->
            <div class="rounded-lg border bg-background p-5 shadow-sm">
              <h3 class="mb-3 font-semibold">Détail par agent</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-xs uppercase text-muted-foreground">
                      <th class="px-3 py-2 text-left">Agent</th>
                      <th class="px-3 py-2 text-right">Ouverture</th>
                      <th class="px-3 py-2 text-right">Encaissements</th>
                      <th class="px-3 py-2 text-right">Décaissements</th>
                      <th class="px-3 py-2 text-right">Solde courant</th>
                      <th class="px-3 py-2 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (agent of dashboardData?.agentsSummary || []; track agent.agentId) {
                      <tr class="border-t">
                        <td class="px-3 py-3 font-medium">{{ agent.agentName }}</td>
                        <td class="px-3 py-3 text-right">
                          {{ formatMoney(agent.openingBalance, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-right text-emerald-600">
                          +{{ formatMoney(agent.entries, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-right text-rose-600">
                          -{{ formatMoney(agent.exits, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-right font-bold">
                          {{ formatMoney(agent.currentBalance, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-center">
                          <span
                            class="rounded-full px-2 py-1 text-xs font-semibold"
                            [class.bg-emerald-100]="agent.sessionStatus === 'OPEN'"
                            [class.text-emerald-800]="agent.sessionStatus === 'OPEN'"
                            [class.bg-slate-100]="agent.sessionStatus !== 'OPEN'"
                          >
                            {{ agent.sessionStatus === 'OPEN' ? 'Ouvert' : 'Fermé' }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ==================== ONGLET SESSIONS ==================== -->
        @if (activeTab === 'sessions') {
          <div class="rounded-lg border bg-background p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Liste des sessions</h3>
              <div class="flex gap-2">
                <input
                  type="date"
                  class="rounded-md border px-3 py-1 text-sm"
                  [(ngModel)]="sessionStartDate"
                  (change)="loadSessions()"
                />
                <span class="text-muted-foreground">à</span>
                <input
                  type="date"
                  class="rounded-md border px-3 py-1 text-sm"
                  [(ngModel)]="sessionEndDate"
                  (change)="loadSessions()"
                />
              </div>
            </div>
            @if (loadingSessions) {
              <p class="text-center py-6">Chargement...</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-xs uppercase text-muted-foreground">
                      <th class="px-3 py-2 text-left">Agent</th>
                      <th class="px-3 py-2 text-left">Date</th>
                      <th class="px-3 py-2 text-right">Ouverture</th>
                      <th class="px-3 py-2 text-right">Encaissements</th>
                      <th class="px-3 py-2 text-right">Décaissements</th>
                      <th class="px-3 py-2 text-right">Solde</th>
                      <th class="px-3 py-2 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (session of sessions; track session.id) {
                      <tr
                        class="border-t cursor-pointer hover:bg-muted/50"
                        (click)="showSessionDetail(session.id)"
                      >
                        <td class="px-3 py-3 font-medium">{{ session.agentName }}</td>
                        <td class="px-3 py-3">{{ session.sessionDate | date: 'dd/MM/yyyy' }}</td>
                        <td class="px-3 py-3 text-right">
                          {{ formatMoney(session.openingBalance, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-right text-emerald-600">
                          +{{ formatMoney(session.totalEntries, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-right text-rose-600">
                          -{{ formatMoney(session.totalExits, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-right font-bold">
                          {{ formatMoney(session.currentBalance, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-center">
                          <span
                            class="rounded-full px-2 py-1 text-xs font-semibold"
                            [class.bg-emerald-100]="session.status === 'OPEN'"
                            [class.text-emerald-800]="session.status === 'OPEN'"
                            [class.bg-slate-100]="session.status !== 'OPEN'"
                          >
                            {{ session.status === 'OPEN' ? 'Ouvert' : 'Fermé' }}
                          </span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="text-center py-6 text-muted-foreground">
                          Aucune session trouvée
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- ==================== ONGLET CLÔTURES ==================== -->
        @if (activeTab === 'closures') {
          <div class="rounded-lg border bg-background p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Historique des clôtures</h3>
              <div class="flex gap-2">
                <input
                  type="date"
                  class="rounded-md border px-3 py-1 text-sm"
                  [(ngModel)]="closureStartDate"
                  (change)="loadClosures()"
                />
                <span class="text-muted-foreground">à</span>
                <input
                  type="date"
                  class="rounded-md border px-3 py-1 text-sm"
                  [(ngModel)]="closureEndDate"
                  (change)="loadClosures()"
                />
              </div>
            </div>
            @if (loadingClosures) {
              <p class="text-center py-6">Chargement...</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-xs uppercase text-muted-foreground">
                      <th class="px-3 py-2 text-left">Agent</th>
                      <th class="px-3 py-2 text-left">Date clôture</th>
                      <th class="px-3 py-2 text-right">Solde attendu</th>
                      <th class="px-3 py-2 text-right">Solde réel</th>
                      <th class="px-3 py-2 text-right">Différence</th>
                      <th class="px-3 py-2 text-left">Clôturé par</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (closure of closures; track closure.id) {
                      <tr class="border-t">
                        <td class="px-3 py-3 font-medium">{{ closure.agentName }}</td>
                        <td class="px-3 py-3">{{ formatDateTime(closure.closedAt) }}</td>
                        <td class="px-3 py-3 text-right">
                          {{ formatMoney(closure.expectedBalance, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-right">
                          {{ formatMoney(closure.actualBalance, 'MAD') }}
                        </td>
                        <td
                          class="px-3 py-3 text-right"
                          [class.text-emerald-600]="closure.difference >= 0"
                          [class.text-rose-600]="closure.difference < 0"
                        >
                          {{ formatMoney(closure.difference, 'MAD') }}
                        </td>
                        <td class="px-3 py-3">{{ closure.closedBy }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center py-6 text-muted-foreground">
                          Aucune clôture trouvée
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- ==================== ONGLET ÉCARTS ==================== -->
        @if (activeTab === 'discrepancies') {
          <div class="rounded-lg border bg-background p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Liste des écarts de caisse</h3>
              <div class="flex gap-2">
                <select
                  class="rounded-md border px-3 py-1 text-sm"
                  [(ngModel)]="discrepancyStatus"
                  (change)="loadDiscrepancies()"
                >
                  <option value="all">Tous</option>
                  <option value="OPEN">En attente</option>
                  <option value="RESOLVED">Résolus</option>
                </select>
              </div>
            </div>
            @if (loadingDiscrepancies) {
              <p class="text-center py-6">Chargement...</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-xs uppercase text-muted-foreground">
                      <th class="px-3 py-2 text-left">Agent</th>
                      <th class="px-3 py-2 text-left">Date signalement</th>
                      <th class="px-3 py-2 text-right">Solde attendu</th>
                      <th class="px-3 py-2 text-right">Solde réel</th>
                      <th class="px-3 py-2 text-right">Différence</th>
                      <th class="px-3 py-2 text-left">Type</th>
                      <th class="px-3 py-2 text-center">Statut</th>
                      <th class="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (discrepancy of discrepancies; track discrepancy.id) {
                      <tr class="border-t">
                        <td class="px-3 py-3 font-medium">{{ discrepancy.agentName }}</td>
                        <td class="px-3 py-3">
                          {{ formatDateTime(discrepancy.reportedAt) }}
                        </td>
                        <td class="px-3 py-3 text-right">
                          {{ formatMoney(discrepancy.expectedBalance, 'MAD') }}
                        </td>
                        <td class="px-3 py-3 text-right">
                          {{ formatMoney(discrepancy.actualBalance, 'MAD') }}
                        </td>
                        <td
                          class="px-3 py-3 text-right font-bold"
                          [class.text-emerald-600]="discrepancy.difference >= 0"
                          [class.text-rose-600]="discrepancy.difference < 0"
                        >
                          {{ formatMoney(discrepancy.difference, 'MAD') }}
                        </td>
                        <td class="px-3 py-3">
                          <span
                            class="rounded-full px-2 py-1 text-xs font-semibold"
                            [class.bg-amber-100]="discrepancy.discrepancyType === 'SURPLUS'"
                            [class.text-amber-800]="discrepancy.discrepancyType === 'SURPLUS'"
                            [class.bg-rose-100]="discrepancy.discrepancyType === 'DEFICIT'"
                            [class.text-rose-800]="discrepancy.discrepancyType === 'DEFICIT'"
                          >
                            {{ discrepancy.discrepancyType }}
                          </span>
                        </td>
                        <td class="px-3 py-3 text-center">
                          <span
                            class="rounded-full px-2 py-1 text-xs font-semibold"
                            [class.bg-amber-100]="discrepancy.status === 'OPEN'"
                            [class.text-amber-800]="discrepancy.status === 'OPEN'"
                            [class.bg-emerald-100]="discrepancy.status === 'RESOLVED'"
                            [class.text-emerald-800]="discrepancy.status === 'RESOLVED'"
                          >
                            {{ discrepancy.status === 'OPEN' ? 'En attente' : 'Résolu' }}
                          </span>
                        </td>
                        <td class="px-3 py-3 text-center">
                          @if (discrepancy.status === 'OPEN') {
                            <button
                              class="rounded-md bg-primary px-3 py-1 text-xs text-white hover:bg-primary/80"
                              (click)="resolveDiscrepancy(discrepancy.id)"
                            >
                              Résoudre
                            </button>
                          } @else {
                            <span class="text-xs text-muted-foreground">-</span>
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="8" class="text-center py-6 text-muted-foreground">
                          Aucun écart trouvé
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- Modal détail session -->
        @if (showSessionModal && selectedSession) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              class="w-full max-w-3xl max-h-[80vh] overflow-auto rounded-xl border bg-background p-5 shadow-xl"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">Détail de la session</h3>
                <button
                  class="text-muted-foreground hover:text-foreground"
                  (click)="closeSessionModal()"
                >
                  ✕
                </button>
              </div>

              <!-- Informations de la session -->
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <span class="text-muted-foreground">Agent:</span>
                    <strong>{{ selectedSession.agentName }}</strong>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Date:</span>
                    <strong>{{ selectedSession.sessionDate | date: 'dd/MM/yyyy' }}</strong>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Solde ouverture:</span>
                    <strong>{{ formatMoney(selectedSession.openingBalance, 'MAD') }}</strong>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Statut:</span>
                    <span
                      class="rounded-full px-2 py-1 text-xs font-semibold"
                      [class.bg-emerald-100]="selectedSession.status === 'OPEN'"
                      [class.text-emerald-800]="selectedSession.status === 'OPEN'"
                      [class.bg-slate-100]="selectedSession.status !== 'OPEN'"
                    >
                      {{ selectedSession.status === 'OPEN' ? 'Ouvert' : 'Fermé' }}
                    </span>
                  </div>
                </div>

                <!-- Détail des mouvements -->
                <div class="pt-4">
                  <h4 class="font-semibold mb-3">Mouvements de caisse</h4>

                  @if (loadingMovements) {
                    <div class="text-center py-6">
                      <p class="text-muted-foreground">Chargement des mouvements...</p>
                    </div>
                  } @else if (sessionMovements.length === 0) {
                    <div class="text-center py-6 bg-muted/20 rounded-lg">
                      <p class="text-muted-foreground">
                        Aucun mouvement enregistré pour cette session
                      </p>
                    </div>
                  } @else {
                    <div class="overflow-x-auto">
                      <table class="w-full text-sm">
                        <thead class="bg-muted/50">
                          <tr class="text-xs uppercase text-muted-foreground">
                            <th class="px-3 py-2 text-left">Date/Heure</th>
                            <th class="px-3 py-2 text-center">Type</th>
                            <th class="px-3 py-2 text-right">Montant</th>
                            <th class="px-3 py-2 text-left">Traitée par</th>
                            <th class="px-3 py-2 text-left">Référence</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (movement of sessionMovements; track movement.movementId) {
                            <tr class="border-t hover:bg-muted/30">
                              <td class="px-3 py-2 text-xs">
                                {{ formatDateTime(movement.createdAt) }}
                              </td>
                              <td class="px-3 py-2 text-center">
                                <span
                                  class="rounded-full px-2 py-1 text-xs font-semibold"
                                  [class.bg-emerald-100]="movement.movementType === 'IN'"
                                  [class.text-emerald-800]="movement.movementType === 'IN'"
                                  [class.bg-rose-100]="movement.movementType === 'OUT'"
                                  [class.text-rose-800]="movement.movementType === 'OUT'"
                                >
                                  {{
                                    movement.movementType === 'IN' ? 'Encaissement' : 'Décaissement'
                                  }}
                                </span>
                              </td>
                              <td
                                class="px-3 py-2 text-right font-medium"
                                [class.text-emerald-600]="movement.movementType === 'IN'"
                                [class.text-rose-600]="movement.movementType === 'OUT'"
                              >
                                {{ movement.movementType === 'IN' ? '+' : '-'
                                }}{{ formatMoney(movement.amount, movement.currency) }}
                              </td>
                              <td class="px-3 py-2 text-sm">{{ movement.processedBy }}</td>
                              <td class="px-3 py-2 text-sm font-mono text-xs">
                                {{ movement.transferReference || '-' }}
                              </td>
                            </tr>

                            <!-- Détail supplémentaire pour les encaissements -->
                            @if (movement.movementType === 'IN' && movement.senderName) {
                              <tr class="bg-muted/20 border-t-0">
                                <td colspan="5" class="px-3 py-2 text-xs text-muted-foreground">
                                  <span class="ml-6"
                                    >📤 Expéditeur: {{ movement.senderName }} | Tél:
                                    {{ movement.senderPhone }} | Pays:
                                    {{ movement.senderCountry }}</span
                                  >
                                </td>
                              </tr>
                            }

                            <!-- Détail supplémentaire pour les décaissements -->
                            @if (movement.movementType === 'OUT' && movement.beneficiaryName) {
                              <tr class="bg-muted/20 border-t-0">
                                <td colspan="5" class="px-3 py-2 text-xs text-muted-foreground">
                                  <span class="ml-6"
                                    >📥 Bénéficiaire: {{ movement.beneficiaryName }} | Tél:
                                    {{ movement.beneficiaryPhone }}</span
                                  >
                                </td>
                              </tr>
                            }
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>

                <!-- Résumé des totaux -->
                @if (sessionMovements.length > 0) {
                  <div class="pt-3 border-t">
                    <div class="grid grid-cols-3 gap-3 text-sm">
                      <div class="p-2 bg-emerald-50 rounded-lg text-center">
                        <span class="text-muted-foreground text-xs">Total Encaissements</span>
                        <p class="text-emerald-600 font-bold">
                          {{ formatMoney(getTotalEntries(), 'MAD') }}
                        </p>
                      </div>
                      <div class="p-2 bg-rose-50 rounded-lg text-center">
                        <span class="text-muted-foreground text-xs">Total Décaissements</span>
                        <p class="text-rose-600 font-bold">
                          {{ formatMoney(getTotalExits(), 'MAD') }}
                        </p>
                      </div>
                      <div class="p-2 bg-blue-50 rounded-lg text-center">
                        <span class="text-muted-foreground text-xs">Solde final</span>
                        <p class="text-blue-600 font-bold">
                          {{ formatMoney(getCurrentBalance(), 'MAD') }}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ManagerCashPageComponent implements OnInit, OnDestroy {
  private readonly _service = inject(ManagerDashboardService);
  private readonly _cdr = inject(ChangeDetectorRef);
  private refreshInterval: any;
  sessionMovements: ManagerCashMovementDetail[] = [];
  loadingMovements = false;
  // Onglets
  activeTab: 'dashboard' | 'sessions' | 'closures' | 'discrepancies' = 'dashboard';

  // Données générales
  dashboardData: ManagerCashSummary | null = null;
  loading = false;
  error = '';
  lastUpdate: Date = new Date();

  // Sessions
  sessions: ManagerCashSession[] = [];
  loadingSessions = false;
  sessionStartDate: string = '';
  sessionEndDate: string = '';
  showSessionModal = false;
  selectedSession: ManagerCashSession | null = null;

  // Clôtures
  closures: ManagerCashClosure[] = [];
  loadingClosures = false;
  closureStartDate: string = '';
  closureEndDate: string = '';

  // Écarts
  discrepancies: ManagerCashDiscrepancy[] = [];
  loadingDiscrepancies = false;
  discrepancyStatus: string = 'all';

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.sessionStartDate = start.toISOString().split('T')[0];
    this.sessionEndDate = end.toISOString().split('T')[0];
    this.closureStartDate = start.toISOString().split('T')[0];
    this.closureEndDate = end.toISOString().split('T')[0];

    this.loadData();
    this.loadSessions();
    this.loadClosures();
    this.loadDiscrepancies();

    this.refreshInterval = setInterval(() => {
      if (this.activeTab === 'dashboard') {
        this.loadData(false);
      }
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refreshCurrentTab(): void {
    this.loadData();
    if (this.activeTab === 'sessions') this.loadSessions();
    if (this.activeTab === 'closures') this.loadClosures();
    if (this.activeTab === 'discrepancies') this.loadDiscrepancies();
  }

  loadData(showLoading = true): void {
    if (showLoading) this.loading = true;
    this.error = '';

    this._service.getCashDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.lastUpdate = new Date();
        this.loading = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger les données';
        this.loading = false;
        this._cdr.markForCheck();
      },
    });
  }

  loadSessions(): void {
    this.loadingSessions = true;
    this._service.getSessions(this.sessionStartDate, this.sessionEndDate).subscribe({
      next: (data) => {
        this.sessions = data;
        this.loadingSessions = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.loadingSessions = false;
        this._cdr.markForCheck();
      },
    });
  }

  showSessionDetail(sessionId: number): void {
    // Charger les détails de la session
    this._service.getSessionDetails(sessionId).subscribe({
      next: (session) => {
        this.selectedSession = session;
        this.showSessionModal = true;
        this.loadSessionMovements(sessionId);
        this._cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  loadSessionMovements(sessionId: number): void {
    this.loadingMovements = true;
    this._service.getSessionMovements(sessionId).subscribe({
      next: (movements) => {
        this.sessionMovements = movements;
        this.loadingMovements = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.loadingMovements = false;
        this._cdr.markForCheck();
      },
    });
  }

  closeSessionModal(): void {
    this.showSessionModal = false;
    this.selectedSession = null;
    this.sessionMovements = [];
    this.loadingMovements = false;
  }

  loadClosures(): void {
    this.loadingClosures = true;
    this._service.getClosures(this.closureStartDate, this.closureEndDate).subscribe({
      next: (data) => {
        this.closures = data;
        this.loadingClosures = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.loadingClosures = false;
        this._cdr.markForCheck();
      },
    });
  }

  loadDiscrepancies(): void {
    this.loadingDiscrepancies = true;
    const status = this.discrepancyStatus === 'all' ? undefined : this.discrepancyStatus;
    this._service.getDiscrepancies(status).subscribe({
      next: (data) => {
        this.discrepancies = data;
        this.loadingDiscrepancies = false;
        this._cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.loadingDiscrepancies = false;
        this._cdr.markForCheck();
      },
    });
  }

  resolveDiscrepancy(discrepancyId: number): void {
    if (confirm('Confirmez-vous la résolution de cet écart ?')) {
      this._service.resolveDiscrepancy(discrepancyId).subscribe({
        next: () => {
          this.loadDiscrepancies();
          this.loadData(false);
          this._cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          alert('Erreur lors de la résolution');
        },
      });
    }
  }

  formatMoney(amount: number | undefined, currency: string): string {
    if (amount === undefined || amount === null) {
      return `0,00 ${currency}`;
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  getTotalEntries(): number {
    return this.sessionMovements
      .filter((m) => m.movementType === 'IN')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
  }

  getTotalExits(): number {
    return this.sessionMovements
      .filter((m) => m.movementType === 'OUT')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
  }

  getCurrentBalance(): number {
    const opening = this.selectedSession?.openingBalance || 0;
    return opening + this.getTotalEntries() - this.getTotalExits();
  }

  formatDateTime(dateValue: any): string {
    if (!dateValue) return '-';

    let date: Date | null = null;

    // Cas 1: Tableau [2026,6,1,10,20,24]
    if (Array.isArray(dateValue) && dateValue.length >= 3) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
      date = new Date(year, month - 1, day, hour, minute, second);
    }

    // Cas 2: Chaîne avec virgules "2026,6,1,10,20,24"
    else if (typeof dateValue === 'string' && dateValue.includes(',')) {
      const parts = dateValue.split(',').map(Number);
      date = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
    }

    // Cas 3: Chaîne ISO standard
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }

    // Cas 4: Timestamp numérique
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }

    // Cas 5: Déjà un objet Date
    else if (dateValue instanceof Date) {
      date = dateValue;
    }

    if (date && !isNaN(date.getTime())) {
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    console.log('Date non reconnue:', dateValue);
    return '-';
  }
}
