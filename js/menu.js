export function initMenu() {
  // compute prefix helper
  function computePrefix() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const isFile =
      pathParts.length === 0 || /\.[a-zA-Z0-9]+$/.test(pathParts[pathParts.length - 1]);
    const depth = isFile ? Math.max(0, pathParts.length - 1) : pathParts.length;
    return depth === 0 ? '' : '../'.repeat(depth);
  }

  const prefix = computePrefix();

  // If the header was server-rendered by Vite plugin, menu lists already exist.
  // Ensure mobile submenus have accessibility attributes and mark active links.
  document.querySelectorAll('.mobile-submenu').forEach((ul) => {
    if (!ul.hasAttribute('aria-hidden')) ul.setAttribute('aria-hidden', 'true');
  });

  function normalizePath(path) {
    if (!path) return '/index.html';
    return path === '/' ? '/index.html' : path;
  }

  function markActiveLinks() {
    const normLocation = normalizePath(location.pathname);
    document.querySelectorAll('.main-menu a, .mobile-menu a').forEach((link) => {
      try {
        const linkUrl = new URL(link.getAttribute('href') || '', location.href);
        const linkPath = normalizePath(linkUrl.pathname);
        if (linkPath === normLocation) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('is-active');
        } else {
          link.removeAttribute('aria-current');
          link.classList.remove('is-active');
        }
      } catch (e) {}
    });
  }

  // Run once on init
  markActiveLinks();

  // ==========================
  // Mobile Menu
  // ==========================
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const body = document.body;
  const header = document.querySelector('.site-header');

  let savedScrollPosition = 0;

  // Функция закрытия меню
  function closeMenu() {
    if (!burger || !mobileNav) return;

    burger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    body.classList.remove('no-scroll');

    body.style.top = '';
    body.style.position = '';
    window.scrollTo(0, savedScrollPosition);
  }

  function openMenu() {
    if (!burger || !mobileNav) return;

    savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    burger.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');

    body.style.position = 'fixed';
    body.style.top = `-${savedScrollPosition}px`;
    body.style.width = '100%';
  }

  burger?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = burger.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay?.addEventListener('click', closeMenu);

  document.querySelectorAll('[data-close-menu]').forEach((el) => {
    el.addEventListener('click', closeMenu);
  });

  mobileNav?.addEventListener('click', (e) => {
    const toggle = e.target.closest('.submenu-toggle');
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      const parentLi = toggle.closest('li');
      const submenu = parentLi?.querySelector('.mobile-submenu');

      if (!submenu) return;

      const newOpen = !isOpen;
      toggle.setAttribute('aria-expanded', newOpen ? 'true' : 'false');
      submenu.classList.toggle('open', newOpen);
      submenu.setAttribute('aria-hidden', newOpen ? 'false' : 'true');
      return;
    }

    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');

      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        e.stopPropagation();

        const targetId = href.substring(1);

        const targetElement =
          document.getElementById(targetId) ||
          document.querySelector(`a[name="${targetId}"]`) ||
          document.querySelector(`[name="${targetId}"]`);

        closeMenu();

        if (targetElement) {
          setTimeout(() => {
            const rect = targetElement.getBoundingClientRect();
            const absoluteTop = rect.top + window.pageYOffset;
            const headerHeight = header?.offsetHeight || 0;

            window.scrollTo({
              top: absoluteTop - headerHeight - 20,
              behavior: 'smooth',
            });
          }, 50);
        }
      } else if (href && href !== '#' && !href.startsWith('javascript:')) {
        closeMenu();
      } else if (href === '#') {
        e.preventDefault();
      }
    }
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav?.classList.contains('open')) {
      closeMenu();
    }
  });

  // Закрытие при ресайзе на десктоп
  let resizeTimer;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 992 && mobileNav?.classList.contains('open')) {
          closeMenu();
        }
      }, 100);
    },
    { passive: true }
  );

  if (header) {
    let ticking = false;
    let scrolledState = header.classList.contains('header-scrolled');
    const ADD_THRESHOLD = 60;
    const REMOVE_THRESHOLD = 40;

    const initScroll = window.pageYOffset || 0;
    if (initScroll > ADD_THRESHOLD && !scrolledState) {
      header.classList.add('header-scrolled');
      scrolledState = true;
    }

    window.addEventListener(
      'scroll',
      () => {
        const current = window.pageYOffset || 0;
        if (!ticking) {
          window.requestAnimationFrame(() => {
            if (current > ADD_THRESHOLD && !scrolledState) {
              header.classList.add('header-scrolled');
              scrolledState = true;
            } else if (current < REMOVE_THRESHOLD && scrolledState) {
              header.classList.remove('header-scrolled');
              scrolledState = false;
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  document.querySelectorAll('.catalog-table').forEach((table) => {
    if (!table.querySelector('colgroup')) {
      const colgroup = document.createElement('colgroup');
      colgroup.innerHTML = '<col><col><col>';
      table.insertBefore(colgroup, table.firstChild);
    }

    if (!table.querySelector('thead')) {
      const tbody = table.querySelector('tbody');
      if (tbody) {
        const thead = document.createElement('thead');
        thead.innerHTML = `
          <tr>
            <th>Название</th>
            <th>Населённый пункт</th>
            <th>Координаты</th>
          </tr>
        `;
        table.insertBefore(thead, tbody);
      }
    }

    const labels = ['Название', 'Место', 'Координаты'];
    table.querySelectorAll('tbody tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (labels[index] && !cell.hasAttribute('data-label')) {
          cell.setAttribute('data-label', labels[index]);
        }
      });
    });

    if (!table.parentElement.classList.contains('table-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });

  console.log('Menu.js loaded:', {
    burger: !!document.querySelector('.burger'),
    mobileNav: !!document.querySelector('.mobile-nav'),
    overlay: !!document.querySelector('.mobile-nav-overlay'),
    tables: document.querySelectorAll('.catalog-table').length,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenu);
} else {
  initMenu();
}
