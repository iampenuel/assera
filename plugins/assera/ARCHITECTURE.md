# ASSERA Plugin architecture

## Boundary

This package is a companion to the frozen public ASSERA website. It is deliberately not a second case engine.

```text
ChatGPT or Codex
  └─ ASSERA Plugin
       ├─ skill: product guidance and safety boundary
       ├─ show_assera_demo: one read-only launcher tool
       └─ widget: brand, workflow summary, public links
            └─ opens the public ASSERA website
                 └─ seven authoritative WebMCP tools + human UI controls
```

The plugin never reads, mirrors, mutates, or persists case state. It makes no network request. The only external transition is a user-initiated navigation to the public ASSERA origin.

## MCP transport

The repository plugin launches the prebuilt single-file MCP server over local
stdio through `.mcp.json`. The TypeScript source is bundled with the
repository’s existing esbuild dependency so runtime startup does not need to
traverse dependency files. The same server has an explicit `--http`
development mode at `http://127.0.0.1:8787/mcp` for MCP Inspector or a Secure
MCP Tunnel. Its public companion endpoint is
`https://assera-companion-mcp.onrender.com/mcp`; it exposes only the same
read-only `show_assera_demo` launcher.

## Tool and resource

- Tool: `show_assera_demo`
- Classification: read-only, non-destructive, idempotent, closed-world
- UI resource: `ui://widget/assera-demo-v3.html`
- MIME: `text/html;profile=mcp-app`
- State: none
- Authentication: none

The tool returns only stable launcher metadata: brand name, tagline, public
landing and case URLs, synthetic status, WebMCP status, and the website tool
count.

## Widget bridge

The widget initializes the standard MCP Apps bridge over JSON-RPC `postMessage` and accepts `ui/notifications/tool-result`. It uses the ChatGPT-only `window.openai.openExternal` method only as an additive enhancement for external navigation; ordinary links remain the fallback.

## CSP and privacy

The widget declares no connect or frame domains. It allows the public ASSERA
origin as its sole resource domain for the approved hero photograph and as its
sole redirect domain for user-initiated navigation. There is no analytics,
tracking, storage, PHI, insurer endpoint, or submission request.
