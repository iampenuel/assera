import type { PatientCase } from "../types/case";

export const SUPPORTED_CASE_ID = "NS-PA-48291";

export const mayaCase = {
  patient: {
    name: "Maya Thompson",
    age: 34,
    location: "Pennsylvania",
  },
  case_id: SUPPORTED_CASE_ID,
  service: "MRI — Right Knee",
  decision: "denied",
  decision_date: "2026-08-25",
  reason_code: "DOC-214",
  reason:
    "Documentation did not establish six weeks of physician-directed conservative treatment.",
  appeal_deadline: "2026-10-29",
  payer: "Northstar Health",
  plain_language_explanation:
    "Northstar Health needs records showing that you completed at least six weeks of treatment—such as physical therapy—under a physician’s direction before approving the MRI.",
  requested_by: "Dr. Emily Carter",
  requested_date: "2026-08-04",
  days_remaining: 62,
} as const satisfies PatientCase;

export function getCaseFixture(caseId: string): PatientCase | null {
  return caseId === SUPPORTED_CASE_ID ? mayaCase : null;
}
