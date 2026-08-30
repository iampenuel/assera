# ASSERA Plugin architecture

## Boundary

This package is a companion to the frozen public ASSERA website. It is deliberately not a second case engine.

```text
ChatGPT or Codex
  └─ ASSERA Plugin
       ├─ skill: demo guidance and safety boundary
       ├─ show_assera_demo: one read-only launcher tool
       └─ widget: brand, workflow summary, public links
            └─ opens the public ASSERA website
                 └─ seven authoritative WebMCP tools + human UI controls
```

The plugin never reads, mirrors, mutates, or persists case state. It makes no network request. The only external transition is a user-initiated navigation to the public ASSERA origin.

## MCP transport

The repository plugin launches the prebuilt single-file MCP server over local stdio through `.mcp.json`. The TypeScript source is bundled with the repository’s existing esbuild dependency so runtime startup does not need to traverse dependency files. The same server has an explicit `--http` development mode at `http://127.0.0.1:8787/mcp` for MCP Inspector or a Secure MCP Tunnel. No public MCP server is deployed in this phase.

## Tool and resource

- Tool: `show_assera_demo`
- Classification: read-only, non-destructive, idempotent, closed-world
- UI resource: `ui://widget/assera-demo-v1.html`
- MIME: `text/html;profile=mcp-app`
- State: none
- Authentication: none

The tool returns only stable demo metadata: brand name, tagline, public landing and case URLs, synthetic status, WebMCP status, and the website tool count.

## Widget bridge

The widget initializes the standard MCP Apps bridge over JSON-RPC `postMessage` and accepts `ui/notifications/tool-result`. It uses the ChatGPT-only `window.openai.openExternal` method only as an additive enhancement for external navigation; ordinary links remain the fallback.

## CSP and privacy

The widget declares no connect, resource, or frame domains. Its legacy compatibility metadata permits redirects only to `https://assera-webmcp.stanleyzebulonp.chatgpt.site`. There is no analytics, tracking, storage, third-party content, PHI, insurer endpoint, or submission request.
