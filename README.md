# Alder Meadow

Website for **Alder Meadow — Kitchenware Tools & Gadgets**, built from the *Alder Meadow Branding Guide 2026*. It's served by the Cloudflare Worker `alder-meadow`.

## Pages

| Path | Page |
| --- | --- |
| `/` | Landing page: the brand story and a day of everyday rituals |
| `/about/` | Our story, written in the brand voice |
| `/shop/` | Product listing with category filters (`?category=cook`, `prep`, `pantry`, `table`) |
| `/shop/<slug>/` | Product detail pages with a **Find in a store near you** call to action |
| `/stores/` | Store finder (`?q=`, `?product=`, `?near=me`) |
| `/styleguide/` | **Internal** brand style guide, password-protected |

## How it's built

- `src/data/products.json` holds the product catalog: names, copy, features, specs, care, imagery and related products.
- `scripts/build.mjs` generates the public pages into `public/` from that data. Run `npm run build` after any change. The generated HTML is committed, and `wrangler deploy` also runs the build first (see `wrangler.jsonc`).
- `public/assets/data/stores.json` holds store locations. While it's empty, the store finder shows a "coming soon" message. Each store looks like this:
  ```json
  { "id": "1", "name": "…", "retailer": "…", "address": "…", "city": "…", "state": "…", "zip": "…",
    "lat": 0, "lng": 0, "phone": "…", "url": "…", "products": ["magnetic-bag-clip-set"] }
  ```
  Use `"products": "all"` for a store that carries the whole collection.
- **E-commerce later:** set a product's `shopUrl` in `products.json` and its product page shows a **Buy online** button next to Find in a store.
- `src/worker.js` serves the static files and puts Basic Auth in front of `/styleguide/`.

## Style guide access

The style guide is for internal use only. It's left out of all public navigation, marked `noindex`, disallowed in `robots.txt`, and gated by the Worker. To enable access, set a password on the Worker:

```sh
npx wrangler secret put STYLEGUIDE_PASSWORD   # username is "alder" (override with STYLEGUIDE_USER)
```

You can also set it in the Cloudflare dashboard under Workers & Pages → alder-meadow → Settings → Variables and Secrets. Until a password is set, `/styleguide/` returns a locked message.

## Develop

```sh
npm install
echo 'STYLEGUIDE_PASSWORD="local"' > .dev.vars
npm run dev      # builds, then serves at http://localhost:8787
```

## Deploy

A push to `main` triggers Cloudflare Workers Builds, which runs `npx wrangler deploy`.

## Fonts

The brand typefaces, **Forma DJR Micro** and **Rollerscript Rough**, are licensed. The font stacks in `public/assets/css/tokens.css` list them first, so adding a licensed web-font kit (for example Adobe Fonts) makes them take over automatically. Until then the site uses the open-source stand-ins **Hanken Grotesk** and **Caveat**.
