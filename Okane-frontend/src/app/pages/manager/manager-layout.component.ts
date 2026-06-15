import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebarInset } from '../../pages/dashboard/sidebar-inset/app-sidebar';
import { SiteHeader } from '../../pages/dashboard/sidebar-inset/site-header';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'okane-manager-layout',
  standalone: true,
  imports: [HlmSidebarImports, RouterOutlet, AppSidebarInset, SiteHeader],
  template: `
    <spartan-app-sidebar-inset>
      <main hlmSidebarInset>
        <spartan-site-header-inset />
        <div class="flex flex-1 flex-col gap-4 p-4">
          <router-outlet />
        </div>
      </main>
    </spartan-app-sidebar-inset>
  `,
})
export class ManagerLayoutComponent {}
