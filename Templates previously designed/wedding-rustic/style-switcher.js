(function () {
  "use strict";

  var STYLES = [
    { value: "default", labelEn: "Signature", labelEs: "Original", swatch: "default" },
    { value: "light", labelEn: "Daylight", labelEs: "Día claro", swatch: "light" },
    { value: "warm", labelEn: "Warm", labelEs: "Cálido", swatch: "warm" },
    { value: "contrast", labelEn: "High contrast", labelEs: "Alto contraste", swatch: "contrast" }
  ];

  var STORAGE_KEY = "ss-template-style:" + location.pathname;
  var root = document.documentElement;

  function getLang() {
    if (root.lang && root.lang.toLowerCase().indexOf("es") === 0) return "es";
    try {
      var params = new URLSearchParams(location.search);
      if ((params.get("lang") || "").toLowerCase() === "es") return "es";
    } catch (e) {}
    return "en";
  }

  function t(en, es) { return getLang() === "es" ? es : en; }

  function readSaved() {
    try {
      var params = new URLSearchParams(location.search);
      var q = params.get("style");
      if (q && STYLES.some(function (s) { return s.value === q; })) return q;
    } catch (e) {}
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      if (v && STYLES.some(function (s) { return s.value === v; })) return v;
    } catch (e) {}
    return "default";
  }

  function applyStyle(value) {
    if (value === "default") root.removeAttribute("data-ss-theme");
    else root.setAttribute("data-ss-theme", value);
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
    var buttons = document.querySelectorAll("[data-ss-option]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].getAttribute("data-ss-option") === value));
    }
  }

  function build() {
    if (document.querySelector(".ss-style-switcher")) return;
    var aside = document.createElement("aside");
    aside.className = "ss-style-switcher";
    aside.setAttribute("aria-label", t("Style options", "Opciones de estilo"));
    aside.setAttribute("data-state", "peek");

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "ss-style-switcher__toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "ss-style-panel");
    toggle.setAttribute("aria-label", t("Show style options", "Mostrar opciones de estilo"));
    toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3m0 12v3M4.6 6.6l2.1 2.1m10.6 10.6 2.1 2.1M3 12h3m12 0h3M4.6 17.4l2.1-2.1M17.3 8.7l2.1-2.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

    var panel = document.createElement("div");
    panel.className = "ss-style-switcher__panel";
    panel.id = "ss-style-panel";
    panel.hidden = true;

    var legend = document.createElement("span");
    legend.className = "ss-style-switcher__legend";
    legend.textContent = t("Style", "Estilo");
    panel.appendChild(legend);

    var list = document.createElement("ul");
    list.className = "ss-style-switcher__list";

    STYLES.forEach(function (s) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-ss-option", s.value);
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML = '<span class="ss-style-switcher__swatch ss-style-switcher__swatch--' + s.swatch + '" aria-hidden="true"></span>' +
        '<span>' + t(s.labelEn, s.labelEs) + '</span>';
      btn.addEventListener("click", function () { applyStyle(s.value); });
      li.appendChild(btn);
      list.appendChild(li);
    });

    panel.appendChild(list);
    aside.appendChild(toggle);
    aside.appendChild(panel);
    document.body.appendChild(aside);

    function setState(state) {
      aside.setAttribute("data-state", state);
      var open = state === "open";
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      toggle.setAttribute("aria-label",
        state === "peek" ? t("Show style options", "Mostrar opciones de estilo")
        : open ? t("Close style options", "Cerrar opciones de estilo")
        : t("Open style options", "Abrir opciones de estilo"));
    }

    toggle.addEventListener("click", function () {
      var state = aside.getAttribute("data-state") || "peek";
      if (state === "peek") setState("ready");
      else if (state === "ready") setState("open");
      else setState("peek");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && aside.getAttribute("data-state") === "open") {
        setState("peek");
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (aside.getAttribute("data-state") !== "open") return;
      if (aside.contains(event.target)) return;
      setState("peek");
    });
  }

  function init() {
    build();
    applyStyle(readSaved());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
