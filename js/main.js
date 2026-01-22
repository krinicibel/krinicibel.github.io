import '../styles.css';
import './menu.js';
import './lightbox.js';
import faviconUrl from '../favicon.svg';

//  favicon по URL, который Vite разрешит и захеширует в сборке
if (typeof document !== 'undefined') {
  const setFavicon = () => {
    const existing = document.querySelector('link[rel="icon"]');
    if (existing) {
      existing.href = faviconUrl;
      existing.type = 'image/svg+xml';
    } else {
      const l = document.createElement('link');
      l.rel = 'icon';
      l.href = faviconUrl;
      l.type = 'image/svg+xml';
      document.head.appendChild(l);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setFavicon);
  } else {
    setFavicon();
  }
}

// экспорт пустой объект для явного ESM-модуля (необязательно)
export {};
