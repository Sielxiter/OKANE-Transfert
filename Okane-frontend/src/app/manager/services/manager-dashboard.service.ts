// src/app/manager/services/manager-dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ManagerClient,
  ManagerClientDetail,
  ManagerPayment,
  CancelPayoutRequest,
  ManagerAgentResponse,
  ManagerAgentRequest,
  ManagerAgentUpdateRequest,
  ManagerDashboardData,
} from '../models/manager-dashboard.models';

@Injectable({ providedIn: 'root' })
export class ManagerDashboardService {
  private readonly _http = inject(HttpClient);
  private readonly _clientsUrl = '/api/manager/clients';
  private readonly _paymentsUrl = '/api/manager/payments';
  private readonly _dashboardUrl = '/api/manager/dashboard';

  // ── Clients ────────────────────────────────────────────────────────────────
  getClients(): Observable<ManagerClient[]> {
    return this._http.get<ManagerClient[]>(this._clientsUrl);
  }

  getClientDetail(clientId: string): Observable<ManagerClientDetail> {
    return this._http.get<ManagerClientDetail>(`${this._clientsUrl}/${clientId}`);
  }

  // ── Paiements ──────────────────────────────────────────────────────────────
  getAllPayments(): Observable<ManagerPayment[]> {
    return this._http.get<ManagerPayment[]>(this._paymentsUrl);
  }

  getPendingPayments(): Observable<ManagerPayment[]> {
    return this._http.get<ManagerPayment[]>(`${this._paymentsUrl}/pending`);
  }

  cancelPayout(transferId: string, raison: string): Observable<ManagerPayment> {
    const body: CancelPayoutRequest = { raison };
    return this._http.post<ManagerPayment>(`${this._paymentsUrl}/${transferId}/cancel`, body);
  }

  getAgents(): Observable<ManagerAgentResponse[]> {
    return this._http.get<ManagerAgentResponse[]>('/api/manager/agents');
  }

  getAgent(agentId: number): Observable<ManagerAgentResponse> {
    return this._http.get<ManagerAgentResponse>(`/api/manager/agents/${agentId}`);
  }

  createAgent(request: ManagerAgentRequest): Observable<ManagerAgentResponse> {
    return this._http.post<ManagerAgentResponse>('/api/manager/agents', request);
  }

  updateAgent(
    agentId: number,
    request: ManagerAgentUpdateRequest,
  ): Observable<ManagerAgentResponse> {
    return this._http.put<ManagerAgentResponse>(`/api/manager/agents/${agentId}`, request);
  }

  toggleAgentStatus(agentId: number): Observable<ManagerAgentResponse> {
    return this._http.patch<ManagerAgentResponse>(
      `/api/manager/agents/${agentId}/toggle-status`,
      {},
    );
  }

  deleteAgent(agentId: number): Observable<void> {
    return this._http.delete<void>(`/api/manager/agents/${agentId}`);
  }

  getDashboard(): Observable<ManagerDashboardData> {
    return this._http.get<ManagerDashboardData>('/api/manager/dashboard');
  }
}
