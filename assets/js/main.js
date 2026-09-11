(() => {
  const menuBtn = document.querySelector('.menu-btn');
  const drawer = document.querySelector('.mobile-drawer');
  const drawerLinks = document.querySelectorAll('.mobile-nav a, .mobile-drawer .btn');

  function closeMenu() {
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }

  menuBtn?.addEventListener('click', () => {
    const open = drawer?.classList.toggle('open');
    drawer?.setAttribute('aria-hidden', String(!open));
    menuBtn?.setAttribute('aria-expanded', String(Boolean(open)));
  });
  drawerLinks.forEach(link => link.addEventListener('click', closeMenu));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal').forEach((el, index) => {
    // Stagger only same-group content; leave major sections subtly paced.
    if (el.classList.contains('project-showcase-item')) {
      el.style.transitionDelay = `${Math.min(index * 70, 210)}ms`;
    }
    revealObserver.observe(el);
  });
})();

// Soft pointer-following aura, disabled on touch / reduced-motion devices.
(() => {
  const aura = document.querySelector('.cursor-aura');
  if (!aura || !window.matchMedia('(hover:hover) and (pointer:fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let x = tx, y = ty;
  let raf = 0;

  document.body.classList.add('has-pointer');

  const frame = () => {
    x += (tx - x) * 0.16;
    y += (ty - y) * 0.16;
    aura.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
    raf = requestAnimationFrame(frame);
  };

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => document.body.classList.remove('has-pointer'));
  window.addEventListener('mouseenter', () => document.body.classList.add('has-pointer'));
  raf = requestAnimationFrame(frame);
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
})();
