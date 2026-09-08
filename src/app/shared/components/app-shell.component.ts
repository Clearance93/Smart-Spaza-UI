import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="flex h-screen overflow-hidden bg-slate-950">
      <!-- Sidebar -->
      <aside
        class="static lg:static fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#1a1f36] to-[#0f172a] transition-all duration-300"
        [class]="sidebarOpen() ? 'translate-x-0 w-72' : '-translate-x-full w-16'">

        <!-- Logo -->
        <div class="flex items-center justify-between h-16 px-6 border-b border-white/5 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-primary-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span class="text-white font-bold">SS</span>
            </div>
            @if (sidebarOpen()) {
              <div>
                <span class="block text-white font-bold text-lg leading-tight">Smart Spaza</span>
                <span class="block text-primary-300 text-xs font-medium">Supplier Portal</span>
              </div>
            }
          </div>
          <button (click)="toggleSidebar()" class="lg:hidden text-dark-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- User card -->
        <div class="px-4 py-5 mx-3 mt-4 rounded-xl bg-gradient-to-br from-purple-900/40 to-primary-900/30 border border-primary-700/20">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              {{ userInitials() }}
            </div>
            @if (sidebarOpen()) {
              <div class="min-w-0">
                <div class="text-white font-semibold text-sm truncate">{{ user()?.name }}</div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs text-primary-300">{{ roleLabel() }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Nav -->
        <nav class="mt-6 px-3 space-y-1">
          @for (item of visibleNavItems(); track item.route) {
            <a [routerLink]="item.route" routerLinkActive="bg-gradient-to-r from-purple-500/90 to-primary-600/90 text-white shadow-lg shadow-purple-500/25"
              [routerLinkActiveOptions]="{ exact: item.route.endsWith('/dashboard') }"
              class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group"
              [class]="isActive(item.route) ? 'bg-gradient-to-r from-purple-500/90 to-primary-600/90 text-white shadow-lg shadow-purple-500/25' : 'text-dark-300 hover:bg-white/5 hover:text-white'">
              <div class="flex items-center gap-3">
                <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
                @if (sidebarOpen()) {
                  <span class="text-sm font-medium whitespace-nowrap">{{ item.label }}</span>
                }
              </div>
            </a>
          }
        </nav>

        <!-- User + Logout -->
        <div class="border-t border-white/10 p-3 flex-shrink-0">
          <button (click)="logout()"
            class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-dark-300 hover:bg-white/5 hover:text-white transition-colors"
            [title]="!sidebarOpen() ? 'Sign out' : ''">
            <span class="text-lg flex-shrink-0">🚪</span>
            @if (sidebarOpen()) { <span class="text-sm font-medium">Sign out</span> }
          </button>
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex flex-col flex-1 min-w-0 transition-all duration-300 overflow-hidden">

        <!-- Top bar -->
        <header class="h-16 border-b flex items-center px-4 gap-4 flex-shrink-0 z-30 bg-slate-900 border-slate-800">
          <button (click)="toggleSidebar()"
            class="p-2 rounded-lg transition-colors"
            [class]="isDriver() ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div class="flex-1"></div>

          <!-- Notifications -->
          <button class="relative p-2 rounded-lg transition-colors"
            [class]="isDriver() ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </button>

          <!-- User avatar -->
          <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span class="text-white text-xs font-bold">{{ userInitials() }}</span>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto bg-slate-950">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AppShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = signal(true);
  user = this.auth.user;
  isDriver = this.auth.isDriver;
  isSupplier = this.auth.isSupplier;

  userInitials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  roleLabel = computed(() => {
    const map: Record<string, string> = { RETAILER: 'Retailer', SUPPLIER: 'Supplier', ADMIN: 'Administrator', DRIVER: 'Driver' };
    return map[this.auth.userRole() ?? ''] ?? '';
  });

  isActive(route: string): boolean {
    const current = this.router.url.split('?')[0];
    return current === route || current.startsWith(route + '/');
  }

  private allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: '🏠', route: '/dashboard', roles: ['RETAILER'] },
    { label: 'Inventory', icon: '📦', route: '/inventory', roles: ['RETAILER'] },
    { label: 'Suppliers', icon: '🤝', route: '/suppliers', roles: ['RETAILER'] },
    { label: 'Orders', icon: '📋', route: '/orders', roles: ['RETAILER'] },
    { label: 'Analytics', icon: '📊', route: '/analytics', roles: ['RETAILER'] },
    { label: 'Settings', icon: '⚙️', route: '/settings', roles: ['RETAILER'] },
    // Supplier
    { label: 'Dashboard', icon: '🏠', route: '/supplier/dashboard', roles: ['SUPPLIER'] },
    { label: 'Command Center', icon: '⚡', route: '/supplier/command-center', roles: ['SUPPLIER'] },
    { label: 'My Products', icon: '📦', route: '/supplier/products', roles: ['SUPPLIER'] },
    { label: 'Orders', icon: '📋', route: '/supplier/orders', roles: ['SUPPLIER'] },
    { label: 'Analytics', icon: '📊', route: '/supplier/analytics', roles: ['SUPPLIER'] },
    // Admin
    { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard', roles: ['ADMIN'] },
    { label: 'Retailers', icon: '🏪', route: '/admin/retailers', roles: ['ADMIN'] },
    { label: 'Suppliers', icon: '🤝', route: '/admin/suppliers', roles: ['ADMIN'] },
    { label: 'Orders', icon: '📋', route: '/admin/orders', roles: ['ADMIN'] },
    // Driver
    { label: 'Dashboard', icon: '🚚', route: '/driver/dashboard', roles: ['DRIVER'] },
    { label: 'Deliveries', icon: '📦', route: '/driver/deliveries', roles: ['DRIVER'] },
    { label: 'Navigation', icon: '🧭', route: '/driver/navigation', roles: ['DRIVER'] },
    { label: 'History', icon: '🕓', route: '/driver/history', roles: ['DRIVER'] },
    { label: 'Earnings', icon: '💰', route: '/driver/earnings', roles: ['DRIVER'] },
    { label: 'Settings', icon: '⚙️', route: '/driver/settings', roles: ['DRIVER'] },
  ];

  visibleNavItems = computed(() => {
    const role = this.auth.userRole();
    return this.allNavItems.filter(item => role && item.roles.includes(role));
  });

  toggleSidebar() { this.sidebarOpen.update(v => !v); }

  logout() { this.auth.logout(); }
}
