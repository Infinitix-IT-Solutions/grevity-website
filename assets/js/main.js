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
    waMessage:    'Hello Grevity! I would like a free demo of your offline billing and inventory software.',

    // Demo form -> your inbox, via Web3Forms (no backend needed).
    // Get a free access key at https://web3forms.com by entering your email,
    // paste it below, and enquiries start arriving. Until it is filled in, the
    // form hands every enquiry to WhatsApp instead, so no lead is ever lost.
    formAccessKey: 'be8952a8-8be5-4c3a-9909-9274afdc15fe',
    formEndpoint:  'https://api.web3forms.com/submit',
    formMailTo:    'grevity.app@gmail.com'     // shown in the enquiry, for your reference
  };

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- analytics ----------------
     Thin wrapper over the GA4 tag in <head>. It no-ops when gtag is missing
     (ad blockers, script failed) so tracking can never break a lead.
     Never pass names, phone numbers, emails or business names here — Google
     Analytics' terms forbid sending personal data, and a violation can get
     the property deleted. Add ?ga_debug=1 to the URL to see events live in
     GA4 > Admin > DebugView. */
  var gaDebug = /[?&]ga_debug=1\b/.test(location.search);
  function track(name, params) {
    if (typeof window.gtag !== 'function') return;
    params = params || {};
    if (gaDebug) params.debug_mode = true;
    try { window.gtag('event', name, params); } catch (e) {}
  }

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
    themeMeta.content = next === 'dark' ? '#070a14' : '#ffffff';
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

  var spySections = ['problem', 'drive', 'features', 'how', 'pricing', 'faq']
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

  /* ---------------- pointer light + tilt ----------------
     Two small pointer effects, both pure CSS custom properties so a
     device without a pointer simply never triggers them. */
  (function () {
    if (reduced || !window.matchMedia('(hover: hover)').matches) return;

    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    $$('.tilt').forEach(function (el) {
      var MAX = 6;                                  // degrees; more reads as a gimmick
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', (((e.clientX - r.left) / r.width) - 0.5) * MAX * 2 + 'deg');
        el.style.setProperty('--rx', (0.5 - ((e.clientY - r.top) / r.height)) * MAX * 2 + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  })();

  /* ---------------- price rendering ----------------
     One plan: a first-year price and a yearly renewal. Both are formatted in
     Indian digit grouping from data-price / data-renew. */
  var priceUI = (function () {
    function render() {
      $$('[data-price], [data-renew], [data-mrp]').forEach(function (el) {
        var v = el.getAttribute('data-price') || el.getAttribute('data-renew') || el.getAttribute('data-mrp');
        if (!v) return;
        var label = el.querySelector('.sr-only');            // keep "Regular price" for screen readers
        el.textContent = '₹' + Number(v).toLocaleString('en-IN');
        if (label) el.insertBefore(label, el.firstChild);
      });
    }
    return { init: render, render: render };
  })();

  /* ---------------- seamless loops ----------------
     Both strips scroll to -50%, so each needs exactly one duplicate set.
     Under reduced motion the CSS turns them into plain scrollers instead. */
  (function () {
    if (reduced) return;
    ['#marqueeTrack', '#tickerTrack'].forEach(function (sel) {
      var track = $(sel);
      if (!track) return;
      track.innerHTML += track.innerHTML;
      Array.prototype.slice.call(track.children, track.children.length / 2)
        .forEach(function (clone) { clone.setAttribute('aria-hidden', 'true'); });
    });
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

  // One delegated listener covers every call and WhatsApp link, including any
  // added later. data-track on the link names where it sits, so GA can show
  // which button actually gets pressed; an untagged link reports "untagged"
  // rather than disappearing from the numbers.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href*="wa.me/"]');
    if (!a) return;
    track(a.getAttribute('href').indexOf('tel:') === 0 ? 'phone_click' : 'whatsapp_click', {
      link_location: a.getAttribute('data-track') || 'untagged'
    });
  });

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
      var trap = $('#fWebsite');
      if (trap && trap.value) { done_silently(); return; }   // honeypot: bots fill it, people cannot see it

      var ok = Object.keys(rules).every(function (id) { return validateField(id); });

      // hCaptcha injects this textarea into the form once solved.
      var capField = form.querySelector('textarea[name="h-captcha-response"]');
      var capToken = capField ? capField.value : '';
      var capWidget = form.querySelector('.h-captcha');
      if (capWidget && !capToken) {
        status.className = 'form__status bad';
        status.textContent = t('err.captcha', 'Please tick the "I am human" box first.');
        capWidget.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        return;
      }

      if (!ok) {
        status.className = 'form__status bad';
        status.textContent = t('form.fix', 'Please check the highlighted fields.');
        var bad = $('.is-invalid'); if (bad) bad.focus();
        return;
      }

      // Field names double as the labels in the enquiry email, so keep them readable.
      var data = {
        name: $('#fName').value.trim(),
        business: $('#fBiz').value.trim(),
        city: $('#fCity').value.trim(),
        phone: '+91' + $('#fPhone').value.replace(/\D/g, ''),
        business_type: $('#fType').options[$('#fType').selectedIndex].text,
        page_language: lang === 'gu' ? 'Gujarati' : 'English',
        submitted_at: new Date().toLocaleString('en-IN'),
        page: location.href
      };

      submit.classList.add('is-busy');
      status.className = 'form__status';
      status.textContent = t('form.sending', 'Sending…');

      var summary = 'Name: ' + data.name + '\nBusiness: ' + data.business +
                    '\nCity: ' + data.city + '\nPhone: ' + data.phone +
                    '\nType: ' + data.business_type;

      // Captured now, because done() resets the form. Only non-personal fields:
      // the select's value (not its label, so English and Gujarati visitors
      // land in the same bucket) and the page language.
      var leadInfo = {
        business_type: $('#fType').value,
        page_language: lang
      };

      function done_silently() {
        status.className = 'form__status ok';
        status.textContent = t('form.thanks', 'Thank you! We will call you within one working day.');
        form.reset();
      }

      function resetCaptcha() {
        // A solved token is single-use; without this a second submit always fails.
        if (window.hcaptcha && typeof window.hcaptcha.reset === 'function') {
          try { window.hcaptcha.reset(); } catch (e) {}
        }
      }

      function done() {
        resetCaptcha();
        submit.classList.remove('is-busy');
        status.className = 'form__status ok';
        status.textContent = t('form.thanks', 'Thank you! We will call you within one working day.');
        form.reset();
      }

      if (!CONFIG.formAccessKey || !CONFIG.formEndpoint) {
        // No key yet: hand the enquiry to WhatsApp so nothing is lost.
        window.open(waLink(summary), '_blank', 'noopener');
        leadInfo.method = 'whatsapp_handoff';
        track('generate_lead', leadInfo);
        done();
        return;
      }

      data.access_key = CONFIG.formAccessKey;
      if (capToken) data['h-captcha-response'] = capToken;
      data.subject = 'New Grevity Demo Request — ' + data.business + ', ' + data.city;
      data.from_name = 'Grevity Website';
      if (CONFIG.formMailTo) data.to_email = CONFIG.formMailTo;

      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          // Web3Forms answers 200 with {success:false} on a bad key, so check both.
          if (!res.ok || body.success === false) throw new Error(body.message || 'status ' + res.status);
          leadInfo.method = 'demo_form';
          track('generate_lead', leadInfo);
          done();
        });
      }).catch(function (err) {
        // Surface the reason: silent WhatsApp hand-offs are hard to debug otherwise.
        if (window.console) console.warn('Grevity form: could not send —', err && err.message);
        // Not a lead yet — the visitor is being bounced to WhatsApp. Counted
        // separately so a broken form key shows up in GA instead of silently
        // costing enquiries.
        track('demo_form_error', {
          error_reason: String((err && err.message) || 'unknown').slice(0, 100),
          fallback: 'whatsapp'
        });
        resetCaptcha();
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
