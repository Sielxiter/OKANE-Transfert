import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'manager/**', renderMode: RenderMode.Client },
  { path: 'agent/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
