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
        data: { roles: ['RETAILER'] },
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
        data: { roles: ['RETAILER'] },
        loadComponent: () =>
          import('./features/retailer-portal/retailer-suppliers.component').then(
            (m) => m.RetailerSuppliersComponent,
          ),
      },
      {
        path: 'analytics',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER'] },
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

      // Supplier portal (everything scoped to the supplier from the JWT).
      {
        path: 'supplier/dashboard',
        canActivate: [roleGuard],
        data: { roles: ['SUPPLIER'] },
        loadComponent: () =>
          import('./features/supplier-portal/supplier-dashboard.component').then(
            (m) => m.SupplierDashboardComponent,
          ),
      },
      {
        path: 'supplier/orders',
        canActivate: [roleGuard],
        data: { roles: ['SUPPLIER'] },
        loadComponent: () =>
          import('./features/supplier-portal/supplier-orders.component').then(
            (m) => m.SupplierOrdersComponent,
          ),
      },
      {
        path: 'supplier/fleet',
        canActivate: [roleGuard],
        data: { roles: ['SUPPLIER'] },
        loadComponent: () =>
          import('./features/supplier-portal/supplier-fleet.component').then(
            (m) => m.SupplierFleetComponent,
          ),
      },
      {
        path: 'supplier/drivers',
        canActivate: [roleGuard],
        data: { roles: ['SUPPLIER'] },
        loadComponent: () =>
          import('./features/supplier-portal/supplier-drivers.component').then(
            (m) => m.SupplierDriversComponent,
          ),
      },
      {
        path: 'supplier/retailers',
        canActivate: [roleGuard],
        data: { roles: ['SUPPLIER'] },
        loadComponent: () =>
          import('./features/supplier-portal/supplier-retailers.component').then(
            (m) => m.SupplierRetailersComponent,
          ),
      },
      {
        path: 'supplier/analytics',
        canActivate: [roleGuard],
        data: { roles: ['SUPPLIER'] },
        loadComponent: () =>
          import('./features/supplier-portal/supplier-analytics.component').then(
            (m) => m.SupplierAnalyticsComponent,
          ),
      },
      {
        path: 'supplier/notifications',
        canActivate: [roleGuard],
        data: { roles: ['SUPPLIER'] },
        loadComponent: () =>
          import('./features/supplier-portal/supplier-notifications.component').then(
            (m) => m.SupplierNotificationsComponent,
          ),
      },

      { path: 'supplier', redirectTo: 'supplier/dashboard', pathMatch: 'full' },

      // Driver portal.
      {
        path: 'driver/dashboard',
        canActivate: [roleGuard],
        data: { roles: ['DRIVER'] },
        loadComponent: () =>
          import('./features/driver-portal/driver-dashboard.component').then(
            (m) => m.DriverDashboardComponent,
          ),
      },
      {
        path: 'driver/deliveries',
        canActivate: [roleGuard],
        data: { roles: ['DRIVER'] },
        loadComponent: () =>
          import('./features/driver-portal/driver-deliveries.component').then(
            (m) => m.DriverDeliveriesComponent,
          ),
      },
      {
        path: 'driver/navigation',
        canActivate: [roleGuard],
        data: { roles: ['DRIVER'] },
        loadComponent: () =>
          import('./features/driver-portal/driver-navigation.component').then(
            (m) => m.DriverNavigationComponent,
          ),
      },
      {
        path: 'driver/history',
        canActivate: [roleGuard],
        data: { roles: ['DRIVER'] },
        loadComponent: () =>
          import('./features/driver-portal/driver-history.component').then(
            (m) => m.DriverHistoryComponent,
          ),
      },
      {
        path: 'driver/performance',
        canActivate: [roleGuard],
        data: { roles: ['DRIVER'] },
        loadComponent: () =>
          import('./features/driver-portal/driver-performance.component').then(
            (m) => m.DriverPerformanceComponent,
          ),
      },
      {
        path: 'driver/notifications',
        canActivate: [roleGuard],
        data: { roles: ['DRIVER'] },
        loadComponent: () =>
          import('./features/driver-portal/driver-notifications.component').then(
            (m) => m.DriverNotificationsComponent,
          ),
      },
      { path: 'driver', redirectTo: 'driver/dashboard', pathMatch: 'full' },

      { path: '**', component: NotFoundComponent },
    ],
  },
];
