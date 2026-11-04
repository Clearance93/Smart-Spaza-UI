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
        path: 'orders',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER', 'SUPPLIER'] },
        loadComponent: () =>
          import('./features/retailer-portal/retailer-orders.component').then(
            (m) => m.RetailerOrdersComponent,
          ),
      },
      {
        path: 'tracking',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER'] },
        loadComponent: () =>
          import('./features/retailer-portal/retailer-tracking.component').then(
            (m) => m.RetailerTrackingComponent,
          ),
      },
      {
        path: 'suppliers',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER', 'SUPPLIER'] },
        loadComponent: () =>
          import('./features/retailer-portal/retailer-suppliers.component').then(
            (m) => m.RetailerSuppliersComponent,
          ),
      },
      {
        path: 'analytics',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER', 'SUPPLIER'] },
        loadComponent: () =>
          import('./features/retailer-portal/retailer-analytics.component').then(
            (m) => m.RetailerAnalyticsComponent,
          ),
      },
      {
        path: 'notifications',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER', 'SUPPLIER', 'DRIVER'] },
        loadComponent: () =>
          import('./features/retailer-portal/retailer-notifications.component').then(
            (m) => m.RetailerNotificationsComponent,
          ),
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER', 'SUPPLIER', 'DRIVER'] },
        loadComponent: () =>
          import('./features/retailer-portal/retailer-settings.component').then(
            (m) => m.RetailerSettingsComponent,
          ),
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
