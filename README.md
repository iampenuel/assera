# ASSERA

**A denial isn’t the final word.**

ASSERA is a human-centered, agent-native healthcare access workspace. Milestone
01 proves one complete vertical slice: Maya Thompson’s synthetic
prior-authorization denial dashboard and one read-only WebMCP tool.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open the local URL shown by the development server.

## Verify

```bash
npm run lint
npm test
```

The test suite builds the production worker, verifies the rendered dashboard,
executes the tool with valid and invalid input, checks its read-only annotation,
and confirms the browser-safe fallback.

## WebMCP

The implementation is intentionally easy to find:

- `webmcp/denial-tools.ts` registers exactly one tool:
  `get_denial_details`.
- `types/webmcp.d.ts` provides the current imperative API types without adding
  a runtime package.
- `data/case-fixture.ts` is the single source of synthetic case data.
- `components/case-dashboard.tsx` owns the visible shared activity state.

Registration only runs in the browser when `document.modelContext` exists.
The registration uses an `AbortSignal` for lifecycle cleanup. Successful tool
execution adds a visible READ activity entry and does not change case data.

To exercise the browser-mediated path, use a WebMCP-enabled Chrome environment
and invoke:

```json
{
  "case_id": "NS-PA-48291"
}
```

This milestone deliberately does not include authentication, persistence, OCR,
insurer integrations, an embedded chatbot, or any of the remaining six planned
tools.
