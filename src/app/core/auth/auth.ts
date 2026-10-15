import { Injectable } from '@angular/core';

import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabaseService.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const { data, error } = await this.supabaseService.client.auth.getUser();

    return !error && !!data.user;
  }

  async isAdmin(): Promise<boolean> {
    const { data: userData, error: userError } = await this.supabaseService.client.auth.getUser();

    if (userError || !userData.user) {
      return false;
    }

    const { data, error } = await this.supabaseService.client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return !!data;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabaseService.client.auth.signOut();

    if (error) {
      throw error;
    }
  }
}
