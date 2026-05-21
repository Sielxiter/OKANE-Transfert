import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoonStar, lucideSunMedium } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ThemeService } from './theme.service';

@Component({
  selector: 'okane-theme-toggle',
  standalone: true,
  imports: [HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideMoonStar, lucideSunMedium })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="icon"
      type="button"
      class="text-muted-foreground"
      [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-pressed]="theme.isDark()"
      (click)="theme.toggle()"
    >
      <ng-icon [name]="theme.isDark() ? 'lucideSunMedium' : 'lucideMoonStar'" class="text-base" />
    </button>
  `,
})
export class ThemeToggleComponent {
  constructor(public readonly theme: ThemeService) {}
}
