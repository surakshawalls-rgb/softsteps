import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Notification as NotificationService } from '../../../core/services/notification';
import { SupabaseService } from '../../../core/services/supabase.service';

interface CustomRequirementSubmission {
  id: string;
  reference_number: number;
  name: string;
  email: string | null;
  phone: string;
  requirement_type: string;
  project_size: string | null;
  material: string | null;
  status: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  requirements: CustomRequirementSubmission[] = [];
  requirementsLoading = true;
  requirementsError = '';
  requirementsCount = 0;

  ngOnInit(): void {
    void this.loadRequirements();

    // Live update: when a new requirement notification arrives, reload the table
    // quietly (no loading flicker).
    this.notifications.adminInsert$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((item) => {
        if (item.type === 'custom_requirement') {
          void this.loadRequirements(true);
        }
      });
  }

  async loadRequirements(silent = false): Promise<void> {
    if (!silent) {
      this.requirementsLoading = true;
    }

    this.requirementsError = '';

    try {
      const { data, error } = await this.supabase.client
        .from('custom_requirement_submissions')
        .select(
          'id, reference_number, name, email, phone, requirement_type, project_size, material, status, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      this.requirements = (data ?? []) as CustomRequirementSubmission[];
      this.requirementsCount = this.requirements.length;
    } catch (error: unknown) {
      console.error('Unable to load custom requirement submissions:', error);
      this.requirements = [];
      this.requirementsCount = 0;
      this.requirementsError =
        'Unable to load submissions. Check the admin database permissions and try again.';
    } finally {
      this.requirementsLoading = false;
      this.cdr.markForCheck();
    }
  }

  formatSubmissionDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatRequirementType(value: string): string {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  formatStatus(value: string): string {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}