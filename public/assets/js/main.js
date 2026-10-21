/* Alder Meadow — progressive enhancements (site + style guide) */
(() => {
  document.documentElement.classList.remove("no-js");

  // Sticky header hairline once the page scrolls
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile navigation
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById(toggle?.getAttribute("aria-controls") || "");
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  // Gentle reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && items.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("is-visible"));
  }

  // Copy-to-clipboard for color values and tokens (style guide)
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        return;
      }
      const original = btn.getAttribute("aria-label") || "";
      btn.classList.add("is-copied");
      btn.setAttribute("aria-label", `Copied ${value}`);
      setTimeout(() => {
        btn.classList.remove("is-copied");
        btn.setAttribute("aria-label", original);
      }, 1400);
    });
  });

  // Style guide: highlight the section in view in the side navigation
  const tocLinks = document.querySelectorAll(".sg-toc a[href^='#']");
  if ("IntersectionObserver" in window && tocLinks.length) {
    const map = new Map();
    tocLinks.forEach((a) => {
      const section = document.querySelector(a.getAttribute("href"));
      if (section) map.set(section, a);
    });
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => a.removeAttribute("aria-current"));
        map.get(entry.target)?.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    map.forEach((_, section) => spy.observe(section));
  }
})();
