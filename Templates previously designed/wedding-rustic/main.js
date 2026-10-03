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
  // ---------- Bilingual toggle ----------
  function setLang(l) {
    document.documentElement.lang = l;
    try { localStorage.setItem('eventLang', l); } catch (e) {}
    var btn = document.querySelector('[data-lang-toggle]');
    if (btn) btn.setAttribute('aria-pressed', String(l === 'es'));
  }
  var langBtn = document.querySelector('[data-lang-toggle]');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      setLang(document.documentElement.lang === 'es' ? 'en' : 'es');
    });
  }

  // ---------- Wedding date ----------
  var DATE = new Date("2026-09-26T15:30:00-04:00").getTime();

  // ---------- Sticky nav ----------
  var nav = document.querySelector("[data-nav]");
  function onScroll() { if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 50); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- Mobile menu ----------
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

  // ---------- Reveal-on-scroll ----------
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

  // ---------- Countdown ----------
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

  // ---------- RSVP demo submit ----------
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
        : (es ? "¡Sí! Gracias, " + name + ". Confirmación en camino." : "Yes! Thank you, " + name + ". Confirmation on its way.");
      status.dataset.tone = "ok";
      form.reset();
    });
  }
})();

/* ===== String light canopy designer (enhance e1) ===== */
(function () {
  var section = document.querySelector("#lights");
  if (!section) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  var strandsG = section.querySelector("[data-lights-strands]");
  var swagInput = section.querySelector("[data-lights-swags]");
  var densWrap = section.querySelector("[data-lights-density]");
  var warmWrap = section.querySelector("[data-lights-warmth]");
  var readout = section.querySelector("[data-lights-readout]");
  var rsvpBtn = section.querySelector("[data-lights-rsvp]");
  if (!strandsG || !swagInput) return;

  function el(name, attrs) { var n = document.createElementNS(SVGNS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function twoLang(elm, en, es) { elm.innerHTML = ""; var a = document.createElement("span"); a.setAttribute("data-lang", "en"); a.innerHTML = en; var b = document.createElement("span"); b.setAttribute("data-lang", "es"); b.innerHTML = es; elm.appendChild(a); elm.appendChild(b); }

  var DENS = [
    { id: "soft", en: "Soft", es: "Suave", count: 8 },
    { id: "full", en: "Full", es: "Pleno", count: 12 },
    { id: "festival", en: "Festival", es: "Festival", count: 16 }
  ];
  var WARM = [
    { id: "warm", en: "Warm white", es: "Blanco c\u00e1lido", a: "#FFE9B8", b: "#FFE9B8" },
    { id: "amber", en: "Amber", es: "\u00c1mbar", a: "#FFB85C", b: "#FFB85C" },
    { id: "fairy", en: "Fairy", es: "Ensue\u00f1o", a: "#FFE9B8", b: "#BFE3FF" }
  ];

  var state = { swags: 4, densId: "full", warmId: "warm" };

  function getDens() { for (var i = 0; i < DENS.length; i++) if (DENS[i].id === state.densId) return DENS[i]; return DENS[1]; }
  function getWarm() { for (var i = 0; i < WARM.length; i++) if (WARM[i].id === state.warmId) return WARM[i]; return WARM[0]; }

  function quad(p0, pc, p2, t) {
    var u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * pc.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * pc.y + t * t * p2.y };
  }

  function render() {
    while (strandsG.firstChild) strandsG.removeChild(strandsG.firstChild);
    var dens = getDens(), warm = getWarm();
    var count = dens.count;
    var n = state.swags;
    var twinkleN = 0;
    for (var i = 0; i < n; i++) {
      var y0 = 20 + i * 9;
      var d = 48 - i * 5;
      var p0 = { x: 8, y: y0 }, p2 = { x: 312, y: y0 }, pc = { x: 160, y: y0 + 2 * d };
      // cord
      var pts = [];
      for (var s = 0; s <= 30; s++) { var q = quad(p0, pc, p2, s / 30); pts.push(q.x.toFixed(1) + "," + q.y.toFixed(1)); }
      strandsG.appendChild(el("polyline", { class: "lights-cord", points: pts.join(" ") }));
      // bulbs
      for (var j = 0; j < count; j++) {
        var t = (j + 0.5) / count;
        var c = quad(p0, pc, p2, t);
        var col = (((i + j) % 2 === 0) ? warm.a : warm.b);
        strandsG.appendChild(el("line", { class: "lights-wire", x1: c.x.toFixed(1), y1: c.y.toFixed(1), x2: c.x.toFixed(1), y2: (c.y + 5).toFixed(1) }));
        strandsG.appendChild(el("circle", { class: "lights-bulb-glow", cx: c.x.toFixed(1), cy: (c.y + 7).toFixed(1), r: 6, fill: col }));
        var bulb = el("circle", { class: "lights-bulb", cx: c.x.toFixed(1), cy: (c.y + 7).toFixed(1), r: 3.4, fill: col });
        if (!reduce && (twinkleN % 3 === 0)) { bulb.setAttribute("class", "lights-bulb is-twinkle"); bulb.style.animationDelay = ((twinkleN * 137) % 2600) + "ms"; }
        twinkleN++;
        strandsG.appendChild(bulb);
      }
    }
    var total = n * count;
    twoLang(readout, "<span class=\"hl\">" + n + "</span> strands &middot; " + total + " bulbs &middot; " + warm.en + " glow", "<span class=\"hl\">" + n + "</span> guirnaldas &middot; " + total + " bombillas &middot; brillo " + warm.es.toLowerCase());
  }

  function buildPills(wrap, arr, getId, setId) {
    arr.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "lights-pill"; b.setAttribute("data-id", opt.id);
      b.setAttribute("aria-pressed", getId() === opt.id ? "true" : "false");
      twoLang(b, opt.en, opt.es);
      b.addEventListener("click", function () {
        setId(opt.id);
        var all = wrap.querySelectorAll(".lights-pill");
        for (var k = 0; k < all.length; k++) all[k].setAttribute("aria-pressed", all[k].getAttribute("data-id") === opt.id ? "true" : "false");
        render();
      });
      wrap.appendChild(b);
    });
  }

  buildPills(densWrap, DENS, function () { return state.densId; }, function (v) { state.densId = v; });
  buildPills(warmWrap, WARM, function () { return state.warmId; }, function (v) { state.warmId = v; });

  swagInput.addEventListener("input", function () { state.swags = parseInt(swagInput.value, 10) || 4; render(); });

  render();

  if (rsvpBtn) {
    rsvpBtn.addEventListener("click", function () {
      var rsvp = document.querySelector("#rsvp");
      if (rsvp) rsvp.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var f = document.querySelector("#rsvp [name='name']");
      if (f) setTimeout(function () { try { f.focus(); } catch (e) {} }, reduce ? 0 : 480);
    });
  }
})();
