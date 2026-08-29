export type Decision = "denied";

export interface DenialDetails {
  readonly case_id: string;
  readonly service: string;
  readonly decision: Decision;
  readonly decision_date: string;
  readonly reason_code: string;
  readonly reason: string;
  readonly appeal_deadline: string;
  readonly payer: string;
}

export type CoverageRequirementId =
  | "physician_evaluation"
  | "prior_xray"
  | "conservative_treatment_duration"
  | "persistent_symptoms"
  | "treatment_date_range";

export interface CoverageRequirement {
  readonly id: CoverageRequirementId;
  readonly label: string;
  readonly meaning: string;
  readonly workspace_label: string;
}

export interface CoveragePolicy {
  readonly case_id: string;
  readonly policy_id: string;
  readonly policy_title: string;
  readonly payer: string;
  readonly effective_date: string;
  readonly synthetic: true;
  readonly requirements: readonly CoverageRequirement[];
}

export type EvidenceStatus =
  | "verified"
  | "needs_confirmation"
  | "insurer_source";

export interface EvidenceConfirmationGap {
  readonly requirement_id: CoverageRequirementId;
  readonly issue: string;
  readonly next_required_information: string;
}

export interface EvidenceDocument {
  readonly id: string;
  readonly name: string;
  readonly filename: string;
  readonly source: string;
  readonly document_date: string;
  readonly status: EvidenceStatus;
  readonly supports: readonly CoverageRequirementId[];
  readonly needs_confirmation: readonly EvidenceConfirmationGap[];
  readonly context?: "denial_context";
  readonly facts?: {
    readonly conservative_treatment_weeks?: number;
    readonly explicit_date_range_confirmed?: boolean;
  };
}

export type RequirementReadinessStatus =
  | "complete"
  | "incomplete"
  | "unavailable";

export interface RequirementReadiness {
  readonly requirement_id: CoverageRequirementId;
  readonly status: RequirementReadinessStatus;
  readonly supported_by: readonly string[];
  readonly issue?: string;
}

export interface AppealReadiness {
  readonly case_id: string;
  readonly synthetic: true;
  readonly summary: {
    readonly total: number;
    readonly complete: number;
    readonly incomplete: number;
    readonly unavailable: number;
  };
  readonly ready_to_prepare: boolean;
  readonly requirements: readonly RequirementReadiness[];
  readonly next_required_information: readonly {
    readonly field: CoverageRequirementId;
    readonly description: string;
  }[];
}

export interface CoverageRequirementsResult {
  readonly case_id: string;
  readonly payer: string;
  readonly policy_id: string;
  readonly policy_title: string;
  readonly effective_date: string;
  readonly synthetic: true;
  readonly requirements: readonly Pick<CoverageRequirement, "id" | "label">[];
}

export interface AppealEvidenceResult {
  readonly case_id: string;
  readonly synthetic: true;
  readonly count: number;
  readonly documents: readonly Pick<
    EvidenceDocument,
    "id" | "name" | "filename" | "source" | "document_date" | "status" | "supports"
  >[];
}

export interface PatientCase extends DenialDetails {
  readonly patient: {
    readonly name: string;
    readonly age: number;
    readonly location: string;
  };
  readonly plain_language_explanation: string;
  readonly requested_by: string;
  readonly requested_date: string;
  readonly days_remaining: number;
}

export interface AgentActivity {
  readonly id: string;
  readonly title: string;
  readonly category: "READ";
  readonly impact: "No information changed";
  readonly occurredAt: string;
}

export type WebMCPStatus = "checking" | "available" | "unavailable" | "error";
