/* VENKI'S GREEN — minimal vanilla JS
 * - i18n: data-i18n attribute → looks up I18N[lang].path.to.key, falls back to en
 * - language switcher
 * - sticky nav scroll state
 * - mobile menu
 * - simple in-view reveal (IntersectionObserver, lightweight, no library)
 */
(function () {
  "use strict";

  const STORAGE_KEY = "vg.lang";

  function getByPath(obj, path) {
    if (!obj) return undefined;
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  function t(key, lang) {
    return getByPath(window.I18N[lang], key) ?? getByPath(window.I18N.en, key) ?? key;
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = t(key, lang);
      if (typeof val === "string") el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"), lang));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"), lang));
    });
    // Update language switcher current label
    const cur = window.LANGS.find((l) => l.code === lang) || window.LANGS[0];
    const btn = document.getElementById("langCurrent");
    if (btn) btn.textContent = cur.native;
    document.querySelectorAll("[data-lang-opt]").forEach((b) => {
      b.setAttribute("aria-selected", b.dataset.langOpt === lang ? "true" : "false");
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  }

  function buildLangMenu() {
    const menu = document.getElementById("langMenu");
    if (!menu) return;
    menu.innerHTML = window.LANGS.map(
      (l) => `<button type="button" role="option" data-lang-opt="${l.code}"
        class="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-cream-100/60
               aria-selected:bg-forest-800 aria-selected:text-cream-50">
        <span class="font-medium">${l.native}</span>
        <span class="text-xs opacity-60">${l.label}</span>
      </button>`
    ).join("");
    menu.addEventListener("click", (e) => {
      const b = e.target.closest("[data-lang-opt]");
      if (!b) return;
      applyLang(b.dataset.langOpt);
      closeLangMenu();
    });
  }

  function openLangMenu() {
    const menu = document.getElementById("langMenu");
    if (!menu) return;
    menu.classList.remove("hidden");
    menu.classList.add("flex");
    document.getElementById("langBtn").setAttribute("aria-expanded", "true");
  }
  function closeLangMenu() {
    const menu = document.getElementById("langMenu");
    if (!menu) return;
    menu.classList.add("hidden");
    menu.classList.remove("flex");
    document.getElementById("langBtn").setAttribute("aria-expanded", "false");
  }

  function initLangSwitcher() {
    const btn = document.getElementById("langBtn");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = document.getElementById("langMenu");
      menu.classList.contains("hidden") ? openLangMenu() : closeLangMenu();
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#langWrap")) closeLangMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLangMenu();
    });
  }

  function initNavScroll() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const onScroll = () => {
      const scrolled = window.scrollY > 24;
      nav.classList.toggle("nav--scrolled", scrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    const btn  = document.getElementById("menuBtn");
    const menu = document.getElementById("mobileMenu");
    if (!btn || !menu) return;
    const toggle = (open) => {
      menu.classList.toggle("hidden", !open);
      btn.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("overflow-hidden", open);
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle(menu.classList.contains("hidden"));
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) toggle(false);
    });
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("hidden") && !e.target.closest("#nav")) toggle(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggle(false);
    });
  }

  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
  }

  function initFakeForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = document.getElementById("formNote");
      if (note) {
        note.classList.remove("opacity-0");
        note.classList.add("opacity-100");
      }
      form.reset();
    });
  }

  function detectInitialLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && window.I18N[saved]) return saved;
    } catch (_) {}
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return window.I18N[nav] ? nav : "en";
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildLangMenu();
    initLangSwitcher();
    initNavScroll();
    initMobileMenu();
    initReveal();
    initFakeForm();
    applyLang(detectInitialLang());
    // year stamp
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  });
})();
