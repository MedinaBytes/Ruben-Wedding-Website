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
  var DATE = new Date("2026-10-17T19:00:00-04:00").getTime();

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
        ? (es ? "Gracias, " + name + ". Lamentamos no contar contigo." : "Thank you, " + name + ". We'll miss you.")
        : (es ? "Magnífico, " + name + ". Confirmación en camino." : "Wonderful, " + name + ". A confirmation is on its way.");
      status.dataset.tone = "ok";
      form.reset();
    });
  }
})();

/* ===== Signature cocktail composer (enhance e1) ===== */
(function () {
  var section = document.querySelector("#bar");
  if (!section) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  var liquid = section.querySelector("[data-bar-liquid]");
  var surface = section.querySelector("[data-bar-surface]");
  var garnishG = section.querySelector("[data-bar-garnish]");
  var basesWrap = section.querySelector("[data-bar-bases]");
  var flavWrap = section.querySelector("[data-bar-flavours]");
  var garnWrap = section.querySelector("[data-bar-garnishes]");
  var nameEl = section.querySelector("[data-bar-name]");
  var noteEl = section.querySelector("[data-bar-note]");
  var rsvpBtn = section.querySelector("[data-bar-rsvp]");
  if (!liquid || !basesWrap) return;

  function el(name, attrs) { var n = document.createElementNS(SVGNS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function twoLang(elm, en, es) { elm.innerHTML = ""; var a = document.createElement("span"); a.setAttribute("data-lang", "en"); a.innerHTML = en; var b = document.createElement("span"); b.setAttribute("data-lang", "es"); b.innerHTML = es; elm.appendChild(a); elm.appendChild(b); }
  function darken(hex, f) { var n = parseInt(hex.slice(1), 16); var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f); return "rgb(" + r + "," + g + "," + b + ")"; }

  var BASES = [
    { id: "gin", en: "Gin", es: "Ginebra", col: "#DCEFE6", nEn: "The Gilded Lily", nEs: "La Azucena Dorada" },
    { id: "bourbon", en: "Bourbon", es: "Bourbon", col: "#C0813A", nEn: "Manhattan Gold", nEs: "Oro de Manhattan" },
    { id: "champagne", en: "Champagne", es: "Champ\u00e1n", col: "#EBDDA6", nEn: "The Empire Fizz", nEs: "El Fizz Empire" },
    { id: "rum", en: "Aged Rum", es: "Ron A\u00f1ejo", col: "#9E5226", nEn: "Midnight Deco", nEs: "Deco de Medianoche" }
  ];
  var FLAVOURS = [
    { id: "vermouth", en: "Dry Vermouth", es: "Vermut Seco", nEn: "crisp and botanical", nEs: "seco y bot\u00e1nico", shift: 0.97 },
    { id: "citrus", en: "Citrus", es: "C\u00edtrico", nEn: "bright with a zest snap", nEs: "luminoso con un toque c\u00edtrico", shift: 1.06 },
    { id: "bitters", en: "Aromatic Bitters", es: "Amargos", nEn: "spiced and brooding", nEs: "especiado y profundo", shift: 0.82 },
    { id: "sparkling", en: "Sparkling", es: "Espumoso", nEn: "effervescent and light", nEs: "efervescente y ligero", shift: 1.04 }
  ];
  var GARNISHES = [
    { id: "olive", en: "Olive", es: "Aceituna" },
    { id: "twist", en: "Lemon Twist", es: "Espiral de Lim\u00f3n" },
    { id: "cherry", en: "Cherry", es: "Cereza" },
    { id: "none", en: "None", es: "Ninguna" }
  ];

  var base = BASES[2], flav = FLAVOURS[3], garn = GARNISHES[1];

  function shiftCol(hex, s) {
    var n = parseInt(hex.slice(1), 16); var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r * s))); g = Math.max(0, Math.min(255, Math.round(g * s))); b = Math.max(0, Math.min(255, Math.round(b * s)));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function drawGarnish() {
    while (garnishG.firstChild) garnishG.removeChild(garnishG.firstChild);
    if (garn.id === "olive") {
      garnishG.appendChild(el("line", { x1: 118, y1: 50, x2: 150, y2: 74, stroke: "#caa84e", "stroke-width": 1.6 }));
      garnishG.appendChild(el("ellipse", { cx: 132, cy: 60, rx: 7, ry: 9, fill: "#6E7A45" }));
      garnishG.appendChild(el("circle", { cx: 132, cy: 60, r: 2.4, fill: "#B23A2E" }));
    } else if (garn.id === "twist") {
      garnishG.appendChild(el("path", { d: "M120,58 C140,48 150,60 144,72 C140,80 128,78 130,68 C131,62 138,62 138,66", fill: "none", stroke: "#E7C200", "stroke-width": 3, "stroke-linecap": "round" }));
    } else if (garn.id === "cherry") {
      garnishG.appendChild(el("path", { d: "M132,46 C134,54 130,58 126,62", fill: "none", stroke: "#7a5a2a", "stroke-width": 1.4 }));
      garnishG.appendChild(el("circle", { cx: 124, cy: 64, r: 7, fill: "#9E1B2F" }));
      garnishG.appendChild(el("circle", { cx: 121.5, cy: 61.5, r: 1.8, fill: "rgba(255,255,255,.45)" }));
    }
  }

  function render() {
    var col = shiftCol(base.col, flav.shift);
    liquid.setAttribute("fill", col);
    surface.setAttribute("fill", darken(base.col, 0.84 * (flav.shift > 1 ? 1 : flav.shift)));
    drawGarnish();
    twoLang(nameEl, base.nEn, base.nEs);
    var withG_en = garn.id === "none" ? "served clean" : "finished with " + (garn.id === "twist" ? "a lemon twist" : garn.id === "olive" ? "an olive" : "a brandied cherry");
    var withG_es = garn.id === "none" ? "servido limpio" : "rematado con " + (garn.id === "twist" ? "una espiral de lim\u00f3n" : garn.id === "olive" ? "una aceituna" : "una cereza al brandy");
    twoLang(noteEl, base.en + " &middot; " + flav.nEn + " &middot; " + withG_en + ".", base.es + " &middot; " + flav.nEs + " &middot; " + withG_es + ".");
  }

  function buildPills(wrap, arr, get, set) {
    arr.forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "bar-pill"; b.setAttribute("data-id", item.id);
      b.setAttribute("aria-pressed", get().id === item.id ? "true" : "false");
      twoLang(b, item.en, item.es);
      b.addEventListener("click", function () {
        set(item);
        var all = wrap.querySelectorAll(".bar-pill");
        for (var i = 0; i < all.length; i++) all[i].setAttribute("aria-pressed", all[i].getAttribute("data-id") === item.id ? "true" : "false");
        render();
      });
      wrap.appendChild(b);
    });
  }
  buildPills(basesWrap, BASES, function () { return base; }, function (x) { base = x; });
  buildPills(flavWrap, FLAVOURS, function () { return flav; }, function (x) { flav = x; });
  buildPills(garnWrap, GARNISHES, function () { return garn; }, function (x) { garn = x; });

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
