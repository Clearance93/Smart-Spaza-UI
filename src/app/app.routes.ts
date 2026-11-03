import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components/app-shell.component';
import { roleGuard } from './core/guards/role.guard';
import { NotFoundComponent } from './shared/components/not-found.component';

/**
 * Only screens backed by SmartSpazaAPI are routed. Every request is scoped to the
 * signed-in business on the server, so a user only ever sees their own data.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [roleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/live-dashboard.component').then((m) => m.LiveDashboardComponent),
      },
      {
        path: 'inventory',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER', 'SUPPLIER'] },
        loadComponent: () =>
          import('./features/retailer-portal/retailer-inventory.component').then(
            (m) => m.RetailerInventoryComponent,
          ),
      },
      {
        path: 'scanner',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER', 'SUPPLIER'] },
        loadComponent: () =>
          import('./features/scanner/scanner.component').then((m) => m.ScannerComponent),
      },

      // Legacy bookmarks from the old supplier portal.
      { path: 'supplier/dashboard', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'supplier', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: '**', component: NotFoundComponent },
    ],
  },
];
