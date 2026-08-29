# ASSERA

**A denial isn’t the final word.**

ASSERA is a human-centered, agent-native healthcare access workspace. The
public landing page introduces the product, and Maya Thompson’s synthetic case
workspace exposes Milestone 02’s complete read-only WebMCP layer.

## Routes

- `/` — public ASSERA landing page
- `/case/NS-PA-48291` — Maya Thompson’s synthetic case workspace
- `/case` — redirects to Maya’s case workspace

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

The test suite builds the production worker, verifies the landing page and case workspace,
executes all four read tools with valid and invalid input, checks deterministic readiness,
validates registration and activity events, and confirms the browser-safe fallback.

## WebMCP

The implementation is intentionally easy to find:

- `webmcp/register-case-tools.ts` owns one browser lifecycle that registers exactly four tools:
  `get_denial_details`, `get_coverage_requirements`, `list_appeal_evidence`, and
  `check_appeal_readiness`.
- `types/webmcp.d.ts` provides the current imperative API types without adding
  a runtime package.
- `data/case-fixture.ts`, `data/policy-fixture.ts`, and `data/evidence-fixture.ts`
  are the shared synthetic domain fixtures used by both the dashboard and tools.
- `domain/readiness.ts` deterministically compares policy requirements with
  evidence mappings; it contains no model call or outcome prediction.
- `components/case/case-dashboard.tsx` owns the visible shared activity state.

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

Suggested Milestone 02 demonstration prompt:

> Help me understand why my MRI was denied. Check what Northstar requires,
> compare that with the evidence already in my case, and tell me exactly what is
> still missing. Do not prepare or submit anything.

The expected read sequence is `get_denial_details` →
`get_coverage_requirements` → `list_appeal_evidence` →
`check_appeal_readiness`. The deterministic conclusion is that explicit
physical-therapy start and end dates still need confirmation. Nothing is
prepared or submitted.

This milestone deliberately does not include authentication, persistence, OCR,
insurer integrations, an embedded chatbot, a success-probability estimate, or
any PREPARE/ACT tool.
