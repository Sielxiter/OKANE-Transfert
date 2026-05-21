import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGalleryVerticalEnd } from '@ng-icons/lucide';
import { LoginFormComponent } from './login-form.component';
import { ThemeToggleComponent } from '../../shared/theme/theme-toggle.component';

@Component({
  selector: 'spartan-login-two-column-reactive-form',
  standalone: true,
  imports: [RouterLink, LoginFormComponent, ThemeToggleComponent, NgIcon],
  providers: [provideIcons({ lucideGalleryVerticalEnd })],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  template: `
    <div class="grid min-h-svh lg:grid-cols-2">
      <div class="flex flex-col gap-4 p-6 md:p-10">
        <div class="flex items-center justify-between gap-2">
          <a routerLink="." class="flex items-center gap-2 font-medium">
            <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <ng-icon name="lucideGalleryVerticalEnd" class="text-base" />
            </div>
            Okane Transfer
          </a>
          <okane-theme-toggle />
        </div>
        <div class="flex flex-1 items-center justify-center">
          <div class="w-full max-w-xs">
            <spartan-two-column-login-form />
          </div>
        </div>
      </div>
      <div class="bg-muted relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Image"
          class="absolute inset-0 h-full w-full object-cover brightness-60 grayscale dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  `,
})
export class LoginPageComponent {}
