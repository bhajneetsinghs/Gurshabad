// js/menu.js — click-to-toggle dropdown; positions panel under the trigger safely
(function () {
  'use strict';

  // ===== Utilities =====
  function q(root, sel) { return root.querySelector(sel); }
  function qa(root, sel) { return Array.from(root.querySelectorAll(sel)); }

  // Ensure a single invisible backdrop that only becomes clickable when active
  function ensureBackdrop() {
    let el = document.getElementById('menu-backdrop');
    if (!el) {
      el = document.createElement('div');
      el.id = 'menu-backdrop';
      el.className = 'menu-backdrop';
      document.body.appendChild(el);
    }
    return el;
  }

  const dropdowns = document.querySelectorAll('.dropdown');
  if (!dropdowns.length) return;

  const backdrop = ensureBackdrop();
  let currentOpen = null; // track the one open dropdown

  function closeDropdown(dd) {
    if (!dd) return;
    const btn   = q(dd, '.learning, .nav-pill, [data-dropdown-trigger]');
    const panel = q(dd, '.dropdown-content');

    dd.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (panel) {
      // Make inert for both pointer & a11y when closed
      panel.style.display = 'none';
      panel.style.pointerEvents = 'none';
      panel.style.opacity = '0';
      panel.style.visibility = 'hidden';
      panel.setAttribute('hidden', '');
    }

    if (currentOpen === dd) currentOpen = null;
    backdrop.classList.remove('active');
  }

  function positionPanel(btn, panel) {
    // Place panel centered under the button using CSS vars (consumed in CSS)
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const top = r.bottom + 10; // 10px gap below trigger
    panel.style.setProperty('--dd-left', cx + 'px');
    panel.style.setProperty('--dd-top',  top + 'px');
  }

  function openDropdown(dd) {
    const btn   = q(dd, '.learning, .nav-pill, [data-dropdown-trigger]');
    const panel = q(dd, '.dropdown-content');
    if (!btn || !panel) return;

    // Close any other open dropdown first
    if (currentOpen && currentOpen !== dd) closeDropdown(currentOpen);

    positionPanel(btn, panel);

    dd.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');

    panel.removeAttribute('hidden');
    panel.style.display       = 'block';
    panel.style.pointerEvents = 'auto';
    panel.style.opacity       = '1';
    panel.style.visibility    = 'visible';
    panel.style.zIndex        = '1300'; // keep above header, below overlays

    currentOpen = dd;

    // Defer to next frame so the element exists before we enable click-off
    requestAnimationFrame(() => backdrop.classList.add('active'));
  }

  function toggleDropdown(dd, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (dd.classList.contains('open')) {
      closeDropdown(dd);
    } else {
      openDropdown(dd);
    }
  }

  // Bind all dropdowns (idempotent)
  dropdowns.forEach(function (dd) {
    if (dd.__bound) return;

    const btn   = q(dd, '.learning, .nav-pill, [data-dropdown-trigger]');
    const panel = q(dd, '.dropdown-content');
    if (!btn || !panel) return;

    // A11y + prepare panel
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('role', 'menu');

    // Start fully closed & inert
    closeDropdown(dd);

    // Click on button toggles dropdown
    btn.addEventListener('click', function (e) { toggleDropdown(dd, e); });

    // Click outside closes (use capture to beat bubbling weirdness)
    document.addEventListener('click', function (e) {
      if (!currentOpen) return;
      const isInside = currentOpen.contains(e.target);
      if (!isInside) closeDropdown(currentOpen);
    }, true);

    // Backdrop click closes
    backdrop.addEventListener('click', function () { if (currentOpen) closeDropdown(currentOpen); });

    // Esc key closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && currentOpen) closeDropdown(currentOpen);
    });

    // Keep panel aligned on resize/scroll (throttled with rAF)
    let raf = 0;
    function onLayout() {
      if (!currentOpen) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        const b = q(currentOpen, '.learning, .nav-pill, [data-dropdown-trigger]');
        const p = q(currentOpen, '.dropdown-content');
        if (b && p) positionPanel(b, p);
      });
    }
    window.addEventListener('resize', onLayout, { passive: true });
    window.addEventListener('scroll',  onLayout, { passive: true });

    dd.__bound = true;
  });
})();