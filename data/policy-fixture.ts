import type { CoveragePolicy } from "../types/case";

export const mayaCoveragePolicy = {
  case_id: "NS-PA-48291",
  policy_id: "NS-MSK-MRI-KNEE-2026",
  policy_title: "Advanced Imaging — Knee MRI Documentation Requirements",
  payer: "Northstar Health",
  effective_date: "2026-01-01",
  synthetic: true,
  requirements: [
    {
      id: "physician_evaluation",
      label: "Physician evaluation",
      meaning: "A clinician evaluation documenting the knee complaint is available.",
      workspace_label: "Physician evaluation",
    },
    {
      id: "prior_xray",
      label: "Prior knee X-ray",
      meaning: "A prior radiography report is available.",
      workspace_label: "Prior knee X-ray",
    },
    {
      id: "conservative_treatment_duration",
      label: "At least six weeks of physician-directed conservative treatment",
      meaning:
        "The available records document at least six weeks of conservative treatment such as physical therapy.",
      workspace_label: "Six weeks of physician-directed conservative treatment",
    },
    {
      id: "persistent_symptoms",
      label: "Persistent symptoms after conservative treatment",
      meaning:
        "The clinical documentation indicates symptoms continued after conservative treatment.",
      workspace_label: "Persistent symptoms after conservative treatment",
    },
    {
      id: "treatment_date_range",
      label: "Explicit treatment start and end dates",
      meaning:
        "The physical-therapy documentation must contain or confirm the treatment date range.",
      workspace_label: "Treatment dates need confirmation",
    },
  ],
} as const satisfies CoveragePolicy;
