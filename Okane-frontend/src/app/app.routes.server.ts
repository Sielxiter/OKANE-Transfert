import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public pages can be pre-rendered
  { path: 'login', renderMode: RenderMode.Prerender },
  // All protected routes must render on the client so the auth guard
  // can read localStorage and redirect to /login if needed.
  { path: '**', renderMode: RenderMode.Client },
];
