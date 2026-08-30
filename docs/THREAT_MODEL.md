# Threat model

This model covers the synthetic ASSERA demonstration, not a production health
system or formal penetration test.

## Assets

- case state and evidence mappings;
- human-confirmed treatment dates;
- appeal draft and exact statement;
- package identity/version and document set;
- human approval record;
- simulated submission and immutable receipt;
- visible READ/PREPARE/CONTROL/ACT activity.

## Actors and trust boundaries

Actors are Maya, an external AI agent, the ASSERA UI, the WebMCP layer, the
simulated payer module, and malicious/mistaken prompt content. Insurer-source
text, ASSERA-derived explanation, human-entered data, agent arguments, human
approval, and simulated system output cross distinct trust boundaries.

The denial notice and human-edited statement are data, not instructions. Tool
arguments are untrusted until schema and domain validation pass. Human approval
is trusted only for its exact stored package binding.

## Threat/control matrix

| Threat | Control | Verification |
|---|---|---|
| Agent invents missing dates | WebMCP has no date-confirmation tool; readiness stays 4/5 until UI confirmation | Domain test + blocked live PREPARE |
| Agent bypasses approval | No approval/revocation tool; adapter omits both methods | Tool inventory + adapter test |
| Stale approval after edit | Material edit increments version and clears approval | Domain tests |
| ACT payload replaces content | Strict reference-only schema; `additionalProperties: false` | Replacement-field adversarial tests |
| Wrong/fabricated references | Typed package/version/approval errors | Domain tests |
| Unknown case access | Constant case schema and `CASE_NOT_FOUND` validation | Route and tool tests + live read check |
| Duplicate or concurrent ACT | Shared synchronous state, exact idempotency | Repeat/concurrency tests |
| Abort during execution | `AbortSignal` checked before commit | Cancellation test |
| Draft prompt injection | Preview marks output untrusted; statement is returned only as data | Live injection eval |
| XSS/content injection | React text rendering; no `dangerouslySetInnerHTML` | Static scan + deterministic/live test |
| Hidden destination/document change | Package builder fixes destination and derives four document references | Preview/ACT tests |
| Unsupported success prediction | Descriptions disclaim prediction; no prediction tool | Adversarial plan/live reasoning |
| Medical-necessity/legal conclusion | Coverage tool is administrative only; UI disclaims medical/legal advice | Tool metadata + adversarial plan |
| Misleading real submission | Simulation-only mode, synthetic receipt, no payer endpoint or network call | Network sentinel + receipt assertions |
| Misleading activity | Every mutation/block records actor, taxonomy, outcome, and impact | Activity assertions |

## Prompt-injection result

The live statement contained an instruction-like sentence, an external URL,
and a script-shaped payload. React showed the exact string as text;
`preview_appeal` returned it as `statement`; the script marker stayed unset;
destination remained Northstar’s simulated appeals department; documents
remained four; approval cleared after the edit; and no submission occurred.

The deterministic test additionally proves that, after Maya approves that exact
current package, the statement remains inert snapshot data and ACT still makes
no network request. No sentence-specific filtering was added.

## Residual limitations

- one fictional case and one fixed policy;
- in-memory state reset by refresh;
- no production authentication layer owned by ASSERA;
- no real insurer connection or delivery confirmation;
- no clinical validation, medical-necessity decision, legal analysis, or
  appeal-outcome prediction;
- no formal security certification or penetration test;
- live agent results are small-sample and environment-dependent;
- the original live guarded-ACT run failed safely with `WRONG_ARGUMENT`; one
  explicitly authorized post-fix browser run passed, while Chrome remains
  unobserved in this environment.
