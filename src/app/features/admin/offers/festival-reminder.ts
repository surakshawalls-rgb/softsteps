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

      /* Dark and gold like the home banner, so the reminder is the first thing seen in the admin panel. */
      .festival-reminder {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem 1.5rem;
        padding: 1.1rem 1.4rem;
        border: 1px solid #2b241b;
        border-radius: 20px;
        background:
          radial-gradient(ellipse at 96% 50%, rgba(232, 176, 75, 0.3), transparent 55%),
          linear-gradient(135deg, #1b1712 0%, #0d0b09 100%);
        box-shadow: 0 14px 32px rgba(26, 22, 18, 0.2);
      }

      .festival-reminder-warning {
        border-color: rgba(141, 45, 45, 0.28);
        background: #fbeeee;
        box-shadow: 0 8px 24px rgba(26, 22, 18, 0.06);
      }

      .festival-reminder-text {
        display: grid;
        gap: 0.3rem;
        max-width: 70ch;
      }

      .festival-reminder-text strong {
        color: #fff8ea;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1.2rem;
        font-weight: 500;
        letter-spacing: -0.01em;
      }

      .festival-reminder-text span {
        color: #d9cdb8;
        font-size: 0.85rem;
        line-height: 1.55;
      }

      .festival-reminder-warning .festival-reminder-text strong {
        color: #1f1a17;
        font-family: inherit;
        font-size: 0.98rem;
        font-weight: 700;
        letter-spacing: 0;
      }

      .festival-reminder-warning .festival-reminder-text span {
        color: #514a41;
      }

      .festival-reminder-actions {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .festival-reminder-button {
        display: inline-flex;
        align-items: center;
        min-height: 42px;
        padding: 0 1.4rem;
        border-radius: 999px;
        background: #d4b27e;
        color: #1b1712;
        font-size: 0.84rem;
        font-weight: 700;
        text-decoration: none;
        transition: background-color 0.2s ease;
      }

      .festival-reminder-button:hover {
        background: #e8cf9f;
      }

      .festival-reminder-dismiss {
        min-height: 42px;
        padding: 0 1rem;
        border: 1px solid rgba(255, 248, 234, 0.28);
        border-radius: 999px;
        background: transparent;
        color: #f2e3c4;
        cursor: pointer;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        transition:
          background-color 0.2s ease,
          border-color 0.2s ease;
      }

      .festival-reminder-dismiss:hover {
        border-color: rgba(255, 248, 234, 0.6);
        background: rgba(255, 248, 234, 0.08);
      }

      .festival-reminder-warning .festival-reminder-dismiss {
        border-color: rgba(41, 37, 31, 0.16);
        background: #fff;
        color: #514a41;
      }

      .festival-reminder-button:focus-visible,
      .festival-reminder-dismiss:focus-visible {
        outline: 2px solid #d4b27e;
        outline-offset: 2px;
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