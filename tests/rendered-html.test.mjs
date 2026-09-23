import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://prototype.example/", {
      headers: { accept: "text/html", host: "prototype.example" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the escalation rule editor and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Escalation Rule Studio<\/title>/i);
  assert.match(html, /<h1 class="sr-only">Update escalation rule<\/h1>/i);
  assert.match(html, /Trigger &amp; Timing/i);
  assert.match(html, /WhatsApp resolution follow-up/i);
  assert.match(html, /<aside class="rule-sidebar sticky" aria-label="Rule details and summary">\s*<label class="rule-name"/i);
  assert.match(html, /<section class="editor-card"[^>]*>\s*<section class="panel progress-panel editor-progress"/i);
  assert.match(html, /property="og:image" content="https:\/\/prototype\.example\/og\.png"/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps the finished project free of starter-only assets", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /kapture:rule:5545:v1/);
  assert.match(page, /Test this rule/);
  assert.doesNotMatch(page, /Prototype controls/);
  assert.match(layout, /generateMetadata/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
});
