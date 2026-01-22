document.addEventListener('DOMContentLoaded', () => {
  function createLightbox() {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Закрыть">×</button>
      <img alt="" />
    `;
    document.body.appendChild(lb);
    lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    return lb;
  }

  function openLightbox(src, alt = '') {
    let lb = document.querySelector('.lightbox');
    if (!lb) lb = createLightbox();
    const img = lb.querySelector('img');
    img.src = src;
    img.alt = alt;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    img.focus();
  }

  function closeLightbox() {
    const lb = document.querySelector('.lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    // Click on gallery link or on <a href="...image">
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (/\.(jpe?g|png|gif|webp|jfif)$/i.test(href)) {
      e.preventDefault();
      openLightbox(href, a.querySelector('img')?.alt || '');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
});