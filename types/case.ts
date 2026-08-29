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

export interface TreatmentDateConfirmation {
  readonly start_date: string;
  readonly end_date: string;
  readonly duration_days: number;
  readonly confirmed_at: string;
  readonly confirmed_by: {
    readonly type: "patient";
    readonly name: "Maya Thompson";
  };
  readonly provided_via: "ASSERA_UI";
  readonly source_evidence_id: "evidence-physical-therapy";
}

export interface ConfirmTreatmentDatesInput {
  readonly start_date: string;
  readonly end_date: string;
  readonly confirmation: boolean;
}

export type EvidenceStatus =
  | "verified"
  | "needs_confirmation"
  | "human_confirmed"
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
  readonly human_confirmation?: TreatmentDateConfirmation;
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

export interface AppealReadinessSummary {
  readonly total: number;
  readonly complete: number;
  readonly incomplete: number;
  readonly unavailable: number;
}

export interface NextRequiredInformation {
  readonly field: CoverageRequirementId;
  readonly description: string;
}

export interface AppealReadiness {
  readonly case_id: string;
  readonly synthetic: true;
  readonly summary: AppealReadinessSummary;
  readonly ready_to_prepare: boolean;
  readonly requirements: readonly RequirementReadiness[];
  readonly next_required_information: readonly NextRequiredInformation[];
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

export interface AppealEvidenceDocumentResult
  extends Pick<
    EvidenceDocument,
    | "id"
    | "name"
    | "filename"
    | "source"
    | "document_date"
    | "status"
    | "supports"
  > {
  readonly human_confirmation?: TreatmentDateConfirmation;
}

export interface AppealEvidenceResult {
  readonly case_id: string;
  readonly synthetic: true;
  readonly count: number;
  readonly documents: readonly AppealEvidenceDocumentResult[];
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

export type WorkspaceActivityCategory = "READ" | "PREPARE";
export type WorkspaceActor = "AGENT" | "HUMAN";
export type WorkspaceActivityOutcome = "completed" | "blocked";

interface WorkspaceActivityBase {
  readonly id: string;
  readonly title: string;
  readonly actor: WorkspaceActor;
  readonly outcome: WorkspaceActivityOutcome;
  readonly impact: string;
  readonly occurredAt: string;
  readonly toolName?: string;
}

export interface ReadWorkspaceActivity extends WorkspaceActivityBase {
  readonly category: "READ";
  readonly actor: "AGENT";
  readonly outcome: "completed";
  readonly impact: "No information changed";
  readonly toolName: string;
}

export interface PrepareWorkspaceActivity extends WorkspaceActivityBase {
  readonly category: "PREPARE";
}

export type WorkspaceActivity =
  | ReadWorkspaceActivity
  | PrepareWorkspaceActivity;

export type WorkspaceActivityInput =
  | Omit<ReadWorkspaceActivity, "id" | "occurredAt">
  | Omit<PrepareWorkspaceActivity, "id" | "occurredAt">;

export interface AppealDraft {
  readonly id: string;
  readonly case_id: string;
  readonly status: "draft";
  readonly created_at: string;
  readonly updated_at: string;
  readonly statement: string;
  readonly evidence_ids: readonly string[];
  readonly requirement_summary: AppealReadinessSummary;
  readonly unresolved_items: readonly NextRequiredInformation[];
  readonly treatment_date_confirmation: TreatmentDateConfirmation;
  readonly synthetic: true;
  readonly submission_status: "not_submitted";
  readonly provenance: {
    readonly generated_by: "ASSERA_DETERMINISTIC_TEMPLATE";
    readonly source_case_id: string;
    readonly human_confirmed_fields: readonly CoverageRequirementId[];
  };
}

export interface CaseWorkspaceState {
  readonly caseId: string;
  readonly treatmentDateConfirmation: TreatmentDateConfirmation | null;
  readonly appealDraft: AppealDraft | null;
  readonly activities: readonly WorkspaceActivity[];
}

export interface CaseWorkspaceSnapshot {
  readonly caseId: string;
  readonly caseData: PatientCase;
  readonly policy: CoveragePolicy;
  readonly baseEvidence: readonly EvidenceDocument[];
  readonly effectiveEvidence: readonly EvidenceDocument[];
  readonly treatmentDateConfirmation: TreatmentDateConfirmation | null;
  readonly readiness: AppealReadiness;
  readonly appealDraft: AppealDraft | null;
  readonly activities: readonly WorkspaceActivity[];
}

export interface ConfirmTreatmentDatesResult {
  readonly action: "confirmed" | "updated" | "unchanged";
  readonly confirmation: TreatmentDateConfirmation;
  readonly readiness: AppealReadiness;
  readonly draft_invalidated: boolean;
}

export interface PrepareAppealResult {
  readonly case_id: string;
  readonly action: "created" | "reused";
  readonly draft: AppealDraft;
}

export interface CaseWorkspaceAdapter {
  getSnapshot(): CaseWorkspaceSnapshot;
  confirmTreatmentDates(
    input: ConfirmTreatmentDatesInput,
    actor: WorkspaceActor,
  ): ConfirmTreatmentDatesResult;
  prepareAppeal(actor: WorkspaceActor): PrepareAppealResult;
  updateDraftStatement(statement: string, actor: WorkspaceActor): AppealDraft;
  recordActivity(input: WorkspaceActivityInput): WorkspaceActivity;
}

export type WebMCPStatus = "checking" | "available" | "unavailable" | "error";
