/* =========================================================
   Grevity — site behaviour
   Vanilla JS, no dependencies. All animation is transform/opacity.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     CONFIG — SITE OWNER: change these five values and nothing else.
     --------------------------------------------------------- */
  var CONFIG = {
    phone:        '+919426526594',        // tel: link (with country code, no spaces)
    phoneDisplay: '+91 94265 26594',      // shown on screen
    whatsapp:     '919426526594',         // wa.me number: country code + number, digits only
    waMessage:    'Hello Grevity! I would like a free demo of your billing and inventory software.',
    formEndpoint: ''                      // e.g. 'https://formspree.io/f/xxxx' or your webhook.
                                          // Leave '' to fall back to WhatsApp hand-off.
  };

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- i18n ---------------- */
  var DICT = window.GREVITY_GU || {};
  var lang = root.getAttribute('data-lang') === 'gu' ? 'gu' : 'en';

  function t(key, fallback) {
    return (lang === 'gu' && DICT[key]) ? DICT[key] : fallback;
  }

  function applyLang(next) {
    lang = next;
    root.setAttribute('data-lang', next);
    root.setAttribute('lang', next === 'gu' ? 'gu' : 'en');
    try { localStorage.setItem('grevity-lang', next); } catch (e) {}

    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      var val = next === 'gu' ? DICT[key] : el.dataset.en;
      if (val !== undefined) el.innerHTML = val;
    });

    $$('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (el.dataset.enPh === undefined) el.dataset.enPh = el.placeholder || '';
      var val = next === 'gu' ? DICT[key] : el.dataset.enPh;
      if (val !== undefined) el.placeholder = val;
    });

    var btn = $('#langToggle'), label = $('#langLabel');
    if (btn && label) {
      label.textContent = next === 'gu' ? 'EN' : 'ગુજ';
      btn.setAttribute('aria-label', next === 'gu' ? 'Switch language to English' : 'ભાષા ગુજરાતીમાં બદલો');
    }
    rotator.reset();
    priceUI.render();
  }

  /* ---------------- theme ---------------- */
  var themeMeta = document.createElement('meta');
  themeMeta.name = 'theme-color';
  document.head.appendChild(themeMeta);

  function applyTheme(next) {
    root.classList.toggle('dark', next === 'dark');
    themeMeta.content = next === 'dark' ? '#0b1020' : '#ffffff';
    var tb = $('#themeToggle');
    if (tb) tb.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    try { localStorage.setItem('grevity-theme', next); } catch (e) {}
  }

  /* ---------------- nav ---------------- */
  var nav = $('#nav');
  var burger = $('#burger');
  var navLinks = $('#navLinks');
  var progress = $('#scrollProgress');
  var mobar = $('#mobar');
  var hero = $('#hero');

  function closeMenu() {
    nav.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }
  if (navLinks) {
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  var spySections = ['problem', 'features', 'local', 'how', 'pricing', 'faq']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle('is-stuck', y > 12);

      if (progress) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? Math.min(y / h, 1) * 100 : 0) + '%';
      }

      if (mobar && hero) {
        mobar.classList.toggle('is-on', y > hero.offsetHeight * 0.55);
      }

      var mid = y + window.innerHeight * 0.35, current = null;
      spySections.forEach(function (s) { if (s.offsetTop <= mid) current = s.id; });
      $$('.nav__links a').forEach(function (a) {
        a.classList.toggle('is-current', current && a.getAttribute('href') === '#' + current);
      });

      revealVisible();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- scroll reveal ---------------- */
  var revealables = $$('.reveal');
  var io = null;

  // Safety net: anything already inside the viewport is revealed outright, so a
  // late layout shift (web fonts) can never leave a section stuck invisible.
  function revealVisible() {
    if (!revealables) return;                 // scroll can fire before init finishes
    revealables.forEach(function (el) {
      if (el.classList.contains('in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
        el.classList.add('in');
        if (io) io.unobserve(el);
      }
    });
  }

  if ('IntersectionObserver' in window && !reduced) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', revealVisible);
    window.addEventListener('resize', revealVisible);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(revealVisible);
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- animated counters ---------------- */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = (String(target).split('.')[1] || '').length;

    if (reduced) { el.textContent = prefix + target.toLocaleString('en-IN') + suffix; return; }

    var dur = 1600, start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix +
        (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-IN')) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------------- hero rotating text ---------------- */
  var rotator = (function () {
    var host = $('#rotator');
    var timer = null, idx = 0;

    function words() {
      if (!host) return [];
      var raw = host.getAttribute(lang === 'gu' ? 'data-words-gu' : 'data-words-en') || '';
      return raw.split('|').filter(Boolean);
    }

    // Lock the box to the longest phrase so the line never jumps mid-swap.
    function sizeToLongest() {
      var list = words();
      if (!host || !list.length) return;
      var probe = document.createElement('span');
      probe.className = 'rotator__word';
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      host.appendChild(probe);
      var w = 0;
      list.forEach(function (word) {
        probe.textContent = word;
        w = Math.max(w, probe.offsetWidth);
      });
      host.removeChild(probe);
      host.style.minWidth = Math.ceil(w) + 'px';
    }

    function show(i, animate) {
      var list = words();
      if (!list.length) return;

      // Only the word still in flow can be the one leaving.
      var current = host.querySelector('.rotator__word:not(.rotator__word--out)');
      var next = document.createElement('span');
      next.className = 'rotator__word';
      next.textContent = list[i % list.length];

      if (current && animate) {
        current.className = 'rotator__word rotator__word--out';   // drop --in, or it replays
        var drop = function () {
          if (current.parentNode) current.parentNode.removeChild(current);
        };
        current.addEventListener('animationend', drop);
        setTimeout(drop, 700);                                    // safety net
        next.classList.add('rotator__word--in');
        host.appendChild(next);
      } else {
        host.textContent = '';
        host.appendChild(next);
      }
    }

    function start() {
      stop();
      if (reduced) return;
      timer = setInterval(function () { idx++; show(idx, true); }, 2600);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function boot() {
      if (!host) return;
      show(idx, false);
      sizeToLongest();
      start();
    }

    if (host) {
      // Widths change when the web font lands or the viewport does.
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeToLongest);
      window.addEventListener('resize', sizeToLongest);
    }

    return { init: boot, reset: boot };
  })();

  /* ---------------- feature filter ---------------- */
  (function () {
    var chips = $$('.chip');
    var cards = $$('#featureGrid .feature');
    var empty = $('#featuresEmpty');
    if (!chips.length) return;

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-selected', String(on));
        });
        var shown = 0;
        cards.forEach(function (card) {
          var match = f === 'all' || card.getAttribute('data-cat') === f;
          card.classList.toggle('is-hidden', !match);
          if (match) {
            shown++;
            card.classList.remove('in');
            // restart the reveal transition for the newly shown set
            void card.offsetWidth;
            card.classList.add('in');
          }
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  })();

  /* ---------------- price rendering ----------------
     One plan: a first-year price and a yearly renewal. Both are formatted in
     Indian digit grouping from data-price / data-renew. */
  var priceUI = (function () {
    function render() {
      $$('[data-price], [data-renew]').forEach(function (el) {
        var v = el.getAttribute('data-price') || el.getAttribute('data-renew');
        if (v) el.textContent = '₹' + Number(v).toLocaleString('en-IN');
      });
    }
    return { init: render, render: render };
  })();

  /* ---------------- testimonials marquee ---------------- */
  (function () {
    var track = $('#marqueeTrack');
    if (!track || reduced) return;
    track.innerHTML += track.innerHTML;                    // seamless -50% loop
    Array.prototype.slice.call(track.children, track.children.length / 2)
      .forEach(function (clone) { clone.setAttribute('aria-hidden', 'true'); });
  })();

  /* ---------------- FAQ: one open at a time ---------------- */
  $$('.acc__item').forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      $$('.acc__item').forEach(function (other) { if (other !== item) other.open = false; });
    });
  });

  /* ---------------- contact links ---------------- */
  function waLink(extra) {
    var msg = CONFIG.waMessage + (extra ? '\n\n' + extra : '');
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
  }

  (function () {
    var href = waLink('');
    ['#waFab', '#mobarWa', '#waCtaBtn'].forEach(function (sel) {
      var el = $(sel); if (el) el.href = href;
    });
    $$('.js-phone').forEach(function (el) { el.textContent = CONFIG.phoneDisplay; });
    $$('a[href^="tel:"]').forEach(function (el) { el.href = 'tel:' + CONFIG.phone; });
  })();

  /* ---------------- demo form ---------------- */
  (function () {
    var form = $('#demoForm');
    if (!form) return;
    var status = $('#formStatus');
    var submit = $('#formSubmit');

    var rules = {
      fName:  function (v) { return v.trim().length >= 2 || t('err.name', 'Please enter your name.'); },
      fBiz:   function (v) { return v.trim().length >= 2 || t('err.biz', 'Please enter your business name.'); },
      fCity:  function (v) { return v.trim().length >= 2 || t('err.city', 'Please enter your city.'); },
      fPhone: function (v) { return /^[6-9]\d{9}$/.test(v.replace(/\D/g, '')) || t('err.phone', 'Enter a valid 10-digit mobile number.'); }
    };

    function validateField(id) {
      var input = document.getElementById(id);
      var out = rules[id](input.value);
      var slot = $('[data-err-for="' + id + '"]');
      var ok = out === true;
      input.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (slot) slot.textContent = ok ? '' : out;
      return ok;
    }

    Object.keys(rules).forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('blur', function () { validateField(id); });
      input.addEventListener('input', function () {
        if (input.classList.contains('is-invalid')) validateField(id);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = Object.keys(rules).every(function (id) { return validateField(id); });
      if (!ok) {
        status.className = 'form__status bad';
        status.textContent = t('form.fix', 'Please check the highlighted fields.');
        var bad = $('.is-invalid'); if (bad) bad.focus();
        return;
      }

      var data = {
        name: $('#fName').value.trim(),
        business: $('#fBiz').value.trim(),
        city: $('#fCity').value.trim(),
        phone: '+91' + $('#fPhone').value.replace(/\D/g, ''),
        type: $('#fType').value,
        language: lang,
        page: location.href,
        submittedAt: new Date().toISOString()
      };

      submit.classList.add('is-busy');
      status.className = 'form__status';
      status.textContent = t('form.sending', 'Sending…');

      var summary = 'Name: ' + data.name + '\nBusiness: ' + data.business +
                    '\nCity: ' + data.city + '\nPhone: ' + data.phone + '\nType: ' + data.type;

      function done() {
        submit.classList.remove('is-busy');
        status.className = 'form__status ok';
        status.textContent = t('form.thanks', 'Thank you! We will call you within one working day.');
        form.reset();
      }

      if (!CONFIG.formEndpoint) {
        // No backend configured: hand the enquiry over to WhatsApp so nothing is lost.
        window.open(waLink(summary), '_blank', 'noopener');
        done();
        return;
      }

      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status ' + res.status);
        done();
      }).catch(function () {
        submit.classList.remove('is-busy');
        status.className = 'form__status bad';
        status.textContent = t('form.failed', 'Could not send. Please WhatsApp us instead — we are one tap away.');
        window.open(waLink(summary), '_blank', 'noopener');
      });
    });
  })();

  /* ---------------- toggles ---------------- */
  var themeToggle = $('#themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(root.classList.contains('dark') ? 'light' : 'dark');
    });
  }
  var langToggle = $('#langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', function () { applyLang(lang === 'gu' ? 'en' : 'gu'); });
  }

  /* ---------------- icon font guard ----------------
     Ligature icons show their raw name ("chat", "menu") if the font fails to
     load. Hide them instead — every icon here sits next to a text label. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      var loaded = false;
      document.fonts.forEach(function (f) {
        if (f.family.replace(/"/g, '').indexOf('Material Symbols') === 0 && f.status === 'loaded') loaded = true;
      });
      if (!loaded && !document.fonts.check('24px "Material Symbols Rounded"')) {
        root.classList.add('no-icons');
      }
    });
  }

  /* ---------------- map outline draw ----------------
     Measure the real path so the stroke-dash animation covers all of it.
     Runs synchronously, before the reveal observer can add .in. */
  (function () {
    var path = $('.gjmap__shape');
    if (!path || typeof path.getTotalLength !== 'function') return;
    var len = Math.ceil(path.getTotalLength());
    if (len > 0) {
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
    }
  })();

  /* ---------------- init ---------------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  applyTheme(root.classList.contains('dark') ? 'dark' : 'light');
  rotator.init();
  priceUI.init();
  if (lang === 'gu') applyLang('gu');
  onScroll();
  window.addEventListener('load', function () { priceUI.render(); });
})();
