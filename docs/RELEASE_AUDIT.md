# ASSERA release audit

Audit date: 2026-09-01
Public-site baseline: Sites version 10, commit `cc15de929bb8da8fc16b443372d16e73358bb8ed`
Source baseline: `b1791c2940795fb257d1aa6da43c49501af82ad4` plus validated responsive and companion work
Audit scope: website, ChatGPT companion, and public-repository hygiene

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

Release validation and deployment are recorded after the final gate in this
document. Public Sites publication is complete; public repository publication
remains a separate owner action.

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

- Sites version 10 is active at the canonical URL from commit
  `cc15de929bb8da8fc16b443372d16e73358bb8ed`.
- Access is Public; no owner login, invitation, or credentials are required.
- Anonymous HTTP checks returned 200 for both `/` and the case route.
- The public case route exposed exactly seven WebMCP tools, passed a READ smoke
  test, and completed one fresh human-approved synthetic ACT journey.
- Public desktop and 390 px mobile checks had no horizontal overflow or console
  errors, and refresh restored the initial 4/5 state.
- The public repository is available at `https://github.com/iampenuel/assera`;
  repository-positioning changes follow the normal validation and push workflow.
- Apache-2.0 now exists at repository root; `NOTICE` preserves the brand/trademark distinction.

The Site publication gate is `PASS`. The repository publication gate is
owner-authorized and proceeds only after the final local release gate passes.

## Validation record

| Gate | Result |
|---|---|
| Targeted WebMCP/domain tests | PASS — 29/29 |
| TypeScript (`--incremental false --allowImportingTsExtensions`) | PASS |
| Lint | PASS |
| Complete test suite | PASS — 33/33 |
| Final production build | PASS — completed once inside `npm test` |
| Local production preview | PASS — 1600, 1024, and 390 widths; clean console; exactly seven tools |
| Prior website clean-clone verification | PASS — fresh Node 22 install, TypeScript, lint, production build, and 33/33 tests at release commit `5089239` |
| Final website + plugin public-clone verification | Required after a validated public push |
| Public Sites release | PASS — version 10, anonymous landing/case 200, seven tools, READ smoke, full synthetic journey |

## Release decision

Implementation-neutral hardening: **VALIDATED**.  
Live guarded-ACT evidence: **PASS — original failure retained; post-fix run passed**.  
Site publication gate: **PASS — public, anonymous access verified**.
Repository maintenance gate: **VALIDATE — commit, public push, and verify the
public repository after positioning or release changes**.
