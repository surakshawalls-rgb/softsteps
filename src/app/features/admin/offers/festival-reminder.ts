import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  UpcomingFestival,
  calendarNeedsUpdate,
  describeDaysLeft,
  formatFestivalDate,
  getFestivalsDueSoon,
} from './festival-calendar';

@Component({
  selector: 'app-festival-reminder',
  standalone: true,
  imports: [RouterLink],
  template: `
    @for (festival of visibleFestivals(); track festival.id) {
      <div class="festival-reminder" role="status">
        <div class="festival-reminder-text">
          <strong>{{ festival.name }} · {{ describeDays(festival.daysLeft) }}</strong>
          <span>
            {{ formatDate(festival.date) }}.
            @if (festival.confirm) {
              Please confirm the exact date for your region.
            }
            Set up your {{ festival.name }} offer now so customers see the new prices in time.
          </span>
        </div>

        <div class="festival-reminder-actions">
          <a
            class="festival-reminder-button"
            routerLink="/admin/offers"
            [queryParams]="{ festival: festival.id }"
          >
            Set up offer
          </a>
          <button type="button" class="festival-reminder-dismiss" (click)="dismiss(festival.id)">
            Dismiss
          </button>
        </div>
      </div>
    }

    @if (needsUpdate() && !updateDismissed()) {
      <div class="festival-reminder festival-reminder-warning" role="status">
        <div class="festival-reminder-text">
          <strong>Festival calendar needs new dates</strong>
          <span>
            The festival dates for next year are not added yet. Open festival-calendar.ts and add
            the new festival dates.
          </span>
        </div>
        <div class="festival-reminder-actions">
          <button type="button" class="festival-reminder-dismiss" (click)="updateDismissed.set(true)">
            Dismiss
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }

      :host:empty {
        display: none;
      }

      .festival-reminder {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.3rem;
        border: 1px solid rgba(147, 95, 43, 0.3);
        border-radius: 20px;
        background:
          radial-gradient(circle at 96% 10%, rgba(201, 147, 86, 0.28), transparent 50%),
          linear-gradient(135deg, #fffdf9 0%, #f7f2ec 100%);
        box-shadow: 0 8px 24px rgba(26, 22, 18, 0.06);
      }

      .festival-reminder-warning {
        border-color: rgba(141, 45, 45, 0.28);
        background: #fbeeee;
      }

      .festival-reminder-text {
        display: grid;
        gap: 0.25rem;
        max-width: 70ch;
      }

      .festival-reminder-text strong {
        color: #1f1a17;
        font-size: 0.98rem;
      }

      .festival-reminder-text span {
        color: #514a41;
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .festival-reminder-actions {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .festival-reminder-button {
        display: inline-flex;
        align-items: center;
        min-height: 40px;
        padding: 0 1.1rem;
        border-radius: 12px;
        background: linear-gradient(135deg, #c99356, #935f2b);
        color: #fff;
        font-size: 0.84rem;
        font-weight: 700;
        text-decoration: none;
      }

      .festival-reminder-dismiss {
        min-height: 40px;
        padding: 0 0.9rem;
        border: 1px solid rgba(41, 37, 31, 0.16);
        border-radius: 12px;
        background: #fff;
        color: #514a41;
        cursor: pointer;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
      }
    `,
  ],
})
export class FestivalReminder {
  readonly festivals = signal<UpcomingFestival[]>(getFestivalsDueSoon());
  readonly needsUpdate = signal(calendarNeedsUpdate());
  readonly updateDismissed = signal(false);
  private readonly dismissed = signal<ReadonlySet<string>>(new Set<string>());

  readonly visibleFestivals = computed(() =>
    this.festivals().filter((festival) => !this.dismissed().has(festival.id)),
  );

  describeDays(daysLeft: number): string {
    return describeDaysLeft(daysLeft);
  }

  formatDate(date: Date): string {
    return formatFestivalDate(date);
  }

  dismiss(id: string): void {
    this.dismissed.set(new Set([...this.dismissed(), id]));
  }
}