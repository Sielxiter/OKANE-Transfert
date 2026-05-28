// src/app/manager/services/manager-dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ManagerClient,
  ManagerClientDetail,
  ManagerPayment,
  CancelPayoutRequest,
} from '../models/manager-dashboard.models';

@Injectable({ providedIn: 'root' })
export class ManagerDashboardService {
  private readonly _http = inject(HttpClient);
  private readonly _clientsUrl = '/api/manager/clients';
  private readonly _paymentsUrl = '/api/manager/payments';

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
}
