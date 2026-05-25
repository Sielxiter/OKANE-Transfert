import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _storageKey = 'okane-theme';
  private readonly _isDark = signal(true);

  public readonly isDark = this._isDark.asReadonly();

  constructor() {
    this.initializeTheme();

    effect(() => {
      if (!isPlatformBrowser(this._platformId)) {
        return;
      }

      this._document.documentElement.classList.toggle('dark', this._isDark());
    });
  }

  public toggle(): void {
    this.setDark(!this._isDark());
  }

  public setDark(isDark: boolean): void {
    this._isDark.set(isDark);

    if (!isPlatformBrowser(this._platformId)) {
      return;
    }

    this._document.documentElement.classList.toggle('dark', isDark);
    this._document.defaultView?.localStorage.setItem(this._storageKey, isDark ? 'dark' : 'light');
  }

  private initializeTheme(): void {
    if (!isPlatformBrowser(this._platformId)) {
      this._isDark.set(true);
      return;
    }

    const storedTheme = this._document.defaultView?.localStorage.getItem(this._storageKey);
    const prefersDark = this._document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? true;
    const initialDark = storedTheme ? storedTheme === 'dark' : prefersDark;

    this._isDark.set(initialDark);
    this._document.documentElement.classList.toggle('dark', initialDark);
  }
}
