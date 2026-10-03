(function () {
  "use strict";

  var WEDDING_DATE = new Date("2026-09-14T16:00:00+02:00").getTime();

  // ---------- Sticky nav scroll state ----------
  var nav = document.querySelector("[data-nav]");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- Mobile menu ----------
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      if (open) menu.setAttribute("hidden", "");
      else menu.removeAttribute("hidden");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        menu.setAttribute("hidden", "");
      });
    });
  }

  // ---------- Reveal-on-scroll ----------
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    revealEls.forEach(function (el) {
      var d = el.getAttribute("data-delay");
      if (d) el.style.setProperty("--reveal-delay", d + "ms");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // ---------- Countdown ----------
  var cdDays = document.querySelector('[data-cd="days"]');
  var cdHours = document.querySelector('[data-cd="hours"]');
  var cdMins = document.querySelector('[data-cd="mins"]');
  var cdSecs = document.querySelector('[data-cd="secs"]');

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function tick() {
    var now = Date.now();
    var diff = Math.max(0, WEDDING_DATE - now);
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    var mins = Math.floor((diff / (1000 * 60)) % 60);
    var secs = Math.floor((diff / 1000) % 60);
    if (cdDays) cdDays.textContent = days;
    if (cdHours) cdHours.textContent = pad(hours);
    if (cdMins) cdMins.textContent = pad(mins);
    if (cdSecs) cdSecs.textContent = pad(secs);
  }
  if (cdDays) {
    tick();
    setInterval(tick, 1000);
  }

  // ---------- RSVP form (no backend) ----------
  var form = document.querySelector(".rsvp-form");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      // Demo only: collect values and show a friendly confirmation.
      var fd = new FormData(form);
      var name = (fd.get("name") || "").toString().trim().split(/\s+/)[0] || "friend";
      var attending = fd.get("attending");
      var msg = attending === "no"
        ? "Thank you, " + name + ". We'll miss you on the day — we'll send you photos."
        : "Yes! Thank you, " + name + ". A confirmation is on its way to your inbox.";
      if (status) { status.textContent = msg; status.dataset.tone = "ok"; }
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

/* ===== Seating chart finder (enhance e1) ===== */
(function () {
  var section = document.querySelector("#seating");
  if (!section) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  var tablesG = section.querySelector("[data-seat-tables]");
  var input = section.querySelector("[data-seat-search]");
  var datalist = section.querySelector("[data-seat-names]");
  var title = section.querySelector("[data-seat-title]");
  var list = section.querySelector("[data-seat-list]");
  var rsvpBtn = section.querySelector("[data-seat-rsvp]");
  if (!tablesG || !input) return;
  function isES() { return document.documentElement.getAttribute("lang") === "es"; }

  var TABLES = [
    { name: "Bellagio", cx: 78, cy: 100 },
    { name: "Varenna", cx: 282, cy: 100 },
    { name: "Tremezzo", cx: 44, cy: 188 },
    { name: "Menaggio", cx: 316, cy: 188 },
    { name: "Cernobbio", cx: 112, cy: 262 },
    { name: "Lenno", cx: 248, cy: 262 }
  ];
  var GUESTS = [
    { n: "Eleanor Hart", t: 0 }, { n: "James Whitfield", t: 0 }, { n: "Sofia Marchetti", t: 0 }, { n: "Daniel Cole", t: 0 },
    { n: "Isabella Romano", t: 1 }, { n: "Marco Bianchi", t: 1 }, { n: "Grace Lin", t: 1 }, { n: "Oliver Bennett", t: 1 },
    { n: "Charlotte Reed", t: 2 }, { n: "Lucas Moretti", t: 2 }, { n: "Amelia Ford", t: 2 }, { n: "Henry Castellano", t: 2 },
    { n: "Mia Conti", t: 3 }, { n: "Benjamin Shaw", t: 3 }, { n: "Valentina Russo", t: 3 }, { n: "Noah Pierce", t: 3 },
    { n: "Clara Esposito", t: 4 }, { n: "William Grant", t: 4 }, { n: "Beatrice Lombardi", t: 4 }, { n: "Thomas Vale", t: 4 },
    { n: "Aria Ferrari", t: 5 }, { n: "Samuel Brooks", t: 5 }, { n: "Giulia De Luca", t: 5 }, { n: "Edward Knight", t: 5 }
  ];
  var groups = [];

  function el(name, attrs) { var n = document.createElementNS(SVGNS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }

  TABLES.forEach(function (tb, i) {
    var g = el("g", { class: "seat-tablegroup" });
    var c = el("circle", { class: "seat-table", cx: tb.cx, cy: tb.cy, r: 28 });
    c.setAttribute("role", "button"); c.setAttribute("tabindex", "0");
    c.setAttribute("aria-label", tb.name + " table");
    var num = el("text", { class: "seat-table-num", x: tb.cx, y: tb.cy - 1 }); num.textContent = (i + 1);
    var nm = el("text", { class: "seat-table-name", x: tb.cx, y: tb.cy + 12 }); nm.textContent = tb.name.toUpperCase();
    g.appendChild(c); g.appendChild(num); g.appendChild(nm);
    function act() { setActive(i, null); }
    c.addEventListener("click", act);
    c.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); act(); } });
    tablesG.appendChild(g);
    groups.push({ g: g, c: c });
  });

  GUESTS.forEach(function (gu) { var o = document.createElement("option"); o.value = gu.n; datalist.appendChild(o); });

  function setActive(ti, guest) {
    groups.forEach(function (gr, i) {
      var on = i === ti;
      gr.g.classList.toggle("is-active", on);
      gr.c.classList.toggle("is-active", on);
    });
    var tb = TABLES[ti];
    title.innerHTML = "";
    var en = document.createElement("span"); en.setAttribute("data-lang", "en");
    var es = document.createElement("span"); es.setAttribute("data-lang", "es");
    if (guest) {
      var first = guest.n.split(" ")[0];
      en.innerHTML = "Welcome, " + first + " &mdash; you&rsquo;re at " + tb.name + ", Table " + (ti + 1);
      es.innerHTML = "Hola " + first + ", est\u00e1s en " + tb.name + ", Mesa " + (ti + 1);
    } else {
      en.innerHTML = tb.name + " &mdash; Table " + (ti + 1);
      es.innerHTML = tb.name + " &mdash; Mesa " + (ti + 1);
    }
    title.appendChild(en); title.appendChild(es);
    list.innerHTML = "";
    GUESTS.filter(function (g2) { return g2.t === ti; }).forEach(function (g2) {
      var li = document.createElement("li");
      li.textContent = g2.n;
      if (guest && g2.n === guest.n) li.className = "is-you";
      list.appendChild(li);
    });
  }

  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) return;
    var match = null;
    for (var i = 0; i < GUESTS.length; i++) { if (GUESTS[i].n.toLowerCase().indexOf(q) === 0) { match = GUESTS[i]; break; } }
    if (!match) for (var j = 0; j < GUESTS.length; j++) { if (GUESTS[j].n.toLowerCase().indexOf(q) !== -1) { match = GUESTS[j]; break; } }
    if (match) setActive(match.t, match);
  });

  if (rsvpBtn) {
    rsvpBtn.addEventListener("click", function () {
      var rsvp = document.querySelector("#rsvp");
      if (rsvp) rsvp.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var f = document.querySelector("#rsvp [name='name']");
      if (f) setTimeout(function () { try { f.focus(); } catch (e) {} }, reduce ? 0 : 480);
    });
  }
})();
