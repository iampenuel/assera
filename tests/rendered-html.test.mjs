import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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

test("server-renders Maya's complete denial dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Case NS-PA-48291 \| ASSERA<\/title>/i);
  assert.match(html, /Good afternoon, Maya\./);
  assert.match(html, /MRI — Right Knee/);
  assert.match(html, /Northstar Health/);
  assert.match(html, /October 29, 2026/);
  assert.match(html, /ORIGINAL INSURER LANGUAGE/);
  assert.match(html, /PLAIN-LANGUAGE EXPLANATION/);
  assert.match(html, /4(?:<!-- -->)? documents/);
  assert.match(html, /4<!-- --> of <!-- -->5<!-- --> complete/);
  assert.match(html, /Treatment dates need confirmation/);
  assert.match(html, /No agent activity yet/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
