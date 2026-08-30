# Judge access

Audit date: 2026-08-29

## Current state

- Site: ASSERA, Sites version 9.
- Canonical URL: `https://assera-webmcp.stanleyzebulonp.chatgpt.site`
- Access mode: custom, owner only.
- Allowed non-owner users/groups: none.
- External visitors: none.
- Owner role: confirmed.
- Available owner access modes: custom and public.
- Anonymous landing request: HTTP 401.
- Anonymous case request: HTTP 401.
- Owner-authenticated in-app browser: landing, case route, and seven WebMCP
  tools loaded.

Current judge result: **NOT ACCESSIBLE** without the owner session. This is a
publication blocker, not an application defect.

## Required final state

- public landing and direct case routes;
- no login or invitation required;
- the same synthetic-data-only release candidate;
- seven tools discoverable in an eligible WebMCP judge environment;
- no credentials in Devpost testing instructions.

## Owner publication steps

After the release candidate and live guarded-ACT gate pass:

1. Open ASSERA’s Sites project sharing/access control.
2. Change audience from the current custom owner-only policy to **Public**
   (the account reports this mode is available).
3. Confirm the canonical landing URL did not change.
4. In a signed-out/private browser, load `/` and `/case/NS-PA-48291`; both must
   return 200 and render without an authentication prompt.
5. In an eligible in-app browser or WebMCP-enabled Chrome session, verify the
   seven-tool inventory and run a fresh READ → blocked PREPARE → human confirm
   → PREPARE → preview → human approval → simulated ACT journey.
6. Only then replace public URL placeholders in README/Devpost/video materials.

The owner may alternatively explicitly authorize Codex to set the Sites access
mode to public, but that authorization has not been given in this milestone.

## Fallback

If public Sites access becomes unavailable, deploy this exact release commit to
an owner-approved public host. Preserve the same routes, browser-native WebMCP
registration, synthetic fixtures, and safety behavior. Do not build a separate
fork or add an MCP/Apps SDK layer. Run the same anonymous and WebMCP smoke tests
before using the fallback URL.

**PUBLICATION GATE — NOT READY**. Public mode is available, but it has not been
selected and anonymous checks still return 401.
