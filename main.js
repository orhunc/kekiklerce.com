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
  var entryEls = Array.from(navItems).map(function(item) {
    return document.getElementById(item.getAttribute('data-entry'));
  }).filter(Boolean);
  if (!mainEl || entryEls.length === 0) return;

  var entryIds = entryEls.map(function(el) { return el.id; });

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
      var el = document.getElementById(id);
      if (!el) return;
      var top = el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + scrollTop;
      if (top <= threshold) best = id;
    });
    updateActive(best);
  });

  // Smooth scroll for same-page anchor clicks
  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      var href = this.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      e.preventDefault();
      var id = this.getAttribute('data-entry');
      var el = document.getElementById(id);
      if (!el) return;
      isScrollingTo = true;
      var top = el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + mainEl.scrollTop - 64;
      mainEl.scrollTo({ top: top, behavior: 'smooth' });
      updateActive(id);
      history.replaceState(null, '', '#' + id);
      setTimeout(function() { isScrollingTo = false; }, 700);
    });
  });

  // On page load: if URL has a hash, scroll to it
  var hash = window.location.hash;
  if (hash) {
    setTimeout(function() {
      var id = hash.replace('#', '');
      var el = document.getElementById(id);
      if (!el) return;
      isScrollingTo = true;
      var top = el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + mainEl.scrollTop - 64;
      mainEl.scrollTo({ top: top, behavior: 'smooth' });
      updateActive(id);
      setTimeout(function() { isScrollingTo = false; }, 700);
    }, 150);
  }
}

/* ── VIDEOS ── */
function initLazyVideos() {
  var iframes = document.querySelectorAll('iframe[data-src]');
  if (!iframes.length) return;

  iframes.forEach(function(iframe) {
    var container = iframe.parentElement;
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    var loader = document.createElement('div');
    loader.className = 'video-loading';
    container.insertBefore(loader, iframe);
    iframe.addEventListener('load', function() {
      loader.style.opacity = '0';
      setTimeout(function() { loader.remove(); }, 400);
      if (iframe.dataset.src && iframe.dataset.src.indexOf('background=1') !== -1 && window.Vimeo) {
        var player = new Vimeo.Player(iframe);
        player.setQuality('480p').catch(function() {});
      }
    }, { once: true });
    iframe.src = iframe.dataset.src;
  });
}

/* ── VIDEO EXPAND ── */
function initVideoExpand() {
  // Create overlay
  var overlay = document.createElement('div');
  overlay.id = 'video-overlay';
  var closeBtn = document.createElement('button');
  closeBtn.id = 'video-overlay-close';
  closeBtn.innerHTML = '&times;';
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  var activeMedia = null;
  var originParent = null;
  var originNext = null;
  var originStyle = null;

  function close() {
    if (!activeMedia || !originParent) { overlay.classList.remove('open'); return; }
    var media = activeMedia, parent = originParent, next = originNext, style = originStyle;
    activeMedia = originParent = originNext = originStyle = null;
    media.removeAttribute('style');
    if (style) media.setAttribute('style', style);
    if (next) parent.insertBefore(media, next);
    else parent.appendChild(media);
    overlay.classList.remove('open');
  }

  closeBtn.addEventListener('click', function(e) { e.stopPropagation(); close(); });
  overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  // Inject expand buttons into autoplay video containers
  document.querySelectorAll('.autoplay-wrap').forEach(function(container) {
    var media = container.querySelector('video');
    if (!media) return;
    var btn = document.createElement('button');
    btn.className = 'video-expand-btn';
    btn.title = 'Expand';
    btn.textContent = '\u26F6';
    container.appendChild(btn);

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      activeMedia = media;
      originParent = container;
      originNext = media.nextSibling;
      originStyle = media.getAttribute('style');
      media.removeAttribute('style');
      overlay.appendChild(media);
      overlay.classList.add('open');
    });
  });
}

/* ── MOBILE MENU ── */
function initMobileMenu() {
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  var btn = document.createElement('button');
  btn.id = 'mobile-menu-btn';
  btn.innerHTML = '&#9776;';
  document.body.appendChild(btn);

  var backdrop = document.createElement('div');
  backdrop.id = 'mobile-backdrop';
  document.body.appendChild(backdrop);

  function open() {
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('visible');
  }
  function close() {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('visible');
  }

  btn.addEventListener('click', function() {
    sidebar.classList.contains('mobile-open') ? close() : open();
  });
  backdrop.addEventListener('click', close);

  // Close sidebar when a nav link is clicked
  sidebar.addEventListener('click', function(e) {
    if (e.target.closest('a')) close();
  });
}

/* ── CUSTOM VIDEO CONTROLS ── */
function initCustomVideoControls() {
  document.querySelectorAll('.custom-video-wrap').forEach(function(wrap) {
    var video = wrap.querySelector('video');
    var playBtn = wrap.querySelector('.cvc-play');
    var muteBtn = wrap.querySelector('.cvc-mute');
    var expandBtn = wrap.querySelector('.cvc-expand');
    if (!video || !playBtn || !muteBtn) return;

    video.muted = false;
    muteBtn.textContent = '🔊';

    playBtn.addEventListener('click', function() {
      if (video.paused) { video.play(); playBtn.textContent = '⏸'; }
      else { video.pause(); playBtn.textContent = '▶'; }
    });

    muteBtn.addEventListener('click', function() {
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? '🔇' : '🔊';
    });

    if (expandBtn) {
      expandBtn.addEventListener('click', function() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else {
          if (wrap.requestFullscreen) wrap.requestFullscreen();
          else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
        }
      });
    }
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function() {
  initGalleries();
  initLightbox();
  initLazyVideos();
  initVideoExpand();
  initCustomVideoControls();
  initScrollSpy();
  initMobileMenu();
});
