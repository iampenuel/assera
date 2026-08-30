# Project title

ASSERA

## Tagline

A denial isn’t the final word.

## Inspiration

Prior authorization creates an information and coordination problem at a
moment when people are already under pressure. KFF’s analysis of 2024 Medicare
Advantage data found 4.1 million fully or partially denied requests; only 11.5%
of denied requests were appealed, while 80.7% of appealed denials were
partially or fully overturned. ASSERA explores a narrower question: what if a
person and an AI agent could share one truthful workspace, with automation
stopping exactly where human authority begins?

## What it does

ASSERA turns one fictional prior-authorization denial into a structured
journey. An agent can read the decision, fictional coverage requirements,
available evidence, and deterministic readiness; safely block when information
is missing; prepare a local deterministic draft after the person confirms
dates; preview the exact package; and record a simulated receipt only after the
person approves that exact package version in ASSERA.

No real insurer is contacted. All data, organizations, and receipts are
synthetic.

## Why ASSERA is a strong fit for WebMCP

ASSERA is not a healthcare chatbot with WebMCP added afterward. The website
itself exposes a structured, state-aware workflow through WebMCP. ChatGPT
provides conversation and orchestration. ASSERA provides canonical case state,
structured evidence, deterministic checks, guarded mutations,
package/version identity, human approval, visible audit activity, and simulated
ACT behavior.

## What people and agents can now do together

The agent handles repetitive reading, comparison, preparation, and exact status
inspection. Maya confirms facts, edits the statement, and controls approval.
The agent cannot invent dates, approve, revoke, replace package content, or send
anything to a real payer. **ASSERA assists. Maya authorizes.**

## Human-centered safety model

- five READ tools and one PREPARE tool before consequential action;
- human-only treatment-date confirmation and package approval;
- approval bound to case, draft, package, versions, actor, UI provenance, and
  simulated scope;
- reference-only ACT with strict extra-property rejection;
- one idempotent, concurrency-safe, immutable simulated receipt;
- cancellation before commit and finalization after ACT;
- visible READ/PREPARE/CONTROL/ACT activity;
- prompt-injection text treated as package data, never instruction;
- no real payer endpoint or submission request.

## How it was built

ASSERA uses React, TypeScript, a reducer-owned in-memory workspace, immutable
synthetic fixtures, deterministic domain modules, browser-native WebMCP tool
registration, and Sites hosting. Domain functions—not a model—derive readiness,
create the draft, build the package, validate approval references, and construct
the simulated receipt.

## WebMCP implementation

The case page registers exactly seven tools through one abortable lifecycle:
`get_denial_details`, `get_coverage_requirements`, `list_appeal_evidence`,
`check_appeal_readiness`, `preview_appeal`, `prepare_appeal`, and
`submit_appeal`. Tool adapters share the same live reducer state rendered by the
human UI. If WebMCP is unavailable, the human fallback uses the same domain
command and safety checks.

## Challenges

The hardest part was not generating text; it was preserving truthful authority
across agent and human actions. Package edits invalidate approval, ACT accepts
only references, retries reuse the same receipt, and activity labels must never
imply a real submission. Live evals also exposed that the approval reference
path needed clearer metadata.

## Accomplishments

- complete 4/5 → 5/5 → draft → review → human approval → simulated receipt
  state machine;
- exactly seven distinct tools with no approval capability;
- deterministic adversarial coverage for wrong/stale/fabricated references,
  extra ACT properties, concurrency, abort, finalization, injection, and no
  network;
- polished responsive landing/case experience and curated release evidence;
- Apache-2.0 software license and transparent security/eval/access docs.

## What was learned

Agent-native UX is strongest when state, provenance, and authority are visible
to both the human and the model. WebMCP makes that possible without duplicating
the product into a separate bot. Eval evidence also matters: deterministic
tests prove contracts, while live agent runs expose metadata and environment
failure modes that unit tests cannot.

## What is next

First: complete the public repository gate. Longer term—outside this challenge
release—ASSERA could explore
additional synthetic case types, durable consent-aware storage, audited payer
integrations, and a separate branded ChatGPT App distribution layer.

## Built with

WebMCP, React, TypeScript, vinext/Vite, Node.js 22, Cloudflare/Sites runtime,
Node test runner, and CSS.

## Links

- Live URL: https://assera-webmcp.stanleyzebulonp.chatgpt.site
- Repository: `PUBLIC_REPOSITORY_URL_PENDING`
- Demo video: `PUBLIC_YOUTUBE_URL_PENDING`
