(function () {
  const IMAGE_RE = /\.(jpe?g|png|gif|webp|jfif|svg|bmp)$/i;
  let currentGroup = [];
  let currentIndex = 0;

  function createLightbox() {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Закрыть">×</button>
      <button class="lightbox__prev" aria-label="Предыдущая">‹</button>
      <img alt="" tabindex="0" />
      <button class="lightbox__next" aria-label="Следующая">›</button>
      <div class="lightbox__caption" aria-hidden="true"></div>
    `;
    document.body.appendChild(lb);

    lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox__prev').addEventListener('click', showPrev);
    lb.querySelector('.lightbox__next').addEventListener('click', showNext);
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });

    return lb;
  }

  function openLightbox(items, index = 0) {
    let lb = document.querySelector('.lightbox');
    if (!lb) lb = createLightbox();
    currentGroup = items || [];
    currentIndex = index;
    updateLightbox();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lb.querySelector('img')?.focus();
  }

  function updateLightbox() {
    const lb = document.querySelector('.lightbox');
    if (!lb) return;
    const img = lb.querySelector('img');
    const caption = lb.querySelector('.lightbox__caption');
    const src = currentGroup[currentIndex];
    img.src = src;
    const meta = currentGroup._meta && currentGroup._meta[currentIndex];
    const alt =
      meta?.tagName === 'IMG'
        ? meta.alt || ''
        : meta?.querySelector?.('img')?.alt || meta?.alt || '';
    img.alt = alt || '';
    caption.textContent = alt || '';
    const showNav = currentGroup.length > 1;
    lb.querySelector('.lightbox__prev').style.display = showNav ? 'flex' : 'none';
    lb.querySelector('.lightbox__next').style.display = showNav ? 'flex' : 'none';
  }

  function closeLightbox() {
    const lb = document.querySelector('.lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showNext() {
    if (!currentGroup.length) return;
    currentIndex = (currentIndex + 1) % currentGroup.length;
    updateLightbox();
  }
  function showPrev() {
    if (!currentGroup.length) return;
    currentIndex = (currentIndex - 1 + currentGroup.length) % currentGroup.length;
    updateLightbox();
  }

  function collectGallery(el) {
    if (!el) return [el];
    const galleryId = el.dataset.gallery;
    if (galleryId) {
      const nodes = Array.from(document.querySelectorAll(`[data-gallery="${galleryId}"]`));
      return nodes;
    }
    const parentGallery = el.closest('.gallery');
    if (parentGallery) {
      const anchors = Array.from(parentGallery.querySelectorAll('a')).filter(
        (a) => IMAGE_RE.test(a.getAttribute('href') || '') || a.querySelector('img')
      );
      if (anchors.length) return anchors;
    }
    const parent = el.closest('p') || el.parentElement;
    if (parent) {
      const anchors = Array.from(parent.querySelectorAll('a')).filter((a) =>
        IMAGE_RE.test(a.getAttribute('href') || '')
      );
      if (anchors.length) return anchors;
      const imgs = Array.from(parent.querySelectorAll('img'));
      if (imgs.length) return imgs;
    }
    return [el];
  }

  function handleDocumentClick(e) {
    const a = e.target.closest('a');
    if (a && IMAGE_RE.test(a.getAttribute('href') || '')) {
      e.preventDefault();
      const nodes = collectGallery(a);
      const items = [];
      items._meta = [];
      nodes.forEach((node) => {
        if (node.tagName === 'A') {
          items.push(node.getAttribute('href'));
          items._meta.push(node);
        } else if (node.tagName === 'IMG') {
          items.push(node.getAttribute('src'));
          items._meta.push(node);
        }
      });
      const idx = nodes.indexOf(a);
      openLightbox(items, idx === -1 ? 0 : idx);
      return;
    }

    const img = e.target.closest('img');
    if (img && !img.closest('a')) {
      const nodes = collectGallery(img);
      const items = [];
      items._meta = [];
      nodes.forEach((node) => {
        if (node.tagName === 'A') {
          items.push(node.getAttribute('href'));
          items._meta.push(node);
        } else if (node.tagName === 'IMG') {
          items.push(node.getAttribute('src'));
          items._meta.push(node);
        }
      });
      const idx = nodes.indexOf(img);
      openLightbox(items, idx === -1 ? 0 : idx);
      return;
    }
  }

  function handleKeydown(e) {
    const lb = document.querySelector('.lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  }

  // Auto-detect groups for paragraphs/divs with multiple images and mark them for styling
  function annotateGalleries() {
    let gid = 0;
    const containers = document.querySelectorAll('p, div');
    containers.forEach((container) => {
      const anchors = Array.from(container.querySelectorAll('a')).filter((a) =>
        IMAGE_RE.test(a.getAttribute('href') || '')
      );
      const imgs = Array.from(container.querySelectorAll('img')).filter((img) => !img.closest('a'));
      if (anchors.length + imgs.length > 1) {
        gid++;
        container.classList.add('gallery');
        const galleryId = 'gallery-' + gid;
        anchors.forEach((a) => (a.dataset.gallery = galleryId));
        imgs.forEach((img) => (img.dataset.gallery = galleryId));
      }
    });
  }

  function init() {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeydown);
    annotateGalleries();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
