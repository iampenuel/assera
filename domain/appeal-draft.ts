import { formatIsoDate } from "./format-date";
import type {
  AppealDraft,
  CaseWorkspaceSnapshot,
  CoverageRequirementId,
  NextRequiredInformation,
} from "../types/case";

export class PrepareBlockedError extends Error {
  readonly code = "PREPARE_BLOCKED" as const;
  readonly incomplete_requirement_ids: readonly CoverageRequirementId[];
  readonly unavailable_requirement_ids: readonly CoverageRequirementId[];
  readonly next_required_information: readonly NextRequiredInformation[];

  constructor(snapshot: CaseWorkspaceSnapshot) {
    super(
      "Appeal preparation is blocked until the required treatment dates are confirmed.",
    );
    this.name = "PrepareBlockedError";
    this.incomplete_requirement_ids = snapshot.readiness.requirements
      .filter((requirement) => requirement.status === "incomplete")
      .map((requirement) => requirement.requirement_id);
    this.unavailable_requirement_ids = snapshot.readiness.requirements
      .filter((requirement) => requirement.status === "unavailable")
      .map((requirement) => requirement.requirement_id);
    this.next_required_information = snapshot.readiness.next_required_information;
  }
}

export type DraftStatementErrorCode =
  | "DRAFT_NOT_FOUND"
  | "DRAFT_STATEMENT_REQUIRED"
  | "DRAFT_STATEMENT_TOO_LONG";

export class DraftStatementError extends Error {
  readonly code: DraftStatementErrorCode;

  constructor(code: DraftStatementErrorCode, message: string) {
    super(message);
    this.name = "DraftStatementError";
    this.code = code;
  }
}

export const MAX_DRAFT_STATEMENT_LENGTH = 5_000;

export function validateDraftStatement(statement: string): string {
  const trimmed = statement.trim();

  if (!trimmed) {
    throw new DraftStatementError(
      "DRAFT_STATEMENT_REQUIRED",
      "The appeal draft statement cannot be blank.",
    );
  }

  if (trimmed.length > MAX_DRAFT_STATEMENT_LENGTH) {
    throw new DraftStatementError(
      "DRAFT_STATEMENT_TOO_LONG",
      `Keep the appeal draft statement to ${MAX_DRAFT_STATEMENT_LENGTH.toLocaleString("en-US")} characters or fewer.`,
    );
  }

  return trimmed;
}

function createDraftStatement(snapshot: CaseWorkspaceSnapshot): string {
  const confirmation = snapshot.treatmentDateConfirmation;
  if (!confirmation) throw new PrepareBlockedError(snapshot);

  const duration =
    confirmation.duration_days % 7 === 0
      ? `${confirmation.duration_days} calendar days (${confirmation.duration_days / 7} weeks)`
      : `${confirmation.duration_days} calendar days`;

  return `To ${snapshot.caseData.payer} Appeals Department:

I am requesting reconsideration of the denial for ${snapshot.caseData.service}, case ${snapshot.caseData.case_id}.

The denial stated that the submitted documentation did not establish six weeks of physician-directed conservative treatment.

The ASSERA case workspace contains an orthopedic evaluation from Penn Orthopedics, a physical-therapy summary from Keystone PT, a knee X-ray report from Northstar Imaging, and the denial notice from ${snapshot.caseData.payer}. ${snapshot.caseData.patient.name} confirmed in ASSERA that physical therapy occurred from ${formatIsoDate(confirmation.start_date, true)} through ${formatIsoDate(confirmation.end_date, true)}, a period of ${duration}.

Please review the included records and reconsider the prior-authorization decision.

This draft was assembled from synthetic demonstration data in ASSERA. It has not been submitted and does not provide medical or legal advice.`;
}

export function createAppealDraft(
  snapshot: CaseWorkspaceSnapshot,
  createdAt: string,
): AppealDraft {
  if (!snapshot.readiness.ready_to_prepare || !snapshot.treatmentDateConfirmation) {
    throw new PrepareBlockedError(snapshot);
  }

  const confirmation = snapshot.treatmentDateConfirmation;
  const dateKey = `${confirmation.start_date.replaceAll("-", "")}-${confirmation.end_date.replaceAll("-", "")}`;

  return {
    id: `appeal-draft-${snapshot.caseId}-${dateKey}`,
    case_id: snapshot.caseId,
    status: "draft",
    created_at: createdAt,
    updated_at: createdAt,
    statement: createDraftStatement(snapshot),
    evidence_ids: snapshot.effectiveEvidence.map((document) => document.id),
    requirement_summary: { ...snapshot.readiness.summary },
    unresolved_items: [...snapshot.readiness.next_required_information],
    treatment_date_confirmation: confirmation,
    synthetic: true,
    submission_status: "not_submitted",
    provenance: {
      generated_by: "ASSERA_DETERMINISTIC_TEMPLATE",
      source_case_id: snapshot.caseId,
      human_confirmed_fields: ["treatment_date_range"],
    },
  };
}
