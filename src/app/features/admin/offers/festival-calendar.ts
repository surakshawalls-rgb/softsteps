/**
 * Soft Steps · Festival calendar for the admin Offers page.
 *
 * HOW TO KEEP IT UP TO DATE
 * - Fixed-date festivals (Christmas, New Year, etc.) repeat every year automatically.
 * - Black Friday is worked out automatically every year.
 * - Festivals that follow the lunar calendar (Diwali, Holi, Eid, ...) move every year,
 *   so their dates are listed by hand in LUNAR_FESTIVALS below. Once a year, add the
 *   new dates (format 'YYYY-MM-DD'). Dates can differ by a day between regions, and
 *   Eid depends on moon sighting, so entries marked confirm: true should be checked.
 * - REMINDER_DAYS decides how many days before a festival the reminder appears.
 */

export const REMINDER_DAYS = 3;

interface LunarFestival {
  name: string;
  date: string; // YYYY-MM-DD
  confirm?: boolean; // true = date can differ by region or moon sighting
}

interface FixedFestival {
  name: string;
  month: number; // 1-12
  day: number;
}

export interface Festival {
  id: string;
  name: string;
  date: Date;
  confirm: boolean;
}

export interface UpcomingFestival extends Festival {
  daysLeft: number;
}

const LUNAR_FESTIVALS: LunarFestival[] = [
  { name: 'Dhanteras', date: '2026-11-06' },
  { name: 'Diwali', date: '2026-11-08' },
  { name: 'Eid al-Fitr', date: '2027-03-10', confirm: true },
  { name: 'Holi', date: '2027-03-22' },
  { name: 'Eid al-Adha', date: '2027-05-17', confirm: true },
  { name: 'Raksha Bandhan', date: '2027-08-17', confirm: true },
  { name: 'Ganesh Chaturthi', date: '2027-09-04', confirm: true },
  { name: 'Onam', date: '2027-09-12' },
  { name: 'Dussehra', date: '2027-10-09' },
  { name: 'Diwali', date: '2027-10-29', confirm: true },
];

const FIXED_FESTIVALS: FixedFestival[] = [
  { name: "New Year's Day", month: 1, day: 1 },
  { name: 'Republic Day', month: 1, day: 26 },
  { name: "Valentine's Day", month: 2, day: 14 },
  { name: 'Independence Day', month: 8, day: 15 },
  { name: 'Christmas', month: 12, day: 25 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function toIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeFestival(name: string, date: Date, confirm: boolean): Festival {
  return { id: `${slugify(name)}-${toIso(date)}`, name, date, confirm };
}

/** Black Friday = the day after the 4th Thursday of November. */
function blackFriday(year: number): Date {
  const firstOfNovember = new Date(year, 10, 1);
  const firstThursdayOffset = (4 - firstOfNovember.getDay() + 7) % 7;
  const fourthThursday = 1 + firstThursdayOffset + 21;

  return new Date(year, 10, fourthThursday + 1);
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

function allFestivals(today: Date): Festival[] {
  const year = today.getFullYear();
  const list: Festival[] = [];

  for (const festival of LUNAR_FESTIVALS) {
    list.push(makeFestival(festival.name, parseIso(festival.date), festival.confirm === true));
  }

  for (const targetYear of [year, year + 1]) {
    for (const festival of FIXED_FESTIVALS) {
      list.push(
        makeFestival(festival.name, new Date(targetYear, festival.month - 1, festival.day), false),
      );
    }

    list.push(makeFestival('Black Friday', blackFriday(targetYear), false));
  }

  return list.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Festivals from today onwards, soonest first. */
export function getUpcomingFestivals(today: Date = new Date(), limit = 8): UpcomingFestival[] {
  return allFestivals(today)
    .map((festival) => ({ ...festival, daysLeft: daysBetween(today, festival.date) }))
    .filter((festival) => festival.daysLeft >= 0)
    .slice(0, limit);
}

/** Festivals that are today or within REMINDER_DAYS days. */
export function getFestivalsDueSoon(today: Date = new Date()): UpcomingFestival[] {
  return getUpcomingFestivals(today, 50).filter((festival) => festival.daysLeft <= REMINDER_DAYS);
}

export function findFestival(id: string, today: Date = new Date()): UpcomingFestival | null {
  return getUpcomingFestivals(today, 500).find((festival) => festival.id === id) ?? null;
}

/** True when the hand-written lunar dates are about to run out. */
export function calendarNeedsUpdate(today: Date = new Date()): boolean {
  const last = LUNAR_FESTIVALS.map((festival) => parseIso(festival.date).getTime()).reduce(
    (max, value) => Math.max(max, value),
    0,
  );

  return daysBetween(today, new Date(last)) < 120;
}

export function describeDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) {
    return 'Today';
  }

  if (daysLeft === 1) {
    return 'Tomorrow';
  }

  return `In ${daysLeft} days`;
}

export function formatFestivalDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}