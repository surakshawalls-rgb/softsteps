import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private readonly supabase: SupabaseClient = createClient(
    environment.supabase.url,
    environment.supabase.publishableKey
  );

  get client(): SupabaseClient {
    return this.supabase;
  }
}