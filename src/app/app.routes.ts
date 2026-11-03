import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components/app-shell.component';
import { roleGuard } from './core/guards/role.guard';
import { SupplierDashboardComponent } from './features/supplier-portal/supplier-dashboard.component';
import { SupplierOrdersComponent } from './features/supplier-portal/supplier-orders.component';
import { SupplierProductsComponent } from './features/supplier-portal/supplier-products.component';
import { SupplierAnalyticsComponent } from './features/supplier-portal/supplier-analytics.component';
import { SupplierCommandCenterComponent } from './features/supplier-portal/supplier-command-center.component';
import { NotFoundComponent } from './shared/components/not-found.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [roleGuard],
    children: [
      { path: '', redirectTo: 'supplier/dashboard', pathMatch: 'full' },

      {
        path: 'supplier',
        canActivate: [roleGuard],
        data: { roles: ['SUPPLIER'] },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: SupplierDashboardComponent },
          { path: 'command-center', component: SupplierCommandCenterComponent },
          { path: 'products', component: SupplierProductsComponent },
          { path: 'orders', component: SupplierOrdersComponent },
          { path: 'analytics', component: SupplierAnalyticsComponent },
        ],
      },

      {
        path: '',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER'] },
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/retailer-portal/retailer-dashboard.component').then(
                (m) => m.RetailerDashboardComponent,
              ),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./features/retailer-portal/retailer-orders.component').then(
                (m) => m.RetailerOrdersComponent,
              ),
          },
          {
            path: 'tracking',
            loadComponent: () =>
              import('./features/retailer-portal/retailer-tracking.component').then(
                (m) => m.RetailerTrackingComponent,
              ),
          },
          {
            path: 'inventory',
            loadComponent: () =>
              import('./features/retailer-portal/retailer-inventory.component').then(
                (m) => m.RetailerInventoryComponent,
              ),
          },
          {
            path: 'suppliers',
            loadComponent: () =>
              import('./features/retailer-portal/retailer-suppliers.component').then(
                (m) => m.RetailerSuppliersComponent,
              ),
          },
          {
            path: 'analytics',
            loadComponent: () =>
              import('./features/retailer-portal/retailer-analytics.component').then(
                (m) => m.RetailerAnalyticsComponent,
              ),
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./features/retailer-portal/retailer-notifications.component').then(
                (m) => m.RetailerNotificationsComponent,
              ),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/retailer-portal/retailer-settings.component').then(
                (m) => m.RetailerSettingsComponent,
              ),
          },
        ],
      },

      {
        path: 'driver',
        canActivate: [roleGuard],
        data: { roles: ['DRIVER'] },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/driver-portal/driver-dashboard.component').then(
                (m) => m.DriverDashboardComponent,
              ),
          },
          {
            path: 'deliveries',
            loadComponent: () =>
              import('./features/driver-portal/driver-deliveries.component').then(
                (m) => m.DriverDeliveriesComponent,
              ),
          },
          {
            path: 'navigation',
            loadComponent: () =>
              import('./features/driver-portal/driver-navigation.component').then(
                (m) => m.DriverNavigationComponent,
              ),
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./features/driver-portal/driver-history.component').then(
                (m) => m.DriverHistoryComponent,
              ),
          },
          {
            path: 'earnings',
            loadComponent: () =>
              import('./features/driver-portal/driver-earnings.component').then(
                (m) => m.DriverEarningsComponent,
              ),
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./features/driver-portal/driver-notifications.component').then(
                (m) => m.DriverNotificationsComponent,
              ),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/driver-portal/driver-settings.component').then(
                (m) => m.DriverSettingsComponent,
              ),
          },
        ],
      },

      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/admin-portal/admin-dashboard.component').then(
                (m) => m.AdminDashboardComponent,
              ),
          },
          {
            path: 'retailers',
            loadComponent: () =>
              import('./features/admin-portal/admin-list.component').then((m) => m.AdminListComponent),
            data: { kind: 'retailers', title: 'Retailers', subtitle: 'Shops buying through Smart Spaza' },
          },
          {
            path: 'suppliers',
            loadComponent: () =>
              import('./features/admin-portal/admin-list.component').then((m) => m.AdminListComponent),
            data: { kind: 'suppliers', title: 'Suppliers', subtitle: 'Wholesalers and distributors on the platform' },
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./features/admin-portal/admin-list.component').then((m) => m.AdminListComponent),
            data: { kind: 'orders', title: 'All Orders', subtitle: 'Every order across the marketplace' },
          },
        ],
      },

      {
        path: 'scanner',
        canActivate: [roleGuard],
        data: { roles: ['RETAILER', 'SUPPLIER'] },
        loadComponent: () =>
          import('./features/scanner/scanner.component').then((m) => m.ScannerComponent),
      },

      { path: '**', component: NotFoundComponent },
    ],
  },
];
