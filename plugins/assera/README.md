# ASSERA Plugin

A local, repository-packaged Plugin that gives ASSERA a branded presence in supported ChatGPT and Codex plugin surfaces. It opens and explains Maya’s public synthetic case experience while preserving the website as the single authoritative source for case state and its seven WebMCP tools.

## What it includes

- one skill: `assera-demo`
- one read-only MCP tool: `show_assera_demo`
- one responsive photographic launcher widget derived from the ASSERA visual system
- one repository marketplace entry at `.agents/plugins/marketplace.json`
- local stdio transport plus opt-in local HTTP development mode

It does not add an eighth website tool, duplicate any case action, store data, contact an insurer, or deploy another public service.

## Requirements

- Node.js 22.13 or newer (validated with 22.23.1)
- npm 10+

## Install and validate

From `plugins/assera/server`:

```bash
npm ci
npm run typecheck
npm run build
npm run check
```

Validate the plugin package from the repository root:

```bash
python3 "$CODEX_HOME/skills/.system/plugin-creator/scripts/validate_plugin.py" plugins/assera
```

The repository marketplace exposes `assera` as `AVAILABLE` with `ON_INSTALL` authentication policy and the `Productivity` category.

## Local MCP transports

The bundled plugin uses stdio through `plugins/assera/.mcp.json`:

```bash
cd plugins/assera/server
npm start
```

For MCP Inspector or ChatGPT Developer Mode, run the local Streamable HTTP endpoint:

```bash
cd plugins/assera/server
npm run dev:http
```

Then use `http://127.0.0.1:8787/mcp` in MCP Inspector. A local visual-only widget preview is available at `http://127.0.0.1:8787/preview`. ChatGPT cannot reach a loopback address directly, so local Developer Mode requires an HTTPS Secure MCP Tunnel to the MCP endpoint. No tunnel is created by this repository; the public server exists only after deploying its Render configuration.

## Render hosting

The repository includes a minimal `render.yaml` Blueprint for the companion MCP server. It builds only `plugins/assera/server` while keeping `plugins/assera/web` and `plugins/assera/assets` available to the bundled widget at runtime.

The service configuration is:

- root directory: `plugins/assera`
- build command: `npm --prefix server ci && npm --prefix server run build`
- start command: `npm --prefix server run start:http`
- health check: `/health`
- public MCP path: `/mcp`
- visual preview path: `/preview`
- Node.js: `22.23.1`

Render supplies `PORT`; the Blueprint sets `HOST=0.0.0.0`. Local HTTP development retains the safe `127.0.0.1:8787` fallback. At runtime, Render's unique `RENDER_EXTERNAL_URL` becomes the widget's `_meta.ui.domain` and `openai/widgetDomain`; a custom unique origin can override it through `ASSERA_WIDGET_ORIGIN`. The service requires no secrets, database, persistent storage, or authentication.

The checked-in Blueprint uses Render Free only as a no-cost deployment preview. Render documents that Free web services sleep after 15 minutes without inbound traffic and are not suitable for production. Before Plugin Directory submission, explicitly upgrade the service to the minimum always-on web-service plan, `0.5c-512mb` (formerly Starter), or another paid always-on plan. Do not apply that paid change without owner approval.

If the OpenAI submission portal later provides a domain-verification token, set it only as the Render environment variable `OPENAI_APPS_CHALLENGE_TOKEN`. The server then returns that exact value from `/.well-known/openai-apps-challenge` with no-store headers. Without a configured token, the path returns `404`; the repository contains no placeholder or real token.

## ChatGPT Developer Mode check

1. Start `npm run dev:http`.
2. Start an approved Secure MCP Tunnel to port 8787.
3. In ChatGPT, enable Developer Mode under Settings → Security and login.
4. On the Plugins page, add the tunnel’s HTTPS URL ending in `/mcp`.
5. Open a new chat, select ASSERA, and ask: “Open ASSERA and show me Maya’s synthetic prior-authorization case.”
6. Confirm the branded card renders, both links open only the public ASSERA origin, and the tool result reports `synthetic: true` and `webmcp_tool_count: 7`.

## Manual screenshots

If the authenticated ChatGPT plugin surface is unavailable to the test environment, capture these manually after the Developer Mode check:

- plugin identity in the Plugins directory or picker
- ASSERA selected in a new conversation
- the rendered photographic widget at desktop width
- the rendered photographic widget at compact width
- the transition from “Open Maya’s synthetic case” to the public case route

Curate public-safe screenshots under `artifacts/release-candidate/`. Do not
include private settings, tokens, tunnel credentials, or unrelated
conversations.

## Safety and product boundary

All case information is synthetic. The widget contains no case data and performs no fetch, analytics, storage, or submission operation. Human confirmation and approval remain in the website UI. ACT remains explicitly simulated; no real insurer is contacted. Refreshing the public website resets the synthetic workspace.
