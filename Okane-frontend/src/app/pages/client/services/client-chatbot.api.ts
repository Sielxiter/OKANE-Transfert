import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CLIENT_API_BASE } from '../../../core/api/api.config';

export interface ChatbotMessage {
	id: number;
	senderType: 'USER' | 'ASSISTANT' | string;
	message: string;
	detectedIntent: string | null;
	createdAt: string;
}

export interface ChatbotConversation {
	sessionId: number;
	status: string;
	language: string;
	startedAt: string | null;
	endedAt: string | null;
	messages: ChatbotMessage[];
	suggestedQuestions: string[];
}

export interface ChatbotSendMessageRequest {
	message: string;
	language?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientChatbotApiService {
	private readonly _http = inject(HttpClient);

	public getConversation(language?: string): Observable<ChatbotConversation> {
		const params: Record<string, string> = language ? { language } : {};
		return this._http.get<ChatbotConversation>(`${CLIENT_API_BASE}/chatbot/session`, { params });
	}

	public sendMessage(request: ChatbotSendMessageRequest): Observable<ChatbotConversation> {
		return this._http.post<ChatbotConversation>(`${CLIENT_API_BASE}/chatbot/messages`, request);
	}
}
