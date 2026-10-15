import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../auth/auth';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (await auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/contact']);
};
