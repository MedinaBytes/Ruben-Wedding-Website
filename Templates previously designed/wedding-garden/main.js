(function () {
  "use strict";
  // Shared bilingual init (URL ?lang=es + portfolio storage)
  (function () {
    try {
      var SHARED_KEY = 'sevensides-portfolio-language';
      var params = new URLSearchParams(window.location.search);
      var fromUrl = (params.get('lang') || '').toLowerCase().slice(0, 2);
      var saved = (localStorage.getItem(SHARED_KEY) || localStorage.getItem('eventLang') || '').toLowerCase().slice(0, 2);
      var nv = (navigator.language || '').toLowerCase();
      var chosen = fromUrl || saved || (nv.indexOf('es') === 0 ? 'es' : 'en');
      document.documentElement.lang = chosen === 'es' ? 'es' : 'en';
      if (fromUrl) { try { localStorage.setItem(SHARED_KEY, chosen); localStorage.setItem('eventLang', chosen); } catch (e) {} }
    } catch (e) {}
  })();
  var DATE = new Date("2026-05-30T15:00:00+01:00").getTime();

  // Bilingual toggle
  var langBtn = document.querySelector('[data-lang-toggle]');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      var next = document.documentElement.lang === 'es' ? 'en' : 'es';
      document.documentElement.lang = next;
      try { localStorage.setItem('eventLang', next); localStorage.setItem('sevensides-portfolio-language', next); } catch (e) {}
      langBtn.setAttribute('aria-pressed', String(next === 'es'));
    });
  }

  // Sticky nav
  var nav = document.querySelector("[data-nav]");
  function onScroll() { if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 50); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.getElementById("m-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      if (open) menu.setAttribute("hidden", ""); else menu.removeAttribute("hidden");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        menu.setAttribute("hidden", "");
      });
    });
  }

  // Reveal-on-scroll
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--reveal-delay", (i % 6) * 80 + "ms");
      io.observe(el);
    });
  }

  // Countdown
  var cd = {
    days: document.querySelector('[data-cd="days"]'),
    hours: document.querySelector('[data-cd="hours"]'),
    mins: document.querySelector('[data-cd="mins"]'),
  };
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function tick() {
    var diff = Math.max(0, DATE - Date.now());
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff / 3600000) % 24);
    var m = Math.floor((diff / 60000) % 60);
    if (cd.days) cd.days.textContent = d;
    if (cd.hours) cd.hours.textContent = pad(h);
    if (cd.mins) cd.mins.textContent = pad(m);
  }
  if (cd.days) { tick(); setInterval(tick, 30000); }

  // RSVP submit
  var form = document.querySelector(".rsvp-form");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var fd = new FormData(form);
      var name = (fd.get("name") || "").toString().trim().split(/\s+/)[0] || "friend";
      var att = fd.get("att");
      var es = document.documentElement.lang === 'es';
      status.textContent = att === "no"
        ? (es ? "Gracias, " + name + ". Te enviaremos las fotos." : "Thank you, " + name + ". We'll send you the photos.")
        : (es ? "¡Sí! Gracias, " + name + ". Te confirmamos en breve." : "Yes! Thank you, " + name + ". A confirmation is on its way.");
      status.dataset.tone = "ok";
      form.reset();
    });
  }
})();

/* ===== Floral arch designer (enhance e1) ===== */
(function () {
  var section = document.querySelector("#arch");
  if (!section) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  var bloomsG = section.querySelector("[data-arch-blooms]");
  var palWrap = section.querySelector("[data-arch-palettes]");
  var grnWrap = section.querySelector("[data-arch-greens]");
  var full = section.querySelector("[data-arch-full]");
  var nameEl = section.querySelector("[data-arch-name]");
  var noteEl = section.querySelector("[data-arch-note]");
  var rsvpBtn = section.querySelector("[data-arch-rsvp]");
  if (!bloomsG || !palWrap) return;

  function el(name, attrs) { var n = document.createElementNS(SVGNS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function twoLang(elm, en, es) { elm.innerHTML = ""; var a = document.createElement("span"); a.setAttribute("data-lang", "en"); a.innerHTML = en; var b = document.createElement("span"); b.setAttribute("data-lang", "es"); b.innerHTML = es; elm.appendChild(a); elm.appendChild(b); }
  function rnd(i) { var x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453; return x - Math.floor(x); }

  var PALETTES = [
    { id: "blush", en: "Blush Romance", es: "Rom\u00e1ntico Rosa", cols: ["#F4DCD3", "#C58B89", "#FBEBE3", "#E8B5AE"], nEn: "The Blush Cascade", nEs: "La Cascada Rosa" },
    { id: "meadow", en: "Wild Meadow", es: "Prado Silvestre", cols: ["#C9A2C7", "#E8C44D", "#FBEBE3", "#B9C6A0"], nEn: "Wildflower Crown", nEs: "Corona Silvestre" },
    { id: "white", en: "Classic White", es: "Blanco Cl\u00e1sico", cols: ["#FFFFFF", "#FAF6EE", "#EADFCB", "#F4DCD3"], nEn: "The Ivory Vow", nEs: "El Voto Marfil" },
    { id: "sunset", en: "Sunset Garden", es: "Jard\u00edn del Ocaso", cols: ["#E8896A", "#F0B860", "#C9595B", "#F4DCD3"], nEn: "Golden Hour Arch", nEs: "Arco Dorado" }
  ];
  var GREENS = [
    { id: "euc", en: "Eucalyptus", es: "Eucalipto", col: "#A8B79B" },
    { id: "fern", en: "Fern", es: "Helecho", col: "#4A6741" },
    { id: "olive", en: "Olive", es: "Olivo", col: "#6b8160" },
    { id: "ivy", en: "Ivy", es: "Hiedra", col: "#5a7a4e" }
  ];

  var pal = PALETTES[0], grn = GREENS[0];
  var CX = 120, CY = 120, R = 88;
  // clusters: [startDeg, endDeg, share]
  var CLUSTERS = [{ a0: 150, a1: 256, share: 0.7 }, { a0: 8, a1: 70, share: 0.3 }];

  function place(deg, rr) { var rad = deg * Math.PI / 180; return { x: CX + rr * Math.cos(rad), y: CY + rr * Math.sin(rad) }; }

  function render() {
    while (bloomsG.firstChild) bloomsG.removeChild(bloomsG.firstChild);
    var total = parseInt(full.value, 10);
    var seedBase = (pal.id.length * 7 + grn.id.length * 3);
    // greenery first (behind)
    var gCount = Math.max(5, Math.round(total * 0.7));
    var gi;
    for (gi = 0; gi < gCount; gi++) {
      var cg = CLUSTERS[gi % 2 === 0 ? 0 : (gi % 5 === 0 ? 1 : 0)];
      var gt = rnd(seedBase + gi * 2.3);
      var gdeg = cg.a0 + (cg.a1 - cg.a0) * gt + (rnd(seedBase + gi) - 0.5) * 10;
      var grr = R + (rnd(seedBase + gi * 1.7) - 0.5) * 16;
      var gp = place(gdeg, grr);
      bloomsG.appendChild(el("ellipse", { cx: gp.x.toFixed(1), cy: gp.y.toFixed(1), rx: 9, ry: 3.4, fill: grn.col, opacity: 0.85, transform: "rotate(" + Math.round(gdeg + 90) + " " + gp.x.toFixed(1) + " " + gp.y.toFixed(1) + ")" }));
    }
    // blooms
    var i, placed = 0;
    for (i = 0; i < total; i++) {
      var c = (i < Math.round(total * CLUSTERS[0].share)) ? CLUSTERS[0] : CLUSTERS[1];
      var t = rnd(seedBase + i * 3.7);
      var deg = c.a0 + (c.a1 - c.a0) * t + (rnd(seedBase + i * 1.3) - 0.5) * 12;
      var rr = R + (rnd(seedBase + i * 2.1) - 0.5) * 20;
      var p = place(deg, rr);
      var col = pal.cols[i % pal.cols.length];
      var size = 6 + rnd(seedBase + i) * 4;
      var g = el("g", { class: "arch-bloom" });
      g.appendChild(el("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: size.toFixed(1), fill: col, stroke: "rgba(74,103,65,.18)", "stroke-width": 0.6 }));
      g.appendChild(el("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: (size * 0.4).toFixed(1), fill: "rgba(201,169,97,.5)" }));
      bloomsG.appendChild(g);
      placed++;
    }
    twoLang(nameEl, pal.nEn, pal.nEs);
    var lush_en = total <= 10 ? "an airy, minimalist" : total <= 16 ? "a balanced, romantic" : "a lush, overflowing";
    var lush_es = total <= 10 ? "un aireado y minimalista" : total <= 16 ? "un equilibrado y rom\u00e1ntico" : "un frondoso y desbordante";
    twoLang(noteEl, pal.en + " blooms with " + grn.en.toLowerCase() + " &mdash; " + lush_en + " arch of " + placed + " stems.", pal.es + " con " + grn.es.toLowerCase() + " &mdash; " + lush_es + " arco de " + placed + " tallos.");
  }

  function buildPills(wrap, arr, get, set) {
    arr.forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "arch-pill"; b.setAttribute("data-id", item.id);
      b.setAttribute("aria-pressed", get().id === item.id ? "true" : "false");
      twoLang(b, item.en, item.es);
      b.addEventListener("click", function () {
        set(item);
        var all = wrap.querySelectorAll(".arch-pill");
        for (var i = 0; i < all.length; i++) all[i].setAttribute("aria-pressed", all[i].getAttribute("data-id") === item.id ? "true" : "false");
        render();
      });
      wrap.appendChild(b);
    });
  }
  buildPills(palWrap, PALETTES, function () { return pal; }, function (x) { pal = x; });
  buildPills(grnWrap, GREENS, function () { return grn; }, function (x) { grn = x; });
  full.addEventListener("input", render);

  if (rsvpBtn) {
    rsvpBtn.addEventListener("click", function () {
      var rsvp = document.querySelector("#rsvp");
      if (rsvp) rsvp.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var f = document.querySelector("#rsvp [name='name']");
      if (f) setTimeout(function () { try { f.focus(); } catch (e) {} }, reduce ? 0 : 480);
    });
  }

  render();
})();
