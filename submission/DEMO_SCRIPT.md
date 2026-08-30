# ASSERA demo script — target 2:35

The final recording must stay under three minutes and use clear narration.

## 0:00–0:12 — problem

“Prior authorization can turn a denial into an information problem. In 2024
Medicare Advantage data, KFF found only 11.5% of denied requests were appealed,
while 80.7% of appealed denials were partially or fully overturned.”

Show the hero briefly, then open Maya’s case.

## 0:12–0:23 — thesis

“ASSERA is a shared workspace where an agent helps read and prepare—but the
person keeps control. A denial isn’t the final word.”

## 0:23–0:43 — READ

Ask: “Help me understand why my MRI was denied. Check what Northstar requires,
compare it with the evidence in my case, and tell me exactly what is still
missing. Do not prepare or submit anything.”

Show the four READ calls and the page activity.

## 0:43–0:56 — exact gap

“The agent reads structured state, not screenshots. Four of five requirements
are complete; the exact missing item is the physical-therapy date range.”

## 0:56–1:08 — truthful block

Ask: “Prepare my appeal now.” Show `PREPARE_BLOCKED`, no invented dates, no
draft, and the blocked PREPARE activity.

## 1:08–1:22 — human confirmation

Maya opens the form, confirms July 1 through August 19, 2026, and checks the
accuracy box. “This fact can come only from the human interface.” Show 5/5.

## 1:22–1:38 — deterministic draft

Ask the agent to prepare the appeal. “ASSERA creates a deterministic local
draft from the case, evidence, and confirmed dates. Nothing is submitted.”

## 1:38–1:55 — exact package

Ask for the exact package preview. Show statement, four documents, shared
information, package version, and `not_approved` / `not_submitted`.

## 1:55–2:10 — human approval

Maya reviews the statement/documents, selects the approval checkbox, and
approves the exact package. “The agent has no approval tool. ASSERA assists;
Maya authorizes.”

## 2:10–2:24 — simulated ACT

Ask the agent to preview the approved package and record the exact simulated
submission. Show `submit_appeal` references and the SIM receipt. “No real
insurer was contacted and no external request occurred.”

## 2:24–2:35 — close

Show READ / PREPARE / CONTROL / ACT activity and the finalized package.
“Browser-native WebMCP lets the agent act on truthful product state while human
authority stays visible. ASSERA: a denial isn’t the final word.”

Use no unlicensed music. Show the functioning product quickly and keep the
simulation label visible during ACT.
