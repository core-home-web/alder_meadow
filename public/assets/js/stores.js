/* Alder Meadow — store finder
   Reads /assets/data/stores.json. Each store:
   { id, name, retailer, address, city, state, zip, lat, lng, phone, url, products: [slugs] | "all" }
   Until stores are added, the page shows a "coming soon" message. */
(() => {
  const form = document.querySelector("[data-store-search]");
  if (!form) return;

  const input = form.querySelector("input[name='q']");
  const locateBtn = form.querySelector("[data-locate]");
  const list = document.querySelector("[data-store-list]");
  const status = document.querySelector("[data-store-status]");
  const soon = document.querySelector("[data-store-soon]");
  const productBox = document.querySelector("[data-store-product]");
  const catalog = window.ALDER_PRODUCTS || {};

  const params = new URLSearchParams(window.location.search);
  let productSlug = params.get("product");
  const product = productSlug && catalog[productSlug] ? catalog[productSlug] : null;
  if (!product) productSlug = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  if (product && productBox) {
    productBox.hidden = false;
    productBox.innerHTML = `
      <img src="${esc(product.image)}" alt="" width="48" height="64">
      <span>Showing stores for <a class="link" href="${esc(product.url)}">${esc(product.name)}</a></span>
      <a class="link stores-product__clear" href="/stores/${params.get("q") ? `?q=${encodeURIComponent(params.get("q"))}` : ""}">Show all products</a>`;
  }

  let stores = [];
  const ready = fetch("/assets/data/stores.json", { headers: { accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : { stores: [] }))
    .then((data) => { stores = Array.isArray(data.stores) ? data.stores : []; })
    .catch(() => { stores = []; });

  const carries = (s) => !productSlug || s.products === "all" || (Array.isArray(s.products) && s.products.includes(productSlug));

  const km = (a, b) => {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const render = (results, label) => {
    list.innerHTML = "";
    if (!stores.length) {
      soon.hidden = false;
      status.textContent = "";
      return;
    }
    soon.hidden = true;
    if (!results.length) {
      status.textContent = `No stores found${label ? ` near ${label}` : ""}. Try another ZIP code or city.`;
      return;
    }
    status.textContent = `${results.length} store${results.length === 1 ? "" : "s"}${label ? ` near ${label}` : ""}`;
    list.innerHTML = results.map(({ store: s, distance }) => {
      const addr = [s.address, [s.city, s.state].filter(Boolean).join(", "), s.zip].filter(Boolean).join(" · ");
      const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([s.name, s.address, s.city, s.state, s.zip].filter(Boolean).join(" "))}`;
      return `<li class="store-card">
        <div>
          ${s.retailer ? `<p class="label muted">${esc(s.retailer)}</p>` : ""}
          <h3 class="h4">${esc(s.name)}</h3>
          <p>${esc(addr)}</p>
          ${s.phone ? `<p><a class="link" href="tel:${esc(s.phone.replace(/[^\d+]/g, ""))}">${esc(s.phone)}</a></p>` : ""}
        </div>
        <div class="store-card__side">
          ${distance != null ? `<span class="store-card__dist">${(distance * 0.621371).toFixed(1)} mi</span>` : ""}
          <a class="btn btn--outline btn--sm" href="${maps}" target="_blank" rel="noopener">Directions</a>
          ${s.url ? `<a class="link" href="${esc(s.url)}" target="_blank" rel="noopener">Store website</a>` : ""}
        </div>
      </li>`;
    }).join("");
  };

  const searchText = async (q) => {
    await ready;
    const term = q.trim().toLowerCase();
    const pool = stores.filter(carries);
    const results = (term
      ? pool.filter((s) => [s.zip, s.city, s.state, s.name, s.retailer].some((v) => v && String(v).toLowerCase().startsWith(term)) ||
          (s.zip && term.length >= 3 && String(s.zip).startsWith(term.slice(0, 3))))
      : pool
    ).map((store) => ({ store, distance: null }));
    render(results, term ? q.trim() : "");
  };

  const searchNear = async () => {
    await ready;
    if (!stores.length) return render([], "");
    if (!("geolocation" in navigator)) {
      status.textContent = "Your browser can't share a location. Try a ZIP code or city instead.";
      return;
    }
    status.textContent = "Finding stores near you…";
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here = { lat: coords.latitude, lng: coords.longitude };
        const results = stores
          .filter((s) => carries(s) && typeof s.lat === "number" && typeof s.lng === "number")
          .map((store) => ({ store, distance: km(here, store) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 20);
        render(results, "you");
      },
      () => { status.textContent = "We couldn't get your location. Try a ZIP code or city instead."; },
      { timeout: 10000, maximumAge: 600000 }
    );
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = new URL(window.location.href);
    u.searchParams.set("q", input.value.trim());
    u.searchParams.delete("near");
    history.replaceState(null, "", u);
    searchText(input.value);
  });
  locateBtn?.addEventListener("click", searchNear);

  const q = params.get("q");
  if (q) input.value = q;
  if (params.get("near") === "me") searchNear();
  else searchText(q || "");
})();
