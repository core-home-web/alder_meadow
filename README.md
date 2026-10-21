# Alder Meadow

Website and digital brand style guide for **Alder Meadow — Kitchenware Tools & Gadgets**, built from the *Alder Meadow Branding Guide 2026*.

- `/` — marketing site: brand story, the collection, SS 2027 palette
- `/styleguide/` — logo, color, typeface, design elements, components, tokens and downloads

It's a static site served by the Cloudflare Worker `alder-meadow` using [Workers static assets](https://developers.cloudflare.com/workers/static-assets/). It has no build step.

## Structure

```
public/
  index.html               Home
  styleguide/index.html    Style guide
  404.html
  assets/
    css/tokens.css         Design tokens (colors, type, spacing, shape): the source of truth
    css/brand.css          Base styles and shared components (buttons, tag cards, badges, forms…)
    css/site.css           Home-page layout
    css/styleguide.css     Style-guide layout
    js/main.js             Nav toggle, scroll reveal, copy-to-clipboard
    img/brand/             Logo, wordmark, arched mark, wildflower border, tag shapes (vector, from the guide)
    img/products/          Packaging shots
    img/textures/linen.jpg Seamless linen tile
wrangler.jsonc             Worker config (assets-only)
```

## Develop

```sh
npm install
npm run dev      # http://localhost:8787
```

## Deploy

A push to `main` triggers Cloudflare Workers Builds, which runs `npx wrangler deploy`. To deploy by hand, run `npm run deploy`.

## Fonts

The brand typefaces, **Forma DJR Micro** and **Rollerscript Rough**, are licensed. The font stacks in `tokens.css` list them first. If you add a licensed web-font kit (for example Adobe Fonts) to the page `<head>`, they take over automatically. Until then the site uses the open-source stand-ins **Hanken Grotesk** and **Caveat** from Google Fonts.
