import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseClientService {

  private readonly clientInstance: SupabaseClient;

  constructor() {
    this.clientInstance = createClient(
      environment.supabase.url,
      environment.supabase.publishableKey
    );
  }

  get client(): SupabaseClient {
    return this.clientInstance;
  }
}
