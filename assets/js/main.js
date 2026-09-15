/* XIIID AI Labs — interaction layer.
   A menu, a generated logo wall, scroll reveals, a cursor-trailing glow,
   and a video that only downloads once it is actually on screen. */

(() => {
  'use strict';

  /* ---- mobile menu ---------------------------------------------------- */
  const toggle = document.querySelector('.menu-toggle');
  const drawer = document.getElementById('drawer');

  if (toggle && drawer) {
    const setOpen = (open) => {
      drawer.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!drawer.classList.contains('is-open')));
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---- partner logo wall ---------------------------------------------- */
  const PARTNERS = [
    ['3dtada', '3Dtada'], ['ande', 'ANDE'], ['avikus', 'Avikus'],
    ['beosin', 'Beosin'], ['carrot-global', 'Carrot Global'],
    ['cg-education', 'CG Education'], ['dupont', 'DuPont'], ['eagle', 'Eagle'],
    ['foghashing', 'Foghashing'], ['hanwha-total', 'Hanwha Total'],
    ['hyundai-heavy', 'Hyundai Heavy Industries'], ['hyundai', 'Hyundai'],
    ['idb', 'IDB'], ['jyp', 'JYP'], ['keri-kr', 'KERI'],
    ['korea-expressway', 'Korea Expressway'], ['korea-gas', 'Korea Gas'],
    ['kt', 'KT'], ['kyungshin', 'Kyungshin'], ['mail', 'Mail'],
    ['phantom-ai', 'Phantom AI'], ['pulmuone', 'Pulmuone'], ['renova', 'Renova'],
    ['roboticslab', 'Robotics Lab'], ['samsung-card', 'Samsung Card'],
    ['samsung-display', 'Samsung Display'], ['samsung-sdi', 'Samsung SDI'],
    ['samsung-sds', 'Samsung SDS'], ['samsung', 'Samsung'], ['seoul', 'Seoul'],
    ['shopify', 'Shopify'], ['sk', 'SK'], ['theplan-g', 'The Plan G'],
    ['ybm', 'YBM'], ['yonsei', 'Yonsei University'], ['yuanta', 'Yuanta']
  ];

  const wall = document.querySelector('.logo-wall');
  if (wall) {
    wall.innerHTML = PARTNERS.map(([slug, name]) =>
      `<li><img src="assets/partners-ink/${slug}.png" alt="${name}" loading="lazy" decoding="async"></li>`
    ).join('');
  }

  /* ---- reveal on scroll -----------------------------------------------
     Elements are marked here rather than in the markup, so the HTML stays
     readable and the whole effect can be removed from one place. Items
     that share a parent are staggered; separate blocks are not.        */
  (() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const GROUPS = [
      '.section-head > *',
      '.ideas > div',
      '.partners-head, .logo-wall',
      '.project',
      '.step',
      '.loop-return-label',
      '.founder',
      '.news-item',
      '.app-card',
      '.community .sheet > *'
    ];

    const targets = [];
    GROUPS.forEach((selector) => {
      const found = Array.from(document.querySelectorAll(selector));
      const byParent = new Map();
      found.forEach((el) => {
        if (el.closest('.hero')) return;           // the hero has its own entrance
        const siblings = byParent.get(el.parentElement) || [];
        siblings.push(el);
        byParent.set(el.parentElement, siblings);
      });
      byParent.forEach((siblings) => {
        siblings.forEach((el, i) => {
          el.setAttribute('data-reveal', '');
          el.style.transitionDelay = `${Math.min(i * 80, 320)}ms`;
          targets.push(el);
        });
      });
    });

    const pending = new Set(targets);
    let io;

    const show = (el) => {
      el.classList.add('is-in');
      pending.delete(el);
      if (io) io.unobserve(el);
    };

    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) show(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });

    targets.forEach((el) => io.observe(el));

    // Safety net. Anchor jumps and fast scrolling can outrun the observer,
    // and an element that never reveals is an element the reader never sees.
    let queued = false;
    const sweep = () => {
      queued = false;
      if (!pending.size) {
        window.removeEventListener('scroll', onMove);
        window.removeEventListener('resize', onMove);
        return;
      }
      const limit = window.innerHeight * 0.94;
      Array.from(pending).forEach((el) => {
        // top above the fold line means it has been reached or passed;
        // an element jumped over must not stay invisible
        if (el.getBoundingClientRect().top < limit) show(el);
      });
    };
    const onMove = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sweep);
    };
    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove, { passive: true });
    onMove();
  })();

  /* ---- pointer glow ---------------------------------------------------
     Eases toward the cursor rather than tracking it exactly, so the wash
     trails a little behind the hand.

     Sections that paint their own background would cover the page-level
     glow, so each hosts a copy of its own. Those are positioned in
     section-local coordinates, which means a rect read per host per frame:
     all reads are batched before any write so the loop never thrashes
     layout.                                                            */
  (() => {
    const glow = document.querySelector('.pointer-glow');
    if (!glow) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hosts = Array.from(document.querySelectorAll('.glow-host'));

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let frame = 0;

    const EASE = 0.075;   // lower trails further behind

    const step = () => {
      x += (targetX - x) * EASE;
      y += (targetY - y) * EASE;

      // read every rect first, then write — never interleaved
      const offsets = hosts.map((host) => {
        const rect = host.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return null;
        return [Math.round(x - rect.left), Math.round(y - rect.top)];
      });

      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      hosts.forEach((host, i) => {
        const offset = offsets[i];
        if (!offset) return;
        host.style.setProperty('--gx', offset[0] + 'px');
        host.style.setProperty('--gy', offset[1] + 'px');
      });

      frame = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      document.body.classList.add('glow-on');
    }, { passive: true });

    document.addEventListener('mouseleave', () => document.body.classList.remove('glow-on'));
    document.addEventListener('mouseenter', () => document.body.classList.add('glow-on'));
    window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });

    frame = requestAnimationFrame(step);
  })();

  /* ---- hero video: attach the source only when it is in view ---------- */
  const video = document.querySelector('.hero-media video');
  if (video) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const load = () => {
      if (video.querySelector('source')) return;
      const source = document.createElement('source');
      source.src = 'assets/media/hero-video.mp4';
      source.type = 'video/mp4';
      video.appendChild(source);
      video.load();
      if (reduced) {
        video.removeAttribute('autoplay');
        video.pause();
      }
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          load();
          obs.disconnect();
        });
      }, { rootMargin: '200px' });
      io.observe(video);
    } else {
      load();
    }
  }
})();
