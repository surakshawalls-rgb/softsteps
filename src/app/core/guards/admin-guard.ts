import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../auth/auth';

export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  try {
    if (!(await auth.isAuthenticated())) {
      return router.createUrlTree(['/admin/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (await auth.isAdmin()) {
      return true;
    }
  } catch {
    return router.createUrlTree(['/admin/access-denied'], {
      queryParams: { reason: 'verification' },
    });
  }

  return router.createUrlTree(['/admin/access-denied']);
};
