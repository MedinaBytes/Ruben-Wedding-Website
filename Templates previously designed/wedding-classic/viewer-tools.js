/* SevenSides viewer tools — language toggle, copy URL, open in new tab, fullscreen.
 * Renders only inside the protected viewer (/webdeveloper/files/ path).
 */
(function () {
  "use strict";

  var FORCE_VIEWER = false;
  try {
    var __q = new URLSearchParams(location.search);
    FORCE_VIEWER = __q.get("ssviewer") === "1" || (typeof localStorage !== "undefined" && localStorage.getItem("ss-viewer-force") === "1");
  } catch (e) {}
  if (!FORCE_VIEWER && !/^\/webdeveloper\/files\//.test(location.pathname)) return;

  function getLang() {
    try {
      var p = new URLSearchParams(location.search);
      if ((p.get("lang") || "").toLowerCase() === "es") return "es";
    } catch (e) {}
    if ((document.documentElement.lang || "").toLowerCase().indexOf("es") === 0) return "es";
    return "en";
  }

  function t(en, es) { return getLang() === "es" ? es : en; }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
    });
  }

  function getProposalSource() {
    if (window.SS_PROPOSAL && typeof window.SS_PROPOSAL === "object") return window.SS_PROPOSAL;
    if (window.SS_BRAND && typeof window.SS_BRAND === "object") return window.SS_BRAND;
    return null;
  }

  // ---------- Proposal personalization ----------
  var ORIGINAL_IDENTITY = null;
  var PREVIEW_STORAGE_KEY = "ss-customer-preview:" + location.pathname + ":" + getLang();
  var SNAPSHOT = {
    title: null,
    textNodes: new Map(),
    textContent: new Map(),
    attrs: [],
    jsonLd: new Map(),
    logos: [],
  };

  function cleanText(value) { return (value || "").toString().replace(/\s+/g, " ").trim(); }
  function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function rememberTitle() {
    if (SNAPSHOT.title === null) SNAPSHOT.title = document.title;
  }

  function rememberTextNode(node) {
    if (!SNAPSHOT.textNodes.has(node)) SNAPSHOT.textNodes.set(node, node.nodeValue || "");
  }

  function setTextContent(element, value) {
    if (!element || value === null || value === undefined) return;
    if (!SNAPSHOT.textContent.has(element)) SNAPSHOT.textContent.set(element, element.textContent || "");
    element.textContent = value;
  }

  function setAttr(element, name, value) {
    if (!element) return;
    var exists = SNAPSHOT.attrs.some(function (entry) { return entry.element === element && entry.name === name; });
    if (!exists) SNAPSHOT.attrs.push({ element: element, name: name, value: element.getAttribute(name) });
    if (value === null || value === undefined) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }

  function setJsonLd(script, value) {
    if (!SNAPSHOT.jsonLd.has(script)) SNAPSHOT.jsonLd.set(script, script.textContent || "");
    script.textContent = JSON.stringify(value, null, 2);
  }

  function detectJsonLdName() {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var index = 0; index < scripts.length; index++) {
      try {
        var value = JSON.parse(scripts[index].textContent || "{}");
        var items = Array.isArray(value) ? value : [value];
        for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
          if (items[itemIndex] && typeof items[itemIndex].name === "string" && cleanText(items[itemIndex].name)) return cleanText(items[itemIndex].name);
        }
      } catch (error) {}
    }
    return null;
  }

  function detectTemplateIdentity() {
    if (ORIGINAL_IDENTITY) return ORIGINAL_IDENTITY;
    var fullName = null;
    var siteName = document.querySelector('meta[property="og:site_name"]');
    if (siteName && cleanText(siteName.content)) fullName = cleanText(siteName.content);
    if (!fullName) fullName = detectJsonLdName();
    if (!fullName) fullName = cleanText((document.title || "").split(/[—|\-–·]/)[0]);

    var shortName = null;
    var brandTargets = document.querySelectorAll(".brand__word, .brand-word, .brand .wordmark, .brand [class*='word'], a.brand span:not(.sr-only), footer .brand span:not(.sr-only)");
    for (var targetIndex = 0; targetIndex < brandTargets.length; targetIndex++) {
      var targetText = cleanText(brandTargets[targetIndex].textContent);
      if (targetText && targetText.length <= 40) { shortName = targetText; break; }
    }
    if (!shortName && fullName) shortName = cleanText(fullName.replace(/\b(co\.?|company|restaurant|studio|clinic|agency|firm|llc|inc\.?|ltd\.?)\b/ig, "")) || fullName;
    ORIGINAL_IDENTITY = { fullName: fullName || shortName || null, shortName: shortName || fullName || null };
    return ORIGINAL_IDENTITY;
  }

  function displayName(data) {
    return cleanText(data.displayName) || cleanText(data.name) || null;
  }

  function replacementPatterns() {
    var identity = detectTemplateIdentity();
    return [identity.fullName, identity.shortName]
      .filter(Boolean)
      .filter(function (value, index, values) { return values.indexOf(value) === index; })
      .sort(function (left, right) { return right.length - left.length; });
  }

  function replaceIdentityInString(source, data) {
    if (!source) return source;
    var nextFullName = cleanText(data.name);
    var nextDisplayName = displayName(data) || nextFullName;
    if (!nextFullName && !nextDisplayName) return source;
    var identity = detectTemplateIdentity();
    var result = source;
    replacementPatterns().forEach(function (pattern) {
      var replacement = pattern === identity.shortName && pattern !== identity.fullName ? nextDisplayName : nextFullName || nextDisplayName;
      if (replacement) result = result.replace(new RegExp(escapeRegex(pattern), "gi"), replacement);
    });
    return result;
  }

  function isExcludedNode(node) {
    if (!node || !node.parentNode) return true;
    var tag = node.parentNode.nodeName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return true;
    if (/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(node.nodeValue || "")) return true;
    if (node.parentNode.closest && node.parentNode.closest('a[href^="mailto:"], a[href^="tel:"]')) return true;
    return !!(node.parentNode.closest && node.parentNode.closest(".ss-viewer-tools, .ss-style-switcher, .ss-demo-watermark, .ss-viewer-modal"));
  }

  function replaceSafeTextNodes(data) {
    var patterns = replacementPatterns();
    if (!patterns.length || !cleanText(data.name)) return;
    var matcher = new RegExp(patterns.map(escapeRegex).join("|"), "i");
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (isExcludedNode(node) || !cleanText(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return matcher.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    var nextNode;
    while ((nextNode = walker.nextNode())) nodes.push(nextNode);
    nodes.forEach(function (node) {
      rememberTextNode(node);
      node.nodeValue = replaceIdentityInString(node.nodeValue || "", data);
    });
  }

  function applyIdentity(data) {
    if (!cleanText(data.name)) return;
    var nextDisplayName = displayName(data) || cleanText(data.name);
    document.querySelectorAll(".brand__word, .brand-word, .brand .wordmark, .brand [class*='word'], a.brand span:not(.sr-only), footer .brand span:not(.sr-only)").forEach(function (element) {
      var current = cleanText(element.textContent);
      if (current && current.length <= 60) setTextContent(element, nextDisplayName);
    });
    replaceSafeTextNodes(data);
    document.querySelectorAll("[aria-label], img[alt], [title]").forEach(function (element) {
      ["aria-label", "alt", "title"].forEach(function (attrName) {
        var value = element.getAttribute(attrName);
        if (value) {
          var nextValue = replaceIdentityInString(value, data);
          if (nextValue !== value) setAttr(element, attrName, nextValue);
        }
      });
    });
  }

  function updateMetadata(data) {
    var companyName = cleanText(data.name);
    if (!companyName) return;
    rememberTitle();
    var titleSuffix = cleanText(data.heroTitle) || cleanText(data.tagline) || cleanText((SNAPSHOT.title || document.title || "").split(/[|—–-]/).slice(1).join(" "));
    document.title = companyName + (titleSuffix ? " | " + titleSuffix : "");
    var description = cleanText(data.tagline) ? companyName + " - " + cleanText(data.tagline) : replaceIdentityInString(document.querySelector('meta[name="description"]')?.content || "", data);
    document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach(function (meta) {
      if (description) setAttr(meta, "content", description);
    });
    document.querySelectorAll('meta[property="og:site_name"]').forEach(function (meta) { setAttr(meta, "content", companyName); });
    document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach(function (meta) {
      setAttr(meta, "content", companyName + (titleSuffix ? " | " + titleSuffix : ""));
    });
  }

  function applyAddressToJsonLd(addressValue, addressObject) {
    if (!addressValue) return addressObject;
    if (!addressObject || typeof addressObject !== "object" || Array.isArray(addressObject)) return addressValue;
    addressObject.streetAddress = addressValue;
    return addressObject;
  }

  function updateJsonLd(data) {
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (script) {
      try {
        var parsed = JSON.parse(script.textContent || "{}");
        var items = Array.isArray(parsed) ? parsed : [parsed];
        var changed = false;
        items.forEach(function (item) {
          if (!item || typeof item !== "object") return;
          if (data.name && Object.prototype.hasOwnProperty.call(item, "name")) { item.name = cleanText(data.name); changed = true; }
          if ((data.tagline || data.proposalNote) && Object.prototype.hasOwnProperty.call(item, "description")) { item.description = cleanText(data.tagline || data.proposalNote); changed = true; }
          if (data.phone && Object.prototype.hasOwnProperty.call(item, "telephone")) { item.telephone = cleanText(data.phone); changed = true; }
          if (data.email && Object.prototype.hasOwnProperty.call(item, "email")) { item.email = cleanText(data.email); changed = true; }
          if (data.address && Object.prototype.hasOwnProperty.call(item, "address")) { item.address = applyAddressToJsonLd(cleanText(data.address), item.address); changed = true; }
          if (data.logoUrl) { item.logo = data.logoUrl; changed = true; }
        });
        if (changed) setJsonLd(script, Array.isArray(parsed) ? items : items[0]);
      } catch (error) {}
    });
  }

  function applyAccent(color) {
    var id = "ss-brand-accent";
    var existing = document.getElementById(id);
    if (!color) { if (existing) existing.remove(); return; }
    var css = ":root,html,body{" +
      "--color-accent:" + color + "!important;" +
      "--color-primary:" + color + "!important;" +
      "--accent:" + color + "!important;" +
      "--brand:" + color + "!important;" +
      "--color-brand:" + color + "!important;" +
      "--color-secondary:" + color + "!important;" +
      "--primary:" + color + "!important;" +
      "--color-accent-dark:" + color + "!important;" +
      "--color-accent-soft:" + color + "33!important;" +
    "}";
    if (existing) { existing.textContent = css; return; }
    var s = document.createElement("style"); s.id = id; s.textContent = css; document.head.appendChild(s);
  }

  function applyLogo(logoUrl, data) {
    if (!logoUrl) return;
    var selectors = [".brand__mark", ".brand-mark", ".brand img", ".brand svg", "a.brand img", "a.brand svg", "footer .brand img", "footer .brand svg", "header [class*='logo'] img", "header [class*='logo'] svg", "svg[class*='logo']", "img[class*='logo']"];
    var seen = new Set();
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (element) {
        if (seen.has(element) || !element.parentNode || element.closest(".ss-viewer-tools, .ss-viewer-modal")) return;
        seen.add(element);
        var rect = element.getBoundingClientRect();
        if (element.tagName === "IMG") {
          setAttr(element, "style", element.getAttribute("style") || "");
          setAttr(element, "src", logoUrl);
          setAttr(element, "srcset", "");
          setAttr(element, "alt", (cleanText(data && data.name) || "Customer") + " logo");
          element.style.objectFit = "contain";
          return;
        }
        var image = document.createElement("img");
        image.className = "ss-proposal-logo";
        image.src = logoUrl;
        image.alt = (cleanText(data && data.name) || "Customer") + " logo";
        image.style.width = Math.max(28, Math.min(140, Math.round(rect.width || parseInt(element.getAttribute("width"), 10) || 44))) + "px";
        image.style.height = Math.max(28, Math.min(140, Math.round(rect.height || parseInt(element.getAttribute("height"), 10) || 44))) + "px";
        image.style.objectFit = "contain";
        image.style.display = "inline-block";
        image.style.verticalAlign = "middle";
        var originalDisplay = element.style.display;
        element.style.display = "none";
        element.parentNode.insertBefore(image, element.nextSibling);
        SNAPSHOT.logos.push({ original: element, image: image, display: originalDisplay });
      });
    });
  }

  function restoreLogos() {
    SNAPSHOT.logos.forEach(function (entry) {
      try {
        entry.original.style.display = entry.display;
        if (entry.image && entry.image.parentNode) entry.image.parentNode.removeChild(entry.image);
      } catch (error) {}
    });
    SNAPSHOT.logos = [];
  }

  function resetPreview() {
    restoreLogos();
    applyAccent(null);
    applyHiddenSections([]);
    if (SNAPSHOT.title !== null) document.title = SNAPSHOT.title;
    SNAPSHOT.textNodes.forEach(function (value, node) { try { node.nodeValue = value; } catch (error) {} });
    SNAPSHOT.textContent.forEach(function (value, element) { try { element.textContent = value; } catch (error) {} });
    SNAPSHOT.attrs.forEach(function (entry) { try { if (entry.value === null) entry.element.removeAttribute(entry.name); else entry.element.setAttribute(entry.name, entry.value); } catch (error) {} });
    SNAPSHOT.jsonLd.forEach(function (value, script) { try { script.textContent = value; } catch (error) {} });
    SNAPSHOT.title = null;
    SNAPSHOT.textNodes = new Map();
    SNAPSHOT.textContent = new Map();
    SNAPSHOT.attrs = [];
    SNAPSHOT.jsonLd = new Map();
    try { sessionStorage.removeItem(PREVIEW_STORAGE_KEY); } catch (error) {}
  }

  function firstVisible(selector) {
    var elements = document.querySelectorAll(selector);
    for (var index = 0; index < elements.length; index++) {
      if (!elements[index].closest(".ss-viewer-tools, .ss-viewer-modal, .ss-demo-watermark") && elements[index].offsetParent !== null) return elements[index];
    }
    return elements[0] || null;
  }

  function firstVisibleFrom(selectors) {
    for (var index = 0; index < selectors.length; index++) {
      var match = firstVisible(selectors[index]);
      if (match) return match;
    }
    return null;
  }

  function applyHeroContent(data) {
    if (data.heroTitle) {
      var heading = firstVisibleFrom([".hero h1", "[class*='hero'] h1", "section[id='top'] h1", "main h1"]);
      if (heading) setTextContent(heading, cleanText(data.heroTitle));
    }
    if (data.tagline) {
      var tagline = firstVisibleFrom([".hero .eyebrow", "[class*='hero'] .eyebrow", ".hero [class*='kicker']", "[class*='hero'] [class*='kicker']"]);
      if (tagline) setTextContent(tagline, cleanText(data.tagline));
    }
    if (data.proposalNote) {
      var note = firstVisibleFrom([".hero__lede", ".hero-lede", ".hero .lede", "[class*='hero'] [class*='lede']", ".hero p:not(.eyebrow)", "section[id='top'] p:not(.eyebrow)"]);
      if (note) setTextContent(note, cleanText(data.proposalNote));
    }
  }

  function replaceMatchingText(re, replacement) {
    if (!replacement) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (isExcludedNode(node) || !node.nodeValue) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.search(re) >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    var nextNode;
    while ((nextNode = walker.nextNode())) nodes.push(nextNode);
    nodes.forEach(function (node) {
      rememberTextNode(node);
      node.nodeValue = node.nodeValue.replace(re, replacement);
    });
  }

  function setContactRow(term, value, type) {
    var changed = false;
    if (!value) return;
    document.querySelectorAll("dl div, .info-list div, .contact div, footer div").forEach(function (row) {
      var label = row.querySelector("dt, strong, b, span, p");
      var target = row.querySelector("dd") || row;
      if (!label || !target || !new RegExp("^" + term + "$", "i").test(cleanText(label.textContent))) return;
      var link = target.querySelector("a");
      changed = true;
      if (type === "email" && link) { setAttr(link, "href", "mailto:" + value); setTextContent(link, value); return; }
      if (type === "phone" && link) { setAttr(link, "href", "tel:" + value.replace(/[^+\d]/g, "")); setTextContent(link, value); return; }
      setTextContent(target, value);
    });
    return changed;
  }

  function applyContact(data) {
    var addressChanged = setContactRow(t("Address", "Dirección"), cleanText(data.address), "address");
    setContactRow(t("Phone", "Teléfono"), cleanText(data.phone), "phone");
    setContactRow(t("Email", "Email"), cleanText(data.email), "email");
    setContactRow(t("Hours", "Horario"), cleanText(data.hours), "hours");
    if (data.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) { setAttr(link, "href", "mailto:" + cleanText(data.email)); setTextContent(link, cleanText(data.email)); });
      replaceMatchingText(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, cleanText(data.email));
    }
    if (data.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(function (link) { setAttr(link, "href", "tel:" + cleanText(data.phone).replace(/[^+\d]/g, "")); setTextContent(link, cleanText(data.phone)); });
      replaceMatchingText(/\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g, cleanText(data.phone));
    }
    if (data.address && !addressChanged) replaceMatchingText(/\b\d{2,6}\s+[A-Za-z0-9][A-Za-z0-9 .'-]{4,80}(?:,\s*[A-Za-z .'-]{2,40}){1,3}\b/g, cleanText(data.address));
  }

  function applyHeroImage(url) {
    if (!url) return;
    var candidates = document.querySelectorAll(
      ".hero img, .hero picture img, .hero-media img, [data-hero] img, header.hero img, section.hero img, section[id*='hero'] img, picture img"
    );
    var first = candidates[0];
    if (!first) return;
    var picture = first.closest("picture");
    if (picture) {
      picture.querySelectorAll("source").forEach(function (s) { s.remove(); });
    }
    first.src = url;
    if (first.srcset) first.srcset = "";
    first.removeAttribute("data-srcset");
  }

  // Live text overrides captured during Edit Copy mode (persisted in window.SS_TEXT_OVERRIDES).
  window.SS_TEXT_OVERRIDES = window.SS_TEXT_OVERRIDES || (getProposalSource() && getProposalSource().textOverrides) || {};

  function toggleEditCopy(host) {
    var on = document.documentElement.dataset.ssEditCopy === "on";
    if (on) {
      document.documentElement.removeAttribute("data-ss-edit-copy");
      document.querySelectorAll("[data-ss-eid]").forEach(function (el) {
        el.removeAttribute("contenteditable");
        el.style.outline = "";
        el.style.cursor = "";
      });
      flash(host, t("Edit mode off", "Modo edición desactivado"));
      return;
    }
    document.documentElement.dataset.ssEditCopy = "on";
    assignEditableIds();
    document.querySelectorAll("[data-ss-eid]").forEach(function (el) {
      el.setAttribute("contenteditable", "true");
      el.style.outline = "1px dashed rgba(102,242,209,0.6)";
      el.style.outlineOffset = "2px";
      el.style.cursor = "text";
      el.addEventListener("blur", function () {
        var key = el.getAttribute("data-ss-eid");
        var v = el.textContent || "";
        if (key) window.SS_TEXT_OVERRIDES[key] = v;
      });
    });
    flash(host, t("Edit mode on — click any text", "Modo edición — toca cualquier texto"));
  }

  function applyHiddenSections(ids) {
    var id = "ss-brand-hidden";
    var existing = document.getElementById(id);
    if (!ids || !ids.length) { if (existing) existing.remove(); return; }
    var css = ids.map(function (s) { return "#" + s + "{display:none!important}"; }).join("");
    if (existing) { existing.textContent = css; return; }
    var el = document.createElement("style"); el.id = id; el.textContent = css; document.head.appendChild(el);
  }

  // Assign sequential edit IDs to all editable text nodes (h1/h2/h3/h4/p/li/blockquote)
  // so text overrides survive page reloads without selector fragility.
  function assignEditableIds() {
    var nodes = document.querySelectorAll("h1, h2, h3, h4, h5, p, li, blockquote, figcaption");
    var i = 0;
    nodes.forEach(function (n) {
      if (!n.closest(".ss-viewer-tools, .ss-viewer-modal, .ss-style-switcher, .ss-demo-watermark, script, style")) {
        n.setAttribute("data-ss-eid", String(i++));
      }
    });
  }

  function applyTextOverrides(map) {
    if (!map || typeof map !== "object") return;
    Object.keys(map).forEach(function (key) {
      var el = document.querySelector('[data-ss-eid="' + key + '"]');
      if (el && typeof map[key] === "string") el.textContent = map[key];
    });
  }

  function applyPersonalization(data) {
    if (!data) return;
    applyIdentity(data);
    updateMetadata(data);
    updateJsonLd(data);
    applyHeroContent(data);
    if (data.accentColor) applyAccent(data.accentColor);
    if (data.logoUrl) applyLogo(data.logoUrl, data);
    if (data.heroImageUrl) applyHeroImage(data.heroImageUrl);
    if (data.phone || data.email || data.address || data.hours) applyContact(data);
    if (Array.isArray(data.hiddenSections)) applyHiddenSections(data.hiddenSections);
    if (data.textOverrides) {
      assignEditableIds();
      applyTextOverrides(data.textOverrides);
    }
  }

  function flash(host, msg) {
    var n = host.querySelector(".ss-viewer-tools__flash");
    if (!n) {
      n = document.createElement("div");
      n.className = "ss-viewer-tools__flash";
      host.appendChild(n);
    }
    n.textContent = msg;
    n.setAttribute("data-visible", "true");
    clearTimeout(n._timer);
    n._timer = setTimeout(function () { n.setAttribute("data-visible", "false"); }, 1500);
  }

  function toggleLang() {
    try {
      var url = new URL(location.href);
      if (getLang() === "es") url.searchParams.delete("lang");
      else url.searchParams.set("lang", "es");
      location.href = url.pathname + url.search + url.hash;
    } catch (e) {}
  }

  function openNewTab() {
    try { window.open(location.href, "_blank", "noopener,noreferrer"); } catch (e) {}
  }

  async function copyUrl(host) {
    try {
      await navigator.clipboard.writeText(location.href);
      flash(host, t("Link copied", "Enlace copiado"));
    } catch (e) {
      flash(host, t("Copy failed", "No se pudo copiar"));
    }
  }

  async function toggleFullscreen() {
    var el = document.documentElement;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) {}
  }

  function openCompare() {
    var current = encodeURIComponent(location.pathname + location.search);
    try { window.top.location.href = "/webdeveloper/compare?a=" + current + "&b=" + current; }
    catch (e) { window.open("/webdeveloper/compare?a=" + current + "&b=" + current, "_blank"); }
  }

  function buildModal(title, bodyEl, className) {
    var overlay = document.createElement("div");
    overlay.className = "ss-viewer-modal" + (className ? " " + className : "");
    overlay.innerHTML = '<div class="ss-viewer-modal__card" role="dialog" aria-modal="true"><div class="ss-viewer-modal__head"><strong></strong><button type="button" aria-label="Close">×</button></div><div class="ss-viewer-modal__body"></div></div>';
    overlay.querySelector("strong").textContent = title;
    overlay.querySelector(".ss-viewer-modal__body").appendChild(bodyEl);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector("button").addEventListener("click", function () { close(); });
    document.body.appendChild(overlay);

    var lastFocus = document.activeElement;
    function focusables() {
      return overlay.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
    }
    function onKeyDown(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var els = focusables();
      if (!els.length) return;
      var first = els[0];
      var last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    function close() {
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      try { lastFocus && lastFocus.focus && lastFocus.focus(); } catch (e) {}
    }
    overlay.close = close;
    document.addEventListener("keydown", onKeyDown, true);
    setTimeout(function () {
      var els = focusables();
      if (els.length) try { els[0].focus(); } catch (e) {}
    }, 0);

    return overlay;
  }

  function openFeedback(host) {
    var form = document.createElement("form");
    form.className = "ss-viewer-form";
    form.innerHTML =
      '<p class="ss-viewer-form__label">' + t("How was this template?", "¿Cómo te pareció esta plantilla?") + '</p>' +
      '<div class="ss-viewer-form__row" role="radiogroup">' +
        '<label><input type="radio" name="rating" value="up" required> 👍 ' + t("Like", "Me gusta") + '</label>' +
        '<label><input type="radio" name="rating" value="down"> 👎 ' + t("Dislike", "No me gusta") + '</label>' +
      '</div>' +
      '<label class="ss-viewer-form__label">' + t("Comment (optional)", "Comentario (opcional)") +
        '<textarea name="comment" rows="3" placeholder="' + t("Anything we should change?", "¿Qué cambiarías?") + '"></textarea>' +
      '</label>' +
      '<div class="ss-viewer-form__status"></div>' +
      '<div class="ss-viewer-form__actions"><button type="submit">' + t("Send", "Enviar") + '</button></div>';

    var modal = buildModal(t("Send feedback", "Enviar comentario"), form);
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var status = form.querySelector(".ss-viewer-form__status");
      status.textContent = t("Sending…", "Enviando…");
      try {
        var res = await fetch("/api/webdeveloper/feedback", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: fd.get("rating"), comment: fd.get("comment"), path: location.pathname }),
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Send failed.");
        status.textContent = t("Thanks for the feedback!", "¡Gracias por tu comentario!");
        status.dataset.tone = "ok";
        setTimeout(function () { modal.remove(); }, 1200);
      } catch (err) {
        status.textContent = err.message || "Error";
        status.dataset.tone = "err";
      }
    });
  }

  function proposalInput(name, label, type, value, placeholder, extra) {
    var id = "ss-proposal-" + name;
    return '<label class="ss-viewer-form__label" for="' + id + '">' + label +
      '<input id="' + id + '" type="' + type + '" name="' + name + '" value="' + esc(value || "") + '" placeholder="' + esc(placeholder || "") + '" ' + (extra || "") + '></label>';
  }

  function openPersonalize(host) {
    var identity = detectTemplateIdentity();
    var current = Object.assign({}, getProposalSource() || {});
    try {
      var saved = JSON.parse(sessionStorage.getItem(PREVIEW_STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") current = Object.assign(current, saved);
    } catch (err) {}

    var form = document.createElement("form");
    form.className = "ss-viewer-form ss-proposal-form";
    form.innerHTML =
      '<p class="ss-proposal-intro">' + t("Make this selected template look like the customer website proposal. The demo services, gallery, testimonials, and team stay as sample content; the customer identity, hero, logo, and contact details change for preview, export, and sharing.", "Haz que esta plantilla seleccionada parezca la propuesta web del cliente. Los servicios demo, galería, testimonios y equipo se mantienen como muestra; la identidad, hero, logo y contacto cambian para previsualizar, exportar y compartir.") + '</p>' +
      proposalInput("name", t("Customer company name", "Nombre de la empresa"), "text", current.name, identity.fullName || "Customer company", "required") +
      proposalInput("displayName", t("Short display name", "Nombre corto"), "text", current.displayName, identity.shortName || "Customer") +
      proposalInput("heroTitle", t("Hero / proposal title", "Título principal"), "text", current.heroTitle, t("How the first screen should read", "Cómo debe leerse la primera pantalla")) +
      proposalInput("tagline", t("Hero subtitle", "Subtítulo del hero"), "text", current.tagline, t("Short customer-specific line", "Línea breve para el cliente")) +
      '<label class="ss-viewer-form__label" for="ss-proposal-proposalNote">' + t("Hero description / note", "Descripción / nota") + '<textarea id="ss-proposal-proposalNote" name="proposalNote" rows="3" placeholder="' + esc(t("Optional supporting paragraph for the proposal preview", "Párrafo opcional para la propuesta")) + '">' + esc(current.proposalNote || "") + '</textarea></label>' +
      '<div class="ss-viewer-form__row">' +
        proposalInput("phone", t("Phone", "Teléfono"), "tel", current.phone, "(555) 555-1234") +
        proposalInput("email", t("Email", "Email"), "email", current.email, "hello@example.com") +
      '</div>' +
      proposalInput("address", t("Address", "Dirección"), "text", current.address, "123 Main Street, Chicago, IL") +
      proposalInput("hours", t("Hours / basic info", "Horario / información básica"), "text", current.hours, t("Mon-Fri 9 AM-6 PM", "Lun-Vie 9 AM-6 PM")) +
      '<label class="ss-viewer-form__label" for="ss-proposal-accentColor">' + t("Brand color", "Color de marca") + '<input id="ss-proposal-accentColor" type="color" name="accentColor" value="' + esc(current.accentColor || "#66f2d1") + '"></label>' +
      '<label class="ss-viewer-form__label" for="ss-proposal-logo">' + t("Customer logo", "Logo del cliente") + '<input id="ss-proposal-logo" type="file" name="logo" accept="image/png,image/svg+xml,image/jpeg,image/webp"><span class="ss-viewer-form__hint">' + t("PNG, JPG, WebP, or safe SVG. Max 1 MB.", "PNG, JPG, WebP o SVG seguro. Máx. 1 MB.") + '</span></label>' +
      '<div class="ss-viewer-form__status" role="status" aria-live="polite"></div>' +
      '<div class="ss-proposal-actions">' +
        '<button type="button" class="ss-proposal-secondary" data-act="reset">' + t("Reset", "Restablecer") + '</button>' +
        '<button type="button" data-act="preview">' + t("Apply preview", "Aplicar vista") + '</button>' +
      '</div>';

    var modal = buildModal(t("Customer proposal builder", "Constructor de propuesta"), form, "ss-viewer-modal--proposal");

    function status(message, tone) {
      var el = form.querySelector(".ss-viewer-form__status");
      el.textContent = message || "";
      if (tone) el.dataset.tone = tone;
      else delete el.dataset.tone;
    }

    async function collect(uploadLogo) {
      var fd = new FormData(form);
      var data = {
        name: cleanText(fd.get("name")) || null,
        displayName: cleanText(fd.get("displayName")) || null,
        heroTitle: cleanText(fd.get("heroTitle")) || null,
        tagline: cleanText(fd.get("tagline")) || null,
        proposalNote: cleanText(fd.get("proposalNote")) || null,
        phone: cleanText(fd.get("phone")) || null,
        email: cleanText(fd.get("email")) || null,
        address: cleanText(fd.get("address")) || null,
        hours: cleanText(fd.get("hours")) || null,
        accentColor: cleanText(fd.get("accentColor")) || null,
        logoUrl: current.logoUrl || null,
        textOverrides: Object.keys(window.SS_TEXT_OVERRIDES || {}).length ? window.SS_TEXT_OVERRIDES : null,
      };
      var file = fd.get("logo");
      if (file && file instanceof File && file.size > 0) {
        if (uploadLogo) {
          status(t("Uploading logo...", "Subiendo logo..."));
          var up = new FormData();
          up.append("file", file);
          var res = await fetch("/api/webdeveloper/logo", { method: "POST", credentials: "same-origin", body: up });
          var json = await res.json();
          if (!res.ok) throw new Error(json.error || "Upload failed.");
          data.logoUrl = json.url;
          current.logoUrl = json.url;
        } else {
          if (current.logoObjectUrl) URL.revokeObjectURL(current.logoObjectUrl);
          current.logoObjectUrl = URL.createObjectURL(file);
          data.logoUrl = current.logoObjectUrl;
        }
      }
      return data;
    }

    async function applyPreview() {
      var data = await collect(false);
      resetPreview();
      applyPersonalization(data);
      try { sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(Object.assign({}, data, { logoUrl: data.logoUrl && data.logoUrl.indexOf("blob:") === 0 ? null : data.logoUrl }))); } catch (err) {}
      status(t("Customer preview applied to this template.", "Vista del cliente aplicada a esta plantilla."), "ok");
      return data;
    }

    form.querySelector('[data-act="preview"]').addEventListener("click", async function () {
      try { await applyPreview(); } catch (err) { status(err.message || "Error", "err"); }
    });

    form.querySelector('[data-act="reset"]').addEventListener("click", function () {
      resetPreview();
      if (current.logoObjectUrl) URL.revokeObjectURL(current.logoObjectUrl);
      current.logoUrl = null;
      current.logoObjectUrl = null;
      form.reset();
      form.querySelector('[name="accentColor"]').value = "#66f2d1";
      status(t("Preview reset. Original template restored.", "Vista previa restablecida."), "ok");
    });
  }

  // ---------- Cost estimator + component toggles + proposal email ----------
  var ESTIMATOR_STORAGE_KEY = "ss-estimator:" + location.pathname;
  var TOGGLE_HIDE_ATTR = "data-ss-estimator-hidden";

  function getTemplateSlug() {
    var m = location.pathname.match(/\/templates\/([^/]+)/);
    return m ? m[1] : "template";
  }

  function formatMoney(amount) {
    var n = Math.max(0, Math.round(Number(amount) || 0));
    return "$" + n.toLocaleString(getLang() === "es" ? "es-MX" : "en-US");
  }

  function detectToggleableSections() {
    var nodes = document.querySelectorAll("main section, main > article, body > section");
    var seen = new Set();
    var out = [];
    Array.prototype.forEach.call(nodes, function (node) {
      if (seen.has(node)) return;
      // Skip nested sections.
      var parent = node.parentElement;
      while (parent && parent !== document.body) {
        if (parent.tagName === "SECTION" && seen.has(parent)) return;
        parent = parent.parentElement;
      }
      seen.add(node);
      var heading = node.querySelector("h1,h2,h3");
      var label = heading ? cleanText(heading.textContent).slice(0, 60) : (node.id || node.className || "Section");
      if (!label) label = "Section";
      out.push({ node: node, id: node.id || ("sec-" + out.length), label: label });
    });
    return out;
  }

  function getEstimatorConfig() {
    return {
      basePrice: 900,
      sectionPrice: 150, // per included section beyond hero/contact/footer
      addons: [
        { id: "lang_es", label: { en: "Add Spanish translation", es: "Agregar traducción al español" }, price: 400 },
        { id: "cms", label: { en: "Content editor (CMS)", es: "Editor de contenido (CMS)" }, price: 800 },
        { id: "ecommerce", label: { en: "E-commerce / online ordering", es: "E-commerce / pedidos en línea" }, price: 1500 },
        { id: "booking", label: { en: "Booking / appointments", es: "Reservas / citas" }, price: 600 },
        { id: "newsletter", label: { en: "Newsletter integration", es: "Newsletter" }, price: 150 },
        { id: "seo", label: { en: "SEO starter package", es: "Paquete SEO inicial" }, price: 350 },
        { id: "logo", label: { en: "Logo design", es: "Diseño de logo" }, price: 250 },
        { id: "photos", label: { en: "Custom photo sourcing", es: "Selección de fotos" }, price: 200 },
        { id: "domain", label: { en: "Custom domain + email setup", es: "Dominio + correo" }, price: 120 },
      ],
      monthly: [
        { id: "hosting", label: { en: "Hosting & maintenance", es: "Hosting y mantenimiento" }, price: 45 },
        { id: "support", label: { en: "Content updates (2h/mo)", es: "Actualizaciones (2h/mes)" }, price: 60 },
      ],
    };
  }

  function loadEstimatorState() {
    try {
      var raw = sessionStorage.getItem(ESTIMATOR_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveEstimatorState(state) {
    try { sessionStorage.setItem(ESTIMATOR_STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function applySectionToggles(sections, hiddenIds) {
    sections.forEach(function (s) {
      var shouldHide = hiddenIds.indexOf(s.id) !== -1;
      if (shouldHide) {
        if (!s.node.hasAttribute(TOGGLE_HIDE_ATTR)) {
          s.node.setAttribute(TOGGLE_HIDE_ATTR, s.node.style.display || "");
        }
        s.node.style.display = "none";
      } else if (s.node.hasAttribute(TOGGLE_HIDE_ATTR)) {
        var prev = s.node.getAttribute(TOGGLE_HIDE_ATTR);
        s.node.style.display = prev || "";
        s.node.removeAttribute(TOGGLE_HIDE_ATTR);
      }
    });
  }

  function buildProposalEmail(state, totals, customer, identity) {
    var lang = getLang();
    var name = customer.name || identity.fullName || "[Customer]";
    var contact = customer.displayName || (name.split(/\s+/)[0]) || "there";
    var lines = [];
    if (lang === "es") {
      lines.push("Hola " + contact + ",");
      lines.push("");
      lines.push("Gracias por la conversación. Aquí tienes la propuesta para el nuevo sitio web de " + name + ", basada en la vista previa que revisamos hoy.");
      lines.push("");
      lines.push("INCLUYE:");
      state.includedSections.forEach(function (label) { lines.push("  • " + label); });
      if (state.addons.length) {
        lines.push("");
        lines.push("EXTRAS:");
        state.addons.forEach(function (a) { lines.push("  • " + a.label + " — " + formatMoney(a.price)); });
      }
      lines.push("");
      lines.push("Subtotal único: " + formatMoney(totals.oneTime));
      if (totals.monthly > 0) lines.push("Mensual recurrente: " + formatMoney(totals.monthly) + " / mes");
      lines.push("");
      lines.push("Tiempo estimado de entrega: 2 a 3 semanas a partir de la aprobación.");
      lines.push("Incluye 2 rondas de revisión y lanzamiento asistido.");
      lines.push("");
      lines.push("¿Avanzamos? Responde a este correo y te envío el contrato y el enlace de pago del 50% inicial.");
      lines.push("");
      lines.push("Saludos,");
    } else {
      lines.push("Hi " + contact + ",");
      lines.push("");
      lines.push("Thanks for the conversation. Here's the proposal for the new " + name + " website, based on the live preview we reviewed today.");
      lines.push("");
      lines.push("INCLUDED:");
      state.includedSections.forEach(function (label) { lines.push("  • " + label); });
      if (state.addons.length) {
        lines.push("");
        lines.push("ADD-ONS:");
        state.addons.forEach(function (a) { lines.push("  • " + a.label + " — " + formatMoney(a.price)); });
      }
      lines.push("");
      lines.push("One-time subtotal: " + formatMoney(totals.oneTime));
      if (totals.monthly > 0) lines.push("Monthly recurring: " + formatMoney(totals.monthly) + " / month");
      lines.push("");
      lines.push("Estimated turnaround: 2–3 weeks from approval.");
      lines.push("Includes 2 revision rounds and assisted launch.");
      lines.push("");
      lines.push("Ready to proceed? Reply to this email and I'll send the contract and a 50% deposit link.");
      lines.push("");
      lines.push("Best,");
    }
    return lines.join("\n");
  }

  function openEstimator(host) {
    var cfg = getEstimatorConfig();
    var identity = detectTemplateIdentity();
    var sections = detectToggleableSections();
    var saved = loadEstimatorState() || {};
    var customer = {};
    try {
      var p = JSON.parse(sessionStorage.getItem(PREVIEW_STORAGE_KEY) || "null");
      if (p) customer = p;
    } catch (e) {}

    var hiddenIds = Array.isArray(saved.hiddenIds) ? saved.hiddenIds.slice() : [];
    var addonIds = Array.isArray(saved.addonIds) ? saved.addonIds.slice() : ["seo", "domain"];
    var monthlyIds = Array.isArray(saved.monthlyIds) ? saved.monthlyIds.slice() : ["hosting"];

    var form = document.createElement("form");
    form.className = "ss-viewer-form ss-proposal-form ss-estimator-form";

    function row(id, label, price, checked, group) {
      var inputId = "ss-est-" + group + "-" + id;
      return '<label class="ss-estimator-row" for="' + inputId + '">' +
        '<input id="' + inputId + '" type="checkbox" name="' + group + '" value="' + esc(id) + '" ' + (checked ? "checked" : "") + '>' +
        '<span class="ss-estimator-row__label">' + esc(label) + '</span>' +
        '<span class="ss-estimator-row__price">' + (price > 0 ? "+" + formatMoney(price) : t("Included", "Incluido")) + '</span>' +
      '</label>';
    }

    var sectionsHtml = sections.map(function (s) {
      var checked = hiddenIds.indexOf(s.id) === -1;
      return row(s.id, s.label, cfg.sectionPrice, checked, "section");
    }).join("");

    var addonsHtml = cfg.addons.map(function (a) {
      return row(a.id, a.label[getLang()] || a.label.en, a.price, addonIds.indexOf(a.id) !== -1, "addon");
    }).join("");

    var monthlyHtml = cfg.monthly.map(function (m) {
      return row(m.id, m.label[getLang()] || m.label.en, m.price, monthlyIds.indexOf(m.id) !== -1, "monthly");
    }).join("");

    form.innerHTML =
      '<p class="ss-proposal-intro">' + t("Toggle the sections the customer actually wants and pick add-ons. The preview updates live and the proposal email is generated from these selections.", "Activa o desactiva las secciones que el cliente realmente quiere y elige extras. La vista previa se actualiza en vivo y el correo de propuesta se genera con estas selecciones.") + '</p>' +
      '<fieldset class="ss-estimator-group"><legend>' + t("Sections included", "Secciones incluidas") + '</legend>' + (sectionsHtml || '<p class="ss-viewer-form__hint">' + t("No sections detected.", "No se detectaron secciones.") + '</p>') + '</fieldset>' +
      '<fieldset class="ss-estimator-group"><legend>' + t("Add-ons (one-time)", "Extras (único pago)") + '</legend>' + addonsHtml + '</fieldset>' +
      '<fieldset class="ss-estimator-group"><legend>' + t("Recurring (monthly)", "Recurrente (mensual)") + '</legend>' + monthlyHtml + '</fieldset>' +
      '<div class="ss-viewer-form__row">' +
        proposalInput("customerEmail", t("Send to (email)", "Enviar a (email)"), "email", customer.email, "client@example.com") +
        proposalInput("fromName", t("Your name (signature)", "Tu nombre (firma)"), "text", saved.fromName, "Jonathan Medina") +
      '</div>' +
      '<div class="ss-estimator-totals" aria-live="polite">' +
        '<div><span>' + t("Base", "Base") + '</span><strong data-role="base"></strong></div>' +
        '<div><span>' + t("Sections", "Secciones") + '</span><strong data-role="sections"></strong></div>' +
        '<div><span>' + t("Add-ons", "Extras") + '</span><strong data-role="addons"></strong></div>' +
        '<div class="ss-estimator-totals__grand"><span>' + t("One-time total", "Total único") + '</span><strong data-role="onetime"></strong></div>' +
        '<div class="ss-estimator-totals__grand"><span>' + t("Monthly", "Mensual") + '</span><strong data-role="monthly"></strong></div>' +
      '</div>' +
      '<div class="ss-viewer-form__status" role="status" aria-live="polite"></div>' +
      '<div class="ss-proposal-actions">' +
        '<button type="button" class="ss-proposal-secondary" data-act="reset">' + t("Reset", "Restablecer") + '</button>' +
        '<button type="button" class="ss-proposal-secondary" data-act="copy">' + t("Copy email", "Copiar correo") + '</button>' +
        '<button type="button" data-act="mailto">' + t("Open in email client", "Abrir en correo") + '</button>' +
      '</div>';

    var modal = buildModal(t("Cost estimator & proposal email", "Cotizador y correo de propuesta"), form, "ss-viewer-modal--proposal");

    function status(msg, tone) {
      var el = form.querySelector(".ss-viewer-form__status");
      el.textContent = msg || "";
      if (tone) el.dataset.tone = tone; else delete el.dataset.tone;
    }

    function readState() {
      var fd = new FormData(form);
      var checkedSections = fd.getAll("section");
      var hidden = sections.filter(function (s) { return checkedSections.indexOf(s.id) === -1; }).map(function (s) { return s.id; });
      var addons = fd.getAll("addon");
      var monthly = fd.getAll("monthly");
      var includedSections = sections.filter(function (s) { return hidden.indexOf(s.id) === -1; }).map(function (s) { return s.label; });
      var addonObjs = cfg.addons.filter(function (a) { return addons.indexOf(a.id) !== -1; }).map(function (a) { return { id: a.id, label: a.label[getLang()] || a.label.en, price: a.price }; });
      var monthlyObjs = cfg.monthly.filter(function (m) { return monthly.indexOf(m.id) !== -1; }).map(function (m) { return { id: m.id, label: m.label[getLang()] || m.label.en, price: m.price }; });
      return {
        hiddenIds: hidden,
        addonIds: addons,
        monthlyIds: monthly,
        includedSections: includedSections,
        addons: addonObjs,
        monthlyItems: monthlyObjs,
        fromName: cleanText(fd.get("fromName")) || "",
        customerEmail: cleanText(fd.get("customerEmail")) || "",
      };
    }

    function computeTotals(state) {
      var sectionsTotal = state.includedSections.length * cfg.sectionPrice;
      var addonsTotal = state.addons.reduce(function (sum, a) { return sum + a.price; }, 0);
      var monthlyTotal = state.monthlyItems.reduce(function (sum, m) { return sum + m.price; }, 0);
      return {
        base: cfg.basePrice,
        sections: sectionsTotal,
        addons: addonsTotal,
        oneTime: cfg.basePrice + sectionsTotal + addonsTotal,
        monthly: monthlyTotal,
      };
    }

    function refresh() {
      var state = readState();
      applySectionToggles(sections, state.hiddenIds);
      var totals = computeTotals(state);
      form.querySelector('[data-role="base"]').textContent = formatMoney(totals.base);
      form.querySelector('[data-role="sections"]').textContent = formatMoney(totals.sections);
      form.querySelector('[data-role="addons"]').textContent = formatMoney(totals.addons);
      form.querySelector('[data-role="onetime"]').textContent = formatMoney(totals.oneTime);
      form.querySelector('[data-role="monthly"]').textContent = formatMoney(totals.monthly) + " / " + t("mo", "mes");
      saveEstimatorState({
        hiddenIds: state.hiddenIds,
        addonIds: state.addonIds,
        monthlyIds: state.monthlyIds,
        fromName: state.fromName,
      });
      return { state: state, totals: totals };
    }

    form.addEventListener("change", function () { refresh(); });
    form.addEventListener("input", function (e) {
      if (e.target && (e.target.name === "fromName" || e.target.name === "customerEmail")) refresh();
    });

    form.querySelector('[data-act="reset"]').addEventListener("click", function () {
      hiddenIds = [];
      applySectionToggles(sections, []);
      Array.prototype.forEach.call(form.querySelectorAll('input[name="section"]'), function (i) { i.checked = true; });
      Array.prototype.forEach.call(form.querySelectorAll('input[name="addon"]'), function (i) { i.checked = false; });
      Array.prototype.forEach.call(form.querySelectorAll('input[name="monthly"]'), function (i) { i.checked = false; });
      refresh();
      status(t("Estimate reset.", "Cotización restablecida."), "ok");
    });

    function buildEmailParts() {
      var info = refresh();
      var body = buildProposalEmail(info.state, info.totals, customer, identity);
      var signature = info.state.fromName ? "\n" + info.state.fromName : "";
      body += signature;
      var subject = (getLang() === "es" ? "Propuesta de sitio web — " : "Website proposal — ") + (customer.name || identity.fullName || getTemplateSlug());
      return { subject: subject, body: body, to: info.state.customerEmail };
    }

    form.querySelector('[data-act="copy"]').addEventListener("click", async function () {
      var parts = buildEmailParts();
      var text = "Subject: " + parts.subject + "\n\n" + parts.body;
      try {
        await navigator.clipboard.writeText(text);
        status(t("Email copied to clipboard.", "Correo copiado al portapapeles."), "ok");
      } catch (e) {
        // Fallback: select in a textarea.
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); status(t("Email copied.", "Correo copiado."), "ok"); }
        catch (err) { status(t("Copy failed — select and copy manually.", "No se pudo copiar — selecciónalo manualmente."), "err"); }
        document.body.removeChild(ta);
      }
    });

    form.querySelector('[data-act="mailto"]').addEventListener("click", function () {
      var parts = buildEmailParts();
      var href = "mailto:" + encodeURIComponent(parts.to || "") +
        "?subject=" + encodeURIComponent(parts.subject) +
        "&body=" + encodeURIComponent(parts.body);
      // mailto URLs have ~2000 char practical limits; warn if too long.
      if (href.length > 1900) status(t("Email is long — your mail client may truncate. Use Copy email instead.", "Correo largo — puede recortarse. Usa Copiar correo."), "err");
      window.location.href = href;
    });

    refresh();
  }

  function makeButton(label, title, onClick, icon) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ss-viewer-tools__btn";
    if (title) b.title = title;
    if (title) b.setAttribute("aria-label", title);
    b.innerHTML = (icon ? '<span aria-hidden="true" style="margin-right:.35rem">' + icon + '</span>' : "") + '<span>' + label + '</span>';
    b.addEventListener("click", onClick);
    return b;
  }

  function build() {
    if (document.querySelector(".ss-viewer-tools")) return;
    var host = document.createElement("div");
    host.className = "ss-viewer-tools";
    host.setAttribute("data-collapsed", "true");

    var handle = document.createElement("button");
    handle.type = "button";
    handle.className = "ss-viewer-tools__handle";
    handle.setAttribute("aria-label", t("Toggle viewer tools", "Mostrar/ocultar herramientas"));
    handle.innerHTML = "<span aria-hidden=\"true\">⚙</span>";
    handle.addEventListener("click", function () {
      var collapsed = host.getAttribute("data-collapsed") === "true";
      host.setAttribute("data-collapsed", String(!collapsed));
    });
    host.appendChild(handle);

    var group = document.createElement("div");
    group.className = "ss-viewer-tools__group";

    var isEs = getLang() === "es";
    group.appendChild(makeButton(
      isEs ? t("English", "English") : t("Español", "Español"),
      t("Switch language", "Cambiar idioma"),
      toggleLang,
      "🌐"
    ));

    var div1 = document.createElement("span"); div1.className = "ss-viewer-tools__divider"; group.appendChild(div1);

    group.appendChild(makeButton(t("Fullscreen", "Pantalla completa"), t("Toggle fullscreen", "Pantalla completa"), toggleFullscreen, "⤢"));

    // Admin-only tools injected after session check
    var adminSlot = document.createElement("span");
    adminSlot.dataset.role = "admin-slot";
    adminSlot.style.display = "inline-flex";
    adminSlot.style.alignItems = "center";
    adminSlot.style.gap = "0.15rem";
    group.appendChild(adminSlot);

    host.appendChild(group);
    document.body.appendChild(host);

    fetch("/api/webdeveloper/session", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var isAdmin = data && data.role === "admin";
        try {
          var p = new URLSearchParams(location.search);
          if (p.get("ssadmin") === "1" || (typeof localStorage !== "undefined" && localStorage.getItem("ss-viewer-admin") === "1")) isAdmin = true;
        } catch (e) {}
        if (isAdmin) {
          var div2 = document.createElement("span"); div2.className = "ss-viewer-tools__divider"; adminSlot.appendChild(div2);
          adminSlot.appendChild(makeButton(t("Proposal", "Propuesta"), t("Build a customer proposal preview", "Crear vista previa de propuesta"), function () { openPersonalize(host); }, "📄"));
          adminSlot.appendChild(makeButton(t("Estimate", "Cotizar"), t("Cost estimator, component toggles, proposal email", "Cotizador, componentes y correo de propuesta"), function () { openEstimator(host); }, "💰"));
          adminSlot.appendChild(makeButton(t("Edit copy", "Editar texto"), t("Toggle inline copy editing", "Editar textos en línea"), function () { toggleEditCopy(host); }, "✎"));
        }
      })
      .catch(function () {});
  }

  function loadScriptOnce(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-ss-lib="' + src + '"]');
      if (existing) { if (existing.dataset.loaded === "1") resolve(); else { existing.addEventListener("load", resolve); existing.addEventListener("error", reject); } return; }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.dataset.ssLib = src;
      s.onload = function () { s.dataset.loaded = "1"; resolve(); };
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  async function loadCaptureLibs() {
    if (!window.html2canvas) await loadScriptOnce("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  }

  // Fetch a cross-origin image and replace its src with an inline data URL so
  // html2canvas can render it without CORS issues. Skips data:/blob: and same-origin.
  async function inlineCrossOriginImages() {
    var imgs = Array.prototype.slice.call(document.images);
    var origin = location.origin;
    await Promise.all(imgs.map(async function (img) {
      try {
        var src = img.currentSrc || img.src;
        if (!src || src.indexOf("data:") === 0 || src.indexOf("blob:") === 0) return;
        if (src.indexOf("http") !== 0) return;
        var u = new URL(src, location.href);
        if (u.origin === origin) return;
        if (img.dataset.ssInlined === "1") return;
        var res = await fetch(u.href, { mode: "cors", credentials: "omit" });
        if (!res.ok) return;
        var blob = await res.blob();
        var reader = new FileReader();
        var dataUrl = await new Promise(function (resolve, reject) {
          reader.onload = function () { resolve(reader.result); };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        img.dataset.ssOriginalSrc = src;
        img.crossOrigin = "anonymous";
        img.src = dataUrl;
        img.dataset.ssInlined = "1";
        if (typeof img.decode === "function") { try { await img.decode(); } catch (e) {} }
      } catch (e) { /* leave original; html2canvas may still try */ }
    }));
  }

  async function preparePageForCapture() {
    // Eager-load lazy images so they paint before capture.
    Array.prototype.slice.call(document.querySelectorAll('img[loading="lazy"]')).forEach(function (i) {
      try { i.loading = "eager"; } catch (e) {}
    });
    // Wait for fonts so text renders correctly.
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    // Inline cross-origin images to bypass CORS taint.
    await inlineCrossOriginImages();
    // Make sure every image is decoded.
    await Promise.all(Array.prototype.slice.call(document.images).map(function (i) {
      if (i.complete && i.naturalWidth) return Promise.resolve();
      if (typeof i.decode === "function") return i.decode().catch(function () {});
      return new Promise(function (r) { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); });
    }));
    // Small settle for layout.
    await new Promise(function (r) { setTimeout(r, 120); });
  }

  async function captureFullPage() {
    var prevScrollX = window.scrollX || window.pageXOffset || 0;
    var prevScrollY = window.scrollY || window.pageYOffset || 0;
    window.scrollTo(0, 0);
    await new Promise(function (r) { setTimeout(r, 60); });
    var de = document.documentElement;
    var body = document.body;
    var width = Math.max(de.scrollWidth, body.scrollWidth, de.clientWidth);
    var height = Math.max(de.scrollHeight, body.scrollHeight, de.clientHeight);
    try {
      return await window.html2canvas(document.body, {
        backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        scale: Math.min(2, window.devicePixelRatio || 1),
        width: width,
        height: height,
        windowWidth: width,
        windowHeight: height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: function (node) {
          return !!(node.closest && (node.closest(".ss-viewer-tools") || node.closest(".ss-viewer-modal") || node.closest(".ss-demo-watermark") || node.closest(".ss-style-switcher")));
        },
      });
    } finally {
      window.scrollTo(prevScrollX, prevScrollY);
    }
  }

  function decodeBase64Json(str) {
    try {
      var b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var json = decodeURIComponent(Array.prototype.map.call(atob(b64), function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(""));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  async function loadSharedPersonalization() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return null; }
    var inline = params.get("ssp");
    if (inline) {
      var decoded = decodeBase64Json(inline);
      if (decoded && typeof decoded === "object") return decoded;
    }
    var token = params.get("share") || params.get("shareToken");
    if (!token) return null;
    try {
      var res = await fetch("/api/webdeveloper/share/" + encodeURIComponent(token), { credentials: "same-origin" });
      if (!res.ok) return null;
      var json = await res.json();
      return (json && (json.personalization || (json.link && json.link.personalization))) || null;
    } catch (e) { return null; }
  }

  function init() {
    build();
    var proposal = getProposalSource();
    if (proposal) {
      try { applyPersonalization(proposal); } catch (e) {}
      return;
    }
    loadSharedPersonalization().then(function (shared) {
      if (shared && typeof shared === "object") {
        try { applyPersonalization(shared); } catch (e) {}
        try { sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(Object.assign({}, shared, { logoUrl: shared.logoUrl && String(shared.logoUrl).indexOf("blob:") === 0 ? null : shared.logoUrl }))); } catch (e) {}
        return;
      }
      try {
        var saved = JSON.parse(sessionStorage.getItem(PREVIEW_STORAGE_KEY) || "null");
        if (saved && typeof saved === "object") applyPersonalization(saved);
      } catch (e) {
        try { sessionStorage.removeItem(PREVIEW_STORAGE_KEY); } catch (err) {}
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
