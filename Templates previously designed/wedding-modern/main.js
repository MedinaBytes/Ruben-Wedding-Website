(function () {
  "use strict";

  var WEDDING_DATE = new Date("2026-06-20T18:00:00-04:00").getTime();

  var nav = document.querySelector("[data-nav]");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add("is-scrolled"); else nav.classList.remove("is-scrolled");
  }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

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

  var dEls = {
    days: document.querySelector('[data-cd="days"]'),
    hours: document.querySelector('[data-cd="hours"]'),
    mins: document.querySelector('[data-cd="mins"]'),
  };
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function tick() {
    var diff = Math.max(0, WEDDING_DATE - Date.now());
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff / 3600000) % 24);
    var m = Math.floor((diff / 60000) % 60);
    if (dEls.days) dEls.days.textContent = d;
    if (dEls.hours) dEls.hours.textContent = pad(h);
    if (dEls.mins) dEls.mins.textContent = pad(m);
  }
  if (dEls.days) { tick(); setInterval(tick, 30000); }

  var form = document.querySelector(".rsvp-form");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var fd = new FormData(form);
      var name = (fd.get("name") || "").toString().trim().split(/\s+/)[0] || "friend";
      var att = fd.get("att");
      status.textContent = att === "no"
        ? "Thanks, " + name + ". We'll send photos."
        : "Hell yes, " + name + ". Confirmation on its way.";
      status.dataset.tone = "ok";
      form.reset();
    });
  }
})();

// ---------------- Bilingual EN/ES toggle ----------------
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
  var btn = document.querySelector('[data-lang-toggle]');
  if (btn) {
    btn.addEventListener('click', function () {
      var next = document.documentElement.lang === 'es' ? 'en' : 'es';
      document.documentElement.lang = next;
      try { localStorage.setItem('eventLang', next); localStorage.setItem('sevensides-portfolio-language', next); } catch (e) {}
      btn.setAttribute('aria-pressed', String(next === 'es'));
    });
  }
})();

/* ===== Subway route planner (enhance e1) ===== */
(function () {
  var section = document.querySelector("#transit");
  if (!section) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  var baseG = section.querySelector("[data-sub-base]");
  var hiG = section.querySelector("[data-sub-hi]");
  var rowsWrap = section.querySelector("[data-sub-rows]");
  var routeEl = section.querySelector("[data-sub-route]");
  var metaEl = section.querySelector("[data-sub-meta]");
  var rsvpBtn = section.querySelector("[data-sub-rsvp]");
  if (!baseG || !rowsWrap) return;

  function el(name, attrs) { var n = document.createElementNS(SVGNS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function twoLang(elm, en, es) { elm.innerHTML = ""; var a = document.createElement("span"); a.setAttribute("data-lang", "en"); a.innerHTML = en; var b = document.createElement("span"); b.setAttribute("data-lang", "es"); b.innerHTML = es; elm.appendChild(a); elm.appendChild(b); }

  var HUB = { x: 250, y: 150, en: "Wythe Hall", es: "Wythe Hall" };
  var LINES = [
    { id: "coral", color: "#FF6A4D", en: "Coral", es: "Coral", per: 4, stops: [
      { x: 30, y: 150, en: "Bedford Av", es: "Bedford Av" },
      { x: 100, y: 150, en: "Lorimer St", es: "Lorimer St" },
      { x: 175, y: 150, en: "Graham Av", es: "Graham Av" }, HUB ] },
    { id: "pine", color: "#3B4A3A", en: "Pine", es: "Pino", per: 3, stops: [
      { x: 250, y: 24, en: "Greenpoint", es: "Greenpoint" },
      { x: 250, y: 70, en: "McGolrick", es: "McGolrick" },
      { x: 250, y: 112, en: "Nassau Av", es: "Nassau Av" }, HUB ] },
    { id: "slate", color: "#2F6F8F", en: "Slate", es: "Pizarra", per: 5, stops: [
      { x: 40, y: 266, en: "Williamsburg", es: "Williamsburg" },
      { x: 110, y: 226, en: "Marcy Av", es: "Marcy Av" },
      { x: 185, y: 188, en: "Hewes St", es: "Hewes St" }, HUB ] }
  ];

  function pts(stops) { return stops.map(function (s) { return s.x + "," + s.y; }).join(" "); }

  function drawBase() {
    while (baseG.firstChild) baseG.removeChild(baseG.firstChild);
    LINES.forEach(function (ln) {
      baseG.appendChild(el("polyline", { class: "sub-line", points: pts(ln.stops), stroke: ln.color, "stroke-width": 6 }));
    });
    LINES.forEach(function (ln) {
      ln.stops.forEach(function (s, i) {
        if (s === HUB) return;
        baseG.appendChild(el("circle", { class: "sub-stop", cx: s.x, cy: s.y, r: 4.2, stroke: ln.color }));
      });
    });
    // hub marker
    baseG.appendChild(el("rect", { class: "sub-hub", x: HUB.x - 7, y: HUB.y - 7, width: 14, height: 14, rx: 2, transform: "rotate(45 " + HUB.x + " " + HUB.y + ")" }));
    var lbl = el("text", { class: "sub-label", x: HUB.x + 12, y: HUB.y + 3 });
    var a = document.createElementNS(SVGNS, "tspan"); a.setAttribute("data-lang", "en"); a.textContent = "Wythe Hall";
    var b = document.createElementNS(SVGNS, "tspan"); b.setAttribute("data-lang", "es"); b.textContent = "Wythe Hall";
    lbl.appendChild(a); lbl.appendChild(b); baseG.appendChild(lbl);
  }

  var origin = { lineId: "coral", idx: 0 };

  function getLine(id) { for (var i = 0; i < LINES.length; i++) if (LINES[i].id === id) return LINES[i]; return LINES[0]; }

  function render() {
    while (hiG.firstChild) hiG.removeChild(hiG.firstChild);
    var ln = getLine(origin.lineId);
    var seg = ln.stops.slice(origin.idx);
    hiG.appendChild(el("polyline", { class: "sub-hi-line", points: pts(seg), stroke: ln.color, "stroke-width": 6 }));
    seg.forEach(function (s) {
      if (s === HUB) return;
      hiG.appendChild(el("circle", { class: "sub-hi-stop", cx: s.x, cy: s.y, r: 4.6, fill: ln.color }));
    });
    var o = ln.stops[origin.idx];
    hiG.appendChild(el("circle", { class: "sub-origin", cx: o.x, cy: o.y, r: 7, stroke: ln.color }));
    hiG.appendChild(el("rect", { class: "sub-hub", x: HUB.x - 7, y: HUB.y - 7, width: 14, height: 14, rx: 2, fill: ln.color, transform: "rotate(45 " + HUB.x + " " + HUB.y + ")" }));

    var stops = (ln.stops.length - 1) - origin.idx;
    var mins = stops * ln.per + 6;
    twoLang(routeEl, "From <span class=\"hl\">" + o.en + "</span> to Wythe Hall", "Desde <span class=\"hl\">" + o.en + "</span> hasta Wythe Hall");
    var stopWord_en = stops === 1 ? "stop" : "stops";
    twoLang(metaEl, "Ride the " + ln.en + " line &middot; " + stops + " " + stopWord_en + " &middot; about " + mins + " min, plus a 2-min walk.", "Toma la l&iacute;nea " + ln.es + " &middot; " + stops + " paradas &middot; unos " + mins + " min, m&aacute;s 2 min a pie.");
  }

  function buildRows() {
    LINES.forEach(function (ln) {
      var row = document.createElement("div"); row.className = "sub-row";
      var lab = document.createElement("span"); lab.className = "sub-row__label";
      var dot = document.createElement("span"); dot.className = "sub-row__dot"; dot.style.background = ln.color; dot.setAttribute("aria-hidden", "true");
      var txt = document.createElement("span");
      twoLang(txt, ln.en + " line", "L&iacute;nea " + ln.es);
      lab.appendChild(dot); lab.appendChild(txt); row.appendChild(lab);
      var pills = document.createElement("div"); pills.className = "sub-pills";
      ln.stops.forEach(function (s, i) {
        if (s === HUB) return;
        var b = document.createElement("button");
        b.type = "button"; b.className = "sub-pill"; b.setAttribute("data-line", ln.id); b.setAttribute("data-idx", i);
        b.setAttribute("aria-pressed", (origin.lineId === ln.id && origin.idx === i) ? "true" : "false");
        twoLang(b, s.en, s.es);
        b.addEventListener("click", function () {
          origin = { lineId: ln.id, idx: i };
          var all = rowsWrap.querySelectorAll(".sub-pill");
          for (var k = 0; k < all.length; k++) {
            all[k].setAttribute("aria-pressed", (all[k].getAttribute("data-line") === ln.id && all[k].getAttribute("data-idx") === String(i)) ? "true" : "false");
          }
          render();
        });
        pills.appendChild(b);
      });
      row.appendChild(pills); rowsWrap.appendChild(row);
    });
  }

  drawBase();
  buildRows();
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
