import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-enquiry-form',
  imports: [FormsModule],
  templateUrl: './enquiry-form.html',
  styleUrl: './enquiry-form.css',
})
export class EnquiryForm {
  whatsappUrl = '';

  form = {
    name: '',
    email: '',
    phone: '',
    projectType: '',
    location: '',
    details: '',
  };

  prepareEnquiry(): void {
    const message = [
      'Project enquiry — Soft Steps Carpets & Rugs',
      `Name: ${this.form.name}`,
      `Email: ${this.form.email}`,
      `Phone: ${this.form.phone || 'Not provided'}`,
      `Project type: ${this.form.projectType || 'Not specified'}`,
      `Project location: ${this.form.location || 'Not specified'}`,
      `Requirement: ${this.form.details}`,
    ].join('\n');

    this.whatsappUrl = `https://wa.me/917007131072?text=${encodeURIComponent(message)}`;
  }
}
