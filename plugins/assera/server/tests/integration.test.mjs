import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createAsseraServer, runHttp } from "../src/server.ts";

const serverRoot = resolve(import.meta.dirname, "..");
const pluginRoot = resolve(serverRoot, "..");
const repositoryRoot = resolve(pluginRoot, "../..");
const toolNamesOnWebsite = [
  "get_denial_details",
  "get_coverage_requirements",
  "list_appeal_evidence",
  "check_appeal_readiness",
  "preview_appeal",
  "prepare_appeal",
  "submit_appeal",
];

function read(relativePath) {
  return readFileSync(resolve(pluginRoot, relativePath), "utf8");
}

test("manifest and repository marketplace describe one installable ASSERA plugin", () => {
  const manifest = JSON.parse(read(".codex-plugin/plugin.json"));
  const marketplace = JSON.parse(
    readFileSync(resolve(repositoryRoot, ".agents/plugins/marketplace.json"), "utf8"),
  );

  assert.equal(manifest.name, "assera");
  assert.equal(manifest.interface.displayName, "ASSERA");
  assert.equal(manifest.interface.defaultPrompt.length, 3);
  assert.deepEqual(manifest.interface.capabilities, ["Interactive", "Read"]);
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, "assera");
  assert.equal(marketplace.plugins[0].source.path, "./plugins/assera");
  assert.equal(marketplace.plugins[0].policy.installation, "AVAILABLE");
  assert.equal(marketplace.plugins[0].policy.authentication, "ON_INSTALL");
});

test("server exposes exactly one read-only launcher tool and its branded resource", async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createAsseraServer();
  const client = new Client({ name: "assera-plugin-test", version: "0.1.0" });

  try {
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const listed = await client.listTools();
    assert.deepEqual(listed.tools.map((tool) => tool.name), ["show_assera_demo"]);

    const tool = listed.tools[0];
    assert.equal(tool.title, "Open ASSERA");
    assert.match(tool.description, /public synthetic prior-authorization case experience/);
    assert.deepEqual(tool.annotations, {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    assert.equal(tool._meta.ui.resourceUri, "ui://widget/assera-demo-v3.html");
    assert.equal(tool._meta["openai/toolInvocation/invoking"], "Opening ASSERA…");
    assert.equal(tool._meta["openai/toolInvocation/invoked"], "ASSERA ready");

    const result = await client.callTool({ name: "show_assera_demo", arguments: {} });
    assert.equal(
      result.content[0].text,
      "ASSERA is open. Maya’s case is synthetic, and the public site exposes seven WebMCP tools for the case workflow.",
    );
    assert.deepEqual(result.structuredContent, {
      name: "ASSERA",
      tagline: "A denial isn’t the final word.",
      site_url: "https://assera-webmcp.stanleyzebulonp.chatgpt.site",
      case_url: "https://assera-webmcp.stanleyzebulonp.chatgpt.site/case/NS-PA-48291",
      synthetic: true,
      webmcp: true,
      webmcp_tool_count: 7,
    });

    const resource = await client.readResource({ uri: "ui://widget/assera-demo-v3.html" });
    assert.equal(resource.contents.length, 1);
    assert.equal(resource.contents[0].mimeType, "text/html;profile=mcp-app");
    assert.match(resource.contents[0].text, /Maya’s synthetic case/);
    assert.match(resource.contents[0].text, /ui\/initialize/);
    assert.match(resource.contents[0].text, /openExternal/);
    assert.match(
      resource.contents[0].text,
      /https:\/\/assera-webmcp\.stanleyzebulonp\.chatgpt\.site\/media\/assera-hero-background\.png/,
    );
    assert.doesNotMatch(resource.contents[0].text, /data:image\/webp;base64,/);
    assert.doesNotMatch(resource.contents[0].text, /class="hero-image"/);
    assert.doesNotMatch(resource.contents[0].text, /__ASSERA_(?:STYLES|APP|LOGO|HERO)/);
    assert.equal(resource.contents[0]._meta.ui.prefersBorder, false);
    assert.equal(resource.contents[0]._meta["openai/widgetPrefersBorder"], false);
    assert.equal(
      resource.contents[0]._meta["openai/widgetDescription"],
      "A branded, read-only launcher for ASSERA and Maya’s public synthetic prior-authorization case.",
    );
    assert.deepEqual(resource.contents[0]._meta.ui.csp, {
      connectDomains: [],
      resourceDomains: ["https://assera-webmcp.stanleyzebulonp.chatgpt.site"],
      frameDomains: [],
    });
    assert.deepEqual(resource.contents[0]._meta["openai/widgetCSP"], {
      connect_domains: [],
      resource_domains: ["https://assera-webmcp.stanleyzebulonp.chatgpt.site"],
      redirect_domains: ["https://assera-webmcp.stanleyzebulonp.chatgpt.site"],
    });
  } finally {
    await client.close();
    await server.close();
  }
});

test("plugin preserves the WebMCP product boundary and has no request or storage code", () => {
  const source = read("server/src/server.ts");
  const widget = read("web/app.js");
  const skill = read("skills/assera-demo/SKILL.md");

  for (const websiteTool of toolNamesOnWebsite) {
    assert.doesNotMatch(source, new RegExp(`registerAppTool\\([^)]*${websiteTool}`));
  }

  assert.doesNotMatch(source, /\bfetch\s*\(|\baxios\b|https\.request|XMLHttpRequest/);
  assert.doesNotMatch(widget, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/);
  assert.match(skill, /website is the authoritative source of truth/i);
  assert.match(skill, /No real insurer is contacted/i);
  assert.match(skill, /Refresh(?:ing)? the website resets/i);
});

test("widget domain metadata uses the configured dedicated HTTPS origin", async () => {
  const originalOrigin = process.env.ASSERA_WIDGET_ORIGIN;
  process.env.ASSERA_WIDGET_ORIGIN = "https://assera-companion.example";

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createAsseraServer();
  const client = new Client({ name: "assera-domain-test", version: "0.1.0" });

  try {
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const resource = await client.readResource({ uri: "ui://widget/assera-demo-v3.html" });
    assert.equal(resource.contents[0]._meta.ui.domain, "https://assera-companion.example");
    assert.equal(
      resource.contents[0]._meta["openai/widgetDomain"],
      "https://assera-companion.example",
    );
    assert.deepEqual(resource.contents[0]._meta.ui.csp, {
      connectDomains: [],
      resourceDomains: ["https://assera-webmcp.stanleyzebulonp.chatgpt.site"],
      frameDomains: [],
    });
  } finally {
    await client.close();
    await server.close();
    if (originalOrigin === undefined) {
      delete process.env.ASSERA_WIDGET_ORIGIN;
    } else {
      process.env.ASSERA_WIDGET_ORIGIN = originalOrigin;
    }
  }
});

test("OpenAI domain challenge is unavailable until an exact token is configured", async () => {
  const originalHost = process.env.HOST;
  const originalPort = process.env.PORT;
  const originalToken = process.env.OPENAI_APPS_CHALLENGE_TOKEN;
  process.env.HOST = "127.0.0.1";
  process.env.PORT = "0";
  delete process.env.OPENAI_APPS_CHALLENGE_TOKEN;

  const httpServer = runHttp();

  try {
    await once(httpServer, "listening");
    const address = httpServer.address();
    assert.ok(address && typeof address === "object");
    const challengeUrl = `http://127.0.0.1:${address.port}/.well-known/openai-apps-challenge`;

    const unavailable = await fetch(challengeUrl);
    assert.equal(unavailable.status, 404);
    assert.equal(await unavailable.text(), "Not found");

    process.env.OPENAI_APPS_CHALLENGE_TOKEN = "portal-issued-token";
    const available = await fetch(challengeUrl);
    assert.equal(available.status, 200);
    assert.equal(available.headers.get("cache-control"), "no-store");
    assert.equal(await available.text(), "portal-issued-token");
  } finally {
    await new Promise((resolveClose, rejectClose) => {
      httpServer.close((error) => (error ? rejectClose(error) : resolveClose()));
    });

    for (const [key, value] of [
      ["HOST", originalHost],
      ["PORT", originalPort],
      ["OPENAI_APPS_CHALLENGE_TOKEN", originalToken],
    ]) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
