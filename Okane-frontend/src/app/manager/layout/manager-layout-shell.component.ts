import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgentLayoutComponent } from '../../agent/layout/agent-layout.component';

@Component({
  selector: 'okane-manager-layout-shell',
  standalone: true,
  imports: [AgentLayoutComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <okane-agent-layout [pageTitle]="pageTitle" rootLabel="Manager" rootLink="/manager/dashboard">
      <router-outlet />
    </okane-agent-layout>
  `,
})
export class ManagerLayoutShellComponent {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _cdr = inject(ChangeDetectorRef);

  public pageTitle = 'Manager';

  constructor() {
    this._router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => {
        this.pageTitle = this.getPageTitle() ?? 'Manager';
        this._cdr.markForCheck();
      });
  }

  private getPageTitle(): string | null {
    let current: ActivatedRoute | null = this._route;
    while (current?.firstChild) {
      current = current.firstChild;
    }
    return (current?.snapshot?.data?.['pageTitle'] as string | undefined) ?? null;
  }
}
