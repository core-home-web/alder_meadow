// Alder Meadow — static page generator.
// Renders the public pages into /public from src/data/products.json.
// Run with `npm run build` after editing product data or templates.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");
const { categories, products } = JSON.parse(readFileSync(join(root, "src/data/products.json"), "utf8"));
const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fullName = (p) => (p.kicker && !p.name.toLowerCase().includes(p.kicker.toLowerCase()) ? `${p.kicker} ${p.name}` : p.name);
const url = (p) => `/shop/${p.slug}/`;

function write(path, html) {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log("  wrote", path);
}

/* ---------------------------------------------------------------- icons */
const ICONS = {
  magnet: '<path d="M7 5h5v11a4 4 0 0 0 8 0V5h5v11a9 9 0 0 1-18 0Z"/><path d="M7 10h5M20 10h5"/>',
  multi: '<rect x="12" y="12" width="8" height="8" rx="1"/><circle cx="6" cy="6" r="2.5"/><circle cx="26" cy="6" r="2.5"/><circle cx="6" cy="26" r="2.5"/><circle cx="26" cy="26" r="2.5"/><path d="m8 8 4 4M24 8l-4 4M8 24l4-4M24 24l-4-4"/>',
  grip: '<path d="M12 17V6.5a2 2 0 0 1 4 0V15M16 13.5a2 2 0 0 1 4 0V16M20 15a2 2 0 0 1 4 0v5c0 4.4-3.1 8-7.5 8h-.6a7 7 0 0 1-5.6-2.8L6.5 20.6a2 2 0 0 1 3-2.6L12 20.5"/>',
  shield: '<path d="M16 4 6 8v7c0 6.5 4.3 11 10 13 5.7-2 10-6.5 10-13V8Z"/><path d="m11.5 16 3 3 6-6.5"/>',
  leaf: '<path d="M7 25C7 13 14 6 26 6c0 12-7 19-19 19Z"/><path d="M7 25 19 13"/>',
  feet: '<rect x="4" y="9" width="24" height="12" rx="3"/><path d="M8 21v3M24 21v3"/>',
  nest: '<path d="M4 8h24l-9 9v8h-6v-8Z"/><path d="M9 12.5h14"/>',
  drop: '<path d="M16 4c4.5 6 8 10.4 8 14.5a8 8 0 0 1-16 0C8 14.4 11.5 10 16 4Z"/><path d="M12.5 19.5a3.6 3.6 0 0 0 3.5 3"/>',
  wood: '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6.5"/><circle cx="16" cy="16" r="2"/>',
  pot: '<path d="M11 5h10M12.5 5c0 3-4.5 5-4.5 11a8 8 0 0 0 16 0c0-6-4.5-8-4.5-11"/><path d="M9 18c4 1.5 10 1.5 14 0"/>',
  sprig: '<path d="M16 29V9"/><path d="M16 20c-4 0-7-3-7-7 4 0 7 3 7 7ZM16 15c4 0 7-3 7-7-4 0-7 3-7 7ZM16 9c-1.7-1.4-1.7-4.6 0-6 1.7 1.4 1.7 4.6 0 6Z"/>',
  pin: '<path d="M16 29s9-8.2 9-15a9 9 0 0 0-18 0c0 6.8 9 15 9 15Z"/><circle cx="16" cy="14" r="3.2"/>',
  locate: '<circle cx="16" cy="16" r="7"/><circle cx="16" cy="16" r="2"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5"/>',
  search: '<circle cx="14" cy="14" r="8"/><path d="m20 20 7 7"/>',
  store: '<path d="M5 13v14h22V13"/><path d="M3 13 6 5h20l3 8Z"/><path d="M13 27v-7h6v7"/>',
  bag: '<path d="M7 10h18l-1.5 17h-15Z"/><path d="M12 13V8a4 4 0 0 1 8 0v5"/>',
  close: '<path d="M8 8l16 16M24 8 8 24"/>',
  arrow: '<path d="M6 16h20M19 9l7 7-7 7"/>',
  sun: '<circle cx="16" cy="16" r="5.5"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8"/>',
  moon: '<path d="M24 20.5A10 10 0 0 1 11.5 8a10 10 0 1 0 12.5 12.5Z"/>',
};
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${Object.entries(ICONS)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 32 32">${v}</symbol>`)
  .join("")}</svg>`;
const icon = (name, cls = "") => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

/* --------------------------------------------------------------- layout */
const NAV = [
  { href: "/shop/", label: "Shop", key: "shop" },
  { href: "/#rituals", label: "Rituals", key: "rituals" },
  { href: "/about/", label: "Our Story", key: "about" },
];

function header(active) {
  return `<header class="site-header">
    <div class="container site-header__inner">
      <a class="brand-link" href="/" aria-label="Alder Meadow — home">
        <img src="/assets/img/brand/badge-160.webp" width="52" height="52" alt="">
        <img class="brand-link__word" src="/assets/img/brand/wordmark.svg" width="150" height="31" alt="">
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <nav class="nav" id="site-nav" aria-label="Primary">
        <ul class="nav__list" role="list">
          ${NAV.map((n) => `<li><a class="nav__link" href="${n.href}"${n.key === active ? ' aria-current="page"' : ""}>${n.label}</a></li>`).join("\n          ")}
        </ul>
        <a class="btn btn--sm" href="/stores/"${active === "stores" ? ' aria-current="page"' : ""}>${icon("pin", "btn__icon")} Find a store</a>
      </nav>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="meadow meadow--ink site-footer__meadow" aria-hidden="true"></div>
    <div class="container">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <img src="/assets/img/brand/wordmark-white.svg" width="174" height="36" alt="Alder Meadow">
          <p>Kitchenware tools &amp; gadgets rooted in simple living and the quiet comfort of home.</p>
          <a class="btn btn--sage btn--sm" href="/stores/">${icon("pin", "btn__icon")} Find a store near you</a>
        </div>
        <div>
          <h2>Shop</h2>
          <ul role="list">
            <li><a href="/shop/">All products</a></li>
            ${categories.map((c) => `<li><a href="/shop/?category=${c.id}">${c.name}</a></li>`).join("\n            ")}
          </ul>
        </div>
        <div>
          <h2>Alder Meadow</h2>
          <ul role="list">
            <li><a href="/about/">Our story</a></li>
            <li><a href="/#rituals">Everyday rituals</a></li>
            <li><a href="/stores/">Find a store</a></li>
          </ul>
        </div>
      </div>
      <div class="site-footer__base">
        <span>© 2026 Alder Meadow</span>
        <span>Kitchenware tools &amp; gadgets</span>
      </div>
    </div>
  </footer>`;
}

function page({ path, title, description, active = "", bodyClass = "", body, head = "", scripts = "" }) {
  const fullTitle = title ? `${title} — Alder Meadow` : "Alder Meadow — Kitchenware Tools & Gadgets";
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#ADB39C">
  <meta property="og:site_name" content="Alder Meadow">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="/assets/img/brand/badge-512.png">
  <meta property="og:type" content="website">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Hanken+Grotesk:wght@300;400;500;600&display=swap">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/brand.css">
  <link rel="stylesheet" href="/assets/css/site.css">
  ${head}
  <script src="/assets/js/main.js" defer></script>
  ${scripts}
</head>
<body class="${bodyClass}">
  <a class="skip-link" href="#main">Skip to content</a>
  ${sprite}
  ${header(active)}
  <main id="main">
${body}
  </main>
  ${footer()}
</body>
</html>
`;
}

/* ----------------------------------------------------------- components */
const countBadge = (p, cls = "") =>
  p.pieces ? `<span class="count-badge ${cls}"><b>${p.pieces}</b><span>Piece set</span></span>` : "";

const features = (p) =>
  `<ul class="features" role="list">${p.features.map((f) => `<li class="feature">${icon(f.icon)}${esc(f.label)}</li>`).join("")}</ul>`;

function productCard(p, { headingLevel = 3, lazy = true } = {}) {
  const h = `h${headingLevel}`;
  return `<article class="tag tag--linen product product--link" data-categories="${p.categories.join(" ")}">
      <div class="product__media">
        <img src="${p.image.src}" width="${p.image.width}" height="${p.image.height}"${lazy ? ' loading="lazy"' : ""} alt="${esc(p.image.alt)}">
        ${countBadge(p, "product__badge")}
      </div>
      <p class="ruled product__kicker">${esc(p.kicker)}</p>
      <${h} class="title-light product__name"><a class="product__link" href="${url(p)}">${esc(p.name)}</a></${h}>
      <p class="product__desc">${esc(p.tagline)}</p>
      <div class="product__foot">
        ${features(p)}
        <span class="product__cta">View details ${icon("arrow", "icon--sm")}</span>
      </div>
    </article>`;
}

function storeBand({ product } = {}) {
  const q = product ? `<input type="hidden" name="product" value="${product.slug}">` : "";
  return `<section class="store-band" aria-labelledby="store-band-title">
      <div class="container store-band__inner">
        <img class="store-band__spot" src="/assets/img/spots/lace.webp" width="505" height="508" alt="" loading="lazy">
        <div class="store-band__copy">
          <p class="script script--lg">come find us</p>
          <h2 id="store-band-title">${product ? `Find the ${esc(product.name.toLowerCase())} near you` : "Find Alder Meadow near you"}</h2>
          <p>Alder Meadow is making its way to store shelves. Search by ZIP code or city to see where you can find us.</p>
        </div>
        <form class="store-search" action="/stores/" method="get" role="search">
          ${q}
          <label class="visually-hidden" for="store-band-q">ZIP code or city</label>
          <div class="store-search__field">
            ${icon("pin")}
            <input class="input" id="store-band-q" name="q" type="text" inputmode="search" autocomplete="postal-code" placeholder="ZIP code or city">
          </div>
          <button class="btn" type="submit">Find a store</button>
        </form>
      </div>
    </section>`;
}

/* ================================================================= HOME */
function home() {
  const shelf = ["utensils", "funnel", "board", "knives", "clips"];
  const shelfProducts = {
    utensils: bySlug["cooking-utensil-set"],
    funnel: bySlug["silicone-funnel-set"],
    board: bySlug["acacia-wood-cutting-board"],
    knives: bySlug["stainless-steel-steak-knives"],
    clips: bySlug["magnetic-bag-clip-set"],
  };
  const rituals = [
    { p: bySlug["silicone-funnel-set"], icon: "sun" },
    { p: bySlug["magnetic-bag-clip-set"], icon: "sun" },
    { p: bySlug["cooking-utensil-set"], icon: "sun" },
    { p: bySlug["acacia-wood-cutting-board"], icon: "moon", extra: bySlug["stainless-steel-steak-knives"] },
  ];

  const body = `
    <!-- Hero: the guide cover, brought to life -->
    <section class="landing-hero" aria-labelledby="hero-title">
      <div class="container landing-hero__copy">
        <p class="label landing-hero__eyebrow">Kitchenware tools &amp; gadgets</p>
        <h1 class="display" id="hero-title">Made for the quiet rituals of home</h1>
        <p class="lead">Kitchen essentials shaped by hand-thrown pottery, the warmth of wooden tools and the calm of the natural world, so the things you reach for every day feel like home.</p>
        <div class="landing-hero__actions">
          <a class="btn" href="/shop/">Shop the collection <span class="arrow" aria-hidden="true">→</span></a>
          <a class="btn btn--outline" href="/stores/">${icon("pin", "btn__icon")} Find a store near you</a>
        </div>
      </div>
      <div class="shelf" aria-label="The Alder Meadow collection">
        <div class="meadow shelf__meadow" aria-hidden="true"></div>
        <ul class="shelf__items" role="list">
          ${shelf
            .map((k) => {
              const p = shelfProducts[k];
              return `<li class="shelf__item shelf__item--${k}"><a href="${url(p)}" aria-label="${esc(fullName(p))}"><img src="${p.image.src}" width="${p.image.width}" height="${p.image.height}" alt="${esc(p.image.alt)}" fetchpriority="${k === "board" ? "high" : "auto"}"></a></li>`;
            })
            .join("\n          ")}
        </ul>
        <div class="linen shelf__ledge" aria-hidden="true"></div>
      </div>
    </section>

    <!-- Story -->
    <section class="intro linen" aria-labelledby="intro-title">
      <div class="container intro__grid">
        <div class="intro__art reveal" aria-hidden="true">
          <img src="/assets/img/brand/badge.svg" width="300" height="300" alt="" class="intro__badge" loading="lazy">
          <img src="/assets/img/spots/anemone.webp" width="560" height="524" alt="" class="intro__spot" loading="lazy">
        </div>
        <div class="intro__copy reveal">
          <p class="ruled ruled--start label">Our story</p>
          <h2 id="intro-title" class="intro__statement">The most meaningful moments happen in the most ordinary places.</h2>
          <div class="prose">
            <p>At the stove on a slow afternoon. By the window with the first cup of coffee. Around the table long after the plates are cleared. Alder Meadow is rooted in the beauty of simple living and the quiet comfort of home.</p>
            <p>We make kitchen essentials that bring a sense of intention and ease to everyday rituals, so cooking feels less like a chore and more like a moment that's yours. Tools that feel as natural, timeless and comforting as home itself.</p>
          </div>
          <a class="link intro__link" href="/about/">Read our story ${icon("arrow", "icon--sm")}</a>
        </div>
      </div>
    </section>

    <!-- Rituals -->
    <section class="section rituals" id="rituals" aria-labelledby="rituals-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="ruled label">From morning to evening</p>
          <h2 id="rituals-title">A day of small rituals</h2>
          <p class="lead">Our tools are made for the in-between moments, the ones that quietly make a house feel like home.</p>
        </header>
        <ol class="ritual-list" role="list">
          ${rituals
            .map(
              ({ p, extra }, i) => `<li class="ritual reveal${i % 2 ? " ritual--flip" : ""}" style="--ritual:${p.ritual.color}">
            <div class="ritual__art">
              <img class="ritual__spot" src="/assets/img/spots/${p.ritual.spot}.webp" alt="" loading="lazy" width="400" height="400">
              <img class="ritual__product" src="${p.image.src}" width="${p.image.width}" height="${p.image.height}" alt="${esc(p.image.alt)}" loading="lazy">
              ${extra ? `<img class="ritual__product ritual__product--extra" src="${extra.image.src}" width="${extra.image.width}" height="${extra.image.height}" alt="${esc(extra.image.alt)}" loading="lazy">` : ""}
            </div>
            <div class="ritual__copy">
              <p class="ritual__time"><span class="ritual__num">0${i + 1}</span><span class="script">${p.ritual.time}</span></p>
              <h3 class="h2">${esc(p.ritual.title)}</h3>
              <p>${esc(p.ritual.text)}</p>
              <div class="ritual__links">
                <a class="btn btn--outline btn--sm" href="${url(p)}">Shop the ${esc(p.name.toLowerCase())}</a>
                ${extra ? `<a class="btn btn--outline btn--sm" href="${url(extra)}">Shop the ${esc(extra.name.toLowerCase())}</a>` : ""}
              </div>
            </div>
          </li>`
            )
            .join("\n          ")}
        </ol>
      </div>
    </section>

    <!-- Collection -->
    <section class="section collection linen" aria-labelledby="collection-title">
      <div class="container">
        <header class="section-head section-head--split reveal">
          <div>
            <p class="ruled ruled--start label">The collection</p>
            <h2 id="collection-title">Made for the everyday</h2>
          </div>
          <a class="btn btn--outline" href="/shop/">Shop all products <span class="arrow" aria-hidden="true">→</span></a>
        </header>
        <ul class="product-rail" role="list">
          ${products.map((p) => `<li class="reveal">${productCard(p)}</li>`).join("\n          ")}
        </ul>
      </div>
    </section>

    <!-- Made with intention -->
    <section class="section intention" aria-labelledby="intention-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="script script--xl intention__script" aria-hidden="true">made with intention</p>
          <h2 id="intention-title">Thoughtful from the first sketch</h2>
        </header>
        <ul class="pillars" role="list">
          <li class="pillar-card reveal">
            <img src="/assets/img/spots/anemone-side.webp" width="479" height="468" alt="" loading="lazy">
            <h3 class="h4">Shaped like thrown clay</h3>
            <p>We borrow from hand-thrown pottery: soft shoulders, gentle curves and forms that feel good to hold.</p>
          </li>
          <li class="pillar-card reveal">
            <img src="/assets/img/spots/clover.webp" width="282" height="352" alt="" loading="lazy">
            <h3 class="h4">Warmed by natural materials</h3>
            <p>Wood that feels warm in your hand and familiar from the very first stir, the kind of comfort you come back to every day.</p>
          </li>
          <li class="pillar-card reveal">
            <img src="/assets/img/spots/lace.webp" width="505" height="508" alt="" loading="lazy">
            <h3 class="h4">Drawn from the meadow</h3>
            <p>Hand-drawn wildflowers and woven linen wrap every piece, as lovely on the shelf as on your counter.</p>
          </li>
        </ul>
      </div>
    </section>


    ${storeBand()}`;

  return page({
    path: "/",
    title: "",
    description:
      "Alder Meadow makes kitchen essentials rooted in simple living, inspired by hand-thrown pottery, warm wooden tools and the quiet beauty of the natural world.",
    body,
    bodyClass: "page-home",
    head: '<link rel="preload" as="image" href="/assets/img/brand/meadow.webp" type="image/webp">',
  });
}

/* ================================================================ ABOUT */
function about() {
  const body = `
    <section class="about-hero" aria-labelledby="about-title">
      <div class="container container--narrow about-hero__inner">
        <img src="/assets/img/brand/mark.svg" width="150" height="155" alt="" class="about-hero__mark">
        <p class="label">Our story</p>
        <h1 class="display" id="about-title">Rooted in simple living</h1>
        <p class="script script--xl about-hero__script">welcome home</p>
      </div>
      <div class="meadow about-hero__meadow" aria-hidden="true"></div>
    </section>

    <section class="about-open linen" aria-label="Our beginning">
      <div class="container container--narrow">
        <p class="about-open__lead reveal">Alder Meadow is rooted in the beauty of simple living and the quiet comfort of home.</p>
        <div class="prose about-open__prose reveal">
          <p>We believe a kitchen is more than the room where meals get made. It's where mornings begin and evenings wind down, where recipes are passed along and conversations run long. The tools in it should feel like they belong there.</p>
          <p>So we design kitchen essentials that bring a sense of intention and ease to everyday rituals. Pieces that feel calm to use, comforting to hold and good to come home to. Pieces you'll want to leave out on the counter.</p>
        </div>
      </div>
    </section>

    <section class="section about-name" aria-labelledby="name-title">
      <div class="container about-name__grid">
        <figure class="about-name__art reveal" aria-hidden="true">
          <img src="/assets/img/spots/anemone.webp" width="560" height="524" alt="" loading="lazy">
        </figure>
        <div class="reveal">
          <p class="ruled ruled--start label">The name</p>
          <h2 id="name-title">Where the alder meets the meadow</h2>
          <div class="prose">
            <p>Alders grow along streams and at the soft edges of meadows. They're sturdy, unassuming trees that quietly enrich the ground around them, and in early spring they hang with catkins long before the leaves arrive.</p>
            <p>That's the kind of presence we want in your kitchen: dependable, unfussy and good for everything around it. The meadow brings the rest: wildflowers, open air and the sense that there's always time to slow down.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section about-inspire linen" aria-labelledby="inspire-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="ruled label">What inspires us</p>
          <h2 id="inspire-title">Clay, wood and wildflowers</h2>
        </header>
        <ul class="inspire" role="list">
          <li class="inspire__item reveal">
            ${icon("pot", "inspire__icon")}
            <h3 class="h4">Hand-thrown pottery</h3>
            <p>The organic forms of a potter's wheel: a rim that isn't perfectly round, a glaze that pools just so. We look for that same softness in every shape we make.</p>
          </li>
          <li class="inspire__item reveal">
            ${icon("wood", "inspire__icon")}
            <h3 class="h4">Wooden tools</h3>
            <p>The warmth of a spoon worn smooth by years of stirring. Natural materials age with you and grow more beautiful the more they're used.</p>
          </li>
          <li class="inspire__item reveal">
            ${icon("sprig", "inspire__icon")}
            <h3 class="h4">The natural world</h3>
            <p>Anemone, clover and Queen Anne's lace. The grounding beauty of a meadow is in everything we make, along with the unhurried pace we hope you'll keep.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section about-believe" aria-labelledby="believe-title">
      <div class="container about-believe__grid">
        <div class="reveal">
          <p class="script script--xl about-believe__script" aria-hidden="true">what we believe</p>
          <h2 id="believe-title">A slower, more thoughtful way of living</h2>
          <p class="lead">We celebrate the everyday, and we make tools that help you do the same.</p>
        </div>
        <ol class="values__list reveal" role="list">
          <li><span class="values__num" aria-hidden="true">01</span><h3 class="h4">Intention over excess</h3><p>Every piece earns its place by bringing ease to a daily ritual. Fewer, better things.</p></li>
          <li><span class="values__num" aria-hidden="true">02</span><h3 class="h4">Ease in the everyday</h3><p>Comfortable grips, steady feet, sizes that nest. Small details that make the work feel lighter.</p></li>
          <li><span class="values__num" aria-hidden="true">03</span><h3 class="h4">Warmth you can feel</h3><p>Natural materials and gentle, handmade details that make a kitchen feel lived in and loved.</p></li>
          <li><span class="values__num" aria-hidden="true">04</span><h3 class="h4">Made to stay</h3><p>Timeless rather than trendy: designs that feel as right in ten years as they do today.</p></li>
        </ol>
      </div>
    </section>

    <section class="about-feel linen" aria-labelledby="feel-title">
      <div class="container about-feel__grid">
        <div class="reveal">
          <p class="ruled ruled--start label">How it feels</p>
          <h2 id="feel-title">Like coming home</h2>
          <div class="prose">
            <p>We hope an Alder Meadow kitchen feels like exhaling at the end of a long day. Like the first warm sip of coffee before anyone else is awake. Like setting the table for the people you love.</p>
            <p>Every piece arrives wrapped in linen and hand-drawn wildflowers, so even a little something for yourself feels like a gift.</p>
          </div>
        </div>
        <ul class="feelings reveal" role="list">
          <li><span class="script">calm</span><p>The rush slows down. A quiet pour, an easy stir, a moment that's all yours.</p></li>
          <li><span class="script">comfort</span><p>Tools that feel familiar the very first time you pick them up.</p></li>
          <li><span class="script">delight</span><p>Small things that make you smile, like a clip right where you left it or a board that stays put.</p></li>
          <li><span class="script">belonging</span><p>The feeling that everything has its place in your kitchen, and so do you.</p></li>
        </ul>
      </div>
    </section>

    <section class="quote surface-sage" aria-label="Our promise">
      <div class="meadow meadow--ink quote__meadow" aria-hidden="true"></div>
      <div class="container container--narrow quote__inner">
        <img src="/assets/img/brand/mark-ink.svg" width="110" height="114" alt="" class="quote__mark" loading="lazy">
        <blockquote>
          <p class="title-light quote__text">The things we use every day should feel as natural, timeless and comforting as home itself.</p>
        </blockquote>
        <p class="script script--lg">— alder meadow</p>
        <div class="quote__actions">
          <a class="btn" href="/shop/">Shop the collection</a>
          <a class="btn btn--outline" href="/stores/">Find a store</a>
        </div>
      </div>
    </section>`;

  return page({
    path: "/about/",
    title: "Our Story",
    description:
      "Alder Meadow is rooted in the beauty of simple living and the quiet comfort of home. Kitchen essentials inspired by hand-thrown pottery, wooden tools and the natural world.",
    active: "about",
    bodyClass: "page-about",
    body,
  });
}

/* ================================================================= SHOP */
function shop() {
  const body = `
    <section class="shop-hero" aria-labelledby="shop-title">
      <div class="container shop-hero__inner">
        <div>
          <p class="ruled ruled--start label">The collection</p>
          <h1 id="shop-title">Shop Alder Meadow</h1>
          <p class="lead">Thoughtful tools for stirring, pouring, slicing and storing, each one wrapped in our wildflower linen.</p>
        </div>
        <img class="shop-hero__spot" src="/assets/img/spots/anemone-side.webp" width="479" height="468" alt="" aria-hidden="true">
      </div>
      <div class="meadow shop-hero__meadow" aria-hidden="true"></div>
    </section>

    <section class="shop linen" aria-label="Products">
      <div class="container">
        <div class="shop__bar">
          <div class="filters" role="group" aria-label="Filter by category">
            <button class="filter" type="button" data-filter="all" aria-pressed="true">All</button>
            ${categories.map((c) => `<button class="filter" type="button" data-filter="${c.id}" aria-pressed="false">${c.name}</button>`).join("\n            ")}
          </div>
          <p class="shop__count" aria-live="polite"><span data-count>${products.length}</span> products</p>
        </div>
        <ul class="product-grid shop__grid" role="list">
          ${products.map((p, i) => `<li data-categories="${p.categories.join(" ")}">${productCard(p, { lazy: i > 2 })}</li>`).join("\n          ")}
        </ul>
        <p class="shop__empty" hidden>No products in this category yet. <button class="link" type="button" data-filter="all">See everything</button></p>
      </div>
    </section>

    ${storeBand()}`;

  return page({
    path: "/shop/",
    title: "Shop",
    description: "Shop the Alder Meadow collection: cooking utensils, silicone funnels, acacia cutting boards, magnetic bag clips and steak knives.",
    active: "shop",
    bodyClass: "page-shop",
    body,
  });
}

/* ================================================================== PDP */
function pdp(p) {
  const images = [p.image, ...p.gallery];
  const related = p.pairsWith.map((s) => bySlug[s]).filter(Boolean);
  const primaryCat = p.categories[0];
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fullName(p),
    description: p.summary,
    image: images.map((i) => i.src),
    brand: { "@type": "Brand", name: "Alder Meadow" },
    category: p.categories.map((c) => catName[c]).join(", "),
    color: p.colorway.name,
  };

  const body = `
    <nav class="breadcrumb container" aria-label="Breadcrumb">
      <ol role="list">
        <li><a href="/">Home</a></li>
        <li><a href="/shop/">Shop</a></li>
        <li><a href="/shop/?category=${primaryCat}">${catName[primaryCat]}</a></li>
        <li><span aria-current="page">${esc(p.name)}</span></li>
      </ol>
    </nav>

    <section class="pdp container" aria-labelledby="pdp-title">
      <div class="pdp__gallery" data-gallery>
        <div class="pdp__stage linen">
          <img class="pdp__main" data-gallery-main src="${p.image.src}" width="${p.image.width}" height="${p.image.height}" alt="${esc(p.image.alt)}" fetchpriority="high">
          ${countBadge(p, "pdp__badge")}
        </div>
        <ul class="pdp__thumbs" role="list" aria-label="Product images">
          ${images
            .map(
              (img, i) => `<li><button class="pdp__thumb" type="button" data-src="${img.src}" data-width="${img.width}" data-height="${img.height}" data-alt="${esc(img.alt)}" aria-label="Show image ${i + 1} of ${images.length}" aria-pressed="${i === 0}"><img src="${img.src}" width="${img.width}" height="${img.height}" alt="" loading="lazy"></button></li>`
            )
            .join("\n          ")}
        </ul>
      </div>

      <div class="pdp__info">
        <p class="ruled ruled--start pdp__kicker">${esc(p.kicker)}</p>
        <h1 class="title-light pdp__title" id="pdp-title">${esc(p.name)}</h1>
        <p class="pdp__tagline">${esc(p.tagline)}</p>
        <p class="pdp__summary">${esc(p.summary)}</p>

        <dl class="pdp__meta">
          <div>
            <dt>Color</dt>
            <dd>${esc(p.colorway.name)}</dd>
          </div>
          ${p.pieces ? `<div><dt>Set</dt><dd>${p.pieces} pieces</dd></div>` : ""}
        </dl>

        <div class="pdp__actions">
          <button class="btn btn--block" type="button" data-open-store-finder>${icon("pin", "btn__icon")} Find in a store near you</button>
          ${
            p.shopUrl
              ? `<a class="btn btn--outline btn--block" href="${esc(p.shopUrl)}">${icon("bag", "btn__icon")} Buy online</a>`
              : `<p class="pdp__note">${icon("bag", "icon--sm")} Online ordering is coming soon.</p>`
          }
        </div>

        <div class="pdp__features">${features(p)}</div>

        <div class="accordion">
          <details open>
            <summary>Details</summary>
            <ul class="pdp__list">${p.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          </details>
          <details>
            <summary>What's in the set</summary>
            <ul class="pdp__list">${p.inTheSet.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          </details>
          <details>
            <summary>Specifications</summary>
            <dl class="pdp__specs">${p.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
          </details>
          <details>
            <summary>Care</summary>
            <ul class="pdp__list">${p.care.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          </details>
        </div>
      </div>
    </section>

    <section class="pdp-ritual" style="--ritual:${p.ritual.color}" aria-labelledby="ritual-title">
      <div class="container pdp-ritual__inner">
        <img class="pdp-ritual__spot" src="/assets/img/spots/${p.ritual.spot}.webp" alt="" aria-hidden="true" loading="lazy" width="400" height="400">
        <div class="pdp-ritual__copy reveal">
          <p class="script script--lg">${esc(p.ritual.time)} ritual</p>
          <h2 id="ritual-title">${esc(p.ritual.title)}</h2>
          <p class="lead">${esc(p.ritual.text)}</p>
        </div>
      </div>
    </section>

    <section class="section pdp-why" aria-labelledby="why-title">
      <div class="container">
        <header class="section-head reveal">
          <p class="ruled label">Why you'll love it</p>
          <h2 id="why-title">Small details, everyday ease</h2>
        </header>
        <ul class="why" role="list">
          ${p.highlights
            .map(
              (h, i) => `<li class="why__item reveal"><span class="why__num" aria-hidden="true">0${i + 1}</span><h3 class="h4">${esc(h.title)}</h3><p>${esc(h.text)}</p></li>`
            )
            .join("\n          ")}
        </ul>
      </div>
    </section>

    ${
      related.length
        ? `<section class="section related linen" aria-labelledby="related-title">
      <div class="container">
        <header class="section-head section-head--split reveal">
          <div>
            <p class="ruled ruled--start label">Pairs well with</p>
            <h2 id="related-title">Complete the ritual</h2>
          </div>
          <a class="btn btn--outline" href="/shop/">Shop all products <span class="arrow" aria-hidden="true">→</span></a>
        </header>
        <ul class="product-grid product-grid--2" role="list">
          ${related.map((r) => `<li class="reveal">${productCard(r)}</li>`).join("\n          ")}
        </ul>
      </div>
    </section>`
        : ""
    }

    ${storeBand({ product: p })}

    <dialog class="store-dialog" id="store-finder" aria-labelledby="store-dialog-title">
      <form class="store-dialog__panel" action="/stores/" method="get">
        <button class="store-dialog__close" type="button" data-close-dialog aria-label="Close">${icon("close")}</button>
        <img src="${p.image.src}" width="${p.image.width}" height="${p.image.height}" alt="" class="store-dialog__img">
        <p class="ruled ruled--start label">Find in store</p>
        <h2 class="h3" id="store-dialog-title">${esc(fullName(p))}</h2>
        <p class="muted">Enter your ZIP code or city to see stores near you that carry this item.</p>
        <input type="hidden" name="product" value="${p.slug}">
        <div class="field">
          <label class="field__label" for="dialog-q">ZIP code or city</label>
          <input class="input" id="dialog-q" name="q" type="text" inputmode="search" autocomplete="postal-code" placeholder="e.g. 97201 or Portland" required>
        </div>
        <div class="store-dialog__actions">
          <button class="btn btn--block" type="submit">${icon("search", "btn__icon")} Search stores</button>
          <button class="btn btn--outline btn--block" type="submit" name="near" value="me" formnovalidate>${icon("locate", "btn__icon")} Use my location</button>
        </div>
      </form>
    </dialog>

    <script type="application/ld+json">${JSON.stringify(ld)}</script>`;

  return page({
    path: url(p),
    title: fullName(p),
    description: `${fullName(p)} by Alder Meadow. ${p.tagline}`,
    active: "shop",
    bodyClass: "page-pdp",
    body,
    head: `<meta property="og:image" content="${p.image.src}">`,
  });
}

/* =============================================================== STORES */
function stores() {
  const catalog = Object.fromEntries(products.map((p) => [p.slug, { name: fullName(p), image: p.image.src, url: url(p) }]));
  const body = `
    <section class="stores-hero" aria-labelledby="stores-title">
      <div class="container container--narrow stores-hero__inner">
        <p class="label">Find a store</p>
        <h1 id="stores-title">Find Alder Meadow near you</h1>
        <p class="lead">Search by ZIP code or city, or use your location, to find stores that carry the collection.</p>
        <form class="store-search store-search--lg" data-store-search role="search">
          <label class="visually-hidden" for="stores-q">ZIP code or city</label>
          <div class="store-search__field">
            ${icon("pin")}
            <input class="input" id="stores-q" name="q" type="text" inputmode="search" autocomplete="postal-code" placeholder="ZIP code or city">
          </div>
          <button class="btn" type="submit">${icon("search", "btn__icon")} Search</button>
          <button class="btn btn--outline" type="button" data-locate>${icon("locate", "btn__icon")} Use my location</button>
        </form>
        <div class="stores-product" data-store-product hidden></div>
      </div>
      <div class="meadow stores-hero__meadow" aria-hidden="true"></div>
    </section>

    <section class="stores linen" aria-labelledby="results-title">
      <div class="container">
        <h2 class="visually-hidden" id="results-title">Store results</h2>
        <p class="stores__status" data-store-status aria-live="polite"></p>
        <ul class="stores__list" data-store-list role="list"></ul>

        <div class="stores__soon" data-store-soon hidden>
          <img src="/assets/img/spots/clover.webp" width="282" height="352" alt="" aria-hidden="true">
          <div>
            <p class="script script--lg">coming soon</p>
            <h2 class="h3">We're on our way to shelves near you</h2>
            <p>Alder Meadow is arriving at our first retail partners soon. Store locations will appear here as soon as they're stocked, so check back before your next shopping trip.</p>
            <div class="stores__soon-actions">
              <a class="btn" href="/shop/">Browse the collection</a>
              <a class="btn btn--outline" href="/about/">Read our story</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <script>window.ALDER_PRODUCTS = ${JSON.stringify(catalog)};</script>`;

  return page({
    path: "/stores/",
    title: "Find a Store",
    description: "Find Alder Meadow kitchen essentials at a store near you. Search by ZIP code or city.",
    active: "stores",
    bodyClass: "page-stores",
    body,
    scripts: '<script src="/assets/js/stores.js" defer></script>',
  });
}

/* ================================================================== 404 */
function notFound() {
  const body = `
    <section class="nf">
      <div class="container container--narrow nf__inner">
        <img src="/assets/img/brand/badge.svg" width="150" height="150" alt="">
        <p class="script script--lg">wandered off the path</p>
        <h1 class="h2">Page not found</h1>
        <p class="muted">The page you're looking for has gone to seed. Let's get you back to the meadow.</p>
        <div class="nf__actions">
          <a class="btn" href="/">Back home</a>
          <a class="btn btn--outline" href="/shop/">Shop the collection</a>
        </div>
      </div>
      <div class="meadow" aria-hidden="true"></div>
    </section>`;
  return page({ path: "/404.html", title: "Page Not Found", description: "This page could not be found.", body, bodyClass: "page-404", head: '<meta name="robots" content="noindex">' });
}

/* ================================================================ BUILD */
console.log("Building Alder Meadow…");
write("index.html", home());
write("about/index.html", about());
write("shop/index.html", shop());
products.forEach((p) => write(`shop/${p.slug}/index.html`, pdp(p)));
write("stores/index.html", stores());
write("404.html", notFound());
console.log("Done.");
