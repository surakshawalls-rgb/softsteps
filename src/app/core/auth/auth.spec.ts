import { TestBed } from '@angular/core/testing';

import { SupabaseService } from '../services/supabase.service';
import { Auth } from './auth';

describe('Auth', () => {
  let service: Auth;
  let currentUserId: string | null;
  let membershipRow: { user_id: string } | null;
  let membershipError: Error | null;
  let queriedTable: string;
  let selectedColumns: string;
  let queriedUserId: string;

  beforeEach(() => {
    currentUserId = null;
    membershipRow = null;
    membershipError = null;
    queriedTable = '';
    selectedColumns = '';
    queriedUserId = '';

    const client = {
      auth: {
        getUser: async () => ({
          data: { user: currentUserId ? { id: currentUserId } : null },
          error: null,
        }),
      },
      from: (table: string) => {
        queriedTable = table;

        return {
          select: (columns: string) => {
            selectedColumns = columns;

            return {
              eq: (column: string, value: string) => {
                if (column === 'user_id') {
                  queriedUserId = value;
                }

                return {
                  maybeSingle: async () => ({
                    data: membershipRow,
                    error: membershipError,
                  }),
                };
              },
            };
          },
        };
      },
    };

    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: SupabaseService, useValue: { client } },
      ],
    });
    service = TestBed.inject(Auth);
  });

  it('checks the current Supabase user membership by user ID', async () => {
    currentUserId = 'auth-user-123';
    membershipRow = { user_id: currentUserId };

    await expect(service.isAdmin()).resolves.toBe(true);
    expect(queriedTable).toBe('admin_users');
    expect(selectedColumns).toBe('user_id');
    expect(queriedUserId).toBe('auth-user-123');
  });

  it('denies access when there is no authenticated user', async () => {
    await expect(service.isAdmin()).resolves.toBe(false);
    expect(queriedTable).toBe('');
  });

  it('denies access when the membership row is absent', async () => {
    currentUserId = 'auth-user-123';

    await expect(service.isAdmin()).resolves.toBe(false);
  });

  it('reports membership lookup failures to the caller', async () => {
    currentUserId = 'auth-user-123';
    membershipError = new Error('Database unavailable');

    await expect(service.isAdmin()).rejects.toThrow('Database unavailable');
  });
});
