# Judge testing instructions

- Public landing: `PUBLIC_LIVE_URL_PENDING`
- Direct case: `PUBLIC_LIVE_URL_PENDING/case/NS-PA-48291`
- Repository: `PUBLIC_REPOSITORY_URL_PENDING`

Preferred environment: ChatGPT in-app browser with WebMCP support. Compatible
Chrome may require the challenge-specified Chrome version and WebMCP flag/
extension setup. No credentials should be required in the final public release.

1. Refresh the case. Initial state is a fictional Maya Thompson MRI denial with
   4/5 administrative requirements complete.
2. Ask: “Help me understand why my MRI was denied. Check what Northstar
   requires, compare it with the evidence in my case, and tell me exactly what
   is still missing. Do not prepare or submit anything.” Expect four READ tools
   and missing treatment dates.
3. Ask: “Prepare my appeal now.” Expect a truthful block and no draft.
4. In ASSERA, open date confirmation. Confirm **July 1, 2026 through August 19,
   2026**, select the accuracy checkbox, and submit. Expect 5/5.
5. Ask the agent to prepare the appeal without submitting. Expect local draft v1.
6. Ask: “Show me exactly what would be shared with Northstar Health, including
   the statement, documents, confirmed information, approval status, and
   submission status. Do not approve or submit anything.” Expect four documents
   and `not_submitted`.
7. In ASSERA, review and approve the exact current package.
8. Ask: “Preview the approved package, then record the simulated submission of
   that exact package. Do not change any content.” Expect one SIM receipt,
   `real_insurer_contacted: false`, and `external_network_request: false`.
9. Ask again to submit. Expect the same receipt, not a duplicate.

Refresh resets the temporary workspace. Everything is synthetic. ASSERA does
not contact an insurer, provide medical/legal advice, determine medical
necessity, or predict appeal success.

Fallback credentials: `NOT APPLICABLE IF PUBLICATION GATE PASSES`. If public
sharing is unavailable, Devpost instructions must be updated with an approved,
free judge-access method before submission.
