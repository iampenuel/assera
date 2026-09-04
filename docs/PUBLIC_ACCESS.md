# Public access

Audit date: 2026-08-29

Most recent recheck: 2026-09-04

## Current state

- Canonical site: `https://assera-webmcp.stanleyzebulonp.chatgpt.site/`
- Direct synthetic case:
  `https://assera-webmcp.stanleyzebulonp.chatgpt.site/case/NS-PA-48291`
- Access mode: public Internet.
- Anonymous landing request: HTTP 200 with no redirect.
- Anonymous case request: HTTP 200 with no redirect.
- No login, invitation, credentials, workspace authorization, or owner session
  required.
- The landing page renders the cinematic ASSERA hero and “Open Maya’s case”
  reaches the synthetic case.
- The public case route exposes exactly seven WebMCP tools.
- Public READ and complete synthetic 4/5 → receipt journeys: PASS.
- Desktop and 390 px mobile rendering: PASS, with no horizontal overflow or
  console errors in the recorded QA run.

Current public-access result: **ACCESSIBLE** without authentication.

## Required public state

- public landing and direct case routes;
- no login or invitation required;
- the same synthetic-data-only experience;
- exactly seven site-owned WebMCP tools in an eligible browser environment;
- no credentials or private access instructions in public documentation.

## Verification record

1. The owner explicitly authorized public access.
2. The canonical URL remained unchanged when public access was enabled.
3. Independent anonymous requests to `/` and `/case/NS-PA-48291` returned 200.
4. An eligible WebMCP browser discovered the exact seven-tool inventory, ran a
   public READ call, and completed a fresh human-approved simulation journey.
5. Refresh restored the initial synthetic 4/5 workspace.
6. The 2026-09-04 signed-out recheck again loaded the landing hero and case
   route without an authentication or workspace-authorization prompt.

## Fallback

If public Sites access becomes unavailable, use an owner-approved public host
for the same validated source. Preserve the same routes, browser-native WebMCP
registration, synthetic fixtures, and safety behavior. Do not build a separate
case engine or add another MCP/Apps SDK layer. Run the same anonymous and
WebMCP smoke tests before publishing a fallback URL.

**PUBLIC ACCESS — PASS**. The canonical site is publicly accessible without
authentication.
