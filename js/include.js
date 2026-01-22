document.addEventListener('DOMContentLoaded', () => {
  const includes = document.querySelectorAll('[data-include]');

  // Вычисляем относительный префикс от текущей страницы к корню
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const isFile = pathParts.length === 0 || /\.[a-zA-Z0-9]+$/.test(pathParts[pathParts.length - 1]);
  const depth = isFile ? Math.max(0, pathParts.length - 1) : pathParts.length;
  const prefix = depth === 0 ? '' : '../'.repeat(depth);

  // Обрабатываем include'ы последовательно (в порядке DOM), чтобы гарантировать вставку header до запуска скриптов footer
  (async () => {
    for (const el of includes) {
      const url = el.getAttribute('data-include');
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch ' + url);
        let html = await res.text();

        // Подправляем ссылки внутри включаемого фрагмента так, чтобы они были корректны из текущей директории
        // href="/" -> prefix + index.html
        html = html.replace(/href=(["'])\/\1/g, (m, q) => `href=${q}${prefix}index.html${q}`);

        // index/map/opv (с или без ведущего слэша, с optional hash)
        html = html.replace(
          /href=(["'])(?:\/)?index\.html(#[^"']*)?\1/gi,
          (m, q, hash) => `href=${q}${prefix}index.html${hash || ''}${q}`
        );
        html = html.replace(
          /href=(["'])(?:\/)?map\.html(#[^"']*)?\1/gi,
          (m, q, hash) => `href=${q}${prefix}map.html${hash || ''}${q}`
        );
        html = html.replace(
          /href=(["'])(?:\/)?opv\.html(#[^"']*)?\1/gi,
          (m, q, hash) => `href=${q}${prefix}opv.html${hash || ''}${q}`
        );

        // favicon -> use prefixed favicon.svg
        html = html.replace(
          /<link[^>]*href=["'][^"']*favicon\.(?:ico|svg)["'][^>]*>/gi,
          `<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />`
        );

        // Убираем встроенные теги <script src="/js/include.js"> и /js/main.js внутри включаемых фрагментов (мы сами инжектим main)
        html = html.replace(
          /<script[^>]*src=["'][^"']*(?:\/js\/include\.js|(?:\/?js\/main\.js))["'][^>]*>\s*<\/script>/gi,
          ''
        );

        el.innerHTML = html;

        // Execute scripts from included HTML (recreate them so they run), adjust relative src if necessary
        el.querySelectorAll('script').forEach((oldScript) => {
          const script = document.createElement('script');
          Array.from(oldScript.attributes).forEach(({ name, value }) => {
            script.setAttribute(name, value);
          });

          if (!oldScript.src) {
            script.textContent = oldScript.textContent;
          } else {
            // If the src is relative (no leading slash and not absolute URL), make it relative to the page
            const src = script.getAttribute('src') || '';
            if (!/^(https?:)?\/\//i.test(src) && !src.startsWith('/') && prefix) {
              script.setAttribute('src', prefix + src);
            }
          }

          document.body.appendChild(script);
          oldScript.remove();
        });
      } catch (err) {
        console.error('Include error:', url, err);
      }
    }

    // After processing all includes, ensure main.js is loaded in dev (avoid duplicates)
    const mainExists = document.querySelector(
      'script[src$="/js/main.js"], script[src$="js/main.js"]'
    );
    if (!mainExists) {
      if (!document.querySelector('script[data-injected-main]')) {
        const s = document.createElement('script');
        s.type = 'module';
        s.setAttribute('data-injected-main', '1');
        s.src = prefix + 'js/main.js';
        document.body.appendChild(s);
      }
    }
  })();
});
