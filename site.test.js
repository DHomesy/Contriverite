import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createSiteServer, getListenOptions } from "./server.js";

const server = createSiteServer();
let origin;

before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("keeps local development private and exposes production on Railway's port", () => {
  assert.deepEqual(getListenOptions({}), { host: "127.0.0.1", port: 5173 });
  assert.deepEqual(getListenOptions({ NODE_ENV: "production", PORT: "8080" }), { host: "0.0.0.0", port: 8080 });
  assert.deepEqual(getListenOptions({ NODE_ENV: "production", HOST: "127.0.0.1", PORT: "6000" }), { host: "127.0.0.1", port: 6000 });
});

test("rejects invalid deployment ports", () => {
  for (const port of ["", "not-a-port", "0", "-1", "65536", "12.5"]) {
    assert.throws(() => getListenOptions({ PORT: port }), /PORT must be an integer between 1 and 65535/);
  }
});

test("serves all public assets with correct content types", async () => {
  for (const [path, contentType] of [
    ["/", "text/html"],
    ["/index.html", "text/html"],
    ["/styles.css", "text/css"],
    ["/script.js", "text/javascript"],
    ["/favicon.svg", "image/svg+xml"],
  ]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get("content-type").startsWith(contentType), path);
    assert.ok((await response.text()).length > 0, path);
  }
});

test("HEAD requests return asset headers without a body", async () => {
  const response = await fetch(origin, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.ok(Number(response.headers.get("content-length")) > 0);
  assert.equal(await response.text(), "");
});

test("supports asset query strings without broadening the public file list", async () => {
  assert.equal((await fetch(`${origin}/styles.css?v=1`)).status, 200);
  assert.equal((await fetch(`${origin}/server.js?v=1`)).status, 404);
});

test("does not expose project files or accept form submissions", async () => {
  for (const path of ["/package.json", "/server.js", "/site.test.js", "/.env", "/missing", "/%2e%2e/server.js"]) {
    assert.equal((await fetch(`${origin}${path}`)).status, 404, path);
  }
  const response = await fetch(origin, { method: "POST", body: "test" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("every internal navigation and SVG reference has a target", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "IDs must be unique");
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(match[1]), `Missing target: ${match[1]}`);
  }
});

test("all four service CTAs map to inquiry form options", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const services = [...html.matchAll(/data-service="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(services, ["website", "software", "security", "ai"]);
  for (const service of services) {
    assert.ok(html.includes(`<option value="${service}">`), service);
  }
  assert.ok(html.includes("support@contriverite.com"));
  assert.ok(html.includes("Nothing is sent through this site."));
});

test("provides direct email if JavaScript does not load", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  assert.match(html, /<form[^>]+id="project-form"[^>]+hidden>/);
  assert.match(html, /<button[^>]+class="menu-toggle"[^>]+hidden>/);
  assert.ok(html.includes('id="contact-fallback"'));
  assert.ok(html.includes('href="mailto:support@contriverite.com"'));
});

test("keeps the page concise with approximately 20 percent more copy", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const hero = html.match(/<section class="hero\b[\s\S]*?<\/section>/)[0];
  assert.ok(hero.includes('href="#contact"'));
  const text = html.match(/<main[\s\S]*?<\/main>/)[0]
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, " ");
  const wordCount = text.trim().split(/\s+/).length;
  assert.ok(wordCount >= 405 && wordCount <= 440, `Expected about 20% more copy than 351 words, got ${wordCount}`);
  assert.equal((html.match(/<details>/g) ?? []).length, 3);
});

test("labels the showcase as a concept and supports optional, finite motion", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(html, /class="showcase-stage" role="img" aria-label="Design concept:/);
  assert.ok(html.includes("A glimpse of what's possible. Design concept."));
  assert.match(html, /class="preview-replay"[^>]+hidden/);
  assert.doesNotMatch(css, /\binfinite\b/);
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"));
  assert.ok(css.includes(".preview-replay { display: none; }"));
});
