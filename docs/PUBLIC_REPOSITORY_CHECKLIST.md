# Public repository maintenance checklist

Initial audit date: 2026-09-01

Positioning review: 2026-09-04

## Current public state

- Default branch: `main`.
- Repository: `https://github.com/iampenuel/assera`.
- Visibility: Public.
- Description: “Human-centered, patient-side healthcare access navigation
  powered by WebMCP.”
- Homepage: `https://assera-webmcp.stanleyzebulonp.chatgpt.site`.
- Source and approved assets are tracked, including the canonical hero and
  official logos.
- Generated builds, dependencies, environments, and local QA artifacts are
  ignored.
- Curated engineering evidence is explicitly allowed under
  `artifacts/release-candidate/`; other local artifact folders remain ignored.
- Public documentation contains no user-home, Downloads, or temporary paths.
- Secret/environment files are not tracked.
- Root license: Apache-2.0; `NOTICE` distinguishes software licensing from
  ASSERA brand identifiers.

## Owner-controlled maintenance

1. Keep the default branch and visibility changes owner-controlled.
2. Keep the repository About description focused on human-centered healthcare
   access, WebMCP, deterministic state, and explicit human approval.
3. Keep the canonical public website URL in the repository homepage field.
4. Maintain focused topics such as `webmcp`, `chatgpt`, `react`, `typescript`,
   `accessibility`, and `healthcare-navigation`.
5. Confirm the host detects Apache-2.0 from root `LICENSE` and renders `NOTICE`.
6. Confirm README images, internal links, public URLs, and evaluation evidence.
7. For release-level changes, clone into a clean temporary directory, use Node
   22, install from the lockfile, and run typecheck, lint, tests, and build.
8. Run a filename-only secret/local-path scan before publishing a release or
   sharing a source archive.

## Public-content guardrails

- Never commit Sites credentials, bypass tokens, environment files, user-home
  paths, temporary archives, or unrelated QA captures.
- Do not claim OpenAI endorsement or describe ASSERA as an OpenAI product.
- Do not claim HIPAA compliance, clinical validation, legal advice, medical
  necessity, appeal success, or real insurer integration.
- Keep the repository’s synthetic-data and simulation-only disclosures visible.
- Preserve the exact seven WebMCP site tools, human-only CONTROL boundary, and
  one-tool read-only companion architecture.

**PUBLIC REPOSITORY STATUS — PUBLIC**. Current project documentation presents
ASSERA as a standalone personal engineering project.
