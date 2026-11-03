import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-2xl mx-auto animate-fade-in">
      <div class="bg-white rounded-2xl border border-dark-100 p-10 text-center card-shadow-lg">
        <div class="text-5xl mb-4">🚧</div>
        <h1 class="text-xl font-bold text-dark-900 mb-1">This section isn't built yet</h1>
        <p class="text-sm text-dark-500 max-w-md mx-auto">
          The page you're looking for is part of the roadmap but hasn't been implemented in this
          build yet.
        </p>
        <a [routerLink]="home()"
          class="inline-block mt-6 text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-600 text-white hover:from-primary-700 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25">
          Back to dashboard
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  private auth = inject(AuthService);

  home(): string {
    const role = this.auth.userRole();
    return role ? this.auth.homeRoute(role as never) : '/login';
  }
}
