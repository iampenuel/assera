import type { EvidenceDocument } from "../types/case";

export const mayaEvidence: readonly EvidenceDocument[] = [
  {
    id: "evidence-orthopedic-evaluation",
    name: "Orthopedic Evaluation",
    filename: "orthopedic-evaluation.pdf",
    source: "Penn Orthopedics",
    document_date: "2026-08-06",
    status: "verified",
    supports: ["physician_evaluation", "persistent_symptoms"],
    needs_confirmation: [],
  },
  {
    id: "evidence-physical-therapy",
    name: "Physical Therapy Summary",
    filename: "physical-therapy-summary.pdf",
    source: "Keystone PT",
    document_date: "2026-08-20",
    status: "needs_confirmation",
    supports: ["conservative_treatment_duration"],
    needs_confirmation: [
      {
        requirement_id: "treatment_date_range",
        issue: "Exact physical-therapy start and end dates require confirmation.",
        next_required_information: "Confirm the physical-therapy start and end dates.",
      },
    ],
    facts: {
      conservative_treatment_weeks: 7,
      explicit_date_range_confirmed: false,
    },
  },
  {
    id: "evidence-knee-xray",
    name: "Knee X-Ray Report",
    filename: "knee-xray-report.pdf",
    source: "Northstar Imaging",
    document_date: "2026-07-29",
    status: "verified",
    supports: ["prior_xray"],
    needs_confirmation: [],
  },
  {
    id: "evidence-denial-notice",
    name: "Denial Notice",
    filename: "denial-notice.pdf",
    source: "Northstar Health",
    document_date: "2026-08-25",
    status: "insurer_source",
    supports: [],
    needs_confirmation: [],
    context: "denial_context",
  },
];
