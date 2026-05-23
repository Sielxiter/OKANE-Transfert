import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideBell,
	lucideCheck,
	lucideClock,
	lucideKeyRound,
	lucideLock,
	lucideLogOut,
	lucideMapPin,
	lucideMonitor,
	lucidePencil,
	lucideRotateCcw,
	lucideSave,
	lucideServer,
	lucideShield,
	lucideShieldAlert,
	lucideShieldCheck,
	lucideSlidersHorizontal,
	lucideSmartphone,
	lucideUserRound,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { UsersPageHeaderComponent } from '../users/shared/users-page-header.component';
import { UsersPlaceholderDialogComponent } from '../users/shared/users-placeholder-dialog.component';
import { SettingsToggleComponent } from './settings-toggle.component';
import {
	ADMIN_PREFERENCES_MOCK,
	ADMIN_PROFILE_MOCK,
	ADMIN_SESSIONS_MOCK,
	NOTIFICATION_TOGGLES_MOCK,
	SECURITY_TOGGLES_MOCK,
	SUPPORTED_CURRENCIES,
	SUPPORTED_LANGUAGES,
	SUPPORTED_THEMES,
	SUPPORTED_TIMEZONES,
	SYSTEM_SETTINGS_MOCK,
	type AdminPreferences,
	type DefaultCurrency,
	type LanguageCode,
	type SettingToggle,
	type ThemeMode,
} from './settings.mock';

@Component({
	selector: 'okane-admin-settings-page',
	standalone: true,
	imports: [
		FormsModule,
		NgIcon,
		HlmButtonImports,
		HlmInputImports,
		HlmSeparatorImports,
		UsersPageHeaderComponent,
		UsersPlaceholderDialogComponent,
		SettingsToggleComponent,
	],
	providers: [
		provideIcons({
			lucideBell,
			lucideCheck,
			lucideClock,
			lucideKeyRound,
			lucideLock,
			lucideLogOut,
			lucideMapPin,
			lucideMonitor,
			lucidePencil,
			lucideRotateCcw,
			lucideSave,
			lucideServer,
			lucideShield,
			lucideShieldAlert,
			lucideShieldCheck,
			lucideSlidersHorizontal,
			lucideSmartphone,
			lucideUserRound,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="flex flex-col gap-4">
			<okane-users-page-header
				eyebrow="Configuration"
				title="Paramètres"
				description="Configurer les préférences administrateur, sécurité, notifications, devise par défaut et paramètres système."
				addLabel="Sauvegarder"
				actionIcon="lucideSave"
				(addClicked)="openSaveDialog()"
			>
				<button
					okaneHeaderActions
					hlmBtn
					size="sm"
					variant="outline"
					type="button"
					(click)="openResetDialog()"
				>
					<ng-icon name="lucideRotateCcw" />
					Réinitialiser
				</button>
			</okane-users-page-header>

			<nav
				class="sticky top-2 z-10 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-sm transition-colors"
				aria-label="Sections paramètres"
			>
				@for (item of navItems; track item.target) {
					<a
						class="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						[href]="'#' + item.target"
					>
						<ng-icon [name]="item.icon" class="text-sm" />
						{{ item.label }}
					</a>
				}
			</nav>

			<section
				id="profile"
				class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
			>
				<header class="flex items-start justify-between gap-3">
					<div>
						<h2 class="text-base font-semibold text-foreground">Profil administrateur</h2>
						<p class="text-xs text-muted-foreground">
							Informations principales du compte administrateur connecté.
						</p>
					</div>
					<span
						class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground"
					>
						<ng-icon name="lucideShieldCheck" class="text-xs" />
						{{ profile.role }}
					</span>
				</header>

				<hlm-separator class="my-5" />

				<div class="grid gap-5 lg:grid-cols-[auto_1fr]">
					<div class="flex flex-col items-center gap-3">
						<div
							class="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary ring-1 ring-border"
						>
							{{ profile.avatarInitials }}
						</div>
						<button hlmBtn variant="outline" size="sm" type="button" (click)="profileDialog.set(true)">
							<ng-icon name="lucidePencil" />
							Modifier le profil
						</button>
					</div>

					<dl class="grid gap-4 sm:grid-cols-2">
						<div>
							<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nom complet</dt>
							<dd class="mt-1 text-sm font-medium text-foreground">{{ profile.fullName }}</dd>
						</div>
						<div>
							<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rôle</dt>
							<dd class="mt-1 text-sm font-medium text-foreground">{{ profile.roleLabel }}</dd>
						</div>
						<div>
							<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
							<dd class="mt-1 text-sm text-foreground">{{ profile.email }}</dd>
						</div>
						<div>
							<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Téléphone</dt>
							<dd class="mt-1 text-sm text-foreground">{{ profile.phone }}</dd>
						</div>
						<div>
							<dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dernière connexion</dt>
							<dd class="mt-1 font-mono text-sm text-foreground">{{ profile.lastLogin }}</dd>
						</div>
					</dl>
				</div>
			</section>

			<section
				id="security"
				class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
			>
				<header>
					<h2 class="text-base font-semibold text-foreground">Sécurité</h2>
					<p class="text-xs text-muted-foreground">
						Mot de passe, double authentification et sessions actives.
					</p>
				</header>

				<hlm-separator class="my-5" />

				<div class="grid gap-3 lg:grid-cols-2">
					<button
						type="button"
						class="group flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						(click)="passwordDialog.set(true)"
					>
						<span
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border"
						>
							<ng-icon name="lucideLock" />
						</span>
						<div class="flex-1 leading-tight">
							<p class="text-sm font-semibold text-foreground">Changer le mot de passe</p>
							<p class="mt-1 text-xs text-muted-foreground">
								Mise à jour du mot de passe administrateur (BCrypt 12).
							</p>
						</div>
					</button>

					<button
						type="button"
						class="group flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						(click)="sessionsDialog.set(true)"
					>
						<span
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-border dark:text-sky-300"
						>
							<ng-icon name="lucideMonitor" />
						</span>
						<div class="flex-1 leading-tight">
							<p class="text-sm font-semibold text-foreground">Gérer les sessions actives</p>
							<p class="mt-1 text-xs text-muted-foreground">
								{{ sessions.length }} session{{ sessions.length > 1 ? 's' : '' }} en cours.
							</p>
						</div>
					</button>
				</div>

				<div class="mt-5 space-y-3">
					@for (toggle of securityToggles(); track toggle.key) {
						<div
							class="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4 transition-colors"
						>
							<div class="leading-tight">
								<p class="text-sm font-semibold text-foreground">{{ toggle.label }}</p>
								<p class="mt-1 text-xs text-muted-foreground">{{ toggle.description }}</p>
							</div>
							<okane-settings-toggle
								[checked]="toggle.value"
								[label]="toggle.label"
								(checkedChange)="onSecurityToggle(toggle.key, $event)"
							/>
						</div>
					}
				</div>

				<div class="mt-5">
					<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Sessions actives
					</p>
					<div class="mt-3 grid gap-3 md:grid-cols-2">
						@for (session of sessions; track session.id) {
							<article
								class="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 transition-colors"
							>
								<div class="flex items-start gap-3">
									<span
										class="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border"
									>
										<ng-icon
											[name]="session.device.includes('iPhone') ? 'lucideSmartphone' : 'lucideMonitor'"
										/>
									</span>
									<div class="leading-tight">
										<p class="text-sm font-medium text-foreground">{{ session.device }}</p>
										<p class="mt-0.5 text-xs text-muted-foreground">
											{{ session.browser }} • {{ session.location }}
										</p>
										<p class="mt-1 font-mono text-xs text-muted-foreground">
											{{ session.ipAddress }} • {{ session.startedAt }}
										</p>
									</div>
								</div>
								@if (session.current) {
									<span
										class="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
									>
										<ng-icon name="lucideCheck" class="text-xs" />
										Actuelle
									</span>
								} @else {
									<button
										type="button"
										class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										(click)="sessionsDialog.set(true)"
									>
										<ng-icon name="lucideLogOut" class="text-xs" />
										Révoquer
									</button>
								}
							</article>
						}
					</div>
				</div>
			</section>

			<section
				id="notifications"
				class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
			>
				<header>
					<h2 class="text-base font-semibold text-foreground">Notifications</h2>
					<p class="text-xs text-muted-foreground">
						Choisir quels événements déclenchent une notification.
					</p>
				</header>

				<hlm-separator class="my-5" />

				<div class="space-y-3">
					@for (toggle of notificationToggles(); track toggle.key) {
						<div
							class="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4 transition-colors"
						>
							<div class="flex items-start gap-3">
								<span
									class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border"
								>
									<ng-icon name="lucideBell" />
								</span>
								<div class="leading-tight">
									<p class="text-sm font-semibold text-foreground">{{ toggle.label }}</p>
									<p class="mt-1 text-xs text-muted-foreground">{{ toggle.description }}</p>
								</div>
							</div>
							<okane-settings-toggle
								[checked]="toggle.value"
								[label]="toggle.label"
								(checkedChange)="onNotificationToggle(toggle.key, $event)"
							/>
						</div>
					}
				</div>
			</section>

			<section
				id="preferences"
				class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
			>
				<header>
					<h2 class="text-base font-semibold text-foreground">Préférences</h2>
					<p class="text-xs text-muted-foreground">
						Langue, thème, devise par défaut et fuseau horaire.
					</p>
				</header>

				<hlm-separator class="my-5" />

				<div class="grid gap-4 md:grid-cols-2">
					<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
						Langue par défaut
						<select
							class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[ngModel]="preferences().language"
							(ngModelChange)="onLanguageChange($event)"
						>
							@for (l of languages; track l.value) {
								<option [value]="l.value">{{ l.label }}</option>
							}
						</select>
					</label>
					<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
						Thème
						<select
							class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[ngModel]="preferences().theme"
							(ngModelChange)="onThemeChange($event)"
						>
							@for (t of themes; track t.value) {
								<option [value]="t.value">{{ t.label }}</option>
							}
						</select>
					</label>
					<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
						Devise par défaut
						<select
							class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[ngModel]="preferences().currency"
							(ngModelChange)="onCurrencyChange($event)"
						>
							@for (c of currencies; track c.value) {
								<option [value]="c.value">{{ c.label }}</option>
							}
						</select>
					</label>
					<label class="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
						Fuseau horaire
						<select
							class="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
							[ngModel]="preferences().timezone"
							(ngModelChange)="onTimezoneChange($event)"
						>
							@for (z of timezones; track z) {
								<option [value]="z">{{ z }}</option>
							}
						</select>
					</label>
				</div>
			</section>

			<section
				id="system"
				class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-colors"
			>
				<header class="flex items-start justify-between gap-3">
					<div>
						<h2 class="text-base font-semibold text-foreground">Paramètres système</h2>
						<p class="text-xs text-muted-foreground">
							Valeurs lues côté infrastructure. Modification réservée à la console serveur.
						</p>
					</div>
					<span
						class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground"
					>
						<ng-icon name="lucideServer" class="text-xs" />
						Lecture seule
					</span>
				</header>

				<hlm-separator class="my-5" />

				<div class="grid gap-3 md:grid-cols-2">
					@for (setting of systemSettings; track setting.key) {
						<article
							class="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 transition-colors"
						>
							<span
								class="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-secondary-foreground ring-1 ring-border"
							>
								<ng-icon [name]="setting.icon" />
							</span>
							<div class="flex-1 leading-tight">
								<p class="text-sm font-semibold text-foreground">{{ setting.label }}</p>
								<p class="mt-1 text-xs text-muted-foreground">{{ setting.description }}</p>
								<p class="mt-2 font-mono text-sm font-medium text-foreground">{{ setting.value }}</p>
							</div>
						</article>
					}
				</div>

				<div
					class="mt-5 flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 transition-colors"
				>
					<div class="flex items-start gap-3">
						<span
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-300"
						>
							<ng-icon name="lucideShieldAlert" />
						</span>
						<div class="leading-tight">
							<p class="text-sm font-semibold text-foreground">Mode maintenance</p>
							<p class="mt-1 text-xs text-muted-foreground">
								Lorsqu'activé, les utilisateurs non administrateurs voient une page d'attente.
							</p>
						</div>
					</div>
					<okane-settings-toggle
						[checked]="maintenanceMode()"
						label="Mode maintenance"
						(checkedChange)="onMaintenanceToggle($event)"
					/>
				</div>
			</section>
		</div>

		<okane-users-placeholder-dialog
			[open]="saveDialog()"
			title="Sauvegarder les paramètres"
			(close)="saveDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="resetDialog()"
			title="Réinitialiser les paramètres"
			(close)="resetDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="profileDialog()"
			title="Modifier le profil"
			(close)="profileDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="passwordDialog()"
			title="Changer le mot de passe"
			(close)="passwordDialog.set(false)"
		/>
		<okane-users-placeholder-dialog
			[open]="sessionsDialog()"
			title="Gérer les sessions actives"
			(close)="sessionsDialog.set(false)"
		/>
	`,
})
export class AdminSettingsPageComponent {
	protected readonly profile = ADMIN_PROFILE_MOCK;
	protected readonly sessions = ADMIN_SESSIONS_MOCK;
	protected readonly systemSettings = SYSTEM_SETTINGS_MOCK;
	protected readonly languages = SUPPORTED_LANGUAGES;
	protected readonly themes = SUPPORTED_THEMES;
	protected readonly currencies = SUPPORTED_CURRENCIES;
	protected readonly timezones = SUPPORTED_TIMEZONES;

	protected readonly navItems = [
		{ target: 'profile', label: 'Profil', icon: 'lucideUserRound' },
		{ target: 'security', label: 'Sécurité', icon: 'lucideShield' },
		{ target: 'notifications', label: 'Notifications', icon: 'lucideBell' },
		{ target: 'preferences', label: 'Préférences', icon: 'lucideSlidersHorizontal' },
		{ target: 'system', label: 'Système', icon: 'lucideServer' },
	];

	protected readonly notificationToggles = signal<SettingToggle[]>(
		NOTIFICATION_TOGGLES_MOCK.map((t) => ({ ...t })),
	);
	protected readonly securityToggles = signal<SettingToggle[]>(
		SECURITY_TOGGLES_MOCK.map((t) => ({ ...t })),
	);
	protected readonly preferences = signal<AdminPreferences>({ ...ADMIN_PREFERENCES_MOCK });
	protected readonly maintenanceMode = signal<boolean>(false);

	protected readonly saveDialog = signal<boolean>(false);
	protected readonly resetDialog = signal<boolean>(false);
	protected readonly profileDialog = signal<boolean>(false);
	protected readonly passwordDialog = signal<boolean>(false);
	protected readonly sessionsDialog = signal<boolean>(false);

	protected openSaveDialog(): void {
		this.saveDialog.set(true);
	}

	protected openResetDialog(): void {
		this.resetDialog.set(true);
	}

	protected onNotificationToggle(key: string, value: boolean): void {
		this.notificationToggles.update((items) =>
			items.map((t) => (t.key === key ? { ...t, value } : t)),
		);
	}

	protected onSecurityToggle(key: string, value: boolean): void {
		this.securityToggles.update((items) =>
			items.map((t) => (t.key === key ? { ...t, value } : t)),
		);
	}

	protected onMaintenanceToggle(value: boolean): void {
		this.maintenanceMode.set(value);
	}

	protected onLanguageChange(value: LanguageCode): void {
		this.preferences.update((p) => ({ ...p, language: value }));
	}

	protected onThemeChange(value: ThemeMode): void {
		this.preferences.update((p) => ({ ...p, theme: value }));
	}

	protected onCurrencyChange(value: DefaultCurrency): void {
		this.preferences.update((p) => ({ ...p, currency: value }));
	}

	protected onTimezoneChange(value: string): void {
		this.preferences.update((p) => ({ ...p, timezone: value }));
	}
}
