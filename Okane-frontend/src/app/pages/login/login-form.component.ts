import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { remixGithubFill, remixLoader4Line } from '@ng-icons/remixicon';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { finalize } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { I18nPipe } from '../../shared/i18n/i18n.pipe';

type LoginResponse = {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
  tokenType: string;
  redirectTo: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    enabled: boolean;
    accountLocked: boolean;
    accountSuspended: boolean;
    agency: { id: number; name: string; code: string } | null;
  };
};

@Component({
  selector: 'spartan-two-column-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HlmFieldImports, HlmInputImports, HlmButtonImports, NgIcon, I18nPipe],
  providers: [provideIcons({ remixGithubFill, remixLoader4Line })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="login()">
      <hlm-field-group>
        <div class="flex flex-col items-center gap-1 text-center">
          <h1 class="text-2xl font-bold">{{ 'Connexion à votre compte' | okaneI18n }}</h1>
          <p class="text-muted-foreground text-sm text-balance">
            {{ 'Entrez votre courriel pour accéder à Okane Transfer' | okaneI18n }}
          </p>
        </div>

        <hlm-field>
          <label hlmFieldLabel for="email">{{ 'Courriel' | okaneI18n }}</label>
          <input hlmInput type="email" id="email" placeholder="m@example.com" formControlName="email" />
          <hlm-field-error validator="required">{{ 'Le courriel est obligatoire.' | okaneI18n }}</hlm-field-error>
          <hlm-field-error validator="email">{{ 'Entrez une adresse courriel valide.' | okaneI18n }}</hlm-field-error>
        </hlm-field>

        <hlm-field>
          <div class="flex items-center">
            <label hlmFieldLabel for="password">{{ 'Mot de passe' | okaneI18n }}</label>
            <a hlmFieldDescription class="ml-auto text-sm underline-offset-4 hover:underline" routerLink=".">
              {{ 'Mot de passe oublié ?' | okaneI18n }}
            </a>
          </div>
          <input hlmInput type="password" id="password" formControlName="password" />
          <hlm-field-error validator="required">{{ 'Le mot de passe est obligatoire.' | okaneI18n }}</hlm-field-error>
          <hlm-field-error validator="minlength">{{ 'Le mot de passe doit contenir au moins 8 caractères.' | okaneI18n }}</hlm-field-error>
        </hlm-field>

        <hlm-field>
          <button hlmBtn type="submit" [disabled]="form.invalid || isSubmitting">
            @if (isSubmitting) {
              <ng-icon name="remixLoader4Line" class="mr-2 text-xl animate-spin" />
            }
            {{ isSubmitting ? ('Connexion...' | okaneI18n) : ('Se connecter' | okaneI18n) }}
          </button>
          @if (loginError) {
            <p class="text-destructive text-center text-sm">{{ loginError }}</p>
          }
        </hlm-field>

        <hlm-field-separator>{{ 'Ou continuer avec' | okaneI18n }}</hlm-field-separator>

        <hlm-field>
          <button hlmBtn variant="outline" type="button">
            <ng-icon name="remixGithubFill" class="text-xl" />
            {{ 'Connexion avec GitHub' | okaneI18n }}
          </button>
          <p hlmFieldDescription class="text-center">
            {{ 'Pas encore de compte ?' | okaneI18n }}
            <a routerLink=".">{{ 'Créer un compte' | okaneI18n }}</a>
          </p>
        </hlm-field>
      </hlm-field-group>
    </form>
  `,
})
export class LoginFormComponent {
  private readonly _fb = inject(FormBuilder);
  private readonly _http = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly _apiBaseUrl = `${API_BASE_URL}/auth`;

  public readonly form = this._fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  public isSubmitting = false;
  public loginError = '';

  public login(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.loginError = '';
    this.form.disable({ emitEvent: false });
    this._cdr.markForCheck();

    const payload = {
      email: this.form.value.email?.trim() ?? '',
      password: this.form.value.password ?? '',
    };

    this._http
      .post<LoginResponse>(`${this._apiBaseUrl}/login`, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.form.enable({ emitEvent: false });
          this._cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          localStorage.setItem('okane_access_token', response.accessToken);
          localStorage.setItem('okane_refresh_token', response.refreshToken);
          localStorage.setItem('okane_token_type', response.tokenType);
          localStorage.setItem('okane_user', JSON.stringify(response.user));
          this._router.navigateByUrl(response.redirectTo || '/dashboard');
        },
        error: (error) => {
          this.loginError =
            error?.error?.message ??
            'Connexion échouée. Vérifiez vos identifiants puis réessayez.';
          this._cdr.markForCheck();
        },
      });
  }
}
