# Judge access

Audit date: 2026-08-29

## Current state

- Site: ASSERA, Sites version 10.
- Canonical URL: `https://assera-webmcp.stanleyzebulonp.chatgpt.site`
- Release commit: `cc15de929bb8da8fc16b443372d16e73358bb8ed`.
- Access mode: public Internet.
- Anonymous landing request: HTTP 200.
- Anonymous case request: HTTP 200.
- No login, invitation, credentials, or owner session required.
- Public case route: exactly seven WebMCP tools discovered.
- Public READ and complete synthetic 4/5 → receipt journeys: PASS.
- Desktop and 390 px mobile rendering: PASS, with no horizontal overflow or
  console errors.

Current judge result: **ACCESSIBLE** without the owner session.

## Required final state

- public landing and direct case routes;
- no login or invitation required;
- the same synthetic-data-only release candidate;
- seven tools discoverable in an eligible WebMCP judge environment;
- no credentials in Devpost testing instructions.

## Publication verification completed

1. The owner explicitly authorized public access.
2. The existing Sites project audience changed to **Public** without creating a
   fork or new site version.
3. The canonical URL remained unchanged.
4. Independent anonymous requests to `/` and `/case/NS-PA-48291` returned 200.
5. An eligible WebMCP browser discovered the exact seven-tool inventory, ran a
   public READ call, and completed a fresh human-approved simulation journey.
6. Refresh restored the initial synthetic 4/5 workspace.

## Fallback

If public Sites access becomes unavailable, deploy this exact release commit to
an owner-approved public host. Preserve the same routes, browser-native WebMCP
registration, synthetic fixtures, and safety behavior. Do not build a separate
fork or add an MCP/Apps SDK layer. Run the same anonymous and WebMCP smoke tests
before using the fallback URL.

**PUBLICATION GATE — PASS**. Sites version 10 is publicly accessible without
authentication at the canonical URL.
