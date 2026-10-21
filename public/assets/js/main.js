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

  // Product page gallery
  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const main = gallery.querySelector("[data-gallery-main]");
    const thumbs = gallery.querySelectorAll(".pdp__thumb");
    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        main.src = thumb.dataset.src;
        main.width = Number(thumb.dataset.width);
        main.height = Number(thumb.dataset.height);
        main.alt = thumb.dataset.alt;
        thumbs.forEach((t) => t.setAttribute("aria-pressed", String(t === thumb)));
      });
    });
  });

  // Find-in-store dialog (product pages)
  const dialog = document.getElementById("store-finder");
  if (dialog && typeof dialog.showModal === "function") {
    document.querySelectorAll("[data-open-store-finder]").forEach((btn) => {
      btn.addEventListener("click", () => {
        dialog.showModal();
        dialog.querySelector("input[name='q']")?.focus();
      });
    });
    dialog.querySelectorAll("[data-close-dialog]").forEach((btn) => btn.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  } else {
    // No <dialog> support: send shoppers straight to the store finder
    document.querySelectorAll("[data-open-store-finder]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slug = document.querySelector("#store-finder input[name='product']")?.value || "";
        window.location.href = `/stores/${slug ? `?product=${encodeURIComponent(slug)}` : ""}`;
      });
    });
  }

  // Shop filters
  const grid = document.querySelector(".shop__grid");
  if (grid) {
    const buttons = document.querySelectorAll("[data-filter]");
    const items = grid.querySelectorAll("li[data-categories]");
    const count = document.querySelector("[data-count]");
    const empty = document.querySelector(".shop__empty");
    const apply = (filter, push) => {
      let shown = 0;
      items.forEach((li) => {
        const match = filter === "all" || li.dataset.categories.split(" ").includes(filter);
        li.hidden = !match;
        if (match) shown++;
      });
      document.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
      if (count) count.textContent = shown;
      if (empty) empty.hidden = shown > 0;
      if (push) {
        const u = new URL(window.location.href);
        if (filter === "all") u.searchParams.delete("category"); else u.searchParams.set("category", filter);
        history.replaceState(null, "", u);
      }
    };
    buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter, true)));
    const initial = new URLSearchParams(window.location.search).get("category");
    if (initial && document.querySelector(`.filter[data-filter="${CSS.escape(initial)}"]`)) apply(initial, false);
  }

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
