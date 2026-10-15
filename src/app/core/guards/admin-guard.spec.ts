import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { Auth } from '../auth/auth';
import { adminGuard } from './admin-guard';

describe('adminGuard', () => {
  let authStub: Pick<Auth, 'isAuthenticated' | 'isAdmin'>;

  beforeEach(() => {
    authStub = {
      isAuthenticated: async () => false,
      isAdmin: async () => false,
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: Auth,
          useFactory: () => authStub,
        },
      ],
    });
  });

  async function runGuard(url: string): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    ) as Promise<boolean | UrlTree>;
  }

  it('redirects unauthenticated users to login with the requested admin URL', async () => {
    const result = await runGuard('/admin/communications');
    const router = TestBed.inject(Router);

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/admin/login?returnUrl=%2Fadmin%2Fcommunications',
    );
  });

  it('allows a verified administrator', async () => {
    authStub = {
      isAuthenticated: async () => true,
      isAdmin: async () => true,
    };

    await expect(runGuard('/admin')).resolves.toBe(true);
  });

  it('denies authenticated users without a membership row', async () => {
    authStub = {
      isAuthenticated: async () => true,
      isAdmin: async () => false,
    };

    const result = await runGuard('/admin/communications');
    const router = TestBed.inject(Router);

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin/access-denied');
  });

  it('denies access when membership verification fails', async () => {
    authStub = {
      isAuthenticated: async () => true,
      isAdmin: async () => {
        throw new Error('Membership query failed');
      },
    };

    const result = await runGuard('/admin/communications');
    const router = TestBed.inject(Router);

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/admin/access-denied?reason=verification',
    );
  });
});
