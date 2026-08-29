# ASSERA

**A denial isn’t the final word.**

ASSERA is a human-centered, agent-native healthcare access workspace. The
public landing page introduces the product, and Maya Thompson’s synthetic case
workspace demonstrates Milestone 04’s READ + PREPARE + human CONTROL boundary.

Milestone 04 ends at local, version-bound package approval. Nothing is sent,
submitted, filed, or persisted.

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

Open the local URL printed by the development server.

## Verify

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

The tests exercise the original READ contracts, live 4/5 → 5/5 readiness,
deterministic draft preparation and versioning, exact package preview,
human-only approval and revocation, stale-approval invalidation, strict tool
registration, browser fallback, and the Milestone 02–04 eval specifications.

## Milestone 04 architecture

The implementation separates capability from authority at runtime:

- `domain/case-workspace.ts` creates two different objects. The
  `CaseWorkspaceToolAdapter` passed to WebMCP can read the live snapshot,
  prepare locally as `AGENT`, derive a preview, and record READ activity. The
  `CaseWorkspaceUiActions` object owns human date confirmation, human
  preparation, statement edits, approval, and revocation.
- `domain/appeal-package.ts` is a pure package builder. It uses the exact stored
  draft and evidence snapshot; it creates no timestamps, state, network calls,
  model calls, approval, or submission.
- `domain/appeal-draft.ts` creates deterministic drafts at version `1`.
  Material statement edits increment the version by exactly one. Identical
  saves are no-ops.
- `components/case/appeal-package-review.tsx` is the visible human review and
  approval surface. Approval requires a checked, version-specific statement.
- `webmcp/register-case-tools.ts` owns the single browser lifecycle and one
  `AbortSignal` for all six tools.
- `evals/review-layer.json` captures the human-approval and no-submission
  safety cases and is validated by tests.

### Package identity and approval

For a draft with ID `draft-id` and version `1`:

- package ID: `draft-id-package`
- package version: `draft-id:v1`

The package preview includes the exact current appeal statement, the four
stored documents, destination, information that would be shared,
human-confirmed treatment dates, readiness, approval state, and the permanent
`not_submitted` milestone status.

An `AppealApproval` is local synthetic provenance that binds Maya Thompson’s
UI action to the exact case, draft ID/version, package ID/version, timestamp,
and simulated-submission scope. It is product-level package approval, not legal
consent. Editing the statement, changing dates, replacing the draft, or
otherwise changing the package version clears stale approval. Repeating an
unchanged approval is idempotent. Revocation removes only the approval record
and preserves the draft and readiness.

## WebMCP tool inventory

The browser registers exactly six tools in one lifecycle:

1. `get_denial_details` — READ
2. `get_coverage_requirements` — READ
3. `list_appeal_evidence` — READ
4. `check_appeal_readiness` — READ
5. `prepare_appeal` — PREPARE
6. `preview_appeal` — READ

`preview_appeal` returns the exact current package and approval status without
approving, submitting, navigating, focusing, or scrolling. A valid preview
adds transparent READ activity; before a draft exists it returns
`PREVIEW_NOT_AVAILABLE`. Malformed input and unknown cases create no activity.

There is no approval, revocation, submission, send, status, or ACT WebMCP tool.
WebMCP cannot receive the human UI action object at runtime, so it cannot call
Maya’s approval command by convention or accident.

Registration runs only when `document.modelContext` exists. Without WebMCP,
the normal ASSERA interface still supports date confirmation, local draft
preparation, exact package review, approval, editing, and revocation. The
permissions panel labels the preview tool unavailable; the product does not
crash.

## Manual demonstration

1. Open `/case/NS-PA-48291` and confirm physical therapy from July 1, 2026
   through August 19, 2026. Readiness becomes 5/5.
2. Prepare the appeal draft. It is draft and package version `v1`, locally only.
3. Ask: “Show me exactly what would be shared with Northstar Health, including
   the statement, documents, confirmed information, and whether I have
   approved it. Do not approve or submit anything.” The expected tool is
   `preview_appeal`; it reports not approved and not submitted.
4. In Review package, inspect the destination, exact statement, four documents,
   information included, and confirmed dates. Check the explicit approval
   statement and choose **Approve this package**. The UI records HUMAN/CONTROL
   activity. Nothing is sent.
5. Ask: “Is the current package approved, and has it been submitted?” The
   preview reports Maya’s matching approval and `not_submitted`.
6. Change and save one sentence. The draft and package become `v2`, and the
   prior approval clears. Saving identical text leaves the version, approval,
   timestamp, and activity unchanged.
7. Approve the current version or revoke local approval. No ACT capability is
   available at any point.

## Trust, provenance, and refresh boundaries

- All patient, payer, policy, and evidence records are synthetic fixtures.
- The package includes only fields already present in the workspace. It does
  not invent member IDs, addresses, phone numbers, dates of birth, diagnosis
  codes, NPIs, or group numbers.
- The denial notice is labeled denial context, never supporting clinical
  evidence.
- Human-confirmed treatment dates and Maya’s package approval retain their UI
  provenance.
- The draft is deterministic and performs no medical or legal reasoning and no
  success prediction.
- State is intentionally React-memory-only. Refresh resets treatment-date
  confirmation, readiness to 4/5, the draft, package approval, and activity.
- There is no localStorage, database, account, upload, OCR, payer connection,
  email, PDF export, receipt, confirmation number, or external request.

Milestone 05 is not implemented.
