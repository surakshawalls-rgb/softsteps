import { Component } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.css'
})
export class ContactPage {

  /** Attachment limits (change these numbers if you need different limits). */
  readonly maxFiles = 5;
  readonly maxFileSizeMb = 5;
  readonly allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
  readonly acceptAttr = this.allowedExtensions.map(ext => '.' + ext).join(',');

  submitted = false;
  attempted = false;
  dragging = false;
  fileError = '';

  /** Files the visitor attached. They are ready to be uploaded once the backend is connected. */
  files: File[] = [];

  form = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  /** Shows a field's error after it was touched, or after Send Enquiry was pressed. */
  showError(control: NgModel): boolean {
    return !!control.invalid && (!!control.touched || this.attempted);
  }

  submit(form: NgForm): void {
    this.attempted = true;

    if (form.invalid) {
      return;
    }

    // Backend hook: send this.form and this.files here when the workflow is connected.
    this.submitted = true;
  }

  reset(): void {
    this.form = { name: '', email: '', phone: '', subject: '', message: '' };
    this.files = [];
    this.fileError = '';
    this.attempted = false;
    this.submitted = false;
  }

  /* ---------- attachments ---------- */

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(input.files);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    this.addFiles(event.dataTransfer?.files ?? null);
  }

  removeFile(index: number): void {
    this.files = this.files.filter((_, i) => i !== index);
    this.fileError = '';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private addFiles(list: FileList | null): void {
    if (!list) {
      return;
    }

    const problems: string[] = [];
    const maxBytes = this.maxFileSizeMb * 1024 * 1024;

    for (const file of Array.from(list)) {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      const duplicate = this.files.some(f => f.name === file.name && f.size === file.size);

      if (duplicate) {
        continue;
      }
      if (!this.allowedExtensions.includes(extension)) {
        problems.push(`"${file.name}" is not a supported file type.`);
        continue;
      }
      if (file.size > maxBytes) {
        problems.push(`"${file.name}" is larger than ${this.maxFileSizeMb} MB.`);
        continue;
      }
      if (this.files.length >= this.maxFiles) {
        problems.push(`You can attach up to ${this.maxFiles} files.`);
        break;
      }

      this.files = [...this.files, file];
    }

    this.fileError = problems.join(' ');
  }
}