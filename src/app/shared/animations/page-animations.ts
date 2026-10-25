/* =========================================================
   PAGE ANIMATIONS  (every page except Home and Admin)
   ---------------------------------------------------------
   Same motion language as the home page. This file only ADDS
   motion: it never edits a word, link, button or layout.

   Hero banner   photo zooms in from a blur, title wipes up,
                 text rises, content drifts away on scroll
   Sections      headings wipe in, text rises, photos wipe open,
                 cards stagger in
   Footer        columns rise as it comes into view

   Content that loads later (products, filters, errors...) is
   picked up automatically.
   ========================================================= */

type Gsap = typeof import('gsap').gsap;

/** Never animate these (they have their own movement / need exact positions). */
const SKIP = [
  'app-product-gallery',
  'app-catalog-toolbar',
  '[data-no-anim]',
  '[role="dialog"]',
  'dialog',
  '.copy-toast',
  '.floating-whatsapp',
].join(',');

/** Things that animate as one block. Anything inside a block is left alone. */
const BLOCKS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'li',
  'img',
  'figure',
  'blockquote',
  'table',
  'form',
  'fieldset',
  'details',
  'app-product-card',
  '.grid > *',
  '[class*="-card"]',
  '[class*="-image"]',
  '[class*="-media"]',
].join(',');

const HERO_CLASS = /hero|legal|heading/;
const HERO_LAYER = 'img, .hero-image, [class*="hero-image"]';

export async function initPageAnimations(host: HTMLElement, options: { footerOnly?: boolean } = {}): Promise<() => void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => undefined;
  }

  let gsap: Gsap;
  let ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;

  try {
    const [core, trigger] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    gsap = core.gsap;
    ScrollTrigger = trigger.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
  } catch {
    return () => undefined;
  }

  let disposed = false;
  const cleanups: Array<() => void> = [];
  const q = (selector: string): HTMLElement[] => Array.from(host.querySelectorAll<HTMLElement>(selector));

  const pageCtx = gsap.context(() => undefined, host);
  const footer = document.querySelector<HTMLElement>('app-site-footer');
  const footerCtx = footer ? gsap.context(() => undefined, footer) : null;

  const refreshSoon = debounce(() => {
    if (!disposed) {
      ScrollTrigger.refresh();
    }
  }, 200);

  /* ---------- footer ---------- */

  if (footer && footerCtx) {
    footerCtx.add(() => {
      const parts = Array.from(footer.querySelectorAll<HTMLElement>('.footer-inner > *'));

      if (parts.length) {
        gsap.from(parts, {
          y: 50,
          opacity: 0,
          duration: 1,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: parts[0], start: 'top 95%', once: true },
        });
      }
    });
  }

  if (options.footerOnly) {
    void document.fonts?.ready.then(refreshSoon);

    return () => {
      disposed = true;
      footerCtx?.revert();
    };
  }

  /* ---------- hero banner ---------- */

  const firstSection = host.querySelector<HTMLElement>('section');
  const hero =
    firstSection && (HERO_CLASS.test(firstSection.className) || firstSection.classList.contains('bg-stone-950'))
      ? firstSection
      : null;

  const inHero = (el: Element): boolean => !!hero && hero.contains(el);

  if (hero) {
    pageCtx.add(() => {
      const layers = Array.from(hero.querySelectorAll<HTMLElement>(HERO_LAYER));
      const titles = Array.from(hero.querySelectorAll<HTMLElement>('h1'));

      const texts = Array.from(hero.querySelectorAll<HTMLElement>('p, a, button, [class*="rule"], [class*="bottom"]')).filter(
        el => !el.closest('h1') && !titles.some(title => title.contains(el)),
      );

      gsap.set(titles, { opacity: 0, y: 56, clipPath: 'inset(0 0 100% 0)' });
      gsap.set(texts, { opacity: 0, y: 26 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });

      if (layers.length) {
        tl.fromTo(
          layers,
          { scale: 1.25, filter: 'blur(12px)' },
          { scale: 1, filter: 'blur(0px)', duration: 1.6, clearProps: 'filter' },
          0,
        ).to(layers, { scale: 1.06, duration: 10, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 1.6);
      }

      tl.to(titles, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1.15, stagger: 0.1, clearProps: 'clipPath,transform' }, 0.15).to(
        texts,
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, clearProps: 'transform' },
        0.5,
      );

      // scrolling away: the hero text drifts up and softens
      const content = titles
        .map(title => {
          let node: HTMLElement | null = title;

          while (node && node.parentElement !== hero) {
            node = node.parentElement;
          }

          return node;
        })
        .filter((node): node is HTMLElement => node !== null);

      if (content.length) {
        gsap.to(Array.from(new Set(content)), {
          yPercent: -8,
          opacity: 0.15,
          ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
        });
      }
    });
  }

  /* ---------- sections (re-checked whenever new content appears) ---------- */

  const done = new WeakSet<Element>();

  const usable = (el: HTMLElement): boolean => {
    if (done.has(el) || el.closest(SKIP) || inHero(el)) {
      return false;
    }

    if (el.offsetWidth === 0 && el.offsetHeight === 0) {
      return false;
    }

    const position = getComputedStyle(el).position;
    return position !== 'fixed' && position !== 'sticky';
  };

  const scan = () => {
    if (disposed) {
      return;
    }

    pageCtx.add(() => {
      const picked: HTMLElement[] = [];

      // document order, and nothing inside an already chosen block
      for (const el of q(BLOCKS)) {
        if (!usable(el) || picked.some(block => block.contains(el))) {
          continue;
        }

        picked.push(el);
      }

      const groups = new Map<Element, number>();

      for (const el of picked) {
        done.add(el);

        const parent = el.parentElement as Element;
        const index = groups.get(parent) ?? 0;
        groups.set(parent, index + 1);

        const isTitle = /^H[1-4]$/.test(el.tagName);
        const isPicture = el.matches('img, figure, [class*="-image"], [class*="-media"]');
        const isCard = el.matches('app-product-card, .grid > *, [class*="-card"]');
        const trigger = { trigger: el, start: isTitle ? 'top 88%' : 'top 92%', once: true };

        if (isTitle) {
          gsap.fromTo(
            el,
            { y: 46, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
            {
              y: 0,
              opacity: 1,
              clipPath: 'inset(0 0 0% 0)',
              duration: 1.05,
              ease: 'power4.out',
              clearProps: 'clipPath,transform,opacity',
              scrollTrigger: trigger,
            },
          );
        } else if (isPicture) {
          gsap.fromTo(
            el,
            { clipPath: 'inset(0 0 100% 0)' },
            { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.out', clearProps: 'clipPath', scrollTrigger: trigger },
          );
        } else if (isCard) {
          gsap.from(el, {
            y: 70,
            opacity: 0,
            duration: 0.95,
            delay: Math.min(index, 8) * 0.08,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: trigger,
          });
        } else {
          gsap.from(el, {
            y: 30,
            opacity: 0,
            duration: 0.9,
            delay: Math.min(index, 5) * 0.06,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: trigger,
          });
        }
      }
    });
  };

  const scanSoon = debounce(() => {
    scan();
    refreshSoon();
  }, 120);

  const observer = new MutationObserver(scanSoon);
  observer.observe(host, { childList: true, subtree: true });
  cleanups.push(() => observer.disconnect());

  void document.fonts?.ready.then(refreshSoon);
  window.addEventListener('load', refreshSoon);
  cleanups.push(() => window.removeEventListener('load', refreshSoon));

  scan();
  refreshSoon();

  return () => {
    disposed = true;
    cleanups.forEach(fn => fn());
    pageCtx.revert();
    footerCtx?.revert();
  };
}

function debounce(fn: () => void, wait: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return () => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, wait);
  };
}