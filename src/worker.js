// Alder Meadow — Worker entry.
// Serves the static site from /public and keeps the internal style guide
// behind HTTP Basic Auth. Set the password with:
//   npx wrangler secret put STYLEGUIDE_PASSWORD
// (optional) STYLEGUIDE_USER — defaults to "alder".

const PROTECTED = /^\/styleguide(\/|$)/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!PROTECTED.test(url.pathname)) return env.ASSETS.fetch(request);

    const password = env.STYLEGUIDE_PASSWORD;
    if (!password) {
      return new Response(
        "The Alder Meadow style guide is internal. Set the STYLEGUIDE_PASSWORD secret on this Worker to enable access.",
        { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } }
      );
    }

    if (!(await authorized(request, env.STYLEGUIDE_USER || "alder", password))) {
      return new Response("Authentication required.", {
        status: 401,
        headers: {
          "www-authenticate": 'Basic realm="Alder Meadow style guide", charset="UTF-8"',
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
        },
      });
    }

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("cache-control", "private, no-store");
    headers.set("x-robots-tag", "noindex, nofollow");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};

async function authorized(request, user, password) {
  const header = request.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }
  const i = decoded.indexOf(":");
  if (i < 0) return false;
  const [a, b] = await Promise.all([digest(decoded), digest(`${user}:${password}`)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function digest(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}
