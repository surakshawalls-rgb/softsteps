/**
 * Soft Steps · Festival hero for the home page.
 *
 * When a festival from the admin festival calendar is close, the home hero shows
 * a festival banner (artwork drawn in code, no image files needed) and the hero
 * text changes to match. Outside festival time the normal hero is shown.
 *
 * HOW TO CHANGE THINGS
 * - Texts, colours and how many days before the festival the banner starts:
 *   edit THEMES below (leadDays = days before the festival, weight = which
 *   festival wins when two are close together; higher wins).
 * - To use a real photo instead of the drawn artwork, add  image: '/festival-banners/diwali.jpg'
 *   to a theme and put the file in the public/festival-banners folder.
 * - Festival dates come from  features/admin/offers/festival-calendar.ts
 */

import { getUpcomingFestivals } from '../../admin/offers/festival-calendar';

export type Motif = 'mandala' | 'sparkle' | 'crescent' | 'splash' | 'chakra' | 'hearts' | 'burst';

interface Palette {
  from: string;
  to: string;
  accent: string;
  accent2: string;
  soft: string;
}

interface FestivalTheme {
  motif: Motif;
  palette: Palette;
  leadDays: number;
  weight: number;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  stamp: [string, string];
  caption: string;
  image?: string;
}

export interface HeroContent {
  festivalName: string | null;
  /** Offer name the admin uses for this festival, e.g. "Diwali Offer". */
  offerLabel: string | null;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  stamp: [string, string];
  caption: string;
  /** Image path or data address for the first banner slide. null = normal photos. */
  art: string | null;
}

export const DEFAULT_HERO: HeroContent = {
  festivalName: null,
  offerLabel: null,
  eyebrow: 'Handcrafted in India · Made for the world',
  headline: 'SOFT STEPS',
  subheadline: 'Hand Woven in Carpet City',
  primaryCta: 'Explore collection',
  stamp: ['CRAFTED', 'WITH CARE'],
  caption: 'Thoughtful texture. Lasting comfort.',
  art: null,
};

// ---------------------------------------------------------------------------
// Festival themes (texts + colours)
// ---------------------------------------------------------------------------

const GOLD_NIGHT: Palette = {
  from: '#0f1b3d',
  to: '#1a0d2e',
  accent: '#e8c26a',
  accent2: '#8aa4ff',
  soft: '#f4f0ff',
};

const FESTIVE_RED: Palette = {
  from: '#4a0f12',
  to: '#1c0b24',
  accent: '#f2b134',
  accent2: '#e8742c',
  soft: '#ffe2a8',
};

const THEMES: Record<string, FestivalTheme> = {
  Dhanteras: {
    motif: 'mandala',
    palette: FESTIVE_RED,
    leadDays: 3,
    weight: 1,
    eyebrow: 'Dhanteras · Handcrafted in India',
    headline: 'HAPPY DHANTERAS',
    subheadline: 'Begin the festive season with something made to last',
    primaryCta: 'Shop festive rugs',
    stamp: ['FESTIVE', 'EDIT'],
    caption: 'Festive edit. Made by hand.',
  },
  Diwali: {
    motif: 'mandala',
    palette: FESTIVE_RED,
    leadDays: 10,
    weight: 3,
    eyebrow: 'Festival of Lights · Handcrafted in India',
    headline: 'HAPPY DIWALI',
    subheadline: 'Light up your home with handwoven warmth',
    primaryCta: 'Shop festive rugs',
    stamp: ['DIWALI', 'EDIT'],
    caption: 'Warm textures for festive homes.',
  },
  Holi: {
    motif: 'splash',
    palette: { from: '#2a0f3a', to: '#10223a', accent: '#ff4f8b', accent2: '#2ec4b6', soft: '#ffd23f' },
    leadDays: 7,
    weight: 2,
    eyebrow: 'Festival of Colours · Handcrafted in India',
    headline: 'HAPPY HOLI',
    subheadline: 'Bring colour and softness home',
    primaryCta: 'Shop colourful rugs',
    stamp: ['COLOUR', 'STORY'],
    caption: 'Colour, woven by hand.',
  },
  'Eid al-Fitr': {
    motif: 'crescent',
    palette: { from: '#0b3a3a', to: '#10212b', accent: '#e5c46b', accent2: '#52b69a', soft: '#f3ecd6' },
    leadDays: 7,
    weight: 2,
    eyebrow: 'Eid Mubarak · Handcrafted in India',
    headline: 'EID MUBARAK',
    subheadline: 'Welcome guests to a warmer, softer home',
    primaryCta: 'Shop festive rugs',
    stamp: ['EID', 'EDIT'],
    caption: 'Festive edit. Made by hand.',
  },
  'Eid al-Adha': {
    motif: 'crescent',
    palette: { from: '#0b3a3a', to: '#10212b', accent: '#e5c46b', accent2: '#52b69a', soft: '#f3ecd6' },
    leadDays: 7,
    weight: 2,
    eyebrow: 'Eid Mubarak · Handcrafted in India',
    headline: 'EID MUBARAK',
    subheadline: 'Welcome guests to a warmer, softer home',
    primaryCta: 'Shop festive rugs',
    stamp: ['EID', 'EDIT'],
    caption: 'Festive edit. Made by hand.',
  },
  'Raksha Bandhan': {
    motif: 'mandala',
    palette: { from: '#4a1038', to: '#1d1230', accent: '#f2b134', accent2: '#e86a92', soft: '#ffe7b8' },
    leadDays: 7,
    weight: 2,
    eyebrow: 'Raksha Bandhan · A gift that lasts',
    headline: 'HAPPY RAKSHA BANDHAN',
    subheadline: 'Gift a handcrafted piece for the home',
    primaryCta: 'Shop gift ideas',
    stamp: ['GIFT', 'EDIT'],
    caption: 'Made by hand, given with love.',
  },
  'Ganesh Chaturthi': {
    motif: 'mandala',
    palette: { from: '#5a1a0a', to: '#241006', accent: '#ffb347', accent2: '#e0451f', soft: '#ffe9c2' },
    leadDays: 7,
    weight: 2,
    eyebrow: 'Ganesh Chaturthi · Handcrafted in India',
    headline: 'HAPPY GANESH CHATURTHI',
    subheadline: 'Welcome the festival with warmth underfoot',
    primaryCta: 'Shop festive rugs',
    stamp: ['FESTIVE', 'EDIT'],
    caption: 'Festive edit. Made by hand.',
  },
  Onam: {
    motif: 'mandala',
    palette: { from: '#0f3d2a', to: '#1c1608', accent: '#f4c542', accent2: '#e96b2d', soft: '#fff1c9' },
    leadDays: 7,
    weight: 2,
    eyebrow: 'Onam · Handcrafted in India',
    headline: 'HAPPY ONAM',
    subheadline: 'Patterns and warmth for the harvest festival',
    primaryCta: 'Shop festive rugs',
    stamp: ['FESTIVE', 'EDIT'],
    caption: 'Pattern and craft, woven together.',
  },
  Dussehra: {
    motif: 'burst',
    palette: { from: '#5a1608', to: '#1c0d12', accent: '#ffc247', accent2: '#d8402a', soft: '#ffe9c2' },
    leadDays: 7,
    weight: 2,
    eyebrow: 'Dussehra · Handcrafted in India',
    headline: 'HAPPY DUSSEHRA',
    subheadline: 'Celebrate new beginnings with handcrafted comfort',
    primaryCta: 'Shop festive rugs',
    stamp: ['FESTIVE', 'EDIT'],
    caption: 'Festive edit. Made by hand.',
  },
  Christmas: {
    motif: 'sparkle',
    palette: { from: '#0e3b2c', to: '#1a1410', accent: '#d6a84a', accent2: '#c0392b', soft: '#f5efe0' },
    leadDays: 14,
    weight: 3,
    eyebrow: 'Christmas · Handcrafted in India',
    headline: 'MERRY CHRISTMAS',
    subheadline: 'Cosy up the season with a handwoven carpet',
    primaryCta: 'Shop gifts for the home',
    stamp: ['SEASON', 'EDIT'],
    caption: 'Warmth for the season.',
  },
  "New Year's Day": {
    motif: 'sparkle',
    palette: GOLD_NIGHT,
    leadDays: 7,
    weight: 2,
    eyebrow: 'New Year · Handcrafted in India',
    headline: 'HAPPY NEW YEAR',
    subheadline: 'Start the year with a fresh, handcrafted space',
    primaryCta: 'Shop new arrivals',
    stamp: ['NEW YEAR', 'EDIT'],
    caption: 'A fresh start, woven by hand.',
  },
  'Republic Day': {
    motif: 'chakra',
    palette: { from: '#0b2350', to: '#0a1530', accent: '#ff9933', accent2: '#138808', soft: '#ffffff' },
    leadDays: 5,
    weight: 1,
    eyebrow: 'Republic Day · Made in India',
    headline: 'HAPPY REPUBLIC DAY',
    subheadline: 'Proudly handcrafted in India, for spaces worldwide',
    primaryCta: 'Explore the collection',
    stamp: ['MADE IN', 'INDIA'],
    caption: 'Proudly made in India.',
  },
  'Independence Day': {
    motif: 'chakra',
    palette: { from: '#0b2350', to: '#0a1530', accent: '#ff9933', accent2: '#138808', soft: '#ffffff' },
    leadDays: 5,
    weight: 1,
    eyebrow: 'Independence Day · Made in India',
    headline: 'HAPPY INDEPENDENCE DAY',
    subheadline: 'Proudly handcrafted in India, for spaces worldwide',
    primaryCta: 'Explore the collection',
    stamp: ['MADE IN', 'INDIA'],
    caption: 'Proudly made in India.',
  },
  "Valentine's Day": {
    motif: 'hearts',
    palette: { from: '#4a0d25', to: '#1f0a18', accent: '#ff6b8a', accent2: '#f2b6c4', soft: '#ffe3ea' },
    leadDays: 7,
    weight: 2,
    eyebrow: "Valentine's Day · Handcrafted in India",
    headline: "HAPPY VALENTINE'S DAY",
    subheadline: 'Make home the loveliest place to be',
    primaryCta: 'Shop gifts for the home',
    stamp: ['LOVE', 'EDIT'],
    caption: 'Made by hand, given with love.',
  },
  'Black Friday': {
    motif: 'burst',
    palette: { from: '#16130f', to: '#050403', accent: '#e8b04b', accent2: '#c0392b', soft: '#f6e7c1' },
    leadDays: 7,
    weight: 2,
    eyebrow: 'Black Friday · Handcrafted in India',
    headline: 'BLACK FRIDAY',
    subheadline: 'Handcrafted carpets for every space',
    primaryCta: 'Shop now',
    stamp: ['BLACK', 'FRIDAY'],
    caption: 'Made by hand. Made to last.',
  },
};

function themeFor(name: string): FestivalTheme {
  return (
    THEMES[name] ?? {
      motif: 'sparkle',
      palette: GOLD_NIGHT,
      leadDays: 7,
      weight: 1,
      eyebrow: `${name} · Handcrafted in India`,
      headline: `HAPPY ${name.toUpperCase()}`,
      subheadline: 'Warmth and craft for your home',
      primaryCta: 'Shop festive rugs',
      stamp: ['FESTIVE', 'EDIT'],
      caption: 'Festive edit. Made by hand.',
    }
  );
}

// ---------------------------------------------------------------------------
// Which festival is the hero showing today?
// ---------------------------------------------------------------------------

function buildHero(name: string, theme: FestivalTheme): HeroContent {
  return {
    festivalName: name,
    offerLabel: `${name} Offer`,
    eyebrow: theme.eyebrow,
    headline: theme.headline,
    subheadline: theme.subheadline,
    primaryCta: theme.primaryCta,
    stamp: theme.stamp,
    caption: theme.caption,
    art: theme.image ?? buildArtDataUrl(theme),
  };
}

/** The festival hero for a festival name, whatever today's date is. */
export function heroForFestival(name: string): HeroContent {
  return buildHero(name, themeFor(name));
}

/** "Diwali Offer" -> "Diwali" (only for festivals that have a theme above), otherwise null. */
export function festivalFromOfferLabel(label: string | null): string | null {
  const suffix = ' Offer';

  if (!label || !label.endsWith(suffix)) {
    return null;
  }

  const name = label.slice(0, -suffix.length);

  return Object.prototype.hasOwnProperty.call(THEMES, name) ? name : null;
}

export function resolveHero(today: Date = new Date()): HeroContent {
  const candidates = getUpcomingFestivals(today, 60)
    .map((festival) => ({ festival, theme: themeFor(festival.name) }))
    .filter(({ festival, theme }) => festival.daysLeft <= theme.leadDays);

  if (candidates.length === 0) {
    return DEFAULT_HERO;
  }

  candidates.sort(
    (a, b) => b.theme.weight - a.theme.weight || a.festival.daysLeft - b.festival.daysLeft,
  );

  const { festival, theme } = candidates[0];

  return buildHero(festival.name, theme);
}
export function describeOffer(
  rows: { offer_discount_type: string | null; offer_discount_value: number | string | null }[],
): string | null {
  const numbers = (type: string): number[] =>
    rows
      .filter((row) => row.offer_discount_type === type)
      .map((row) => Number(row.offer_discount_value))
      .filter((value) => Number.isFinite(value) && value > 0);

  const percents = numbers('percent');

  if (percents.length > 0) {
    const max = Math.max(...percents);
    const min = Math.min(...percents);

    return max === min ? `${max}% off` : `Up to ${max}% off`;
  }

  const flats = numbers('flat');

  if (flats.length > 0) {
    return `Up to ₹${Math.max(...flats)} off`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Banner artwork (SVG drawn in code)
// ---------------------------------------------------------------------------

const CX = 600;
const CY = 700;

const SCATTER: [number, number, number][] = [
  [120, 260, 9], [260, 150, 6], [420, 330, 7], [900, 210, 8], [1040, 330, 6], [1120, 520, 9],
  [90, 640, 7], [1110, 860, 8], [170, 980, 7], [330, 1120, 6], [880, 1130, 8], [1030, 1020, 6],
  [600, 1250, 9], [240, 1300, 6], [980, 1290, 7], [740, 330, 5], [470, 990, 5],
];

function n(value: number): string {
  return value.toFixed(1);
}

function rotated(count: number, render: (index: number) => string): string {
  let out = '';

  for (let i = 0; i < count; i++) {
    out += `<g transform="translate(${CX} ${CY}) rotate(${n((360 / count) * i)})">${render(i)}</g>`;
  }

  return out;
}

function starPoints(points: number, outer: number, inner: number, cx = CX, cy = CY): string {
  const out: string[] = [];

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    out.push(`${n(cx + radius * Math.cos(angle))},${n(cy + radius * Math.sin(angle))}`);
  }

  return out.join(' ');
}

function mandala(p: Palette): string {
  const petal = 'M0 -200 C34 -150 34 -96 0 -58 C-34 -96 -34 -150 0 -200 Z';
  const smallPetal = 'M0 -132 C22 -102 22 -68 0 -42 C-22 -68 -22 -102 0 -132 Z';

  return (
    `<circle cx="${CX}" cy="${CY}" r="214" fill="none" stroke="${p.accent}" stroke-width="3" opacity="0.9"/>` +
    `<circle cx="${CX}" cy="${CY}" r="198" fill="none" stroke="${p.accent2}" stroke-width="4" stroke-dasharray="3 12" opacity="0.9"/>` +
    rotated(24, (i) => `<path d="${petal}" fill="${i % 2 === 0 ? p.accent : p.accent2}" opacity="0.92"/>`) +
    rotated(12, () => `<path d="${smallPetal}" fill="${p.soft}" opacity="0.9"/>`) +
    `<circle cx="${CX}" cy="${CY}" r="46" fill="${p.accent2}" stroke="${p.soft}" stroke-width="4"/>` +
    `<path d="M600 666 C626 692 626 716 600 736 C574 716 574 692 600 666 Z" fill="${p.soft}"/>`
  );
}

function sparkle(p: Palette): string {
  let dots = '';

  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16;
    dots += `<circle cx="${n(CX + 205 * Math.cos(angle))}" cy="${n(CY + 205 * Math.sin(angle))}" r="${i % 2 === 0 ? 11 : 6}" fill="${i % 2 === 0 ? p.accent : p.accent2}"/>`;
  }

  return (
    dots +
    `<polygon points="${starPoints(8, 185, 62)}" fill="${p.accent}" opacity="0.95"/>` +
    `<polygon points="${starPoints(8, 120, 40)}" fill="${p.soft}" opacity="0.9" transform="rotate(22.5 ${CX} ${CY})"/>` +
    rotated(3, () => `<line x1="-150" y1="0" x2="150" y2="0" stroke="${p.soft}" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`) +
    `<circle cx="${CX}" cy="${CY}" r="26" fill="${p.accent2}" stroke="${p.soft}" stroke-width="4"/>`
  );
}

function crescent(p: Palette): string {
  return (
    `<defs><mask id="cut"><rect x="0" y="0" width="1200" height="1500" fill="#fff"/><circle cx="668" cy="668" r="150" fill="#000"/></mask></defs>` +
    `<circle cx="${CX}" cy="${CY}" r="190" fill="${p.accent}" mask="url(#cut)"/>` +
    `<circle cx="${CX}" cy="${CY}" r="226" fill="none" stroke="${p.accent2}" stroke-width="4" stroke-dasharray="2 14" opacity="0.9"/>` +
    `<polygon points="${starPoints(5, 46, 19, 800, 610)}" fill="${p.soft}"/>` +
    `<polygon points="${starPoints(5, 26, 11, 870, 710)}" fill="${p.accent}"/>` +
    `<polygon points="${starPoints(5, 20, 8, 760, 780)}" fill="${p.accent2}"/>`
  );
}

function splash(p: Palette): string {
  const colours = [p.accent, p.accent2, p.soft, '#7b5cff', '#ff8a3d', '#2ec4b6', '#ff4f8b'];
  const blobs: [number, number, number, number][] = [
    [-90, -70, 110, 0], [80, -60, 95, 1], [-20, 60, 120, 3], [110, 70, 85, 4],
    [-120, 70, 80, 5], [0, -130, 70, 6], [30, 10, 60, 2],
  ];
  let out = '';

  for (const [dx, dy, r, c] of blobs) {
    out += `<circle cx="${CX + dx}" cy="${CY + dy}" r="${r}" fill="${colours[c]}" opacity="0.78"/>`;
  }

  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18;
    const radius = 215 + (i % 3) * 14;
    out += `<circle cx="${n(CX + radius * Math.cos(angle))}" cy="${n(CY + radius * Math.sin(angle))}" r="${6 + (i % 4) * 2}" fill="${colours[i % colours.length]}" opacity="0.9"/>`;
  }

  return out;
}

function chakra(p: Palette): string {
  let dots = '';

  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 * i) / 24;
    dots += `<circle cx="${n(CX + 200 * Math.cos(angle))}" cy="${n(CY + 200 * Math.sin(angle))}" r="7" fill="${i % 2 === 0 ? p.accent : p.accent2}"/>`;
  }

  return (
    dots +
    `<circle cx="${CX}" cy="${CY}" r="168" fill="none" stroke="${p.soft}" stroke-width="10"/>` +
    rotated(24, () => `<line x1="0" y1="-30" x2="0" y2="-158" stroke="${p.soft}" stroke-width="5" stroke-linecap="round"/>`) +
    `<circle cx="${CX}" cy="${CY}" r="26" fill="${p.soft}"/>`
  );
}

function hearts(p: Palette): string {
  const heart = 'M0 70 C-190 -60 -90 -190 0 -90 C90 -190 190 -60 0 70 Z';
  const small: [number, number, number, number][] = [
    [360, 560, 0.3, 1], [840, 580, 0.28, 1], [340, 850, 0.24, 0], [860, 860, 0.32, 0], [600, 470, 0.22, 1],
  ];
  let out = `<g transform="translate(${CX} ${CY + 40}) scale(1.45)"><path d="${heart}" fill="${p.accent}"/></g>`;

  out += `<g transform="translate(${CX} ${CY + 70}) scale(0.84)"><path d="${heart}" fill="${p.soft}" opacity="0.55"/></g>`;

  for (const [x, y, s, c] of small) {
    out += `<g transform="translate(${x} ${y}) scale(${s})"><path d="${heart}" fill="${c === 1 ? p.accent2 : p.accent}" opacity="0.9"/></g>`;
  }

  return out;
}

function burst(p: Palette): string {
  return (
    `<polygon points="${starPoints(16, 218, 160)}" fill="${p.accent}"/>` +
    `<polygon points="${starPoints(16, 190, 140)}" fill="${p.accent2}" transform="rotate(11.25 ${CX} ${CY})"/>` +
    `<circle cx="${CX}" cy="${CY}" r="112" fill="${p.from}" stroke="${p.soft}" stroke-width="5"/>` +
    `<circle cx="${CX}" cy="${CY}" r="88" fill="none" stroke="${p.accent}" stroke-width="3" stroke-dasharray="3 9"/>` +
    `<polygon points="${starPoints(5, 44, 18)}" fill="${p.soft}"/>`
  );
}

const MOTIFS: Record<Motif, (p: Palette) => string> = {
  mandala,
  sparkle,
  crescent,
  splash,
  chakra,
  hearts,
  burst,
};

export function buildArt(theme: Pick<FestivalTheme, 'motif' | 'palette'>): string {
  const p = theme.palette;
  let scatter = '';

  SCATTER.forEach(([x, y, r], i) => {
    scatter +=
      i % 2 === 0
        ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.accent}" opacity="0.55"/>`
        : `<polygon points="${x},${y - r * 1.6} ${x + r},${y} ${x},${y + r * 1.6} ${x - r},${y}" fill="${p.soft}" opacity="0.5"/>`;
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" preserveAspectRatio="xMidYMid slice">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/></linearGradient>` +
    `<radialGradient id="glow" cx="50%" cy="47%" r="48%"><stop offset="0" stop-color="${p.accent}" stop-opacity="0.42"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>` +
    `<pattern id="kilim" width="96" height="64" patternUnits="userSpaceOnUse">` +
    `<polygon points="48,6 84,32 48,58 12,32" fill="${p.accent}" opacity="0.6"/>` +
    `<polygon points="48,20 66,32 48,44 30,32" fill="${p.from}"/>` +
    `<circle cx="0" cy="32" r="5" fill="${p.accent2}"/><circle cx="96" cy="32" r="5" fill="${p.accent2}"/>` +
    `</pattern>` +
    `</defs>` +
    `<rect width="1200" height="1500" fill="url(#bg)"/>` +
    `<rect width="1200" height="1500" fill="url(#glow)"/>` +
    scatter +
    MOTIFS[theme.motif](p) +
    `<rect x="0" y="40" width="1200" height="64" fill="url(#kilim)" opacity="0.8"/>` +
    `<rect x="0" y="1396" width="1200" height="64" fill="url(#kilim)" opacity="0.8"/>` +
    `<rect x="0" y="30" width="1200" height="3" fill="${p.accent}" opacity="0.7"/>` +
    `<rect x="0" y="112" width="1200" height="3" fill="${p.accent}" opacity="0.7"/>` +
    `<rect x="0" y="1384" width="1200" height="3" fill="${p.accent}" opacity="0.7"/>` +
    `<rect x="0" y="1466" width="1200" height="3" fill="${p.accent}" opacity="0.7"/>` +
    `</svg>`
  );
}

function buildArtDataUrl(theme: FestivalTheme): string {
  const svg = buildArt(theme);

  // the svg only contains plain ASCII characters, so btoa is safe
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}