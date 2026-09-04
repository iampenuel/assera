# Dependency advisory review

Review date: 2026-08-29  
Commands: `npm audit --json` and `npm audit --omit=dev --json` under Node
22.23.1. No fix command was run and no dependency changed.

This is a limited engineering review, not a formal security certification.

## Summary

| Scope | Result |
|---|---:|
| Production audit (`--omit=dev`) | 0 vulnerabilities |
| Full installed tree | 17 vulnerabilities: 15 high, 2 low |
| Critical findings | 0 |

The deployed runtime has four production dependencies in the audit inventory.
The production-only audit is clean. All reported full-tree findings are in the
development/build graph. They affect build tooling, local dev servers, parsers,
image tooling, or transitive network packages; they are not demonstrated to be
reachable through ASSERA’s static page/WebMCP runtime.

## Classification

| Package/family | Directness | Scope | Review |
|---|---|---|---|
| `@cloudflare/vite-plugin`, `vinext`, `vite`, `wrangler`, `react-server-dom-webpack` | Direct dev/build dependencies | Development/build | Advisories exist; production-only audit excludes them. |
| `miniflare`, `undici`, `ws`, `sharp`, `image-size`, `esbuild` | Transitive build/local-runtime graph | Development/build | Relevant to local/build tooling; no ASSERA payer submission path uses them. |
| `brace-expansion`, `fast-uri`, `js-yaml`, `nanoid`, `postcss`, `@babel/core` | Transitive parser/build utilities | Development/build | Inputs are not exposed as public ASSERA runtime parsers in this release. |

## Reachability and release decision

ASSERA’s shipped product logic uses React rendering, deterministic in-memory
domain functions, and browser-native WebMCP registration. It has no API route,
file upload, YAML parser, webhook, WebSocket server, SOCKS proxy, or public dev
server in production. No advisory is currently demonstrated to cross into the
synthetic case/ACT boundary.

Decision: the findings do not block this synthetic demonstration, but they
remain tracked technical debt. Reassess and update through a dedicated,
tested dependency maintenance change. Do not expose local Vite, Wrangler, or
Miniflare dev servers to untrusted networks.

## Safeguards

- Lockfile is committed.
- Node 22 is required.
- Production Sites deployment is built from a validated commit.
- No `npm audit fix` or forced upgrade was used.
- Future upgrades must rerun TypeScript, lint, all tests, build, and live WebMCP
  smoke checks.
