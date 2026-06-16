import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBot, lucideLoaderCircle, lucideSend, lucideSparkles } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AgentPageIntroComponent } from '../../agent/ui/agent-page-intro.component';
import { AgentSectionCardComponent } from '../../agent/ui/agent-section-card.component';
import { I18nService } from '../../shared/i18n/i18n.service';
import { ClientChatbotApiService, type ChatbotConversation, type ChatbotMessage } from './services/client-chatbot.api';

@Component({
	selector: 'okane-client-chatbot-page',
	standalone: true,
	imports: [CommonModule, FormsModule, NgIcon, HlmButtonImports, AgentPageIntroComponent, AgentSectionCardComponent],
	providers: [provideIcons({ lucideBot, lucideSend, lucideSparkles, lucideLoaderCircle })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-6 md:gap-8">
			<okane-agent-page-intro
				eyebrow="Espace Client"
				title="Chatbot / Aide"
				subtitle="Assistant dédié aux questions sur Okane Transfer. Les réponses hors périmètre sont refusées proprement."
			/>

			<div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
				<div class="flex min-w-0 flex-col gap-6">
					<okane-agent-section-card title="Conversation" subtitle="Pose ta question ou choisis une question fréquente.">
						<div class="flex h-[32rem] flex-col rounded-2xl border border-border bg-background/60">
							<div class="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
								@if (loading() && messages().length === 0) {
									<div class="space-y-3">
										<div class="h-20 rounded-2xl border border-border bg-muted/30 animate-pulse"></div>
										<div class="ml-auto h-16 w-3/4 rounded-2xl border border-border bg-muted/30 animate-pulse"></div>
										<div class="h-20 rounded-2xl border border-border bg-muted/30 animate-pulse"></div>
									</div>
								} @else if (messages().length === 0) {
									<div class="flex h-full items-center justify-center">
										<div class="max-w-md rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
											<div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
												<ng-icon name="lucideBot" />
											</div>
											<p class="mt-4 text-sm font-medium text-foreground">Commence une conversation</p>
											<p class="mt-2 text-sm text-muted-foreground">
												Le chatbot répond uniquement aux sujets liés à Okane Transfer: transferts, frais, suivi, profil, KYC/AML et notifications.
											</p>
										</div>
									</div>
								} @else {
									@for (message of messages(); track trackMessage(message)) {
										<div class="flex" [class.justify-end]="message.senderType === 'USER'">
											<div
												class="max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm transition-colors md:max-w-[78%]"
												[class.border-primary/20]="message.senderType === 'USER'"
												[class.bg-primary]="message.senderType === 'USER'"
												[class.text-primary-foreground]="message.senderType === 'USER'"
												[class.border-border]="message.senderType !== 'USER'"
												[class.bg-card]="message.senderType !== 'USER'"
												[class.text-card-foreground]="message.senderType !== 'USER'"
											>
												<div class="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] opacity-80">
													<span>{{ message.senderType === 'USER' ? 'Vous' : 'Okane Assistant' }}</span>
													<span>{{ message.createdAt | date:'dd/MM HH:mm' }}</span>
												</div>
												<p class="mt-2 whitespace-pre-line text-sm leading-6">{{ message.message }}</p>
											</div>
										</div>
									}
								}
							</div>

							<div class="border-t border-border bg-card p-4 md:p-5">
								@if (error()) {
									<div class="mb-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
										{{ error() }}
									</div>
								}
								<div class="flex flex-col gap-3">
									<textarea
										class="min-h-28 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
										name="chatbotDraft"
										[ngModel]="draft()"
										(ngModelChange)="draft.set($event)"
										placeholder="Écris ta question sur Okane Transfer..."
										[disabled]="loading()"
										rows="4"
									></textarea>
									<div class="flex flex-wrap items-center justify-between gap-3">
										<p class="text-xs text-muted-foreground">
											Questions autorisées: transferts, frais, suivi, KYC/AML, profil, notifications.
										</p>
										<button hlmBtn type="button" [disabled]="loading()" (click)="sendDraft()">
											@if (loading()) {
												<ng-icon name="lucideLoaderCircle" class="mr-2 animate-spin" />
											} @else {
												<ng-icon name="lucideSend" class="mr-2" />
											}
											Envoyer
										</button>
									</div>
								</div>
							</div>
						</div>
					</okane-agent-section-card>
				</div>

				<div class="flex min-w-0 flex-col gap-6">
					<okane-agent-section-card title="Questions populaires" subtitle="Clique pour lancer une réponse immédiate.">
						<div class="flex flex-wrap gap-2">
							@for (question of popularQuestions; track question) {
								<button hlmBtn variant="outline" size="sm" type="button" (click)="askPopularQuestion(question)">
									<ng-icon name="lucideSparkles" class="mr-2" />
									{{ question }}
								</button>
							}
						</div>
					</okane-agent-section-card>

					<okane-agent-section-card title="Périmètre du bot" subtitle="Le bot est volontairement limité aux sujets Okane Transfer.">
						<div class="space-y-3 text-sm text-muted-foreground">
							<p>Il refuse les questions hors sujet et te redirige vers l'aide utile.</p>
							<p>La conversation est enregistrée en base dans l'historique de l'espace client.</p>
							<p>Gemini est appelé uniquement côté backend.</p>
						</div>
					</okane-agent-section-card>

					<okane-agent-section-card title="Session" subtitle="État de la conversation en cours.">
						<div class="grid gap-3 text-sm">
							<div class="rounded-2xl border border-border bg-background/70 p-4">
								<p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Statut</p>
								<p class="mt-1 font-medium text-foreground">{{ conversation()?.status ?? 'ACTIVE' }}</p>
							</div>
							<div class="rounded-2xl border border-border bg-background/70 p-4">
								<p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Langue</p>
								<p class="mt-1 font-medium text-foreground">{{ conversation()?.language ?? 'fr' }}</p>
							</div>
							<div class="rounded-2xl border border-border bg-background/70 p-4">
								<p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Messages</p>
								<p class="mt-1 font-medium text-foreground">{{ messages().length }}</p>
							</div>
						</div>
					</okane-agent-section-card>
				</div>
			</div>
		</div>
	`,
})
export class ClientChatbotPageComponent {
	private readonly _api = inject(ClientChatbotApiService);
	private readonly _i18n = inject(I18nService);

	protected readonly conversation = signal<ChatbotConversation | null>(null);
	protected readonly draft = signal('');
	protected readonly loading = signal(false);
	protected readonly error = signal('');

	protected readonly messages = computed(() => this.conversation()?.messages ?? []);
	protected readonly popularQuestions = [
		'Comment suivre un transfert ?',
		'Quels sont les frais ?',
		'Comment mettre à jour mon profil ?',
		'Que faire si mon transfert est bloqué ?',
		'Comment fonctionne la vérification KYC ?',
	];

	constructor() {
		this.reloadConversation();
	}

	public reloadConversation(): void {
		this.loading.set(true);
		this.error.set('');
		this._api.getConversation(this._i18n.locale()).subscribe({
			next: (conversation) => {
				this.conversation.set(conversation);
				this.loading.set(false);
			},
			error: () => {
				this.loading.set(false);
				this.error.set("Impossible de charger l'assistant pour le moment.");
			},
		});
	}

	public askPopularQuestion(question: string): void {
		this.draft.set(question);
		this.sendDraft();
	}

	public sendDraft(): void {
		const message = this.draft().trim();
		if (!message || this.loading()) {
			return;
		}

		this.loading.set(true);
		this.error.set('');
		this._api.sendMessage({ message, language: this._i18n.locale() }).subscribe({
			next: (conversation) => {
				this.conversation.set(conversation);
				this.draft.set('');
				this.loading.set(false);
			},
			error: () => {
				this.loading.set(false);
				this.error.set("Impossible d'envoyer le message pour le moment.");
			},
		});
	}

	protected trackMessage(message: ChatbotMessage): string {
		return `${message.id}-${message.createdAt}-${message.senderType}`;
	}
}
