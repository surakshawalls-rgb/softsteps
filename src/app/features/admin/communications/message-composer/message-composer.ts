import { Component, OnInit } from '@angular/core';

interface EmailAttachment { filename: string; contentType: string; contentBase64: string; size: number; }
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BUSINESS_DETAILS, MESSAGE_TEMPLATES, type CommunicationChannel } from '../../data/message-templates';
import { EmailCommunicationService } from '../../services/email-communication.service';
import { MessageTemplateService } from '../../services/message-template.service';
import { WhatsAppCommunicationService } from '../../services/whatsapp-communication.service';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './message-composer.html',
  styleUrl: './message-composer.css',
})
export class MessageComposer implements OnInit {
  readonly templates = MESSAGE_TEMPLATES;
  readonly businessDetails = BUSINESS_DETAILS;

  channel: CommunicationChannel = 'email';
  templateId = MESSAGE_TEMPLATES[0].id;
  recipientName = '';
  recipientCompany = '';
  recipientEmail = '';
  recipientPhone = '';
  productName = '';
  messageContext = '';
  emailSubject = '';
  messageBody = '';
  successMessage = '';
  errorMessage = '';
  isSubmitting = false;
  attachments: EmailAttachment[] = [];
  readonly maxAttachmentBytes = 5 * 1024 * 1024;
  readonly allowedAttachmentTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  constructor(
    private readonly messageTemplateService: MessageTemplateService,
    private readonly emailService: EmailCommunicationService,
    private readonly whatsappService: WhatsAppCommunicationService,
  ) {}

  ngOnInit(): void {
    this.syncTemplate();
  }

  get selectedTemplate() {
    return this.templates.find((template) => template.id === this.templateId) ?? this.templates[0];
  }

  get recipientLabel(): string {
    return this.channel === 'email' ? 'Recipient email address' : 'Recipient WhatsApp number';
  }

  get recipientPlaceholder(): string {
    return this.channel === 'email' ? 'buyer@example.com' : '+91 98765 43210';
  }

  onChannelChange(): void {
    this.clearMessages();
    this.syncTemplate();
  }

  onTemplateChange(): void {
    this.clearMessages();
    this.syncTemplate();
  }

  async onAttachmentSelection(event: Event): Promise<void> {
    this.clearMessages();
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    for (const file of files) {
      if (!this.allowedAttachmentTypes.includes(file.type)) {
        this.errorMessage = `${file.name}: only JPG, PNG, WebP, and PDF files are allowed.`;
        continue;
      }
      if (file.size <= 0 || file.size > this.maxAttachmentBytes) {
        this.errorMessage = `${file.name}: file must be between 1 byte and 5 MB.`;
        continue;
      }
      if (this.attachments.some(item => item.filename === file.name && item.size === file.size)) {
        continue;
      }
      if (this.attachments.reduce((sum, item) => sum + item.size, 0) + file.size > this.maxAttachmentBytes) {
        this.errorMessage = 'The total attachment size cannot exceed 5 MB.';
        break;
      }

      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
        reader.onload = () => {
          const result = String(reader.result ?? '');
          const comma = result.indexOf(',');
          if (comma < 0) reject(new Error(`Could not encode ${file.name}.`));
          else resolve(result.slice(comma + 1));
        };
        reader.readAsDataURL(file);
      }).catch(error => {
        this.errorMessage = error instanceof Error ? error.message : 'Could not read attachment.';
        return '';
      });

      if (contentBase64) {
        this.attachments.push({
          filename: file.name.replace(/[\\/\r\n"]/g, '_').slice(0, 120),
          contentType: file.type,
          contentBase64,
          size: file.size
        });
      }
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }
  async sendEmail(): Promise<void> {
    this.clearMessages();

    const trimmedEmail = this.recipientEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!trimmedEmail || !isValidEmail) {
      this.errorMessage = 'Please enter a valid recipient email address before sending.';
      return;
    }

    const rendered = this.messageTemplateService.renderTemplate(this.selectedTemplate, 'email', {
      buyerName: this.recipientName,
      companyName: this.recipientCompany,
      productName: this.productName,
      senderName: this.businessDetails.businessName,
      senderEmail: this.businessDetails.businessEmail,
      website: this.businessDetails.website,
    });

    const cleanedBody = this.appendContextToBody(rendered.body, this.messageContext);

    this.isSubmitting = true;

    try {
      const result = await this.emailService.sendEmail({
        to: trimmedEmail,
        subject: this.emailSubject || rendered.subject,
        body: cleanedBody,
        senderName: this.businessDetails.businessName,
        senderEmail: this.businessDetails.businessEmail,
      });

      if (result.ok) {
        this.successMessage = result.message;
      } else {
        this.errorMessage = result.message;
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  openWhatsApp(): void {
    this.clearMessages();

    const phone = this.recipientPhone.trim();

    if (!phone) {
      this.errorMessage = 'Please enter the recipient WhatsApp number before opening WhatsApp.';
      return;
    }

    try {
      const url = this.whatsappService.buildWhatsAppUrl(phone, this.messageBody || this.getCurrentMessageBody());
      window.open(url, '_blank', 'noopener,noreferrer');
      this.successMessage = 'WhatsApp opened successfully. Please confirm and send the prefilled message from the app.';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to open WhatsApp with the provided number.';
    }
  }

  syncTemplate(): void {
    const template = this.selectedTemplate;
    const rendered = this.messageTemplateService.renderTemplate(template, this.channel, {
      buyerName: this.recipientName,
      companyName: this.recipientCompany,
      productName: this.productName,
      senderName: this.businessDetails.businessName,
      senderEmail: this.businessDetails.businessEmail,
      website: this.businessDetails.website,
    });

    if (this.channel === 'email') {
      this.emailSubject = rendered.subject;
    }

    this.messageBody = this.appendContextToBody(rendered.body, this.messageContext);
  }

  private appendContextToBody(body: string, extraContext: string): string {
    const trimmed = extraContext.trim();

    if (!trimmed) {
      return body;
    }

    return `${body}\n\nAdditional context:\n${trimmed}`;
  }

  private getCurrentMessageBody(): string {
    return this.messageBody || this.appendContextToBody(this.selectedTemplate.whatsappBody, this.messageContext);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
