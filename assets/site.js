/* ============================================================
   A28 Global — Site JS
   Mobile menu, nav active state, scroll reveal, contact form.
   ============================================================ */

(() => {
  // ============================================================
  // Asset paths for the About-page merged-chimera mascot section.
  // ONE place to update when the PNGs are converted to WebP — flip
  // `ext` from 'png' to 'webp' and every <img data-mascot-src="...">
  // re-resolves correctly. The HTML carries `data-mascot-src="oyen.idle"`
  // etc. and we set the src below from this config.
  // ============================================================
  const MASCOT_ASSETS = {
    base: 'assets/about_mascots/',
    ext:  'webp',
    files: {
      oyen: { idle: 'beachcatstand',  raise: 'beachcatraisepaw',  paw: 'beachcatpaw'  },
      capy: { idle: 'beachcapystand', raise: 'beachcapyraisepaw', paw: 'beachcapypaw' },
    },
    src(key) {
      const [m, s] = key.split('.');
      return this.base + this.files[m][s] + '.' + this.ext;
    },
  };
  // Resolve every [data-mascot-src] element's src from the config above.
  // Done at script start (before DOMContentLoaded settles) so the images
  // begin loading as soon as possible.
  document.querySelectorAll('[data-mascot-src]').forEach((el) => {
    const key = el.dataset.mascotSrc;
    if (key) el.src = MASCOT_ASSETS.src(key);
  });

  // --- Intro boot animation ---
  const introBoot = document.getElementById('intro-boot');
  if (introBoot) {
    const alreadyPlayed = sessionStorage.getItem('a28-intro-played') === '1';
    if (alreadyPlayed) {
      introBoot.classList.add('is-removed');
    } else {
      document.body.classList.add('intro-boot-active');
      const skipBtn = document.getElementById('intro-boot-skip');
      const lines = introBoot.querySelectorAll('#intro-boot-lines .intro-boot__line');
      const fill = document.getElementById('intro-boot-fill');
      const pct  = document.getElementById('intro-boot-pct');
      const timers = [];
      let pctTimer = null;
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        timers.forEach(clearTimeout);
        if (pctTimer) clearInterval(pctTimer);
        introBoot.classList.add('is-hidden');
        document.body.classList.remove('intro-boot-active');
        sessionStorage.setItem('a28-intro-played', '1');
        setTimeout(() => introBoot.classList.add('is-removed'), 700);
      };

      skipBtn?.addEventListener('click', finish);

      // Phase 1: reveal terminal lines one by one
      const LINE_STAGGER = 480;
      const LINE_START = 420;
      lines.forEach((line, i) => {
        timers.push(setTimeout(() => line.classList.add('is-visible'), LINE_START + i * LINE_STAGGER));
      });

      // Phase 2: swap to compile bar, then animate fill 0 → 100
      const compileStart = LINE_START + lines.length * LINE_STAGGER + 520;
      timers.push(setTimeout(() => {
        introBoot.classList.add('is-compile');
        let p = 0;
        pctTimer = setInterval(() => {
          // Variable step so it feels organic, slightly weighted to slow near 100
          const remaining = 100 - p;
          const step = Math.max(1.6, Math.min(remaining, Math.random() * 6 + 3));
          p = Math.min(100, p + step);
          if (fill) fill.style.width = p + '%';
          if (pct) pct.textContent = Math.round(p) + '%';
          if (p >= 100) {
            clearInterval(pctTimer);
            pctTimer = null;
            timers.push(setTimeout(finish, 520));
          }
        }, 130);
      }, compileStart));
    }
  }

  // --- Active nav link ---
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav__link[data-page]').forEach(a => {
    if (a.dataset.page === path) a.classList.add('is-active');
  });
  document.querySelectorAll('.mobile-menu__nav a[data-page]').forEach(a => {
    if (a.dataset.page === path) a.style.color = 'var(--a28-gold-light)';
  });

  // --- Mobile menu ---
  const menu = document.getElementById('mobile-menu');
  const burger = document.getElementById('nav-burger');
  const close = document.getElementById('mobile-menu-close');
  const open = () => { menu.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
  const shut = () => { menu.classList.remove('is-open'); document.body.style.overflow = ''; };
  burger?.addEventListener('click', open);
  close?.addEventListener('click', shut);
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', shut));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });

  // --- Scroll reveal ---
  // .reveal (government) and .ent-reveal (enterprise) share the same
  // is-visible toggle — both pick up their own transitions from CSS.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .ent-reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal, .ent-reveal').forEach(el => el.classList.add('is-visible'));
  }

  // --- Hero animations ---
  const heroHl = document.getElementById('hero-headline');
  if (heroHl) requestAnimationFrame(() => setTimeout(() => heroHl.classList.add('is-revealed'), 350));

  const workHl = document.getElementById('work-heading');
  if (workHl) requestAnimationFrame(() => setTimeout(() => workHl.classList.add('is-revealed'), 220));

  const heroFoot = document.getElementById('hero-foot');
  if (heroFoot) setTimeout(() => heroFoot.classList.add('is-ready'), 950);

  // Mouse parallax on hero video
  const heroEl = document.getElementById('hero');
  const heroVid = document.querySelector('.hero-video');
  const heroSpotVid = document.querySelector('.hero-spot-reveal video');
  if (heroEl && heroVid) {
    const heroTextTargets = Array.from(document.querySelectorAll('.hero-text-spot'));
    heroEl.addEventListener('mousemove', e => {
      const r = heroEl.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 9;
      const transform = `scale(1.06) translate(${x}px, ${y}px)`;
      heroVid.style.transform = transform;
      if (heroSpotVid) heroSpotVid.style.transform = transform;
    });
    heroEl.addEventListener('mouseleave', () => {
      heroVid.style.transform = 'scale(1.06) translate(0, 0)';
      if (heroSpotVid) heroSpotVid.style.transform = 'scale(1.06) translate(0, 0)';
      heroEl.classList.remove('is-hero-text-hover');
    });
    heroTextTargets.forEach(el => {
      const moveHeroTextSpot = e => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--hero-text-x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--hero-text-y', `${e.clientY - rect.top}px`);
      };
      el.addEventListener('pointerenter', e => {
        heroEl.classList.add('is-hero-text-hover');
        el.classList.add('is-text-spot-active');
        moveHeroTextSpot(e);
      });
      el.addEventListener('pointermove', moveHeroTextSpot);
      el.addEventListener('pointerleave', () => {
        heroEl.classList.remove('is-hero-text-hover');
        el.classList.remove('is-text-spot-active');
        el.style.setProperty('--hero-text-x', '-999px');
        el.style.setProperty('--hero-text-y', '-999px');
      });
    });
  }

  // --- Capability wheel ---
  const wheel = document.querySelector('.capability-wheel');
  if (wheel) {
    const cards = Array.from(wheel.querySelectorAll('[data-wheel-card]'));
    const current = wheel.querySelector('[data-wheel-current]');
    const prev = wheel.querySelector('[data-wheel-prev]');
    const next = wheel.querySelector('[data-wheel-next]');
    let active = 0;
    let wheelLocked = false;

    const renderWheel = () => {
      cards.forEach((card, index) => {
        const offset = (index - active + cards.length) % cards.length;
        card.classList.remove('is-active', 'is-prev', 'is-next', 'is-far');
        if (offset === 0) card.classList.add('is-active');
        else if (offset === 1) card.classList.add('is-next');
        else if (offset === cards.length - 1) card.classList.add('is-prev');
        else card.classList.add('is-far');
      });
      wheel.dataset.active = active.toString();
      if (current) current.textContent = String(active + 1).padStart(2, '0');
    };

    const rotateWheel = dir => {
      active = (active + dir + cards.length) % cards.length;
      renderWheel();
    };

    prev?.addEventListener('click', () => rotateWheel(-1));
    next?.addEventListener('click', () => rotateWheel(1));
    wheel.addEventListener('wheel', e => {
      const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = horizontalIntent ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8) return;
      e.preventDefault();
      if (wheelLocked) return;
      wheelLocked = true;
      rotateWheel(delta > 0 ? 1 : -1);
      setTimeout(() => { wheelLocked = false; }, 420);
    }, { passive: false });

    renderWheel();
  }

  // --- CTA cursor effect ---
  const ctaPanel = document.querySelector('.prefooter-cta__panel');
  const finePointer = window.matchMedia?.('(pointer: fine)').matches;
  if (ctaPanel && finePointer) {
    const moveCtaCursor = e => {
      const rect = ctaPanel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctaPanel.style.setProperty('--cta-cursor-x', `${x}px`);
      ctaPanel.style.setProperty('--cta-cursor-y', `${y}px`);
      ctaPanel.style.setProperty('--cta-x', `${(x / rect.width) * 100}%`);
      ctaPanel.style.setProperty('--cta-y', `${(y / rect.height) * 100}%`);
    };

    ctaPanel.addEventListener('pointerenter', e => {
      ctaPanel.classList.add('is-cursor-active');
      moveCtaCursor(e);
    });
    ctaPanel.addEventListener('pointermove', moveCtaCursor);
    ctaPanel.addEventListener('pointerleave', () => {
      ctaPanel.classList.remove('is-cursor-active');
    });
  }

  // --- About hotspots (What We Do Differently) ---
  const hotspotsRoot = document.getElementById('about-hotspots');
  if (hotspotsRoot) {
    const hotspots = hotspotsRoot.querySelectorAll('.about-hotspot');
    const cards    = hotspotsRoot.querySelectorAll('.about-hotspot-card');
    const closeAll = () => {
      hotspots.forEach(h => h.classList.remove('is-active'));
      cards.forEach(c => c.classList.remove('is-open'));
    };
    hotspots.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.hotspot;
        const card = hotspotsRoot.querySelector(`.about-hotspot-card[data-card="${id}"]`);
        const wasOpen = btn.classList.contains('is-active');
        closeAll();
        if (!wasOpen) {
          btn.classList.add('is-active');
          card?.classList.add('is-open');
        }
      });
    });
    cards.forEach(card => {
      card.addEventListener('click', (e) => e.stopPropagation());
      card.querySelector('.about-hotspot-card__close')?.addEventListener('click', closeAll);
    });
    document.addEventListener('click', (e) => {
      if (!hotspotsRoot.contains(e.target)) closeAll();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  }

  // --- About page ---
  const aboutHl = document.getElementById('about-heading');
  if (aboutHl) {
    // Staggered line reveal (same pattern as homepage hero)
    requestAnimationFrame(() => setTimeout(() => aboutHl.classList.add('is-revealed'), 150));
  }

  // Scroll parallax on the hero image (scale(1.06) base + translateY)
  const aboutHeroFig = document.querySelector('.about-hero__img');
  if (aboutHeroFig) {
    const aboutHeroImg = aboutHeroFig.querySelector('img');
    const aboutSection = document.querySelector('.about-hero');
    const onScroll = () => {
      const rect = aboutSection.getBoundingClientRect();
      // Only run while the section is in view
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const progress = -rect.top / (aboutSection.offsetHeight || 1);
      // Shift image up to 36px as section scrolls out
      const shift = Math.max(0, Math.min(progress * 50, 36));
      aboutHeroImg.style.transform = `scale(1.06) translateY(${-shift}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Set stagger index on list items so CSS transition-delay kicks in
  document.querySelectorAll('.about-list .about-list__item').forEach((el, i) => {
    el.style.setProperty('--about-i', i);
  });

  // Spotlight cursor — applies to any .about-spotlight section
  const spotlightSections = document.querySelectorAll('.about-spotlight');
  if (spotlightSections.length && window.matchMedia?.('(pointer: fine)').matches) {
    spotlightSections.forEach(section => {
      const moveSpot = e => {
        const rect = section.getBoundingClientRect();
        section.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        section.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
      };
      section.addEventListener('pointerenter', e => {
        section.classList.add('is-spotlight-active');
        moveSpot(e);
      });
      section.addEventListener('pointermove', moveSpot);
      section.addEventListener('pointerleave', () => {
        section.classList.remove('is-spotlight-active');
        // Park the mask way off-canvas so reveal disappears instantly
        section.style.setProperty('--spot-x', '-999px');
        section.style.setProperty('--spot-y', '-999px');
      });
    });
  }

  // Attr list items: observe via IntersectionObserver + stagger index
  const aboutAttrCols = document.querySelectorAll('.about-attrs__col');
  if (aboutAttrCols.length && 'IntersectionObserver' in window) {
    const attrIo = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.about-attr-list li').forEach((li, i) => {
          li.style.setProperty('--attr-i', i);
          // Small timeout so the browser paints the initial opacity:0 state first
          setTimeout(() => li.classList.add('is-visible'), i * 55);
        });
        attrIo.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    aboutAttrCols.forEach(col => attrIo.observe(col));
  } else {
    // Fallback: just show everything
    document.querySelectorAll('.about-attr-list li').forEach(li => li.classList.add('is-visible'));
  }

  // --- How We Deliver — particle sphere ---
  // Mirrors the enterprise sphere but with the gov palette (gold + bone
  // on dark). ~520 surface particles distributed via the Fibonacci
  // spiral with a per-particle sine ripple. Four equator markers (one
  // per step) ride the sphere; their corresponding .deliver-label is
  // pinned next to each marker's screen position and fades based on
  // depth — so labels travel alongside the points, not in fixed slots.
  const deliverCanvas = document.getElementById('deliver-canvas');
  const deliverStage  = document.getElementById('deliver-stage');
  const deliverHint   = document.getElementById('deliver-hint');
  const deliverLabelEls = deliverStage
    ? Array.from(deliverStage.querySelectorAll('.deliver-label'))
    : [];

  if (deliverCanvas && deliverStage) {
    const ctx = deliverCanvas.getContext('2d');

    function readPalette() {
      const cs = getComputedStyle(document.body);
      const pick = (name, fallback) => (cs.getPropertyValue(name) || fallback).trim();
      return {
        goldLight: pick('--a28-gold-light-rgb', '215, 168, 88'),
        gold:      pick('--a28-gold-rgb',       '139, 102, 13'),
        goldPale:  pick('--a28-gold-pale-rgb',  '237, 212, 168'),
        bone:      pick('--a28-bone-rgb',       '245, 245, 235'),
      };
    }
    let palette = readPalette();

    // ---- Surface particles (Fibonacci sphere) — denser for that "bombastic" feel ----
    const N_POINTS = 1100;
    const surface = (() => {
      const arr = [];
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N_POINTS; i++) {
        const y = 1 - (i / (N_POINTS - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;
        arr.push({
          x: Math.cos(theta) * r,
          y: y,
          z: Math.sin(theta) * r,
          seed: i * 0.317 + Math.random() * 0.4,
        });
      }
      return arr;
    })();

    // ---- Outer corona sparks (drift in/out for halo motion) ----
    const SPARK_COUNT = 80;
    const sparks = Array.from({ length: SPARK_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 1.06 + Math.random() * 0.32,
      seed: Math.random() * 6.28,
      driftSpeed: 0.12 + Math.random() * 0.18,
    }));

    // ---- Equator markers (4 steps, 90° apart) ----
    const MARKERS = [
      { angle: 0              },
      { angle: Math.PI * 0.5  },
      { angle: Math.PI        },
      { angle: Math.PI * 1.5  },
    ];

    let spin       = 0;
    let spinTarget = 0;
    let interacted = false;
    let dragging   = false;
    let lastX      = 0;

    function render(now) {
      const dpr = window.devicePixelRatio || 1;
      const W = deliverCanvas.width  / dpr;
      const H = deliverCanvas.height / dpr;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const R  = Math.min(W, H) * 0.46;

      const cs = Math.cos(spin), sn = Math.sin(spin);

      // ---- Outer halo aura — soft warm bloom behind the sphere ----
      const aura = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 2.1);
      aura.addColorStop(0,    `rgba(${palette.goldLight}, 0.18)`);
      aura.addColorStop(0.45, `rgba(${palette.gold}, 0.10)`);
      aura.addColorStop(1,    `rgba(${palette.gold}, 0)`);
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(cx, cy, R * 2.1, 0, Math.PI * 2); ctx.fill();

      // ---- Outer corona ring (thin halo ring just outside the sphere) ----
      const coronaPulse = 1 + Math.sin(now * 0.0014) * 0.012;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.04 * coronaPulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${palette.goldLight}, 0.35)`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.12 * coronaPulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${palette.gold}, 0.18)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // ---- Drifting corona sparks (orbit-style sparks around the sphere) ----
      sparks.forEach(s => {
        const a = s.angle + now * 0.00012 * s.driftSpeed;
        const r = R * (s.radius + Math.sin(now * 0.0009 + s.seed) * 0.015);
        const sx = cx + Math.cos(a) * r;
        const sy = cy + Math.sin(a) * r * 0.35; // flatten — feels like a halo orbit
        const tw = 0.4 + (Math.sin(now * 0.003 + s.seed * 2.1) * 0.5 + 0.5) * 0.6;
        ctx.fillStyle = `rgba(${palette.goldPale}, ${tw * 0.55})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1.1, 0, Math.PI * 2); ctx.fill();
      });

      // ---- Inner glow (sits behind the particles for a "fluid" core feel) ----
      const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      innerGlow.addColorStop(0,    `rgba(${palette.goldLight}, 0.55)`);
      innerGlow.addColorStop(0.55, `rgba(${palette.gold}, 0.22)`);
      innerGlow.addColorStop(1,    `rgba(${palette.gold}, 0)`);
      ctx.fillStyle = innerGlow;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2); ctx.fill();

      // ---- Project + sort particles ----
      const projected = surface.map(p => {
        const rx = p.x * cs + p.z * sn;
        const rz = -p.x * sn + p.z * cs;
        const wobble = Math.sin(now * 0.0018 + p.seed * 5.2) * 0.034;
        const rEff = R * (1 + wobble);
        return {
          sx: cx + rx * rEff,
          sy: cy + p.y * rEff,
          depth: (rz + 1) * 0.5,
        };
      });
      projected.sort((a, b) => a.depth - b.depth);

      projected.forEach(p => {
        const size = 0.7 + p.depth * 3.1;
        const a    = 0.14 + p.depth * 0.78;
        ctx.fillStyle = `rgba(${palette.goldLight}, ${a * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fill();
        // Highlight pop on the very front particles
        if (p.depth > 0.82) {
          ctx.fillStyle = `rgba(${palette.bone}, ${(p.depth - 0.82) * 1.6})`;
          ctx.beginPath();
          ctx.arc(p.sx - size * 0.3, p.sy - size * 0.3, size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ---- Meridian wireframe arcs (front-half only for depth) ----
      const MERIDIANS = 6;
      ctx.lineWidth = 1;
      for (let m = 0; m < MERIDIANS; m++) {
        const mAng = (m / MERIDIANS) * Math.PI * 2 + spin;
        // Build a half-arc from north pole to south pole on this longitude;
        // only draw segments where rotated z >= 0 (front side).
        ctx.beginPath();
        let drawing = false;
        const STEPS = 48;
        for (let s = 0; s <= STEPS; s++) {
          const t = s / STEPS;
          const lat = -Math.PI / 2 + t * Math.PI;
          const x = Math.cos(lat) * Math.sin(mAng);
          const y = Math.sin(lat);
          const z = Math.cos(lat) * Math.cos(mAng);
          if (z < 0) { drawing = false; continue; }
          const sx = cx + x * R;
          const sy = cy + y * R;
          if (!drawing) { ctx.moveTo(sx, sy); drawing = true; }
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = `rgba(${palette.goldLight}, 0.08)`;
        ctx.stroke();
      }
      // Equator — slightly brighter, only front half
      ctx.beginPath();
      const ESTEPS = 96;
      let eDrawing = false;
      for (let s = 0; s <= ESTEPS; s++) {
        const a = (s / ESTEPS) * Math.PI * 2 + spin;
        const x = Math.sin(a);
        const z = Math.cos(a);
        if (z < 0) { eDrawing = false; continue; }
        const sx = cx + x * R;
        const sy = cy;
        if (!eDrawing) { ctx.moveTo(sx, sy); eDrawing = true; }
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = `rgba(${palette.goldLight}, 0.20)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ---- Front-face gleam (upper-left key light) ----
      const gleam = ctx.createRadialGradient(
        cx - R * 0.28, cy - R * 0.32, 0,
        cx - R * 0.18, cy - R * 0.22, R * 0.7
      );
      gleam.addColorStop(0, `rgba(${palette.bone}, 0.32)`);
      gleam.addColorStop(1, `rgba(${palette.bone}, 0)`);
      ctx.fillStyle = gleam;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // ---- Equator markers ----
      const markers = MARKERS.map((m, i) => {
        const a = m.angle + spin;
        const wx = Math.sin(a);
        const wz = Math.cos(a);
        return {
          i,
          sx: cx + wx * R,
          sy: cy,
          wx,
          z:  wz,
          depth: (wz + 1) * 0.5,
        };
      });

      // Draw back-to-front so front markers paint last
      markers.slice().sort((a, b) => a.depth - b.depth).forEach(m => {
        if (m.z < -0.85) return;
        const size = 9 + m.depth * 11;

        // Soft outer glow on every visible marker
        const outerGlow = ctx.createRadialGradient(m.sx, m.sy, size * 0.4, m.sx, m.sy, size * 4.2);
        outerGlow.addColorStop(0, `rgba(${palette.goldLight}, ${0.20 + m.depth * 0.35})`);
        outerGlow.addColorStop(1, `rgba(${palette.goldLight}, 0)`);
        ctx.fillStyle = outerGlow;
        ctx.beginPath(); ctx.arc(m.sx, m.sy, size * 4.2, 0, Math.PI * 2); ctx.fill();

        // Bead
        const bead = ctx.createRadialGradient(m.sx - size * 0.35, m.sy - size * 0.35, 0, m.sx, m.sy, size);
        bead.addColorStop(0,   `rgba(${palette.bone}, 1)`);
        bead.addColorStop(0.55,`rgba(${palette.goldLight}, 0.98)`);
        bead.addColorStop(1,   `rgba(${palette.gold}, 0.92)`);
        ctx.fillStyle = bead;
        ctx.beginPath(); ctx.arc(m.sx, m.sy, size, 0, Math.PI * 2); ctx.fill();

        // Hairline edge
        ctx.beginPath(); ctx.arc(m.sx, m.sy, size, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${palette.bone}, ${0.4 + m.depth * 0.4})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Step number on the front face
        if (m.depth > 0.5) {
          const numA = (m.depth - 0.5) * 2;
          ctx.fillStyle = `rgba(${palette.bone}, ${numA})`;
          ctx.font = `600 ${Math.max(8, size * 0.85)}px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(m.i + 1), m.sx, m.sy + 1);
        }
      });

      // ---- Position labels riding their markers ----
      // Each label is pinned tightly next to its bead and pushed radially
      // outward as the marker moves to the front, so the card visibly
      // orbits the sphere instead of swapping between fixed slots.
      const stageW = deliverStage.offsetWidth;
      const stageH = deliverStage.offsetHeight;
      const scaleX = stageW / W;
      const scaleY = stageH / H;
      markers.forEach(m => {
        const label = deliverLabelEls[m.i];
        if (!label) return;
        const size = 9 + m.depth * 11;
        // Outward push grows as the marker swings forward.
        const push = size + 14 + m.depth * 28;
        // Horizontal direction follows the marker's x position relative to
        // the sphere centre; vertical lift is a gentle arc so the label
        // floats above when crossing the front and dips on the sides.
        const sideX = m.wx >= 0 ? 1 : -1;
        const lx = m.sx + sideX * push;
        const ly = m.sy - 14 - Math.max(0, m.depth - 0.5) * 26;
        const lxStage = lx * scaleX;
        const lyStage = ly * scaleY;
        const lw = label.offsetWidth  || 148;
        const lh = label.offsetHeight || 70;
        const margin = 8;
        let leftPx = sideX > 0 ? lxStage : lxStage - lw;
        leftPx = Math.max(margin, Math.min(stageW - lw - margin, leftPx));
        const topPx = Math.max(margin, Math.min(stageH - lh - margin, lyStage - lh * 0.5));
        label.style.left = leftPx + 'px';
        label.style.top  = topPx + 'px';
        // Fade based on depth — back-side labels disappear so only the
        // forward-facing ones read.
        const vis = Math.max(0, Math.min(1, (m.depth - 0.40) / 0.30));
        label.style.opacity = String(vis);
        label.classList.toggle('is-visible', vis > 0.05);
      });
    }

    function loop() {
      const now = performance.now();
      // Idle auto-spin (gentle) until the user grabs
      if (!interacted) spinTarget += 0.0024;
      spin += (spinTarget - spin) * 0.08;
      render(now);
      requestAnimationFrame(loop);
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w   = deliverStage.offsetWidth;
      const h   = deliverStage.offsetHeight;
      deliverCanvas.width  = Math.round(w * dpr);
      deliverCanvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const markInteracted = () => {
      if (interacted) return;
      interacted = true;
      deliverHint?.classList.add('is-hidden');
    };

    // Wheel — only hijack inside central 40% of the stage so the page
    // can still scroll past with the cursor near the edges.
    deliverStage.addEventListener('wheel', e => {
      const rect = deliverStage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (x < 0.30 || x > 0.70) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 3) return;
      spinTarget += delta * 0.003;
      markInteracted();
    }, { passive: false });

    deliverCanvas.addEventListener('pointerdown', e => {
      dragging = true;
      lastX = e.clientX;
      deliverCanvas.setPointerCapture(e.pointerId);
      markInteracted();
    });
    deliverCanvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      spinTarget += dx * 0.008;
    });
    const endDrag = () => { dragging = false; };
    deliverCanvas.addEventListener('pointerup',     endDrag);
    deliverCanvas.addEventListener('pointercancel', endDrag);

    resize();
    window.addEventListener('resize', () => { resize(); palette = readPalette(); });
    requestAnimationFrame(loop);
  }

  // --- How We Deliver — fixed-pin 3D model alternative ---
  const deliverModel3d = document.getElementById('deliver-model3d');
  const deliverModelScene = document.getElementById('deliver-model3d-scene');

  if (deliverModel3d && deliverModelScene) {
    const viewport = deliverModel3d.querySelector('.deliver-model3d__viewport');
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotateX = 54;
    let rotateY = -12;
    let targetX = rotateX;
    let targetY = rotateY;
    let interacted = false;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function setModelRotation() {
      deliverModelScene.style.setProperty('--model-rotate-x', `${rotateX}deg`);
      deliverModelScene.style.setProperty('--model-rotate-y', `${rotateY}deg`);
    }

    function tickModel() {
      if (!interacted && !dragging) {
        const idleTime = Date.now() * 0.0012;
        targetY = -12 + Math.sin(idleTime) * 6;
        targetX = 54 + Math.sin(idleTime * 0.8) * 5;
      }
      const speed = dragging ? 0.42 : 0.1;
      rotateX += (targetX - rotateX) * speed;
      rotateY += (targetY - rotateY) * speed;
      setModelRotation();
      requestAnimationFrame(tickModel);
    }

    viewport?.addEventListener('pointerdown', e => {
      dragging = true;
      interacted = true;
      lastX = e.clientX;
      lastY = e.clientY;
      viewport.setPointerCapture(e.pointerId);
    });

    viewport?.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetY = clamp(targetY + dx * 0.16, -34, 34);
      targetX = clamp(targetX - dy * 0.12, 6, 80);
    });

    viewport?.addEventListener('pointerup', () => { dragging = false; });
    viewport?.addEventListener('pointercancel', () => { dragging = false; });
    viewport?.addEventListener('pointerleave', () => { dragging = false; });
    viewport?.addEventListener('lostpointercapture', () => { dragging = false; });

    setModelRotation();
    tickModel();
  }

  // --- Enterprise "How we get it done" — spinnable toy block ---
  const entCube   = document.getElementById('ent-cube');
  const entCubeVp = document.getElementById('ent-cube-viewport');
  if (entCube && entCubeVp) {
    const entHint   = document.getElementById('ent-cube-hint');
    const entDots   = Array.from(document.querySelectorAll('.ent-cube__dot'));
    const entReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const REST_RX   = -16;
    let ry = -28, rx = REST_RX, targetRy = -28, targetRx = REST_RX;
    let dragging = false, lastX = 0, lastY = 0, interacted = false, lastIdx = -1;

    // Which side face (0..3) currently faces front. Faces spin past the viewer
    // every 90° of rotateY: front(0) → right(1) → back(2) → left(3).
    const faceIndex = () => ((Math.round(-targetRy / 90) % 4) + 4) % 4;

    function updateDots() {
      const idx = faceIndex();
      if (idx === lastIdx) return;
      lastIdx = idx;
      entDots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
    function stopIdle() {
      if (interacted) return;
      interacted = true;
      if (entHint) entHint.classList.add('is-hidden');
    }
    function tick() {
      // Skip work while the block lives on the hidden (government) route.
      if (!entCube.offsetParent) { requestAnimationFrame(tick); return; }
      if (!interacted && !dragging && !entReduce) targetRy -= 0.22;   // gentle idle spin
      const speed = dragging ? 0.5 : 0.12;
      ry += (targetRy - ry) * speed;
      rx += (targetRx - rx) * speed;
      entCube.style.setProperty('--cube-ry', ry.toFixed(2) + 'deg');
      entCube.style.setProperty('--cube-rx', rx.toFixed(2) + 'deg');
      updateDots();
      requestAnimationFrame(tick);
    }

    entCubeVp.addEventListener('pointerdown', e => {
      dragging = true; stopIdle();
      lastX = e.clientX; lastY = e.clientY;
      entCubeVp.setPointerCapture(e.pointerId);
    });
    entCubeVp.addEventListener('pointermove', e => {
      if (!dragging) return;
      targetRy += (e.clientX - lastX) * 0.5;
      targetRx = Math.max(-44, Math.min(8, targetRx - (e.clientY - lastY) * 0.25));
      lastX = e.clientX; lastY = e.clientY;
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      targetRy = Math.round(targetRy / 90) * 90;   // snap a face square to the front
      targetRx = REST_RX;                          // ease back to the resting tilt
    }
    ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture']
      .forEach(ev => entCubeVp.addEventListener(ev, endDrag));

    entDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        stopIdle();
        const base = Math.round(targetRy / 360) * 360;
        let cand = base - i * 90;                   // pick the nearest equivalent angle
        [cand - 360, cand + 360].forEach(c => {
          if (Math.abs(c - targetRy) < Math.abs(cand - targetRy)) cand = c;
        });
        targetRy = cand;
        targetRx = REST_RX;
      });
    });

    updateDots();
    entCube.style.setProperty('--cube-ry', ry.toFixed(2) + 'deg');
    entCube.style.setProperty('--cube-rx', rx.toFixed(2) + 'deg');
    tick();
  }

  // --- Enterprise sphere — "How We Get It Done" ---
  // Particle sphere (Fibonacci spiral + per-particle sine ripple) with
  // N step-markers riding the equator. Whichever marker has the largest
  // +z (closest to viewer) is the "active" step. Its DOM card snaps to
  // the marker's canvas-space position (+72px right, vertically centered)
  // and cross-fades in. Hysteresis on the z-compare keeps the switch
  // from flickering when two markers are roughly equidistant.
  //
  // A11y: invisible <button> per marker (positioned to overlay each dot)
  // gives keyboard + click access. Enter/Space and click snap that step
  // to front; arrow keys cycle. A polite live region announces the
  // active step. prefers-reduced-motion skips the canvas entirely — CSS
  // shows the .ent-sphere-fallback list instead.
  const PROCESS_STEPS = [
    { number: 1, color: 'terra',
      title: 'Frame the Problem',
      description: 'We listen first. Then we map the real shape of the system, the constraints, and the outcome you actually need.' },
    { number: 2, color: 'sky',
      title: 'Design the Path',
      description: 'Architecture, data flows, interaction patterns — sketched out before a line of code so the destination is clear.' },
    { number: 3, color: 'sage',
      title: 'Build With Care',
      description: 'Code, integrations, dashboards, automations — built by the same people who designed them. No throw-overs.' },
    { number: 4, color: 'blush',
      title: 'Operate & Evolve',
      description: "We don't disappear at go-live. We help operate, measure, and iterate so the system actually delivers value." },
  ];

  const sphereCanvas = document.getElementById('ent-sphere-canvas');
  const sphereStage  = document.getElementById('ent-sphere-stage');
  const sphereReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sphereCanvas && sphereStage && !sphereReduce &&
      document.documentElement.dataset.theme === 'enterprise') {
    const sphereCtx     = sphereCanvas.getContext('2d');
    const sphereHint    = document.getElementById('ent-sphere-hint');
    const sphereLive    = document.getElementById('ent-sphere-live');
    const sphereCardEls = Array.from(sphereStage.querySelectorAll('.ent-sphere-card'));
    const sphereNodeEls = Array.from(sphereStage.querySelectorAll('.ent-sphere-node'));
    const sphereDotEls  = Array.from(sphereStage.querySelectorAll('.ent-sphere-dot'));

    function spherePalette() {
      const cs = getComputedStyle(document.body);
      const pick = (n, f) => (cs.getPropertyValue(n) || f).trim();
      return {
        terra:     pick('--ent-terra-rgb',        '209, 118, 84'),
        terraDeep: pick('--ent-terra-deep-rgb',   '177, 78, 46'),
        peach:     pick('--ent-peach-rgb',        '240, 201, 168'),
        mist:      pick('--ent-mist-rgb',         '247, 224, 208'),
        sage:      pick('--ent-sage-rgb',         '143, 161, 124'),
        sky:       pick('--ent-sky-rgb',          '159, 185, 201'),
        blush:     pick('--ent-blush-rgb',        '232, 180, 160'),
        paper:     pick('--ent-cream-paper-rgb',  '251, 246, 236'),
        ink:       pick('--ent-ink-rgb',          '28, 27, 31'),
      };
    }
    let palette = spherePalette();

    // ---- Surface particles (Fibonacci sphere) ----
    const N_POINTS = 620;
    const surface = (() => {
      const arr = [];
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N_POINTS; i++) {
        const y = 1 - (i / (N_POINTS - 1)) * 2;       // -1..1
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;
        arr.push({
          x: Math.cos(theta) * r,
          y: y,
          z: Math.sin(theta) * r,
          seed: i * 0.317 + Math.random() * 0.4,      // unique phase per particle
        });
      }
      return arr;
    })();

    // ---- Equator markers, evenly spaced — one per PROCESS_STEPS entry.
    // Angles are negated so that positive spin (drag right / auto-spin)
    // brings them to the front in 1 → 2 → 3 → 4 order. ----
    const MARKERS = PROCESS_STEPS.map((s, i) => ({
      angle: -(i / PROCESS_STEPS.length) * Math.PI * 2,
      color: s.color,
    }));
    // Negative hysteresis = challenger can take over before it's strictly
    // more front-facing than the incumbent. The active card swaps while
    // it's still on the front half but starting to slide off-center, so
    // it never trails far enough to bust out of the stage container.
    const HYSTERESIS = -0.5;
    const POP_DUR    = 320;    // ms — scale 1 → 1.06 → 1 when active changes

    let spin = 0;          // current Y-axis rotation in radians
    let spinTarget = 0;
    let interacted = false;
    let dragging = false;
    let lastX = 0;
    let activeIdx = -1;
    let popStart = -1;

    function announce(idx) {
      if (!sphereLive || !PROCESS_STEPS[idx]) return;
      const s = PROCESS_STEPS[idx];
      sphereLive.textContent = `Step ${s.number} of ${PROCESS_STEPS.length}: ${s.title}`;
    }

    function setActive(idx, posPx, now) {
      if (idx === activeIdx) return;
      activeIdx = idx;
      popStart  = now;
      sphereCardEls.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      sphereNodeEls.forEach((b, i) => {
        if (i === idx) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      sphereDotEls.forEach((d, i) => {
        d.classList.toggle('is-active', i === idx);
        d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });
      // Snapshot the active card's position so it lands beside the node
      // at the moment of activation; from this frame on, the active card
      // tracks live (see end of renderSphere). Inactive cards stay frozen
      // at their last position while they fade out — no jump on swap.
      const card = sphereCardEls[idx];
      if (card && posPx) {
        card.style.setProperty('--card-x', posPx.x + 'px');
        card.style.setProperty('--card-y', posPx.y + 'px');
      }
      announce(idx);
    }

    function renderSphere(now) {
      const dpr = window.devicePixelRatio || 1;
      const W = sphereCanvas.width / dpr;
      const H = sphereCanvas.height / dpr;
      sphereCtx.clearRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;
      const R  = Math.min(W, H) * 0.42;

      const cs = Math.cos(spin), sn = Math.sin(spin);

      // Soft inner glow behind the particles
      const innerGlow = sphereCtx.createRadialGradient(cx, cy, 0, cx, cy, R);
      innerGlow.addColorStop(0,    `rgba(${palette.peach}, 0.45)`);
      innerGlow.addColorStop(0.55, `rgba(${palette.terra}, 0.18)`);
      innerGlow.addColorStop(1,    `rgba(${palette.terra}, 0)`);
      sphereCtx.fillStyle = innerGlow;
      sphereCtx.beginPath(); sphereCtx.arc(cx, cy, R * 1.05, 0, Math.PI * 2); sphereCtx.fill();

      // ---- Project + sort surface particles back-to-front ----
      const projected = surface.map(p => {
        // Y-axis rotation: (x,z) → (x*c + z*s, -x*s + z*c)
        const rx = p.x * cs + p.z * sn;
        const rz = -p.x * sn + p.z * cs;
        // Liquid ripple — per-particle sine offset on the radius.
        // Higher amplitude + frequency = more vigorous bubbling surface.
        const wobble = Math.sin(now * 0.0034 + p.seed * 5.2) * 0.06;
        const rEff = R * (1 + wobble);
        return {
          sx: cx + rx * rEff,
          sy: cy + p.y * rEff,
          depth: (rz + 1) * 0.5,   // 0 (back) .. 1 (front)
        };
      });
      projected.sort((a, b) => a.depth - b.depth);

      // Draw particles — small dots, size+alpha modulated by depth
      projected.forEach(p => {
        const size = 0.7 + p.depth * 2.4;
        const a = 0.08 + p.depth * 0.62;
        sphereCtx.fillStyle = `rgba(${palette.terraDeep}, ${a * 0.55})`;
        sphereCtx.beginPath();
        sphereCtx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        sphereCtx.fill();
      });

      // Highlight gleam on the front face of the sphere
      const gleam = sphereCtx.createRadialGradient(
        cx - R * 0.28, cy - R * 0.32, 0, cx - R * 0.18, cy - R * 0.22, R * 0.65
      );
      gleam.addColorStop(0, `rgba(${palette.paper}, 0.35)`);
      gleam.addColorStop(1, `rgba(${palette.paper}, 0)`);
      sphereCtx.fillStyle = gleam;
      sphereCtx.beginPath(); sphereCtx.arc(cx, cy, R, 0, Math.PI * 2); sphereCtx.fill();

      // ---- Equator markers ----
      const markers = MARKERS.map((m, i) => {
        const a = m.angle + spin;
        const wx = Math.sin(a);
        const wz = Math.cos(a);
        return {
          i,
          color: m.color,
          sx: cx + wx * R,
          sy: cy,           // equator: y = 0
          z:  wz,
          depth: (wz + 1) * 0.5,
        };
      });

      // Pick the front-most as the active step, with hysteresis so a
      // challenger has to clearly beat the incumbent to take over.
      // Find the best non-incumbent challenger, then compare *once*
      // against the incumbent — otherwise the incumbent (still high z)
      // can flip the result back mid-loop on the 4→1 wrap-around, where
      // marker 0 wins the early iterations but marker 3 is checked last.
      let newActive;
      if (activeIdx < 0) {
        newActive = markers[0];
        for (let i = 1; i < markers.length; i++) {
          if (markers[i].z > newActive.z) newActive = markers[i];
        }
      } else {
        let topChallenger = null;
        for (let i = 0; i < markers.length; i++) {
          if (i === activeIdx) continue;
          if (!topChallenger || markers[i].z > topChallenger.z) {
            topChallenger = markers[i];
          }
        }
        const incumbent = markers[activeIdx];
        newActive = (topChallenger && topChallenger.z > incumbent.z + HYSTERESIS)
          ? topChallenger
          : incumbent;
      }
      setActive(newActive.i, { x: newActive.sx, y: newActive.sy }, now);

      // Keep the active card glued to its marker as the sphere rotates.
      const activeMarker = markers[activeIdx];
      if (activeMarker && sphereCardEls[activeIdx]) {
        sphereCardEls[activeIdx].style.setProperty('--card-x', activeMarker.sx + 'px');
        sphereCardEls[activeIdx].style.setProperty('--card-y', activeMarker.sy + 'px');
      }

      // Update node-button positions + behind-state for hit-testing.
      markers.forEach(m => {
        const btn = sphereNodeEls[m.i];
        if (!btn) return;
        btn.style.setProperty('--node-x', m.sx + 'px');
        btn.style.setProperty('--node-y', m.sy + 'px');
        btn.classList.toggle('is-behind', m.z < -0.35);
      });

      // ---- Pop scale on the active marker when it changes ----
      let popScale = 1;
      if (popStart >= 0) {
        const t = (now - popStart) / POP_DUR;
        if (t >= 1) popStart = -1;
        else popScale = 1 + 0.06 * Math.sin(Math.max(0, t) * Math.PI);
      }

      // Draw markers back-to-front so the active (front) one sits on top
      markers.sort((a, b) => a.depth - b.depth).forEach(m => {
        if (m.z < -0.85) return;  // skip almost-fully-behind markers
        let baseSize = 9 + m.depth * 9;
        if (m.i === activeIdx) baseSize *= popScale;
        const cRgb = palette[m.color];

        // Outer glow on the front face only
        if (m.depth > 0.55) {
          const glow = sphereCtx.createRadialGradient(m.sx, m.sy, baseSize * 0.5, m.sx, m.sy, baseSize * 3.5);
          glow.addColorStop(0, `rgba(${cRgb}, ${(m.depth - 0.55) * 0.7})`);
          glow.addColorStop(1, `rgba(${cRgb}, 0)`);
          sphereCtx.fillStyle = glow;
          sphereCtx.beginPath(); sphereCtx.arc(m.sx, m.sy, baseSize * 3.5, 0, Math.PI * 2); sphereCtx.fill();
        }
        // Marker bead
        const bead = sphereCtx.createRadialGradient(m.sx - baseSize * 0.35, m.sy - baseSize * 0.35, 0, m.sx, m.sy, baseSize);
        bead.addColorStop(0,   `rgba(${palette.paper}, 1)`);
        bead.addColorStop(0.5, `rgba(${cRgb}, 0.98)`);
        bead.addColorStop(1,   `rgba(${cRgb}, 0.85)`);
        sphereCtx.fillStyle = bead;
        sphereCtx.beginPath(); sphereCtx.arc(m.sx, m.sy, baseSize, 0, Math.PI * 2); sphereCtx.fill();
        // Ink hairline
        sphereCtx.beginPath(); sphereCtx.arc(m.sx, m.sy, baseSize, 0, Math.PI * 2);
        sphereCtx.strokeStyle = `rgba(${palette.ink}, ${0.4 + m.depth * 0.5})`;
        sphereCtx.lineWidth = 1.4;
        sphereCtx.stroke();
        // Step number on the front face
        if (m.depth > 0.45) {
          const numA = (m.depth - 0.45) * 2;
          sphereCtx.fillStyle = `rgba(${palette.ink}, ${numA})`;
          sphereCtx.font = `600 ${Math.max(9, baseSize * 0.85)}px "JetBrains Mono", monospace`;
          sphereCtx.textAlign = 'center';
          sphereCtx.textBaseline = 'middle';
          sphereCtx.fillText(String(m.i + 1), m.sx, m.sy + 1);
        }
      });
    }

    function sphereLoop() {
      const now = performance.now();
      if (!interacted) spinTarget += 0.0024;   // gentle auto-spin until first interaction
      spin += (spinTarget - spin) * 0.08;
      renderSphere(now);
      requestAnimationFrame(sphereLoop);
    }

    function sphereResize() {
      const dpr = window.devicePixelRatio || 1;
      const w = sphereCanvas.clientWidth;
      const h = sphereCanvas.clientHeight;
      sphereCanvas.width  = Math.round(w * dpr);
      sphereCanvas.height = Math.round(h * dpr);
      sphereCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const markInteracted = () => {
      if (interacted) return;
      interacted = true;
      if (sphereHint) sphereHint.classList.add('is-hidden');
    };

    // ---- Snap-to-step: rotate the sphere so MARKERS[idx] is front-facing,
    // taking the shortest angular path. By default this also flips the
    // interacted flag (stops the auto-spin) — pass keepAutoSpin:true to
    // nudge the rotation without halting it (carousel-dot behavior). ----
    function snapToStep(idx, opts) {
      if (idx < 0 || idx >= MARKERS.length) return;
      const TAU = Math.PI * 2;
      const targetSpin = -MARKERS[idx].angle;
      const curMod = ((spinTarget % TAU) + TAU) % TAU;
      const tgtMod = ((targetSpin % TAU) + TAU) % TAU;
      let delta = tgtMod - curMod;
      if (delta >  Math.PI) delta -= TAU;
      if (delta < -Math.PI) delta += TAU;
      spinTarget += delta;
      if (opts && opts.keepAutoSpin) {
        if (sphereHint) sphereHint.classList.add('is-hidden');
      } else {
        markInteracted();
      }
    }

    sphereDotEls.forEach((btn, i) => {
      btn.addEventListener('click', () => snapToStep(i, { keepAutoSpin: true }));
    });

    sphereNodeEls.forEach((btn, i) => {
      btn.addEventListener('click', () => snapToStep(i));
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          snapToStep(i);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const ni = (i + 1) % sphereNodeEls.length;
          snapToStep(ni); sphereNodeEls[ni].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const ni = (i - 1 + sphereNodeEls.length) % sphereNodeEls.length;
          snapToStep(ni); sphereNodeEls[ni].focus();
        }
      });
    });

    sphereCanvas.addEventListener('pointerdown', e => {
      dragging = true;
      lastX = e.clientX;
      sphereCanvas.setPointerCapture(e.pointerId);
      markInteracted();
    });
    sphereCanvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      spinTarget += dx * 0.008;
    });
    const endSphereDrag = () => { dragging = false; };
    sphereCanvas.addEventListener('pointerup',     endSphereDrag);
    sphereCanvas.addEventListener('pointercancel', endSphereDrag);

    sphereResize();
    window.addEventListener('resize', () => { sphereResize(); palette = spherePalette(); });
    requestAnimationFrame(sphereLoop);
  }

  // --- Contact form(s) ---
  // Government route: #contact-form. Enterprise route: #contact-form-ent.
  // Both carry class .contact-form so a single loop wires both up; only
  // one is visible at a time (the other sits inside a hidden data-theme-only
  // wrapper), so there's no risk of double-submit.
  const cs = getComputedStyle(document.body);
  const accentLight = (cs.getPropertyValue('--a28-gold-light') || '#D7A858').trim();
  const accentPale  = (cs.getPropertyValue('--a28-gold-pale')  || '#EDD4A8').trim();

  document.querySelectorAll('.contact-form').forEach(form => {
    const fb = form.querySelector('.feedback');
    const btn = form.querySelector('button[type="submit"]');
    if (!fb || !btn) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const msg = (data.get('message') || '').toString().trim();
      if (!name || !email || !msg) {
        fb.textContent = 'Please fill in name, email, and message.';
        fb.style.color = accentLight;
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fb.textContent = 'Please enter a valid email address.';
        fb.style.color = accentLight;
        return;
      }
      const restoreHTML = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Sending…';
      setTimeout(() => {
        fb.style.color = accentPale;
        fb.textContent = `Thanks, ${name.split(' ')[0]} — we'll be in touch within two business days.`;
        form.reset();
        btn.disabled = false; btn.innerHTML = restoreHTML;
      }, 800);
    });
  });

  // --- Enterprise hero: scroll-jacked marquee + stop-motion capybara ---
  // Two modes share the same preloaded frame list:
  //   ≥768px (scroll-jack)  — capy frames are driven by scroll progress
  //                           (rotation = how far the user has scrolled).
  //   <768px (static stack) — capy auto-spins on its own at a steady rate
  //                           since there's no scroll-jack to rotate it.
  // Reduced-motion: scroll-jack is disabled by gsap.matchMedia and the
  // auto-spin block bails out, so the capy holds on frame 0.
  const heroLine = document.getElementById('ent-hero-line');
  const heroCapy = document.getElementById('ent-hero-capy');
  const heroCapyImg = document.getElementById('ent-hero-capy-img');
  const heroSection = document.getElementById('ent-hero');
  if (heroCapy && heroCapyImg &&
      document.documentElement.dataset.theme === 'enterprise') {

    const FRAME_COUNT = 8;
    // Preload every frame so the stop-motion swaps are instant.
    // Ordered to begin on frame 0003 and spin "backwards" (0003, 0002, 0001,
    // 0008, 0007 …) so the rotation reads in the other direction.
    const START_FRAME = 3;   // 1-based frame the spin begins on
    const SPIN_DIR = -1;     // -1 = reversed (descending frame number)
    const frames = [];
    for (let k = 0; k < FRAME_COUNT; k++) {
      const n = (((START_FRAME - 1 + SPIN_DIR * k) % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT + 1;
      const img = new Image();
      img.src = 'assets/beachcapyspin/' + String(n).padStart(4, '0') + '.webp';
      img.decode().catch(() => {});   // pre-decode so the first spin doesn't flicker
      frames.push(img);
    }

    // ----- Phone-only auto-spin -----
    // At <768px the scroll-jack is off (CSS shows the static stack), so the
    // capy would otherwise sit on a single frame. Spin it on a timer instead
    // — slower than a video so it reads as a deliberate stop-motion turntable
    // (every ~280ms = ~3.6fps). Gated by matchMedia so the timer is only
    // alive while the viewport is actually phone-width; it stops itself when
    // the user resizes up to tablet (where scroll then takes over).
    const phoneMQ      = window.matchMedia?.('(max-width: 767px)');
    const reduceMQ     = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const reduceMotion = !!reduceMQ?.matches;
    const SPIN_MS      = 280;
    let spinFrame = 0;
    let spinTimer = null;
    const tickSpin = () => {
      spinFrame = (spinFrame + 1) % FRAME_COUNT;
      heroCapyImg.src = frames[spinFrame].src;
    };
    const startSpin = () => {
      if (spinTimer || reduceMotion) return;
      spinTimer = setInterval(tickSpin, SPIN_MS);
    };
    const stopSpin = () => {
      if (!spinTimer) return;
      clearInterval(spinTimer);
      spinTimer = null;
    };

    // IntersectionObserver pauses the timer when the hero is off-screen.
    let isIntersecting = true;
    if (heroSection && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          isIntersecting = e.isIntersecting;
          if (phoneMQ?.matches) {
            isIntersecting ? startSpin() : stopSpin();
          }
        });
      }, { rootMargin: '120px' });
      io.observe(heroSection);
    }

    // matchMedia listener flips the timer on/off when the viewport crosses
    // the 768px line (resize / device rotate).
    const applyMode = () => {
      if (phoneMQ?.matches && isIntersecting) startSpin();
      else                                   stopSpin();
    };
    applyMode();
    phoneMQ?.addEventListener?.('change', applyMode);

    // ----- Tablet/desktop scroll-jack -----
    if (heroLine && heroSection && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      const TEXT_END_FRACTION = 0.75;
      const travel = () => Math.max(0, heroLine.scrollWidth - window.innerWidth * TEXT_END_FRACTION);
      const capyStart = () => (window.innerWidth - heroCapy.offsetWidth) / 2 + 80;
      const capyEnd   = () => -(window.innerWidth / 2 + heroCapy.offsetWidth / 2 + 60);
      const TOTAL_ROTATIONS = 1.5; // spins across the whole scroll range

      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.set(heroCapy, { xPercent: -50, yPercent: -50, x: capyStart() });
        heroCapy.classList.add('is-ready');
        heroSection.classList.add('is-ready');

        const CAPY_DUR = 1.1;
        let lastFrame = -1;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroSection,
            start: 0,
            end: () => '+=' + (travel() * CAPY_DUR),
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              // Stepped frame swap driven by scroll progress (no blending).
              const idx = Math.floor((self.progress * TOTAL_ROTATIONS * FRAME_COUNT) % FRAME_COUNT);
              if (idx !== lastFrame) {
                heroCapyImg.src = frames[idx].src;
                lastFrame = idx;
              }
            }
          }
        });
        tl.to(heroLine, { x: () => -travel(), duration: 1, ease: 'none' }, 0);
        tl.fromTo(heroCapy,
          { x: () => capyStart() },
          { x: () => capyEnd(), duration: CAPY_DUR, ease: 'none' },
          0
        );

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh());
        }

        return () => {
          gsap.set([heroLine, heroCapy], { clearProps: 'transform' });
          heroCapyImg.src = frames[0].src;
          lastFrame = -1;
        };
      });
    }
  }

  // --- "What we build" cards: tap/click toggles the photo overlay ---
  // (hover + keyboard focus are handled in CSS; this adds touch + a pinned state)
  const buildCards = Array.from(document.querySelectorAll('.ent-card'));
  buildCards.forEach(card => {
    if (!card.querySelector('.ent-card__overlay')) return;
    const toggle = () => {
      const wasActive = card.classList.contains('is-active');
      buildCards.forEach(c => c.classList.remove('is-active'));
      if (!wasActive) card.classList.add('is-active');
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  // --- Capabilities deck: holographic tilt + foil that follow the cursor ---
  // CSS handles the foil layers + reduced-motion fallback; this feeds it the
  // pointer position. Desktop pointers only — touch devices keep static cards.
  const capCards = Array.from(document.querySelectorAll('.ent-cap-deck .ent-cap-card'));
  const fineHover  = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const tiltReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (capCards.length && fineHover && !tiltReduce) {
    const MAX = 10; // peak tilt in degrees at the card's edges
    capCards.forEach(card => {
      let raf = 0;
      const onMove = e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;   // 0 (left) .. 1 (right)
        const py = (e.clientY - r.top) / r.height;   // 0 (top)  .. 1 (bottom)
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          card.style.setProperty('--rx', ((py - 0.5) * 2 * MAX).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((0.5 - px) * 2 * MAX).toFixed(2) + 'deg');
          card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
      };
      const reset = () => {
        card.classList.remove('is-tilting');
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      };
      card.addEventListener('pointerenter', () => card.classList.add('is-tilting'));
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', reset);
    });
  }

  // --- Partner index cards: cursor-follow 3D tilt + lift ---
  // Home / enterprise route, section 06. Each card pivots up to 8° to follow
  // the cursor on hover via inline transform — overrides the CSS :hover
  // rule. Cleared on mouseleave so the resting nth-child tilt comes back.
  // CSS handles the stamp seal reveal + number badge ping; this only owns
  // the 3D tilt. Skipped on coarse/touch pointers and under reduced motion.
  const partnerCards = Array.from(document.querySelectorAll('.ent-partner'));
  const partnerFineHover  = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const partnerReduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (partnerCards.length && partnerFineHover && !partnerReduceMotion) {
    const MAX_TILT = 8;
    partnerCards.forEach(card => {
      let raf = 0;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - 0.5;   // -0.5 .. 0.5
        const py = (e.clientY - r.top)  / r.height - 0.5;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const rx = (-py * 2 * MAX_TILT).toFixed(2);
          const ry = ( px * 2 * MAX_TILT).toFixed(2);
          card.style.transform =
            `perspective(720px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(-3px, -5px, 0)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // --- About: paw-dot reveal ("Focus & How We Work") ---
  // Hover-driven open/close with click-toggle override:
  //   - mouseenter on side → opens card (+ CSS raises paw)
  //   - mouseleave from BOTH side and card → closes card
  //   - click dot → toggles. Click-to-close adds `is-suppress-raise`
  //     so the paw drops immediately even if the cursor stays put
  //     and the hover doesn't re-open the card.
  //   - mouseleave clears suppress so the next hover behaves normally.
  // Card is a DOM sibling of side (not a descendant), so a hover-count
  // pair on side+card prevents the card from closing while the mouse
  // is hovering the card itself.
  const mascotStage = document.getElementById('ent-mascot-stage');
  if (mascotStage && document.documentElement.dataset.theme === 'enterprise') {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasGsap = typeof window.gsap !== 'undefined';
    const sides = Array.from(mascotStage.querySelectorAll('.ent-mascot-side'));

    // Quick rotation perturbation on the mascot — for the click-open
    // feedback only (not on hover-open, which would loop too often).
    const waveMascot = (mascot, side) => {
      if (!mascot || !hasGsap || reduceMotion) return;
      const cs = getComputedStyle(mascot);
      const baseTilt = parseFloat(cs.getPropertyValue('--base-tilt')) || 0;
      const dir = side.classList.contains('ent-mascot-side--left') ? -1 : 1;
      mascot.style.animationPlayState = 'paused';
      const restore = () => {
        gsap.set(mascot, { clearProps: 'rotate,transform' });
        mascot.style.animationPlayState = '';
      };
      const tl = gsap.timeline({ onComplete: restore });
      tl.set(mascot, { rotate: baseTilt });
      tl.to(mascot, { rotate: baseTilt + 6 * dir, duration: 0.09, ease: 'sine.inOut' });
      tl.to(mascot, { rotate: baseTilt - 4 * dir, duration: 0.09, ease: 'sine.inOut' });
      tl.to(mascot, { rotate: baseTilt + 4 * dir, duration: 0.09, ease: 'sine.inOut' });
      tl.to(mascot, { rotate: baseTilt,           duration: 0.09, ease: 'sine.inOut' });
    };

    const openCard = (side, dot, card) => {
      if (side.classList.contains('is-card-open')) return;
      side.classList.add('is-card-open');
      side.classList.remove('is-hint-on');
      dot.setAttribute('aria-expanded', 'true');
      const fromX = side.classList.contains('ent-mascot-side--right') ? 220 : -220;

      if (hasGsap && !reduceMotion) {
        gsap.set(card, { x: fromX, opacity: 0 });
      } else {
        card.style.transition = 'none';
        card.style.opacity = '0';
      }
      card.hidden = false;

      requestAnimationFrame(() => {
        if (hasGsap && !reduceMotion) {
          gsap.to(card, {
            x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)',
            clearProps: 'transform',
          });
        } else {
          card.style.transition = 'opacity 220ms ease';
          card.style.opacity = '1';
        }
      });
    };

    const closeCard = (side, dot, card) => {
      if (!side.classList.contains('is-card-open')) return;
      side.classList.remove('is-card-open');
      dot.setAttribute('aria-expanded', 'false');
      const toX = side.classList.contains('ent-mascot-side--right') ? 220 : -220;
      if (hasGsap && !reduceMotion) {
        gsap.to(card, {
          x: toX, opacity: 0, duration: 0.3, ease: 'power2.in',
          onComplete: () => {
            card.hidden = true;
            gsap.set(card, { clearProps: 'all' });
          },
        });
      } else {
        card.style.opacity = '0';
        setTimeout(() => { card.hidden = true; card.style.cssText = ''; }, 220);
      }
    };

    sides.forEach((side) => {
      const dot = side.querySelector('.ent-paw-dot');
      if (!dot) return;
      const cardId = dot.getAttribute('aria-controls');
      const card = cardId ? document.getElementById(cardId) : null;
      if (!card) return;
      const mascot = side.querySelector('.ent-mascot');

      // Per-side state:
      //   pinned     — true while the card is committed open via click.
      //                Pinned overrides hover/leave; only another click
      //                (or card click / Escape) can close.
      //   hoverCount — combined side+card hover counter, so crossing
      //                between the two doesn't trigger a stray close.
      //   closeTimer — debounce so the count can settle on crossover.
      let pinned = false;
      let hoverCount = 0;
      let closeTimer = null;
      const cancelCloseTimer = () => {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      };
      const scheduleClose = () => {
        cancelCloseTimer();
        closeTimer = setTimeout(() => {
          if (hoverCount === 0) {
            // Mouse fully left the zone → suppress always lifts.
            side.classList.remove('is-suppress-raise');
            // Only hover-driven opens close on leave; pinned stays.
            if (!pinned) closeCard(side, dot, card);
          }
        }, 60);
      };

      side.addEventListener('mouseenter', () => {
        hoverCount++;
        cancelCloseTimer();
        if (!pinned && !side.classList.contains('is-suppress-raise')) {
          openCard(side, dot, card);
        }
      });
      side.addEventListener('mouseleave', () => {
        hoverCount = Math.max(0, hoverCount - 1);
        scheduleClose();
      });
      card.addEventListener('mouseenter', () => {
        hoverCount++;
        cancelCloseTimer();
      });
      card.addEventListener('mouseleave', () => {
        hoverCount = Math.max(0, hoverCount - 1);
        scheduleClose();
      });

      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pinned) {
          // Pinned → close + unpin + suppress (so the still-hovering
          // cursor doesn't immediately re-open via hover).
          pinned = false;
          side.classList.add('is-suppress-raise');
          dot.blur();
          closeCard(side, dot, card);
        } else if (side.classList.contains('is-card-open')) {
          // Hover-open → click latches it pinned. Wave for feedback.
          pinned = true;
          waveMascot(mascot, side);
        } else {
          // Closed → open + pin.
          pinned = true;
          side.classList.remove('is-suppress-raise');
          openCard(side, dot, card);
          waveMascot(mascot, side);
        }
      });

      // Clicking the card dismisses (same as click-to-close on dot).
      card.addEventListener('click', () => {
        if (!side.classList.contains('is-card-open')) return;
        pinned = false;
        side.classList.add('is-suppress-raise');
        closeCard(side, dot, card);
      });

      // Expose the pin reset for the document-level Escape handler.
      side._unpinFn = () => { pinned = false; };
    });

    // Hint labels appear after a 2s delay on idle sides.
    setTimeout(() => {
      sides.forEach((s) => {
        if (!s.classList.contains('is-card-open')) s.classList.add('is-hint-on');
      });
    }, 2000);

    // Escape closes any open card — also unpins so hover behaves
    // normally on the next mouse entry.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      sides.forEach((side) => {
        if (!side.classList.contains('is-card-open')) return;
        if (side._unpinFn) side._unpinFn();
        side.classList.add('is-suppress-raise');
        const dot = side.querySelector('.ent-paw-dot');
        const cardId = dot && dot.getAttribute('aria-controls');
        const card = cardId ? document.getElementById(cardId) : null;
        if (dot && card) closeCard(side, dot, card);
      });
    });
  }

  // --- Back to top ---
  const toTop = document.getElementById('to-top');
  if (toTop) {
    const onScrollTop = () => {
      if (window.scrollY > 600) toTop.classList.add('is-visible');
      else toTop.classList.remove('is-visible');
    };
    window.addEventListener('scroll', onScrollTop, { passive: true });
    onScrollTop();
    toTop.addEventListener('click', () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
