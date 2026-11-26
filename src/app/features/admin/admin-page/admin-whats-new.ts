import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  UpcomingFestival,
  describeDaysLeft,
  formatFestivalDate,
  getUpcomingFestivals,
} from '../offers/festival-calendar';

type UpdateIcon = 'banner' | 'calendar' | 'offers';

interface AdminUpdate {
  icon: UpdateIcon;
  title: string;
  text: string;
  tag: 'New' | 'Updated';
  link: string;
}

/**
 * The short "What's new" list on the Overview page.
 * To add an update, put a new line at the top of this list (keep the list to about 4 lines).
 */
const UPDATES: AdminUpdate[] = [
  {
    icon: 'banner',
    title: 'Festival home banner',
    text: 'Upload your own banner for each festival (1200 × 896 px).',
    tag: 'New',
    link: '/admin/offers',
  },
  {
    icon: 'calendar',
    title: 'Festival calendar',
    text: 'Reminders 3 days before each festival, with one click to start an offer.',
    tag: 'Updated',
    link: '/admin/offers',
  },
  {
    icon: 'offers',
    title: 'Offers',
    text: 'Festive, Big Billion Sale, Discount and Custom offers on selected products.',
    tag: 'New',
    link: '/admin/offers',
  },
];

@Component({
  selector: 'app-admin-whats-new',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="whats-new" [class.single]="!next" aria-label="What's new">
      @if (next; as festival) {
        <article class="festival" [class.soon]="festival.daysLeft <= 3">
          <p class="label"><span class="dot"></span>Next festival</p>

          <h2>{{ festival.name }}</h2>
          <p class="date">{{ formatDate(festival.date) }}</p>

          <p class="when">
            <span class="chip">{{ describeDays(festival.daysLeft) }}</span>
            @if (festival.confirm) {
              <span class="confirm">Confirm date</span>
            }
          </p>

          <a class="cta" routerLink="/admin/offers" [queryParams]="{ festival: festival.id }">
            Set up offer
          </a>

          @if (later.length) {
            <p class="then">
              Then
              @for (item of later; track item.id; let last = $last) {
                <strong>{{ item.name }}</strong> · {{ item.daysLeft }} days{{ last ? '' : '  /  ' }}
              }
            </p>
          }
        </article>
      }

      <article class="updates">
        <header>
          <p class="eyebrow">What's new</p>
          <h2>Recent admin updates</h2>
        </header>

        <ul>
          @for (update of updates; track update.title) {
            <li>
              <a [routerLink]="update.link">
                <span class="icon" aria-hidden="true">
                  @switch (update.icon) {
                    @case ('banner') {
                      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-9 9" /></svg>
                    }
                    @case ('calendar') {
                      <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                    }
                    @default {
                      <svg viewBox="0 0 24 24"><path d="M19 5L5 19" /><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /></svg>
                    }
                  }
                </span>

                <span class="copy">
                  <strong>{{ update.title }}</strong>
                  <span>{{ update.text }}</span>
                </span>

                <span class="tag" [class.is-new]="update.tag === 'New'">{{ update.tag }}</span>
              </a>
            </li>
          }
        </ul>
      </article>
    </section>
  `,
  styles: [
    `
      :host {
        --ink: #1f1a17;
        --ink-muted: #837b71;
        --brand: #935f2b;
        --brand-dark: #6f4519;
        --cream: #f7f2ec;
        --cream-deep: #efe6da;
        --line: rgba(41, 37, 31, 0.09);
        --gold: #d4b27e;
        display: block;
      }

      .whats-new {
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
        gap: 1.25rem;
      }

      .whats-new.single {
        grid-template-columns: minmax(0, 1fr);
      }

      h2 {
        margin: 0;
        background: none;
        -webkit-text-fill-color: currentColor;
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      p {
        margin: 0;
      }

      /* ---- Next festival: dark and gold, same look as the festival calendar ---- */
      .festival {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
        min-height: 17rem;
        padding: 1.7rem 1.8rem 1.8rem;
        overflow: hidden;
        isolation: isolate;
        border: 1px solid #2b241b;
        border-radius: 28px;
        background:
          radial-gradient(ellipse at 90% 40%, rgba(232, 176, 75, 0.3), transparent 55%),
          linear-gradient(135deg, #1b1712 0%, #0d0b09 100%);
        color: #f6ecd8;
        box-shadow: 0 18px 40px rgba(26, 22, 18, 0.22);
      }

      /* fine sun-ray ring in the corner */
      .festival::before {
        position: absolute;
        top: 50%;
        right: -4.5rem;
        z-index: -1;
        width: 17rem;
        aspect-ratio: 1;
        border-radius: 50%;
        background: repeating-conic-gradient(
          from 0deg,
          rgba(212, 178, 126, 0.7) 0 0.7deg,
          transparent 0.7deg 7.5deg
        );
        content: '';
        opacity: 0.6;
        transform: translateY(-50%);
        -webkit-mask-image: radial-gradient(circle, transparent 0 44%, #000 45% 74%, transparent 75%);
        mask-image: radial-gradient(circle, transparent 0 44%, #000 45% 74%, transparent 75%);
      }

      .festival::after {
        position: absolute;
        top: 50%;
        right: -1.6rem;
        z-index: -1;
        width: 10.5rem;
        aspect-ratio: 1;
        border: 1px solid rgba(212, 178, 126, 0.55);
        border-radius: 50%;
        content: '';
        box-shadow: inset 0 0 0 0.55rem rgba(212, 178, 126, 0.08);
        transform: translateY(-50%);
      }

      .label {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #d9cdb8;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.04em;
      }

      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--gold);
      }

      .festival h2 {
        margin-top: 0.7rem;
        color: #fff8ea;
        font-size: clamp(2.2rem, 3.2vw, 3rem);
        line-height: 1.02;
      }

      .date {
        color: var(--gold);
        font-size: 0.95rem;
      }

      .when {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 0.6rem 0 0.9rem;
      }

      .chip,
      .confirm {
        padding: 0.28rem 0.75rem;
        border-radius: 999px;
        font-size: 0.74rem;
        font-weight: 700;
      }

      .chip {
        background: rgba(212, 178, 126, 0.16);
        color: #f2e3c4;
      }

      .soon .chip {
        background: var(--gold);
        color: #1b1712;
      }

      .confirm {
        background: rgba(251, 238, 238, 0.14);
        color: #ffc9c9;
      }

      .cta {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 44px;
        padding: 0 1.4rem;
        border-radius: 999px;
        background: var(--gold);
        color: #1b1712;
        font-size: 0.84rem;
        font-weight: 700;
        text-decoration: none;
        transition:
          background-color 0.2s ease,
          transform 0.2s ease;
      }

      .cta::after {
        content: '→';
        transition: transform 0.2s ease;
      }

      .cta:hover {
        background: #e8cf9f;
      }

      .cta:hover::after {
        transform: translateX(3px);
      }

      .cta:focus-visible,
      .updates a:focus-visible {
        outline: 2px solid var(--gold);
        outline-offset: 2px;
      }

      .then {
        margin-top: auto;
        padding-top: 1.1rem;
        color: #bfae8f;
        font-size: 0.78rem;
        line-height: 1.6;
        white-space: pre-wrap;
      }

      .then strong {
        color: #f2e3c4;
        font-weight: 600;
      }

      /* ---- Recent updates ---- */
      .updates {
        padding: 1.6rem 1.7rem 1.4rem;
        border: 1px solid var(--line);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow:
          0 1px 2px rgba(26, 22, 18, 0.04),
          0 8px 24px rgba(26, 22, 18, 0.05);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.45rem;
        color: var(--brand);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .eyebrow::before {
        width: 26px;
        height: 2px;
        border-radius: 2px;
        background: var(--brand);
        content: '';
      }

      .updates h2 {
        color: var(--ink);
        font-size: 1.7rem;
      }

      ul {
        display: grid;
        gap: 0.35rem;
        margin: 1rem 0 0;
        padding: 0;
        list-style: none;
      }

      .updates a {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.95rem;
        padding: 0.8rem 0.9rem;
        border-radius: 18px;
        color: inherit;
        text-decoration: none;
        transition: background-color 0.2s ease;
      }

      .updates a:hover {
        background: var(--cream);
      }

      .updates a:focus-visible {
        outline-color: var(--brand);
      }

      .icon {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: var(--cream-deep);
        color: var(--brand-dark);
      }

      .icon svg {
        width: 22px;
        height: 22px;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.7;
      }

      .copy {
        display: grid;
        gap: 0.15rem;
        min-width: 0;
      }

      .copy strong {
        color: var(--ink);
        font-size: 0.95rem;
        font-weight: 700;
      }

      .copy span {
        color: var(--ink-muted);
        font-size: 0.82rem;
        line-height: 1.45;
      }

      .tag {
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        background: var(--cream-deep);
        color: var(--brand-dark);
        font-size: 0.72rem;
        font-weight: 700;
      }

      .tag.is-new {
        background: #e6f2e9;
        color: #1f6b3a;
      }

      @media (max-width: 960px) {
        .whats-new {
          grid-template-columns: minmax(0, 1fr);
        }

        .festival {
          min-height: 15rem;
        }
      }

      @media (max-width: 520px) {
        .updates a {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .tag {
          grid-column: 2;
          justify-self: start;
        }

        .festival::before {
          right: -7rem;
        }

        .festival::after {
          right: -4rem;
        }
      }
    `,
  ],
})
export class AdminWhatsNew {
  /** The soonest festival and the next two after it, from the same calendar the Offers page uses. */
  private readonly upcoming: UpcomingFestival[] = getUpcomingFestivals(new Date(), 3);

  readonly next: UpcomingFestival | null = this.upcoming[0] ?? null;
  readonly later: UpcomingFestival[] = this.upcoming.slice(1);
  readonly updates: AdminUpdate[] = UPDATES;

  describeDays(daysLeft: number): string {
    return describeDaysLeft(daysLeft);
  }

  formatDate(date: Date): string {
    return formatFestivalDate(date);
  }
}