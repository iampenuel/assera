# ASSERA release audit

Audit date: 2026-08-30  
Baseline: Sites version 9, commit `ca2bd331895f2b612ee0e2aa8047071a4a56bc5a`  
Candidate scope: Milestone 06 hardening and submission preparation

## Executive result

The software boundary remains intact: seven WebMCP tools, one synthetic case,
reference-only simulated ACT, human-only approval, immutable receipt, and no
submission-related network request. The source and production-dependency scans
found no release-blocking secret, PHI, or runtime advisory.

Two real findings were identified:

1. A live agent selected `submit_appeal` correctly but read the approval ID from
   the wrong preview path. The call was blocked before execution. Tool metadata
   now names `preview_appeal.approval.approval_id` explicitly. After disclosure
   and fresh owner authorization, a separate browser-mediated post-fix run used
   the correct nested value and recorded one simulation-only receipt.
2. The case shell overflowed by 56 px at 1024×768. The case-only responsive
   breakpoint now collapses the three-column shell at 1080 px; other visual
   breakpoints and the approved art direction are unchanged. A production
   preview recheck measured `innerWidth: 1024` and `scrollWidth: 1024`.

Release validation and private deployment are recorded after the final gate in
this document. Public access and public repository publication remain owner
actions.

## Source and data audit

| Area | Result | Evidence |
|---|---|---|
| Secrets and credential-like strings | PASS | No matching source file; deployment credentials are not stored in the repository. |
| `.env`, key, certificate files | PASS | None present outside ignored/generated dependency content. |
| Public-document local paths | PASS | No user-home, Downloads, or temporary paths in tracked public files. |
| Synthetic data | PASS | The sole case, insurer, provider, policy, evidence, approval, and receipt are explicitly fictional/synthetic. |
| PHI | PASS for release scope | No real patient record or uploaded clinical document is present. Maya Thompson is a fictional fixture. |
| Browser persistence | PASS | No `localStorage` or `sessionStorage`; refresh creates a fresh in-memory workspace. |
| Network submission | PASS | ACT tests replace `fetch` with a failure sentinel; receipts state `external_network_request: false`. |
| HTML injection | PASS | No `dangerouslySetInnerHTML`; live and deterministic injection tests render statement text inertly. |
| Generated content | PASS | Builds, dependencies, environments, local QA, and TypeScript caches are ignored. Canonical release evidence is the sole tracked artifact subtree. |
| Large tracked source | PASS | Largest required asset is the approved 2.1 MB hero photograph; no generated archive is tracked. |

The Worker `fetch` entry point and test `worker.fetch` invocations are normal
request handling, not payer submission code. No webhook, `XMLHttpRequest`, form
POST handler, or external payer endpoint exists.

## WebMCP contract audit

Exactly seven tools remain:

1. `get_denial_details` — READ
2. `get_coverage_requirements` — READ
3. `list_appeal_evidence` — READ
4. `check_appeal_readiness` — READ
5. `preview_appeal` — READ, untrusted output
6. `prepare_appeal` — PREPARE
7. `submit_appeal` — ACT, simulation only

There is no tool for confirming dates, editing a draft, approving, revoking,
changing destination/documents, submitting to a real insurer, cancelling, or
resubmitting. All schemas reject extra properties. Registration uses one
abortable lifecycle. `preview_appeal` is the single source of current package,
approval, and receipt status.

## Live-agent audit

The in-app browser was available. Chrome was `NOT_RUN` because the Chrome
browser family/extension connection was unavailable after the required retry.
The full raw record is in `evals/live-agent-results.json`.

- 45 recorded rows: 37 PASS, 3 FAIL, 5 NOT_RUN.
- Critical A, B, C, and D each completed three successful journeys; B needed
  one retry after a stale tool snapshot.
- Critical E retains the original `WRONG_ARGUMENT` failure and two earlier
  `NOT_RUN` rows. One separately authorized post-fix run passed end to end with
  the exact package/version/approval references and one immutable receipt.
- Prompt-injection live evaluation passed: exact text was returned as package
  data, destination/documents stayed fixed, approval cleared, and no script ran.
- No real insurer was contacted and no external submission request occurred.

These are small engineering samples, not a statistical reliability claim.

## Dependency audit

`npm audit --omit=dev --json` reported 0 production vulnerabilities. The full
audit reported 17 development/build findings (15 high, 2 low), including direct
build-tool advisories and transitive parser/network/dev-server advisories. None
is demonstrated to be reachable through the deployed synthetic runtime. No
dependency was changed. See `docs/DEPENDENCY_REVIEW.md`.

Before final lint, the existing `node_modules` tree was found to contain 168
duplicate directories with macOS-style ` 2`/` 3` suffixes, including ESLint and
build packages. This caused module loading to stall. One lockfile-faithful
`npm ci` replaced only the regenerable dependency tree; duplicate count then
measured zero and lint completed normally. No manifest or lockfile changed.

## Access and publication audit

- Sites version 9 is active at the canonical URL.
- Access is custom owner-only; no external visitors or groups are allowed.
- Public access is available to the owner as a selectable access mode.
- Anonymous HTTP checks returned 401 for both `/` and the case route.
- No Git remote is configured, so no public repository exists yet.
- Apache-2.0 now exists at repository root; `NOTICE` preserves the brand/trademark distinction.

Therefore both publication gates remain `NOT READY` until the owner explicitly
authorizes the access/visibility changes and post-change smoke tests pass.

## Validation record

| Gate | Result |
|---|---|
| Targeted WebMCP/domain tests | PASS — 29/29 |
| TypeScript (`--incremental false`) | PASS |
| Lint | PASS |
| Complete test suite | PASS — 33/33 |
| Final production build | PASS — completed once inside `npm test` |
| Local production preview | PASS — 1600, 1024, and 390 widths; clean console; exactly seven tools |
| Clean-clone verification | Pending release commit |
| Private Sites candidate | Pending release commit and clean-clone gate |

## Release decision

Implementation-neutral hardening: **VALIDATED**.  
Live guarded-ACT evidence: **PASS — original failure retained; post-fix run passed**.  
Site publication gate: **NOT READY — owner-controlled**.  
Repository publication gate: **NOT READY — owner-controlled**.
