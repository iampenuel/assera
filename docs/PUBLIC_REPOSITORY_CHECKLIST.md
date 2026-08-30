# Public repository checklist

Audit date: 2026-08-29

## Current state

- Branch: `main`.
- Git remote: none configured.
- Hosting provider/visibility: not applicable; no public remote exists.
- Source/assets: tracked, including the approved hero and official logos.
- Generated builds/dependencies/environments: ignored.
- Canonical release evidence: explicitly allowed under
  `artifacts/release-candidate/`; other local artifact folders stay ignored.
- Public-document local paths: none found.
- Secret/environment files: none found.
- Root license: Apache-2.0; `NOTICE` distinguishes software licensing from
  ASSERA brand identifiers.
- Clean-clone/build result: pending final gate.

## Owner-controlled publication steps

1. Create or select the final repository on the owner’s chosen provider; set
   the default branch to `main`. Do not make it public until the release commit
   and secret scan are final.
2. Add the remote, for example `git remote add origin <repository-url>`.
3. Push the release commit with `git push -u origin main`.
4. Change repository visibility to Public only with owner approval.
5. Add description: “Human-centered, browser-native WebMCP workflow for a
   synthetic prior-authorization appeal demonstration.”
6. Add the final public website URL in the repository About field.
7. Add focused topics such as `webmcp`, `chatgpt`, `react`, `typescript`,
   `accessibility`, and `healthcare-navigation`.
8. Confirm the host detects Apache-2.0 from root `LICENSE` and renders `NOTICE`.
9. Confirm README images/links, public URLs, and demo-video URL.
10. Clone into a clean temporary directory, use Node 22, install from the
    lockfile, and run typecheck, lint, tests, and build.
11. Re-run a filename-only secret/local-path scan on the exact pushed commit.
12. Preserve the final commit SHA and repository URL in Devpost.

## Public-content guardrails

- Never commit Sites credentials, bypass tokens, environment files, user-home
  paths, temporary archives, or unrelated QA captures.
- Do not claim HIPAA compliance, clinical validation, legal advice, medical
  necessity, appeal success, or real insurer integration.
- Keep the repository’s synthetic-data statement visible.

**REPOSITORY PUBLICATION GATE — NOT READY**. A release commit, clean-clone
verification, remote selection, push, and explicit visibility approval remain.
