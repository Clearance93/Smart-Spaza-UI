import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data?.['roles'] as User['role'][] | undefined) ?? [];
  const user = auth.user();

  if (!user) return router.createUrlTree(['/login']);
  if (roles.length > 0 && !roles.includes(user.role)) {
    return router.createUrlTree([auth.homeRoute(user.role)]);
  }
  return true;
};

export const homeRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  return router.createUrlTree([user ? auth.homeRoute(user.role) : '/login']);
};
