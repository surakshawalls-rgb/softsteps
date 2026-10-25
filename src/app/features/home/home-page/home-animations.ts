/* =========================================================
   HOME PAGE ANIMATIONS
   ---------------------------------------------------------
   Everything here only ADDS motion to what already exists on
   the page. No words, links, buttons or layouts are changed.

   1. Intro      logo + photo cards shuffle, then a zoom-blur
                 wipe into the hero (first visit of a session)
   2. Hero       text rises in, photos drift slowly and the hero
                 zooms / fades gently while you scroll away
   3. Sections   headings wipe in, text rises, photos reveal,
                 cards stagger, rugs drop onto the rail
   ========================================================= */

type Gsap = typeof import('gsap').gsap;

const INTRO_KEY = 'ss-intro-seen';

const HEADINGS = [
  '.brand-intro h2',
  '.style-section-heading h2',
  '.featured-section h2',
  '.benefits-section h2',
  '.craftsmanship-copy h2',
  '.editorial-copy h2',
  '.custom-manufacturing-copy h2',
  '.consultation-heading h2',
  '.stay-connected-copy h2',
  '.custom-cta-section h2',
].join(',');

const SUPPORT_TEXT = [
  '.brand-intro p',
  '.style-section-heading p',
  '.featured-section p.text-xs',
  '.featured-section .max-w-7xl a',
  '.benefits-section .max-w-2xl p',
  '.craftsmanship-copy > :not(h2)',
  '.editorial-copy > :not(h2)',
  '.custom-manufacturing-copy > :not(h2):not(.custom-capabilities)',
  '.consultation-heading > :not(h2)',
  '.stay-connected-copy > :not(h2)',
  '.stay-connected-actions > *',
  '.custom-cta-section .max-w-5xl > :not(h2)',
].join(',');

export async function initHomeAnimations(host: HTMLElement): Promise<() => void> {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Visitors who asked for less motion get the plain page.
  if (reduced) {
    root.classList.remove('ss-pending');
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
    root.classList.remove('ss-pending');
    return () => undefined;
  }

  const q = (selector: string): HTMLElement[] => Array.from(host.querySelectorAll<HTMLElement>(selector));
  const one = (selector: string): HTMLElement | null => host.querySelector<HTMLElement>(selector);

  // true only when the visitor opened the home page directly (not by clicking a link inside the site)
  const firstLoad = root.classList.contains('ss-pending');
  const playIntro = firstLoad && !safeSession('get');

  // the header lives outside this page, so it is picked up directly
  const header = document.querySelector<HTMLElement>('app-site-header .site-header');
  const whatsapp = one('.floating-whatsapp');
  const extras = (): HTMLElement[] => [header, whatsapp].filter((el): el is HTMLElement => el !== null);

  const ctx = gsap.context(() => undefined, host);
  const cleanups: Array<() => void> = [];
  let disposed = false;

  /* ---------- starting positions for the hero text (hidden until it is its turn) ---------- */

  ctx.add(() => {
    gsap.set(q('.hero-tl, .hero-tr, .hero-br'), { opacity: 0 });
    gsap.set(q('.hero-copy h1'), { opacity: 0, y: 56, clipPath: 'inset(0 0 100% 0)' });
    gsap.set(q('.hero-actions'), { opacity: 0, y: 26 });

    if (firstLoad) {
      gsap.set(extras(), { opacity: 0 });
      gsap.set(header ? [header] : [], { y: -26 });
      gsap.set(whatsapp ? [whatsapp] : [], { scale: 0.4 });
    }
  });

  /* ---------- 1. INTRO ---------- */

  const runIntro = (): Promise<void> =>
    new Promise<void>(resolve => {
      const photos = q('.hero-slide img')
        .slice(0, 3)
        .map(img => (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src)
        .filter(Boolean);

      const overlay = document.createElement('div');
      overlay.className = 'ss-intro';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML =
        '<div class="ss-intro-inner">' +
        '<div class="ss-intro-stack">' +
        photos.map(src => `<div class="ss-intro-card"><img src="${src}" alt="" draggable="false"></div>`).join('') +
        '</div>' +
        '<div class="ss-intro-mark">SS</div>' +
        '</div>';
      document.body.appendChild(overlay);

      // the overlay now covers the page, so the page can be shown underneath it
      root.classList.remove('ss-pending');

      // freeze scrolling while the intro plays
      const block = (event: Event) => event.preventDefault();
      window.addEventListener('wheel', block, { passive: false });
      window.addEventListener('touchmove', block, { passive: false });
      window.scrollTo(0, 0);

      const inner = overlay.querySelector<HTMLElement>('.ss-intro-inner')!;
      const mark = overlay.querySelector<HTMLElement>('.ss-intro-mark')!;
      const cards = Array.from(overlay.querySelectorAll<HTMLElement>('.ss-intro-card'));
      const rotations = [-8, 5, -3];
      const track = one('.hero-track');

      gsap.set(cards, { opacity: 0, scale: 0.72, y: 30, rotate: (i: number) => rotations[i % 3] });
      gsap.set(mark, { opacity: 0, y: 18 });
      if (track) {
        gsap.set(track, { scale: 1.35, filter: 'blur(14px)' });
      }

      let finished = false;
      const finish = () => {
        if (finished) {
          return;
        }

        finished = true;
        overlay.remove();
        window.removeEventListener('wheel', block);
        window.removeEventListener('touchmove', block);
        safeSession('set');
        resolve();
      };

      let top = 10;
      const tl = gsap.timeline({ onComplete: finish });

      tl.to(cards, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 })
        .to(mark, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.3);

      // the photo cards shuffle: each one slides out and goes on top of the pile
      for (let i = 0; i < 4; i++) {
        const card = cards[i % cards.length];
        const direction = i % 2 === 0 ? 1 : -1;
        tl.to(card, { x: direction * 74, rotate: rotations[i % 3] + direction * 11, duration: 0.17, ease: 'power2.out' })
          .set(card, { zIndex: ++top })
          .to(card, { x: 0, rotate: rotations[(i + 1) % 3], duration: 0.22, ease: 'power2.inOut' });
      }

      // zoom-blur wipe into the hero
      tl.addLabel('wipe', '+=0.18')
        .to(inner, { scale: 7, filter: 'blur(16px)', opacity: 0, duration: 0.95, ease: 'power3.in' }, 'wipe')
        .to(overlay, { opacity: 0, duration: 0.55, ease: 'power1.out' }, 'wipe+=0.5');

      if (track) {
        tl.to(
          track,
          { scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out', clearProps: 'filter,transform' },
          'wipe+=0.45',
        );
      }

      // a click or tap skips ahead quickly
      overlay.addEventListener('click', () => tl.timeScale(4));

      // safety net: never leave the visitor stuck behind the intro
      window.setTimeout(() => {
        tl.progress(1);
        finish();
      }, 9000);
    });

  /* ---------- 2. HERO ---------- */

  const heroIn = () => {
    ctx.add(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.to(q('.hero-tl'), { opacity: 1, duration: 0.8 }, 0)
        .to(
          q('.hero-copy h1'),
          { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1.15, clearProps: 'clipPath,transform' },
          0.1,
        )
        .to(q('.hero-actions'), { opacity: 1, y: 0, duration: 0.9, clearProps: 'transform' }, 0.5)
        .to(q('.hero-tr'), { opacity: 1, duration: 0.9 }, 0.55)
        .to(q('.hero-br'), { opacity: 1, duration: 0.9 }, 0.7);

      if (firstLoad) {
        if (header) {
          tl.to(header, { opacity: 1, y: 0, duration: 0.9, clearProps: 'transform,opacity' }, 0.2);
        }

        if (whatsapp) {
          tl.to(whatsapp, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(2)', clearProps: 'transform,opacity' }, 1);
        }
      }
    });
  };

  ctx.add(() => {
    const hero = one('.home-hero');

    if (!hero) {
      return;
    }

    // slow drifting zoom on the banner photos (paused while the hero is off screen)
    const drift = gsap.to(q('.hero-slide img'), {
      scale: 1.08,
      duration: 9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    ScrollTrigger.create({
      trigger: hero,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: self => drift.paused(!self.isActive),
    });

    // scrolling away: photos zoom gently, the corner text drifts up and fades
    gsap.to(q('.hero-slides'), {
      scale: 1.14,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });

    gsap.to(q('.hero-layout'), {
      yPercent: -10,
      opacity: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  });

  /* ---------- 3. SECTIONS (re-checked whenever new content appears) ---------- */

  const done = new WeakSet<Element>();

  const fresh = (selector: string): HTMLElement[] =>
    q(selector).filter(el => {
      if (done.has(el)) {
        return false;
      }

      done.add(el);
      return true;
    });

  const once = (trigger: Element, start = 'top 88%') => ({ trigger, start, once: true });

  const scan = () => {
    if (disposed) {
      return;
    }

    ctx.add(() => {
      // headings wipe down into place
      fresh(HEADINGS).forEach(el => {
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
            scrollTrigger: once(el),
          },
        );
      });

      // small text, links and buttons rise in order
      const counts = new Map<Element, number>();

      fresh(SUPPORT_TEXT).forEach(el => {
        const parent = el.parentElement as Element;
        const index = counts.get(parent) ?? 0;
        counts.set(parent, index + 1);

        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 0.9,
          delay: Math.min(index, 4) * 0.07,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: once(el, 'top 92%'),
        });
      });

      // "Find your kind of craft" cards: rise in, then drift at different speeds
      const styleCards = fresh('.style-card');

      if (styleCards.length) {
        const grid = styleCards[0].parentElement as HTMLElement;
        const drifts = [
          [6, -6],
          [-9, 9],
          [4, -4],
        ];

        gsap.from(styleCards, {
          y: 120,
          opacity: 0,
          duration: 1.1,
          stagger: 0.15,
          ease: 'power3.out',
          clearProps: 'opacity',
          scrollTrigger: once(grid, 'top 85%'),
        });

        styleCards.forEach((card, index) => {
          const [from, to] = drifts[index % drifts.length];

          gsap.fromTo(
            card,
            { yPercent: from },
            {
              yPercent: to,
              ease: 'none',
              scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        });
      }

      // rug rail: the rail draws across, then the rugs drop onto it
      fresh('.rug-rail').forEach(rail => {
        const line = rail.querySelector<HTMLElement>('.rug-rail-line');
        const tl = gsap.timeline({ scrollTrigger: once(rail, 'top 80%') });

        if (line) {
          tl.fromTo(
            line,
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power2.inOut', clearProps: 'clipPath' },
            0,
          );
        }

        // picked at the moment it plays, so only the rugs on screen are animated
        tl.add(() => {
          const visible = Array.from(rail.querySelectorAll<HTMLElement>('.rug-hang')).filter(el => {
            const box = el.getBoundingClientRect();
            return box.right > 0 && box.left < window.innerWidth;
          });

          gsap.fromTo(
            visible,
            { y: -90, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.1,
              ease: 'back.out(1.3)',
              stagger: { each: 0.07, from: 'center' },
              clearProps: 'transform,opacity',
            },
          );
        }, 0.25);
      });

      // "Why Soft Steps" cards
      const benefits = fresh('.benefit-card');

      if (benefits.length) {
        gsap.from(benefits, {
          y: 70,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: once(benefits[0].parentElement as Element, 'top 85%'),
        });
      }

      // big photo with copy: wipe open, then a slow parallax inside the frame
      fresh('.craftsmanship-image').forEach(frame => {
        gsap.fromTo(
          frame,
          { clipPath: 'inset(0 0 100% 0)' },
          {
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.3,
            ease: 'power4.out',
            clearProps: 'clipPath',
            scrollTrigger: once(frame, 'top 85%'),
          },
        );

        const img = frame.querySelector('img');

        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.3, yPercent: -5 },
            {
              scale: 1.14,
              yPercent: 5,
              ease: 'none',
              scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        }
      });

      // photos that sit directly in their section wipe open
      fresh('.editorial-section > img, .custom-manufacturing-section > img').forEach(img => {
        gsap.fromTo(
          img,
          { clipPath: 'inset(0 0 100% 0)' },
          {
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.3,
            ease: 'power4.out',
            clearProps: 'clipPath',
            scrollTrigger: once(img, 'top 85%'),
          },
        );
      });

      // custom manufacturing chips
      fresh('.custom-capabilities').forEach(group => {
        gsap.from(Array.from(group.children), {
          y: 18,
          opacity: 0,
          duration: 0.7,
          stagger: 0.07,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: once(group, 'top 92%'),
        });
      });

      // "Start with a conversation" rows
      const links = fresh('.consultation-links a');

      if (links.length) {
        gsap.from(links, {
          y: 50,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: once(links[0].parentElement as Element, 'top 88%'),
        });
      }
    });
  };

  /* ---------- start ---------- */

  const refreshSoon = debounce(() => {
    if (!disposed) {
      ScrollTrigger.refresh();
    }
  }, 200);

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

  if (playIntro) {
    void runIntro().then(() => {
      if (!disposed) {
        heroIn();
      }
    });
  } else {
    root.classList.remove('ss-pending');
    heroIn();
  }

  return () => {
    disposed = true;
    cleanups.forEach(fn => fn());
    ctx.revert();
    document.querySelector('.ss-intro')?.remove();
    root.classList.remove('ss-pending');
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

/** Remembers (for this browser tab) that the intro has already played. */
function safeSession(action: 'get' | 'set'): boolean {
  try {
    if (action === 'set') {
      sessionStorage.setItem(INTRO_KEY, '1');
      return true;
    }

    return sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}