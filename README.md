# ASSERA

**A denial isn’t the final word.**

ASSERA is a human-centered, agent-native healthcare access workspace. The
public landing page introduces the product, and Maya Thompson’s synthetic case
workspace exposes Milestone 03’s READ + PREPARE WebMCP layer.

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
executes the four READ tools and one PREPARE tool with valid and invalid input,
checks the live 4/5 → 5/5 readiness transition, validates draft safety and
idempotency, and confirms the browser-safe fallback.

## WebMCP

The implementation is intentionally easy to find:

- `webmcp/register-case-tools.ts` owns one browser lifecycle that registers exactly five tools:
  `get_denial_details`, `get_coverage_requirements`, `list_appeal_evidence`, and
  `check_appeal_readiness` as READ, plus `prepare_appeal` as PREPARE.
- `types/webmcp.d.ts` provides the current imperative API types without adding
  a runtime package.
- `data/case-fixture.ts`, `data/policy-fixture.ts`, and `data/evidence-fixture.ts`
  are the shared synthetic domain fixtures used by both the dashboard and tools.
- `domain/readiness.ts` deterministically compares policy requirements with
  evidence mappings; it contains no model call or outcome prediction.
- `domain/case-workspace.ts` owns the reducer commands and stable live adapter
  shared by the interface and WebMCP.
- `domain/treatment-dates.ts` validates human-confirmed dates and derives
  effective evidence without mutating the fixtures.
- `domain/appeal-draft.ts` creates one deterministic, local, unsubmitted draft.
- `components/case/case-dashboard.tsx` owns the in-memory workspace boundary.

Registration only runs in the browser when `document.modelContext` exists.
The registration uses one `AbortSignal` for lifecycle cleanup. READ tools add
visible no-change activity. `prepare_appeal` is always registered, returns a
typed `PREPARE_BLOCKED` error at 4/5, and creates or reuses the stored draft at
5/5. No ACT or submission tool exists.

To exercise the browser-mediated path, use a WebMCP-enabled Chrome environment
and invoke:

```json
{
  "case_id": "NS-PA-48291"
}
```

Suggested Milestone 03 preparation prompt, after Maya confirms July 1 through
August 19 in the interface:

> I confirmed the dates. Recheck readiness and prepare the appeal draft. Do not
> submit anything.

The expected sequence is `check_appeal_readiness` → `prepare_appeal`. The
deterministic draft is stored only in React memory, remains editable through an
explicit save action, and resets on refresh. Nothing is submitted or sent.

This milestone deliberately does not include authentication, persistence, OCR,
insurer integrations, an embedded chatbot, a success-probability estimate, an
ACT tool, or any external submission path.
