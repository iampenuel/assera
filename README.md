# ASSERA

**A denial isn’t the final word.**

ASSERA is a human-centered, agent-native healthcare access workspace. The
public landing page introduces the product, and Maya Thompson’s synthetic case
demonstrates Milestone 05’s READ + PREPARE + human CONTROL + simulated ACT
boundary.

Milestone 05 records a local, immutable simulation receipt only. It never
contacts a real insurer, sends email, uploads files, or makes a
submission-related network request.

## Routes

- `/` — public ASSERA landing page
- `/case/NS-PA-48291` — Maya Thompson’s synthetic case workspace
- `/case` — redirects to Maya’s case workspace

## Run and verify

Node.js 22.13 or newer is required.

```bash
npm install
npm run dev
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Milestone 05 architecture

- `domain/case-workspace.ts` is the single mutation boundary. Its synchronous
  live-state adapter makes first submission, rapid retry, and concurrent calls
  observe one authoritative in-memory record.
- `domain/simulated-payer.ts` contains pure reference validation and receipt
  construction. It performs no I/O, content interpretation, model call, payer
  call, or state mutation.
- `domain/appeal-package.ts` builds the exact current review snapshot and, after
  finalization, returns the stored submitted snapshot with concise receipt
  metadata.
- `CaseWorkspaceToolAdapter` exposes READ, PREPARE, preview, and one simulated
  ACT command. It still cannot confirm dates, edit content, approve, or revoke.
- `CaseWorkspaceUiActions` retains Maya’s human-only approval authority and
  exposes the same authoritative submission command as a browser fallback.
- The submission command checks its execution `AbortSignal` before commit,
  atomically stores the submission and ACT activity, and returns the same
  object rendered by the receipt UI.

### Approval and reference binding

Maya’s UI creates one stable `AppealApproval.id`. Approval binds the exact case,
draft ID/version, package ID/version, actor, UI origin, and simulated scope.
`submit_appeal` accepts references only:

```json
{
  "case_id": "NS-PA-48291",
  "package_id": "…",
  "package_version": "…",
  "approval_id": "…",
  "mode": "simulation"
}
```

It cannot accept or change the statement, documents, dates, medical
information, notes, or approval. Mismatched or stale references fail with a
typed domain error and truthful blocked ACT activity.

### Receipt, idempotency, and finalization

The first valid call generates exactly one `submission-…` ID and one visibly
synthetic `SIM-…` confirmation number. Exact retries return `action: "reused"`
with the same stored receipt. Rapid/concurrent calls cannot create a second
submission.

After submission, the approved package snapshot, draft, dates, approval, and
receipt are immutable. Date changes, draft edits, preparation, reapproval, and
revocation fail with `SUBMISSION_FINALIZED`. Refresh intentionally starts a new
ephemeral synthetic workspace.

## WebMCP tool inventory

Exactly seven tools are registered through one browser lifecycle and one
registration `AbortSignal`:

1. `get_denial_details` — READ
2. `get_coverage_requirements` — READ
3. `list_appeal_evidence` — READ
4. `check_appeal_readiness` — READ
5. `preview_appeal` — READ
6. `prepare_appeal` — PREPARE
7. `submit_appeal` — ACT (simulation only)

No WebMCP tool can approve, revoke, edit, cancel, resubmit, upload, or fabricate
human authority. `preview_appeal` remains the only read path for approval and
submission status. `submit_appeal` returns compact receipt metadata and not the
appeal statement.

Without `document.modelContext`, the case UI remains functional. Maya can
review and approve the exact package and choose **Run simulated submission**;
that fallback uses the same command and produces a HUMAN / ASSERA_UI receipt.

## Manual demonstration

1. Confirm physical therapy from July 1 through August 19, 2026; readiness
   becomes 5/5.
2. Prepare the local appeal draft and preview the exact package.
3. In ASSERA, review the package, check the version-specific statement, and
   choose **Approve this package**. The activity log records HUMAN / CONTROL.
4. Ask the agent to preview again and pass the returned case, package, version,
   and approval references to `submit_appeal` with `mode: "simulation"`.
5. Confirm the main column and right rail show **SIMULATION COMPLETE**, the
   `SIM-…` receipt, no real insurer contacted, and no external network request.
6. Repeat the exact call; it returns the existing receipt without creating a
   duplicate. Try an edit or revocation; the finalized workspace rejects it.

## Tests and evals

The suite covers the original READ/PREPARE/CONTROL contracts plus approval IDs,
strict reference-only schema, every submission error, agent and human paths,
idempotent/concurrent calls, pre-commit cancellation, finalization,
submitted-preview behavior, UI integration, and the 14 scenarios in
`evals/act-layer.json`.

All case, payer, policy, evidence, approval, submission, and receipt data are
synthetic. ASSERA does not provide medical or legal advice and does not predict
appeal success or payer outcome.
