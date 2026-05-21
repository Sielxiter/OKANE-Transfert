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
  imports: [ReactiveFormsModule, RouterLink, HlmFieldImports, HlmInputImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ remixGithubFill, remixLoader4Line })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="login()">
      <hlm-field-group>
        <div class="flex flex-col items-center gap-1 text-center">
          <h1 class="text-2xl font-bold">Login to your account</h1>
          <p class="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>

        <hlm-field>
          <label hlmFieldLabel for="email">Email</label>
          <input hlmInput type="email" id="email" placeholder="m@example.com" formControlName="email" />
          <hlm-field-error validator="required">Email is required.</hlm-field-error>
          <hlm-field-error validator="email">Enter a valid email address.</hlm-field-error>
        </hlm-field>

        <hlm-field>
          <div class="flex items-center">
            <label hlmFieldLabel for="password">Password</label>
            <a hlmFieldDescription class="ml-auto text-sm underline-offset-4 hover:underline" routerLink=".">
              Forgot password?
            </a>
          </div>
          <input hlmInput type="password" id="password" formControlName="password" />
          <hlm-field-error validator="required">Password is required.</hlm-field-error>
          <hlm-field-error validator="minlength">Password must be at least 8 characters long.</hlm-field-error>
        </hlm-field>

        <hlm-field>
          <button hlmBtn type="submit" [disabled]="form.invalid || isSubmitting">
            @if (isSubmitting) {
              <ng-icon name="remixLoader4Line" class="mr-2 text-xl animate-spin" />
            }
            {{ isSubmitting ? 'Signing in...' : 'Login' }}
          </button>
          @if (loginError) {
            <p class="text-destructive text-center text-sm">{{ loginError }}</p>
          }
        </hlm-field>

        <hlm-field-separator>Or continue with</hlm-field-separator>

        <hlm-field>
          <button hlmBtn variant="outline" type="button">
            <ng-icon name="remixGithubFill" class="text-xl" />
            Login with GitHub
          </button>
          <p hlmFieldDescription class="text-center">
            Don't have an account?
            <a routerLink=".">Sign up</a>
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
  private readonly _apiBaseUrl = 'http://localhost:8080/api/auth';

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
      .pipe(finalize(() => {
        this.isSubmitting = false;
        this.form.enable({ emitEvent: false });
        this._cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          localStorage.setItem('okane_access_token', response.accessToken);
          localStorage.setItem('okane_refresh_token', response.refreshToken);
          localStorage.setItem('okane_token_type', response.tokenType);
          localStorage.setItem('okane_user', JSON.stringify(response.user));
          this._router.navigateByUrl(response.redirectTo || '/dashboard');
        },
        error: (error) => {
          this.loginError = error?.error?.message ?? 'Login failed. Check your credentials and try again.';
          this._cdr.markForCheck();
        },
      });
  }
}
