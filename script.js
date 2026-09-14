/* Bunyaan Tech — bunyaan.tech
   Progressive enhancement only: every section is readable without this file. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Year ─────────────────────────────────────────────────────── */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── Mobile navigation ────────────────────────────────────────── */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ── Services accordion ───────────────────────────────────────── */
  var acc = document.getElementById('acc');

  function setPanel(item, open) {
    var btn = item.querySelector('.acc-head');
    var panel = item.querySelector('.acc-panel');
    if (!btn || !panel) return;
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
  }

  if (acc) {
    var items = Array.prototype.slice.call(acc.querySelectorAll('.acc-item'));

    items.forEach(function (item) {
      setPanel(item, item.classList.contains('is-open'));
      var btn = item.querySelector('.acc-head');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          if (other !== item) setPanel(other, false);
        });
        setPanel(item, willOpen);
      });
    });

    var remeasure = function () {
      items.forEach(function (item) {
        if (item.classList.contains('is-open')) {
          var p = item.querySelector('.acc-panel');
          if (p) p.style.maxHeight = p.scrollHeight + 'px';
        }
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

    // Keep the open panel correctly sized when the layout reflows.
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        items.forEach(function (item) {
          if (item.classList.contains('is-open')) {
            var p = item.querySelector('.acc-panel');
            if (p) p.style.maxHeight = p.scrollHeight + 'px';
          }
        });
      }, 150);
    });
  }

  /* ── Current section in the nav ───────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.nav a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = links[entry.target.id];
        if (a) a.classList.toggle('is-current', entry.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ── Brief form → email ───────────────────────────────────────── */
  var form = document.getElementById('briefForm');
  var note = document.getElementById('formNote');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };
      var name = v('f-name');
      var email = v('f-email');
      var company = v('f-company');
      var need = v('f-need');
      var brief = v('f-brief');

      var bad = false;
      [['f-name', name.length > 1], ['f-email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)]]
        .forEach(function (pair) {
          var row = document.getElementById(pair[0]).closest('.row');
          row.classList.toggle('invalid', !pair[1]);
          if (!pair[1]) bad = true;
        });

      if (bad) {
        if (note) {
          note.textContent = 'Add your name and a valid email so we can reply.';
          note.classList.remove('is-sent');
        }
        return;
      }

      var subject = 'New brief — ' + (company || name);
      var body =
        'Name: ' + name + '\n' +
        'Company: ' + (company || '—') + '\n' +
        'Email: ' + email + '\n' +
        'Requirement: ' + need + '\n\n' +
        'The problem:\n' + (brief || '—') + '\n\n' +
        '— Sent from bunyaan.tech';

      window.location.href =
        'mailto:bunyaantech@gmail.com?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      if (note) {
        note.innerHTML =
          'Your email client is opening with the brief attached to the message. ' +
          'If nothing happened, email <a href="mailto:bunyaantech@gmail.com">bunyaantech@gmail.com</a> directly.';
        note.classList.add('is-sent');
      }
    });
  }

  /* ── Hero node network ────────────────────────────────────────── */
  var canvas = document.getElementById('net');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var hero = canvas.parentNode;
  var nodes = [];
  var w = 0, h = 0, dpr = 1, raf = null, visible = true;
  var pointer = { x: -9999, y: -9999, on: false };

  var LINK = 148;      // px at which two nodes connect
  var REACH = 190;     // pointer influence radius

  function size() {
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(rect.width, 1);
    h = Math.max(rect.height, 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    var target = Math.round((w * h) / 17000);
    var count = Math.max(22, Math.min(64, target));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.17,
        vy: (Math.random() - 0.5) * 0.17,
        r: Math.random() < 0.18 ? 2.6 : 1.5,
        hot: Math.random() < 0.18
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];

      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          var d = Math.sqrt(d2);
          ctx.strokeStyle = 'rgba(96,166,255,' + (0.30 * (1 - d / LINK)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      if (pointer.on) {
        var px = a.x - pointer.x, py = a.y - pointer.y;
        var pd = Math.sqrt(px * px + py * py);
        if (pd < REACH) {
          ctx.strokeStyle = 'rgba(140,197,255,' + (0.34 * (1 - pd / REACH)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = a.hot ? 'rgba(126,190,255,.92)' : 'rgba(150,196,244,.5)';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (pointer.on) {
        var dx = pointer.x - n.x, dy = pointer.y - n.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < REACH && d > 1) {
          n.x += (dx / d) * 0.22 * (1 - d / REACH);
          n.y += (dy / d) * 0.22 * (1 - d / REACH);
        }
      }

      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (raf || reduce) return;
    raf = requestAnimationFrame(step);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function init() {
    size();
    seed();
    draw();
    if (!reduce && visible && !document.hidden) start();
  }

  init();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { stop(); init(); });
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      stop();
      init();
    }, 200);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (visible) start();
  });

  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var rect = hero.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.on = true;
    });
    hero.addEventListener('pointerleave', function () {
      pointer.on = false;
      pointer.x = pointer.y = -9999;
    });
  }
})();
