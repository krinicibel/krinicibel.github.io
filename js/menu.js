(function () {
  // Инициализация меню — выполняется сразу, если документ уже загружен
  function initMenu() {
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
    document.querySelectorAll('[data-close-menu]').forEach(el => {
      el.addEventListener('click', closeMenu);
    });

    // Submenu toggles (аккордеон)
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
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
    mobileNav?.querySelectorAll('a').forEach(link => {
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
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 992 && mobileNav?.classList.contains('open')) {
          closeMenu();
        }
      }, 100);
    }, { passive: true });

    // ==========================
    // Header scroll effect
    // ==========================
    if (header) {
      let lastScroll = 0;
      
      window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
          header.classList.add('header-scrolled');
        } else {
          header.classList.remove('header-scrolled');
        }
        
        lastScroll = currentScroll;
      }, { passive: true });
    }

    // ==========================
    // Catalog Tables Enhancement
    // ==========================
    document.querySelectorAll('.catalog-table').forEach(table => {
      
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
      
      table.querySelectorAll('tbody tr').forEach(row => {
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
      tables: document.querySelectorAll('.catalog-table').length
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
  } else {
    initMenu();
  }
})();