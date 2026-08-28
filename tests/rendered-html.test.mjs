import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
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

test("server-renders the public ASSERA landing page", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<title>ASSERA — A denial isn’t the final word\.<\/title>/i);
  assert.match(html, /PATIENT-SIDE HEALTHCARE ACCESS/);
  assert.match(html, /A denial isn(?:&#x27;|&apos;|')t/);
  assert.match(html, /Open Maya(?:&#x27;|&apos;|')s case/);
  assert.match(html, /HOW IT WORKS/);
  assert.match(html, /Clarity before automation/);
  assert.match(html, /Agency stays with you/);
  assert.match(html, /\/media\/assera-hero-background\.png/);
  assert.match(html, /\/brand\/assera-mark-ivory\.png/);
  assert.doesNotMatch(html, /Private case workspace|get_denial_details/);
});

test("server-renders Maya's complete denial dashboard on the case route", async () => {
  const response = await render("/case/NS-PA-48291");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Case NS-PA-48291 \| ASSERA<\/title>/i);
  assert.match(html, /Private case workspace/);
  assert.match(html, /Synthetic demo case/);
  assert.match(html, /MRI — Right Knee/);
  assert.match(html, /Northstar Health/);
  assert.match(html, /October 29, 2026/);
  assert.match(html, /INSURER LANGUAGE \(ORIGINAL\)/);
  assert.match(html, /EXPLANATION IN PLAIN LANGUAGE/);
  assert.match(html, /4 documents/);
  assert.match(html, /4 of 5 requirements complete/);
  assert.match(html, /Treatment dates need confirmation/);
  assert.match(html, /No agent activity yet/);
  assert.match(html, /Review &amp; confirm dates/);
  assert.match(html, /(?:\/|%2F)brand(?:\/|%2F)assera-mark-espresso\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
