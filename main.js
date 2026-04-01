/* ── GALLERIES ── */
function initGalleries() {
  document.querySelectorAll('.gallery').forEach(function(gallery) {
    if (gallery.dataset.inited) return;
    gallery.dataset.inited = '1';

    var track = gallery.querySelector('.gallery-track');
    if (!track) return;

    // Wrap each image in a slide div to prevent bleed between images
    track.querySelectorAll('img').forEach(function(img) {
      var slide = document.createElement('div');
      slide.className = 'gallery-slide';
      img.parentNode.insertBefore(slide, img);
      slide.appendChild(img);
    });

    var total   = gallery.querySelectorAll('img').length;
    var footer  = gallery.nextElementSibling;
    if (!footer) return;

    var dots      = footer.querySelectorAll('.dot');
    var creditEl  = footer.querySelector('.photo-credit');
    var counterEl = footer.querySelector('.gallery-counter');
    var credits   = [];
    try { credits = JSON.parse(gallery.dataset.credits || '[]'); } catch(e) {}

    var current = 0, timer = null;

    if (total <= 1) {
      var dotsWrap = footer.querySelector('.gallery-dots');
      if (dotsWrap) dotsWrap.style.display = 'none';
    }

    function updateUI(i) {
      dots.forEach(function(d, idx) { d.classList.toggle('active', idx === i); });
      if (counterEl) counterEl.textContent = (i + 1) + ' / ' + total;
      if (creditEl && credits[i] !== undefined) creditEl.textContent = credits[i];
    }

    function goTo(i) {
      current = ((i % total) + total) % total;
      gallery.scrollTo({ left: gallery.clientWidth * current, behavior: 'smooth' });
      updateUI(current);
    }

    var isVisible = false, hovered = false;

    function startAuto() {
      stopAuto();
      if (isVisible && !hovered && total > 1) {
        timer = setInterval(function() { goTo(current + 1); }, 5000);
      }
    }
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    var observer = new IntersectionObserver(function(entries) {
      isVisible = entries[0].isIntersecting;
      if (isVisible) startAuto(); else stopAuto();
    }, { threshold: 0.4 });
    observer.observe(gallery);

    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() { goTo(i); startAuto(); });
    });

    gallery.addEventListener('scroll', function() {
      var idx = Math.round(gallery.scrollLeft / gallery.clientWidth);
      if (idx !== current) { current = idx; updateUI(idx); }
    });

    gallery.addEventListener('mouseenter', function() { hovered = true;  stopAuto(); });
    gallery.addEventListener('mouseleave', function() { hovered = false; startAuto(); });
    gallery.addEventListener('touchstart',  function() { hovered = true;  stopAuto(); });
    gallery.addEventListener('touchend', function() {
      setTimeout(function() {
        current = Math.round(gallery.scrollLeft / gallery.clientWidth);
        updateUI(current);
        hovered = false;
        startAuto();
      }, 600);
    });
  });
}

/* ── LIGHTBOX ── */
function initLightbox() {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var lbImg = document.getElementById('lightbox-img');

  document.getElementById('lightbox-close').addEventListener('click', function(e) {
    e.stopPropagation();
    lb.classList.remove('open');
  });
  lb.addEventListener('click', function() { lb.classList.remove('open'); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') lb.classList.remove('open');
  });
  document.addEventListener('click', function(e) {
    var img = e.target.closest('.gallery-track img, .drag-overlay img');
    if (!img) return;
    lbImg.src = img.src;
    lb.classList.add('open');
  });
}

/* ── SCROLL SPY + SMOOTH ANCHOR SCROLL ── */
function initScrollSpy() {
  var mainEl   = document.getElementById('main');
  var navItems = document.querySelectorAll('.nav-item[data-entry]');
  var entryEls = document.querySelectorAll('[id^="entry-"]');
  if (!mainEl || entryEls.length === 0) return;

  var entryIds = [];
  entryEls.forEach(function(el) { entryIds.push(el.id.replace('entry-', '')); });

  var isScrollingTo = false;

  function updateActive(id) {
    navItems.forEach(function(el) {
      el.classList.toggle('active', el.getAttribute('data-entry') === id);
    });
  }

  // Set first entry active on load
  updateActive(entryIds[0]);

  // Scroll spy
  mainEl.addEventListener('scroll', function() {
    if (isScrollingTo) return;
    var scrollTop  = mainEl.scrollTop;
    var threshold  = scrollTop + mainEl.clientHeight * 0.35;
    var best       = entryIds[0];
    entryIds.forEach(function(id) {
      var el = document.getElementById('entry-' + id);
      if (!el) return;
      var top = el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + scrollTop;
      if (top <= threshold) best = id;
    });
    updateActive(best);
  });

  // Smooth scroll for same-page anchor clicks (#entry-xxx)
  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      var href = this.getAttribute('href') || '';
      if (!href.startsWith('#')) return; // cross-page link — let browser navigate
      e.preventDefault();
      var id = this.getAttribute('data-entry');
      var el = document.getElementById('entry-' + id);
      if (!el) return;
      isScrollingTo = true;
      var top = el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + mainEl.scrollTop - 64;
      mainEl.scrollTo({ top: top, behavior: 'smooth' });
      updateActive(id);
      history.replaceState(null, '', '#entry-' + id);
      setTimeout(function() { isScrollingTo = false; }, 700);
    });
  });

  // On page load: if URL has #entry-xxx, scroll to it
  var hash = window.location.hash;
  if (hash && hash.startsWith('#entry-')) {
    setTimeout(function() {
      var id = hash.replace('#entry-', '');
      var el = document.getElementById('entry-' + id);
      if (!el) return;
      isScrollingTo = true;
      var top = el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + mainEl.scrollTop - 64;
      mainEl.scrollTo({ top: top, behavior: 'smooth' });
      updateActive(id);
      setTimeout(function() { isScrollingTo = false; }, 700);
    }, 150);
  }
}

/* ── LAZY VIDEOS ── */
function initLazyVideos() {
  var mainEl = document.getElementById('main');
  var iframes = document.querySelectorAll('iframe[data-src]');
  if (!iframes.length) return;

  iframes.forEach(function(iframe) {
    var container = iframe.parentElement;
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    var loader = document.createElement('div');
    loader.className = 'video-loading';
    container.insertBefore(loader, iframe);
  });

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var iframe = entry.target;
      observer.unobserve(iframe);
      iframe.src = iframe.dataset.src;
      iframe.addEventListener('load', function() {
        var loader = iframe.parentElement && iframe.parentElement.querySelector('.video-loading');
        if (!loader) return;
        loader.style.opacity = '0';
        setTimeout(function() { loader.remove(); }, 400);
      }, { once: true });
    });
  }, { root: mainEl || null, rootMargin: '300px' });

  iframes.forEach(function(iframe) { observer.observe(iframe); });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function() {
  initGalleries();
  initLightbox();
  initLazyVideos();
  initScrollSpy();
});
