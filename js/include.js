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
          if (oldScript.src) {
            script.src = oldScript.src;
            // Вставляем скрипт без defer/async, чтобы он выполнялся как можно скорее в нужном порядке
            script.async = false;
            script.defer = false;
          } else {
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
