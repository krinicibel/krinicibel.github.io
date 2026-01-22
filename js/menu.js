// menu.js — модульная версия для Vite
import { menuData } from './menu-data.js';
// Инициализация меню — выполняется сразу при импорте/загрузке модуля
export function initMenu() {
  // compute prefix helper (соответствует include.js)
  function computePrefix() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const isFile = pathParts.length === 0 || /\.[a-zA-Z0-9]+$/.test(pathParts[pathParts.length - 1]);
    const depth = isFile ? Math.max(0, pathParts.length - 1) : pathParts.length;
    return depth === 0 ? '' : '../'.repeat(depth);
  }

  const prefix = computePrefix();

  // build menus from menuData (desktop + mobile)
  (function buildMenus() {
    const mainMenu = document.querySelector('.main-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mainMenu) mainMenu.innerHTML = '';
    if (mobileMenu) mobileMenu.innerHTML = '';

    let submenuIdCounter = 0;
    menuData.forEach((item) => {
      // Desktop
      if (mainMenu) {
        const li = document.createElement('li');
        if (item.items && item.items.length) {
          li.className = 'has-submenu';
          const a = document.createElement('a');
          a.href = `${prefix}index.html${item.anchor || ''}`;
          a.textContent = item.title;
          li.appendChild(a);

          const ul = document.createElement('ul');
          ul.className = 'submenu';
          item.items.forEach((sub) => {
            const sli = document.createElement('li');
            const sa = document.createElement('a');
            sa.href = `${prefix}index.html${sub.anchor || ''}`;
            sa.textContent = sub.title;
            sli.appendChild(sa);
            ul.appendChild(sli);
          });
          li.appendChild(ul);
        } else {
          const a = document.createElement('a');
          a.href = item.href ? `${prefix}${item.href}` : `${prefix}index.html${item.anchor || ''}`;
          a.textContent = item.title;
          li.appendChild(a);
        }
        mainMenu.appendChild(li);
      }

      // Mobile
      if (mobileMenu) {
        const mli = document.createElement('li');
        if (item.items && item.items.length) {
          const wrapper = document.createElement('div');
          wrapper.className = 'mobile-menu-item';
          const a = document.createElement('a');
          a.href = `${prefix}index.html${item.anchor || ''}`;
          a.textContent = item.title;
          wrapper.appendChild(a);

          const btn = document.createElement('button');
          btn.className = 'submenu-toggle';
          btn.type = 'button';
          btn.setAttribute('aria-expanded', 'false');
          const sid = `mobile-submenu-${++submenuIdCounter}`;
          btn.setAttribute('aria-controls', sid);
          btn.setAttribute('aria-label', 'Открыть подменю');
          btn.innerHTML = `<svg width=\"20\" height=\"20\"><use href=\"#icon-chevron\"></use></svg>`;
          wrapper.appendChild(btn);

          const sul = document.createElement('ul');
          sul.className = 'mobile-submenu';
          sul.id = sid;
          item.items.forEach((sub) => {
            const sli = document.createElement('li');
            const sa = document.createElement('a');
            sa.href = `${prefix}index.html${sub.anchor || ''}`;
            sa.textContent = sub.title;
            sli.appendChild(sa);
            sul.appendChild(sli);
          });

          mli.appendChild(wrapper);
          mli.appendChild(sul);
        } else {
          const wrapper = document.createElement('div');
          wrapper.className = 'mobile-menu-item';
          const a = document.createElement('a');
          a.href = `${prefix}${item.href || 'index.html'}`;
          a.textContent = item.title;
          wrapper.appendChild(a);
          mli.appendChild(wrapper);
        }
        mobileMenu.appendChild(mli);
      }
    });

    // Mark active links (normalize / and /index.html)
    function normalizePath(path) {
      if (!path) return '/index.html';
      return path === '/' ? '/index.html' : path;
    }
    const normLocation = normalizePath(location.pathname);
    document.querySelectorAll('.main-menu a, .mobile-menu a').forEach((link) => {
      try {
        const linkUrl = new URL(link.getAttribute('href'), location.href);
        const linkPath = normalizePath(linkUrl.pathname);
        if (linkPath === normLocation) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('is-active');
        }
      } catch (e) {}
    });
  })();

  // ==========================
  // Mobile Menu
  // ==========================
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const body = document.body;
  const header = document.querySelector('.site-header');

  // Функция закрытия меню
  function closeMenu() {
    if (!burger || !mobileNav) return;

    burger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    body.classList.remove('no-scroll');
  }

  // Функция открытия меню
  function openMenu() {
    if (!burger || !mobileNav) return;

    burger.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
  }

  // Toggle mobile menu по клику на бургер
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

  // Закрытие по клику на overlay (затемнённый фон)
  overlay?.addEventListener('click', closeMenu);

  // Также поддержка старого атрибута data-close-menu
  document.querySelectorAll('[data-close-menu]').forEach((el) => {
    el.addEventListener('click', closeMenu);
  });

  // Submenu toggles (аккордеон)
  document.querySelectorAll('.submenu-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      const parentLi = toggle.closest('li');
      const submenu = parentLi?.querySelector('.mobile-submenu');

      if (!submenu) return;

      toggle.setAttribute('aria-expanded', !isOpen);
      submenu.classList.toggle('open', !isOpen);
    });
  });

  // Закрытие меню при клике на ссылку
  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      // Небольшая задержка для плавности
      setTimeout(closeMenu, 100);
    });
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

  // ==========================
  // Header scroll effect (rAF + hysteresis to avoid flicker)
  // ==========================
  if (header) {
    let ticking = false;
    let scrolledState = header.classList.contains('header-scrolled');
    const ADD_THRESHOLD = 60; // scroll >= this -> add class
    const REMOVE_THRESHOLD = 40; // scroll < this -> remove class

    // Initialize based on current position
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

  // ==========================
  // Catalog Tables Enhancement
  // ==========================
  document.querySelectorAll('.catalog-table').forEach((table) => {
    // 1. Добавляем colgroup если нет
    if (!table.querySelector('colgroup')) {
      const colgroup = document.createElement('colgroup');
      colgroup.innerHTML = '<col><col><col>';
      table.insertBefore(colgroup, table.firstChild);
    }

    // 2. Добавляем thead если нет
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

    // 3. Добавляем data-label для мобильной версии
    const labels = ['Название', 'Место', 'Координаты'];

    table.querySelectorAll('tbody tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (labels[index] && !cell.hasAttribute('data-label')) {
          cell.setAttribute('data-label', labels[index]);
        }
      });
    });

    // 4. Оборачиваем в wrapper если нет
    if (!table.parentElement.classList.contains('table-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });

  // ==========================
  // Debug info (можно убрать в продакшене)
  // ==========================
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
