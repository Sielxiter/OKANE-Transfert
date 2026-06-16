import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CLIENT_API_BASE } from '../../../core/api/api.config';
import type { ClientKycVerificationRequest, ClientKycVerificationResponse } from '../client.models';

@Injectable({ providedIn: 'root' })
export class ClientKycApiService {
	private readonly _http = inject(HttpClient);

	public submitVerification(request: ClientKycVerificationRequest) {
		return this._http.post<ClientKycVerificationResponse>(`${CLIENT_API_BASE}/kyc/submit`, request);
	}
}
