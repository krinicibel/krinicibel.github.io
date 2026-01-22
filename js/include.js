document.addEventListener('DOMContentLoaded', () => {
  const includes = document.querySelectorAll('[data-include]');

  // Обрабатываем include'ы последовательно (в порядке DOM), чтобы гарантировать вставку header до запуска скриптов footer
  (async () => {
    for (const el of includes) {
      const url = el.getAttribute('data-include');
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch ' + url);
        const html = await res.text();
        el.innerHTML = html;

        // Execute scripts from included HTML (recreate them so they run)
        el.querySelectorAll('script').forEach((oldScript) => {
          const script = document.createElement('script');
          // Копируем все атрибуты оригинального <script> (type, defer, async, crossorigin и т.д.)
          Array.from(oldScript.attributes).forEach(({ name, value }) => {
            script.setAttribute(name, value);
          });

          if (!oldScript.src) {
            script.textContent = oldScript.textContent;
          }

          document.body.appendChild(script);
          oldScript.remove();
        });
      } catch (err) {
        console.error('Include error:', url, err);
      }
    }
  })();
});
