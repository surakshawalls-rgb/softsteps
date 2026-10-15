import { Injectable } from '@angular/core';

import { SupabaseService } from '../../../core/services/supabase.service';

export interface EmailSendRequest {
  to: string;
  subject: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
  attachments?: Array<{ filename: string; contentType: string; contentBase64: string }>;
}

export interface EmailSendResult {
  ok: boolean;
  configured: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class EmailCommunicationService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResult> {
    try {
      const { data, error } = await this.supabaseService.client.functions.invoke('send-admin-email', {
        body: {
          to: request.to,
          subject: request.subject,
          body: request.body,
          // The function deliberately fixes the authenticated sender server-side.
          senderName: request.senderName ?? 'Soft Steps Carpets & Rugs',
          senderEmail: request.senderEmail ?? 'info@softstepscarpets.com',
          attachments: request.attachments ?? [],
        },
      });

      if (error) {
        return {
          ok: false,
          configured: true,
          message: error.message ?? 'The email request could not be accepted by the delivery service.',
        };
      }

      if (!data?.success) {
        return {
          ok: false,
          configured: data?.configured ?? true,
          message: data?.message ?? 'The email request could not be completed.',
        };
      }

      return {
        ok: true,
        configured: true,
        message: data.message ?? 'Email accepted by the Hostinger mail server.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while sending email.';
      return { ok: false, configured: true, message };
    }
  }
}
