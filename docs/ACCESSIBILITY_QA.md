# Accessibility QA

Review date: 2026-09-01
Surface: public Sites version 10 plus final Phase 07C/07D source and visual QA

Overall status: **CONDITIONAL PASS**. No blocking semantic, labeling, focus-style,
contrast-signaling, or mobile-overflow defect was found. Automated Tab-key
traversal is `NOT_RUN`: the connected browser accepted key commands but did not
advance `document.activeElement`, so a final manual keyboard pass is still
required before public submission.

## Journey evidence

The live in-app-browser journey covered case entry, readiness, opening the date
form, confirming dates, agent preparation, draft edit/save, package review,
human approval, approval invalidation after edit, sidebar state, and mobile
menu opening. Approved Milestone 05 evidence covers approval, human fallback,
simulated receipt, finalized package, and READ/PREPARE/CONTROL/ACT activity.

| Check | Result | Evidence |
|---|---|---|
| Page/section structure | PASS | One `h1`; named regions/sections; nav has `aria-label="Case workspace"`. |
| Form labels | PASS | Date inputs, confirmation checkbox, draft textarea, and approval checkbox have programmatic labels. |
| Error association | PASS | Triggered checkbox error used `role="alert"`; inputs/checkbox linked to `treatment-date-error` with `aria-describedby`. |
| Focus visibility | PASS by source | Global `:focus-visible` styles and field-specific outlines are present. |
| Focus management | PASS by source/live behavior | Human open/confirm/prepare/review/receipt actions intentionally focus the changed region and respect reduced motion. WebMCP calls do not invoke focus helpers. |
| Keyboard order | NOT_RUN | Browser backend did not advance active focus on Tab; perform the manual checklist below. |
| Live regions | PASS with watch item | Polite status regions announce local state; alerts are used for errors. Multiple live regions exist but observed interactions produced scoped messages, not loops. |
| Status not color-only | PASS | “DENIED,” “Blocked,” “Human only,” “APPROVED,” “SIMULATION COMPLETE,” and explanatory text accompany color. |
| Meaningful controls | PASS | Buttons name actions: Review dates, Confirm dates, Save changes, Approve package, Revoke approval, Run simulated submission. |
| Finalized/read-only state | PASS | `readOnly` textarea and visible “FINALIZED” / “READ-ONLY AFTER SIMULATION” labels. |
| Receipt readability | PASS | Heading, confirmation number, metadata list, and explicit no-real-insurer statements. |
| Mobile menu | PASS | Native `details`/`summary`; summary measured 70×44 px and opened a named navigation. |
| Touch targets | PASS with minor note | Primary controls meet 44 px; the logo link measured 42 px high at desktop but is not a mobile task control. |
| 390×844 overflow | PASS | Landing and case continuation measured `scrollWidth === innerWidth`; the inline Prepare CTA remained visible after date confirmation. |
| Reduced motion | PASS | CSS disables smooth behavior; intentional focus helper uses `matchMedia`. |
| Browser console | PASS | No warning/error entries during landing, case, form, prepared package, or injection checks. |

## Manual keyboard completion checklist

Run once in the final public candidate without a mouse:

1. Tab to Open Maya’s case and press Enter.
2. Open Case menu at narrow width; traverse each anchor and close it.
3. Open Review dates; edit both native date inputs; toggle the confirmation
   checkbox with Space; submit and verify focus lands on the confirmed panel.
4. Trigger the missing-confirmation error and confirm the message is announced.
5. Use the human Prepare action; verify focus moves to Appeal draft.
6. Edit/save, review the package, approve, revoke, and approve again.
7. Run human simulated submission; verify focus moves to receipt and all
   finalized controls are understandable.
8. Traverse sidebar/mobile anchors and confirm no focus trap or hidden target.

Record any defect before marking this document’s overall status PASS.
