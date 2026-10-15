import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-custom-requirement-page',
  imports: [FormsModule],
  templateUrl: './custom-requirement-page.html',
  styleUrl: './custom-requirement-page.css'
})
export class CustomRequirementPage {
  constructor(private readonly supabaseService: SupabaseService) {}

  submitted = false;
  isSubmitting = false;
  errorMessage = '';

  form = {
    name: '', email: '', phone: '', requirementType: '',
    projectSize: '', preferredSize: '', material: '',
    colour: '', budget: '', location: '', details: ''
  };

  async submit(): Promise<void> {
    if (this.isSubmitting || this.submitted) return;

    const name = this.form.name.trim();
    const phone = this.form.phone.trim();
    const details = this.form.details.trim();
    const requirementType = this.form.requirementType.trim();
    const email = this.form.email.trim();

    if (!name || !phone || !details || !requirementType) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      // Generate the ID before insertion so the function can refer to this row
      // without granting public SELECT access to customer submissions.
      const submissionId = crypto.randomUUID();

      const { error } = await this.supabaseService.client
        .from('custom_requirement_submissions')
        .insert({
          id: submissionId,
          name,
          email: email || null,
          phone,
          requirement_type: requirementType,
          project_size: this.form.projectSize.trim() || null,
          preferred_size: this.form.preferredSize.trim() || null,
          material: this.form.material || null,
          colour: this.form.colour.trim() || null,
          budget: this.form.budget || null,
          location: this.form.location.trim() || null,
          details,
          status: 'new'
        });

      if (error) {
        console.error('Custom requirement insert failed:', error);

        throw new Error(
          error.code === '42P01' || error.code === 'PGRST205'
            ? 'The enquiry table is not available yet. Please contact us directly.'
            : error.code === '42501'
              ? 'Submission permissions are not configured correctly. Please contact us directly.'
              : 'We could not save your requirement. Please try again or contact us directly.'
        );
      }

      // The enquiry is already saved. Email failure must not turn a successful
      // submission into a failed customer experience.
      try {
        const { error: notificationError } =
          await this.supabaseService.client.functions.invoke(
            'notify-custom-requirement',
            { body: { submissionId } }
          );

        if (notificationError) {
          console.warn(
            'Enquiry saved, but admin email notification failed:',
            notificationError
          );
        }
      } catch (notificationError) {
        console.warn(
          'Enquiry saved, but admin email notification could not be reached:',
          notificationError
        );
      }

      this.submitted = true;
    } catch (error) {
      console.error('Custom requirement submission failed:', error);
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
