/* ============================================================
   A28 Global — Landing (Choose Your Sidekick)
   Auto-looping 8-frame turntable + intro boot animation.
   No scroll, no GSAP — vanilla.
   ============================================================ */

(() => {
  /* =========================================================
     INTRO BOOT (plays once per session before the landing)
     ========================================================= */
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

      const LINE_STAGGER = 480;
      const LINE_START = 420;
      lines.forEach((line, i) => {
        timers.push(setTimeout(() => line.classList.add('is-visible'), LINE_START + i * LINE_STAGGER));
      });

      const compileStart = LINE_START + lines.length * LINE_STAGGER + 520;
      timers.push(setTimeout(() => {
        introBoot.classList.add('is-compile');
        let p = 0;
        pctTimer = setInterval(() => {
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

  /* =========================================================
     TURNTABLE (auto-loop, 8 frames, in sync across both sides)
     ========================================================= */
  const FRAME_COUNT = 8;
  const ENTERPRISE_DIR = 'assets/frames/enterprise';
  const GOVERNMENT_DIR = 'assets/frames/government';
  const FRAME_EXT = 'webp';

  // 0001.png … 0008.png
  const buildUrls = (dir) =>
    Array.from({ length: FRAME_COUNT }, (_, i) =>
      `${dir}/${String(i + 1).padStart(4, '0')}.${FRAME_EXT}`
    );

  const enterpriseUrls = buildUrls(ENTERPRISE_DIR);
  const governmentUrls = buildUrls(GOVERNMENT_DIR);

  // SVG placeholder for a missing frame (only used if a PNG fails to load)
  const placeholderFrame = (side, frameIndex) => {
    const angle = (frameIndex / FRAME_COUNT) * 360;
    const isGov = side === 'government';
    const bgA   = isGov ? '#1a1a1a' : '#F4EDE0';
    const bgB   = isGov ? '#0a0a0a' : '#E2D2B4';
    const ring  = isGov ? '#C9A961' : '#8B660D';
    const inkA  = isGov ? '#C9A961' : '#2C2418';
    const inkB  = isGov ? '#F0DDA8' : '#5A431A';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="${bgA}"/><stop offset="100%" stop-color="${bgB}"/>
        </radialGradient>
        <linearGradient id="fig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${inkA}"/><stop offset="100%" stop-color="${inkB}"/>
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="170" fill="url(#bg)"/>
      <circle cx="200" cy="200" r="148" fill="none" stroke="${ring}" stroke-opacity="0.32"/>
      <g transform="translate(200 200) rotate(${angle})">
        <ellipse cx="0" cy="78" rx="86" ry="10" fill="${isGov ? '#000' : '#5a431a'}" fill-opacity="0.22"/>
        <g transform="translate(-44 0)">
          <ellipse cx="0" cy="32" rx="32" ry="36" fill="url(#fig)"/>
          <circle cx="0" cy="-12" r="26" fill="url(#fig)"/>
          <circle cx="-8" cy="-14" r="3" fill="#fff"/>
          <circle cx="8" cy="-14" r="3" fill="#fff"/>
        </g>
        <g transform="translate(44 4)">
          <ellipse cx="0" cy="32" rx="24" ry="34" fill="url(#fig)"/>
          <circle cx="0" cy="-8" r="22" fill="url(#fig)"/>
          <circle cx="-7" cy="-10" r="2.5" fill="#fff"/>
          <circle cx="7" cy="-10" r="2.5" fill="#fff"/>
        </g>
      </g>
      <text x="200" y="380" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="2" fill="${ring}" fill-opacity="0.6">
        FRAME ${String(frameIndex + 1).padStart(2, '0')} · PLACEHOLDER
      </text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  // Probe each URL; if it fails, fall back to an SVG placeholder
  const resolveFrame = (url, side, idx) =>
    new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(url);
      img.onerror = () => resolve(placeholderFrame(side, idx));
      img.src = url;
    });

  const initTurntable = async () => {
    const eImg = document.getElementById('turntable-img-enterprise');
    const gImg = document.getElementById('turntable-img-government');
    if (!eImg || !gImg) return;

    const [enterprise, government] = await Promise.all([
      Promise.all(enterpriseUrls.map((u, i) => resolveFrame(u, 'enterprise', i))),
      Promise.all(governmentUrls.map((u, i) => resolveFrame(u, 'government', i))),
    ]);

    // Preload into browser cache
    const cache = [];
    [...enterprise, ...government].forEach((src) => {
      const im = new Image();
      im.decoding = 'async';
      im.src = src;
      cache.push(im);
    });
    await Promise.all(
      cache.map((im) =>
        im.complete ? Promise.resolve() : new Promise((r) => { im.onload = r; im.onerror = r; })
      )
    );

    // Initial pose — NOT frame 0 (which is front-facing on both sides).
    // Pick a starting frame that shows a more dynamic 3/4 angle.
    // Tweak INITIAL_FRAME (0–7) to change the default pose.
    // GOV_OFFSET keeps the two sides half a rotation apart so a different
    // mascot is facing the camera on each side at any given moment.
    const INITIAL_FRAME = 7;  // 0-indexed → 0008.png on enterprise side
    const GOV_OFFSET = 4;
    let frame = 0;
    const setFrame = (next) => {
      frame = ((next % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
      const govFrame = (frame + GOV_OFFSET) % FRAME_COUNT;
      eImg.src = enterprise[frame];
      gImg.src = government[govFrame];
    };
    setFrame(INITIAL_FRAME);

    // ---- Cursor-driven rotation ----
    // Horizontal cursor movement scrubs the turntable: rightward steps
    // forward (frame + 1), leftward steps back. Vertical movement is
    // ignored. PIXELS_PER_FRAME tunes sensitivity — lower = more
    // responsive. Skipped under prefers-reduced-motion so the mascots
    // hold their initial pose.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 769px)').matches;
    if (!reduceMotion) {
      const PIXELS_PER_FRAME = 120;
      let accum = 0;
      let lastX = null;
      window.addEventListener('mousemove', (e) => {
        if (lastX === null) { lastX = e.clientX; return; }
        accum += e.clientX - lastX;
        lastX = e.clientX;
        while (Math.abs(accum) >= PIXELS_PER_FRAME) {
          if (accum > 0) {
            setFrame(frame + 1);
            accum -= PIXELS_PER_FRAME;
          } else {
            setFrame(frame - 1);
            accum += PIXELS_PER_FRAME;
          }
        }
      });
    }

    // ---- Desktop wheel-driven rotation ----
    // Desktop layout pins to a single viewport (overflow:hidden), so wheel
    // events would otherwise scroll nothing. Capture them and translate into
    // discrete frame steps. Gated to ≥769px so mobile keeps native vertical
    // scrolling for the stacked layout.
    if (!reduceMotion && isDesktop) {
      const WHEEL_PIXELS_PER_FRAME = 220;
      let wheelAccum = 0;
      window.addEventListener('wheel', (e) => {
        e.preventDefault();
        wheelAccum += e.deltaY;
        while (Math.abs(wheelAccum) >= WHEEL_PIXELS_PER_FRAME) {
          if (wheelAccum > 0) {
            setFrame(frame + 1);
            wheelAccum -= WHEEL_PIXELS_PER_FRAME;
          } else {
            setFrame(frame - 1);
            wheelAccum += WHEEL_PIXELS_PER_FRAME;
          }
        }
      }, { passive: false });
    }

    // ---- Touch-device auto-rotation ----
    // Phones and tablets have no cursor to scrub and no wheel to scroll, so
    // the mascots would otherwise sit on a single frame. Spin them gently on
    // a timer. ~750ms/frame → a full 8-frame turn every ~6 seconds.
    // Detected via pointer/hover capability, not viewport width, so iPads in
    // landscape (which match the "desktop" layout) still auto-rotate.
    const isTouchPrimary = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (!reduceMotion && isTouchPrimary) {
      const FRAME_INTERVAL_MS = 500;
      let autoTimer = setInterval(() => setFrame(frame + 1), FRAME_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        } else if (!autoTimer) {
          autoTimer = setInterval(() => setFrame(frame + 1), FRAME_INTERVAL_MS);
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTurntable);
  } else {
    initTurntable();
  }

  /* =========================================================
     CTA click → persist route choice to sessionStorage
     The destination URLs already carry ?route=..., but this
     belt-and-suspenders guarantees the inner pages see the
     correct theme even if the param is stripped en route.
     ========================================================= */
  const persistRoute = (side) => {
    try { sessionStorage.setItem('a28-route', side); } catch (e) {}
  };
  const bindCta = () => {
    document.querySelectorAll('.split-side__cta').forEach((a) => {
      // Skip parked CTAs — they're interactive visually but shouldn't
      // persist a route or navigate anywhere.
      if (a.getAttribute('aria-disabled') === 'true') return;
      const side = a.closest('[data-side]')?.dataset.side;
      if (!side) return;
      a.addEventListener('click', () => persistRoute(side));
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCta);
  } else {
    bindCta();
  }
})();
