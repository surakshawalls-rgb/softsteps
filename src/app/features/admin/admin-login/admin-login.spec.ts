import { getSafeAdminReturnUrl } from './admin-login';

describe('getSafeAdminReturnUrl', () => {
  it('preserves safe internal admin destinations', () => {
    expect(getSafeAdminReturnUrl('/admin/communications')).toBe('/admin/communications');
    expect(getSafeAdminReturnUrl('/admin/communications?tab=email')).toBe(
      '/admin/communications?tab=email',
    );
  });

  it('defaults invalid, external, and login-loop destinations to the overview', () => {
    expect(getSafeAdminReturnUrl(null)).toBe('/admin');
    expect(getSafeAdminReturnUrl('https://example.com/admin')).toBe('/admin');
    expect(getSafeAdminReturnUrl('//example.com/admin')).toBe('/admin');
    expect(getSafeAdminReturnUrl('/admin/login')).toBe('/admin');
    expect(getSafeAdminReturnUrl('/admin/access-denied')).toBe('/admin');
    expect(getSafeAdminReturnUrl('/admin/../contact')).toBe('/admin');
  });
});
