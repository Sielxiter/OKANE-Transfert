import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const BASE = 'http://localhost:8080/api/agent';

export interface ClientSearchResult {
	id: number;
	fullName: string;
	phone: string | null;
	identityType: string;
	identityNumber: string;
	country: string | null;
	nationality: string | null;
	kycStatus: string | null;
	amlRiskLevel: string | null;
	restricted: boolean;
}

export interface OcrResult {
	rawText: string;
	nom: string;
	prenom: string;
	numeroPiece: string;
	nationalite: string;
	confidence: number;
	error?: string;
}

export interface AmlResult {
	riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
	matchScore: number;
	matchedEntityName: string;
	source: string;
	matched: boolean;
	error?: string;
}

export interface CreateClientRequest {
	firstName: string;
	lastName: string;
	phone: string;
	identityType: string;
	identityNumber: string;
	nationality: string;
	kycStatus: string;
	amlRiskLevel: string;
	rawOcrText?: string;
	documentType?: string;
}

export interface CreatedClient {
	id: number;
	fullName: string;
	phone: string;
	identityType: string;
	identityNumber: string;
	country: string | null;
	nationality: string | null;
	kycStatus: string;
	amlRiskLevel: string;
	restricted: boolean;
}

@Injectable({ providedIn: 'root' })
export class KycClientApiService {
	private readonly _http = inject(HttpClient);

	public searchClients(query: string): Observable<ClientSearchResult[]> {
		return this._http.get<ClientSearchResult[]>(`${BASE}/clients/search`, {
			params: { q: query },
		});
	}

	public performOcr(imageBase64: string, documentType: string): Observable<OcrResult> {
		return this._http.post<OcrResult>(`${BASE}/kyc/ocr`, {
			image: imageBase64,
			documentType,
		});
	}

	public amlCheck(firstName: string, lastName: string, nationality?: string): Observable<AmlResult> {
		return this._http.post<AmlResult>(`${BASE}/compliance/aml-check`, {
			firstName,
			lastName,
			nationality: nationality ?? '',
		});
	}

	public createClient(request: CreateClientRequest): Observable<CreatedClient> {
		return this._http.post<CreatedClient>(`${BASE}/clients`, request);
	}

	public updateClientKyc(clientId: number, request: Partial<CreateClientRequest>): Observable<CreatedClient> {
		return this._http.patch<CreatedClient>(`${BASE}/clients/${clientId}/kyc`, request);
	}
}
