import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MANAGER_API_BASE } from '../../../core/api/api.config';

export interface ApiTransfer {
	id: number;
	referenceCode: string;
	withdrawalCode: string;
	senderFullName: string;
	senderPhone: string;
	beneficiaryFullName: string;
	beneficiaryPhone: string;
	amount: number;
	currency: string;
	feeAmount: number;
	netAmount: number;
	status: string;
	sourceAgencyName: string;
	sourceAgencyCode: string;
	agentName: string;
	createdAt: string;
	sentAt: string;
}

export interface ApiTransferPage {
	content: ApiTransfer[];
	totalElements: number;
	totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ManagerTransfersApiService {
	private readonly _http = inject(HttpClient);
	private readonly _base = `${MANAGER_API_BASE}/transfers`;

	public getTransfers(): Observable<ApiTransferPage> {
		return this._http.get<ApiTransferPage>(this._base);
	}

	public getTransferDetails(id: number): Observable<ApiTransfer> {
		return this._http.get<ApiTransfer>(`${this._base}/${id}`);
	}
}
