import { Injectable } from '@angular/core';

import {
  BUSINESS_DETAILS,
  MESSAGE_TEMPLATES,
  type CommunicationChannel,
  type MessageTemplate,
} from '../data/message-templates';
import { getGreetingName, replacePlaceholders } from '../utils/message-template.utils';

export interface TemplateRenderInputs {
  buyerName?: string | null;
  companyName?: string | null;
  productName?: string | null;
  senderName?: string | null;
  senderEmail?: string | null;
  website?: string | null;
}

@Injectable({ providedIn: 'root' })
export class MessageTemplateService {
  readonly templates: MessageTemplate[] = MESSAGE_TEMPLATES;

  getTemplate(id: string): MessageTemplate | undefined {
    return this.templates.find((template) => template.id === id);
  }

  renderTemplate(
    template: MessageTemplate,
    channel: CommunicationChannel,
    values: TemplateRenderInputs = {},
  ): { subject: string; body: string } {
    const greetingName = getGreetingName(values.buyerName);
    const resolvedValues = {
      buyerName: greetingName,
      companyName: values.companyName ?? '',
      productName: values.productName ?? 'the requested product',
      senderName: values.senderName ?? BUSINESS_DETAILS.businessName,
      senderEmail: values.senderEmail ?? BUSINESS_DETAILS.businessEmail,
      website: values.website ?? BUSINESS_DETAILS.website,
    };

    const subject = replacePlaceholders(template.emailSubject, resolvedValues);
    const bodySource = channel === 'email' ? template.emailBody : template.whatsappBody;
    const body = replacePlaceholders(bodySource, resolvedValues);

    return { subject, body };
  }
}
