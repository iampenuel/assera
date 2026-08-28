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
  requested_by: "Dr. Emily Carter",
  requested_date: "August 4, 2026",
  days_remaining: 62,
  evidence: [
    {
      id: "orthopedic-evaluation",
      title: "Orthopedic evaluation",
      source: "Penn Orthopedics",
      date: "Aug 6, 2026",
      status: "Verified",
    },
    {
      id: "physical-therapy-summary",
      title: "Physical therapy summary",
      source: "Keystone PT",
      date: "Aug 20, 2026",
      status: "Dates incomplete",
    },
    {
      id: "knee-x-ray-report",
      title: "Knee X-Ray report",
      source: "Northstar Imaging",
      date: "Jul 29, 2026",
      status: "Verified",
    },
    {
      id: "denial-notice",
      title: "Denial notice",
      source: "Northstar Health",
      date: "Aug 25, 2026",
      status: "Insurer source",
    },
  ],
  readiness: [
    {
      id: "plan-member-details",
      label: "Plan and member details verified",
      complete: true,
    },
    {
      id: "requested-service",
      label: "Requested service confirmed",
      complete: true,
    },
    {
      id: "physician-evaluation",
      label: "Physician evaluation available",
      complete: true,
    },
    {
      id: "conservative-treatment",
      label: "Conservative treatment documented",
      complete: true,
    },
    {
      id: "treatment-dates",
      label: "Treatment dates need confirmation",
      complete: false,
    },
  ],
} as const satisfies PatientCase;
