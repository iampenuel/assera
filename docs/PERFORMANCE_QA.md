# Performance and runtime QA

Review date: 2026-08-30  
No heavy audit dependency was installed.

## Findings

| Area | Result | Evidence |
|---|---|---|
| Hero loading | PASS | `next/image`, `fill`, `priority`, and `sizes="100vw"`; exact approved 2.1 MB photograph; no generated replacement. |
| Hero layout stability | PASS by implementation/visual QA | Absolutely positioned fill image inside a fixed minimum-height hero prevents image reflow. |
| Console errors/warnings | PASS | None observed on landing, initial case, prepared package, form, or prompt-injection state. |
| Hydration errors | PASS | No hydration console entry; client workspace updated correctly after WebMCP/UI actions. |
| Duplicate registration | PASS | Deterministic test asserts exactly seven unique tools and one registration signal. |
| Render loops | PASS | No repeated activity or registration observed after idle navigation/action. |
| Submission network traffic | PASS | No endpoint exists; tests fail if preparation/ACT call `fetch`. |
| Route behavior | PASS | Anonymous requests return 200 for both the public landing and case routes; no owner session is required. |
| Responsive overflow | PASS | v9 showed 56 px overflow at 1024×768. The validated source moves case-shell collapse to 1080 px; local production QA measured 1024 px viewport and 1024 px document width. |
| 1600/1440/768/390 layout | PASS | Deployed-v9 coverage passed all listed widths except the now-fixed 1024 case shell; local production QA reconfirmed 1600 and 390 without overflow. |
| Slow/blocked assets | PASS by observed UI | Hero, logos, typography, and case surfaces loaded; no browser warning/error. |
| Lighthouse-style score | NOT_RUN | Existing browser did not expose timing/layout-shift entries and no large audit package was installed. |

## Responsive evidence

Landing measurements at 1600×900, 1440×900, 1024×768, 768×1024, and
390×844 all matched the requested viewport and had no horizontal overflow.
The full landing sections—hero, statistics, How It Works, Our Approach, Safety,
CTA, and footer—are captured in the desktop/mobile release evidence.

Initial case measurements matched all five viewports. The deployed version 9
overflow at 1024×768 was isolated to its 205 + minimum 560 + 315 px grid. The
validated source collapses only the case layout by 1080 px. Local production QA after
the final build measured no overflow at 1024, 1600, or 390. Desktop 1440/1600
and tablet/mobile ≤768 behavior remain otherwise unchanged.

Curated evidence under `artifacts/release-candidate/` covers the landing page,
initial 4/5 state, confirmed-date continuation, human approval hierarchy,
neutral receipt, activity taxonomy, plugin surfaces, and inert injection text.

## Runtime boundary

The application is a deterministic in-memory synthetic experience. It has no database call,
analytics SDK, upload, webhook, payer API, polling loop, or submission request.
Refresh resets the workspace. The production build gate records bundle/build
completion in `docs/RELEASE_AUDIT.md`.

## Follow-up

If a future performance profiler is available without a heavy install, capture
LCP/CLS/network timing without downscaling or replacing the approved hero image
merely to chase a synthetic score.
