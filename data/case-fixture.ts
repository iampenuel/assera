import type { PatientCase } from "../types/case";

export const mayaCase = {
  patient: {
    name: "Maya Thompson",
    age: 34,
    location: "Pennsylvania",
  },
  case_id: "NS-PA-48291",
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
  evidence: [
    { id: "orthopedic-evaluation", title: "Orthopedic Evaluation" },
    { id: "physical-therapy-summary", title: "Physical Therapy Summary" },
    { id: "knee-x-ray-report", title: "Knee X-Ray Report" },
    { id: "denial-notice", title: "Denial Notice" },
  ],
  readiness: [
    { id: "physician-evaluation", label: "Physician evaluation", complete: true },
    { id: "prior-x-ray", label: "Prior X-ray", complete: true },
    {
      id: "conservative-treatment",
      label: "Six weeks conservative treatment",
      complete: true,
    },
    { id: "persistent-symptoms", label: "Persistent symptoms", complete: true },
    {
      id: "treatment-dates",
      label: "Explicit treatment start/end dates",
      complete: false,
    },
  ],
} as const satisfies PatientCase;
