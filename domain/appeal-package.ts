import type {
  AppealApproval,
  AppealPackagePreview,
  AppealPackageSnapshot,
  CaseWorkspaceSnapshot,
  WorkspaceActor,
} from "../types/case";

export type AppealPackageErrorCode =
  | "PREVIEW_NOT_AVAILABLE"
  | "PACKAGE_NOT_READY";

export class AppealPackageError extends Error {
  readonly code: AppealPackageErrorCode;

  constructor(code: AppealPackageErrorCode, message: string) {
    super(message);
    this.name = "AppealPackageError";
    this.code = code;
  }
}

export type AppealApprovalErrorCode =
  | "APPROVAL_CONFIRMATION_REQUIRED"
  | "PACKAGE_VERSION_MISMATCH"
  | "APPROVAL_NOT_AVAILABLE"
  | "APPROVAL_ACTOR_NOT_ALLOWED";

export class AppealApprovalError extends Error {
  readonly code: AppealApprovalErrorCode;

  constructor(code: AppealApprovalErrorCode, message: string) {
    super(message);
    this.name = "AppealApprovalError";
    this.code = code;
  }
}

function packageNotReady(): never {
  throw new AppealPackageError(
    "PACKAGE_NOT_READY",
    "The current package is not ready for review. Recheck the case workspace and prepare a current draft.",
  );
}

function buildCurrentAppealPackageSnapshot(
  snapshot: CaseWorkspaceSnapshot,
): AppealPackageSnapshot {
  const draft = snapshot.appealDraft;
  const confirmation = snapshot.treatmentDateConfirmation;

  if (!draft) {
    throw new AppealPackageError(
      "PREVIEW_NOT_AVAILABLE",
      "Prepare an appeal draft before previewing the submission package.",
    );
  }

  if (
    !confirmation ||
    !snapshot.readiness.ready_to_prepare ||
    snapshot.readiness.summary.complete !== snapshot.readiness.summary.total ||
    snapshot.readiness.next_required_information.length > 0 ||
    draft.unresolved_items.length > 0 ||
    draft.case_id !== snapshot.caseId ||
    draft.treatment_date_confirmation.start_date !== confirmation.start_date ||
    draft.treatment_date_confirmation.end_date !== confirmation.end_date
  ) {
    packageNotReady();
  }

  const includedDocuments = draft.evidence_ids.map((id) => {
    const document = snapshot.effectiveEvidence.find((candidate) => candidate.id === id);
    if (!document) packageNotReady();

    return {
      id: document.id,
      name: document.name,
      source: document.source,
      document_date: document.document_date,
      role: document.context === "denial_context"
        ? "denial_context" as const
        : "supporting_evidence" as const,
    };
  });

  const packageId = `${draft.id}-package`;
  const packageVersion = `${draft.id}:v${draft.version}`;
  const approval = snapshot.appealApproval;

  if (
    approval &&
    (approval.case_id !== snapshot.caseId ||
      approval.package_id !== packageId ||
      approval.package_version !== packageVersion ||
      approval.draft_id !== draft.id ||
      approval.draft_version !== draft.version)
  ) {
    packageNotReady();
  }

  return {
    package_id: packageId,
    package_version: packageVersion,
    case_id: snapshot.caseId,
    draft_id: draft.id,
    draft_version: draft.version,
    status: "review",
    synthetic: true,
    external_submission: false,
    destination: {
      name: "Northstar Health Appeals Department",
      channel: "simulated_payer_portal",
    },
    statement: draft.statement,
    included_documents: includedDocuments,
    shared_information: [
      {
        field: "patient_name",
        label: "Patient name",
        value: snapshot.caseData.patient.name,
        source: "case_record",
      },
      {
        field: "case_id",
        label: "Case number",
        value: snapshot.caseId,
        source: "case_record",
      },
      {
        field: "requested_service",
        label: "Requested service",
        value: snapshot.caseData.service,
        source: "case_record",
      },
      {
        field: "denial_reason",
        label: "Denial reason",
        value: snapshot.caseData.reason,
        source: "insurer_source",
      },
      {
        field: "denial_reason_code",
        label: "Denial reason code",
        value: snapshot.caseData.reason_code,
        source: "insurer_source",
      },
      {
        field: "treatment_start_date",
        label: "Confirmed treatment start date",
        value: confirmation.start_date,
        source: "human_confirmed",
      },
      {
        field: "treatment_end_date",
        label: "Confirmed treatment end date",
        value: confirmation.end_date,
        source: "human_confirmed",
      },
      {
        field: "appeal_statement",
        label: "Appeal statement",
        value: draft.statement,
        source: "assera_draft",
      },
      {
        field: "included_documents",
        label: "Included documents",
        value: includedDocuments
          .map((document) => `${document.id}: ${document.name}`)
          .join("; "),
        source: "case_record",
      },
    ],
    human_confirmed_information: {
      treatment_start_date: confirmation.start_date,
      treatment_end_date: confirmation.end_date,
      confirmed_by: confirmation.confirmed_by.name,
      confirmed_at: confirmation.confirmed_at,
    },
    readiness_summary: { ...snapshot.readiness.summary },
    unresolved_items: [...snapshot.readiness.next_required_information],
    approval: approval
      ? {
          status: "approved",
          approval_id: approval.id,
          approved_at: approval.approved_at,
          approved_by: approval.approved_by.name,
          package_version: approval.package_version,
        }
      : { status: "not_approved" },
    submission_status: "not_submitted",
  };
}

export function buildAppealPackagePreview(
  snapshot: CaseWorkspaceSnapshot,
): AppealPackagePreview {
  if (snapshot.appealSubmission) {
    const submission = snapshot.appealSubmission;
    return {
      ...submission.package_snapshot,
      status: "submitted_simulation",
      submission_status: "submitted_simulation",
      submission: {
        id: submission.id,
        submitted_at: submission.submitted_at,
        submitted_by: submission.submitted_by,
        destination: submission.destination,
        approval_id: submission.approval_id,
        receipt: submission.receipt,
        external_network_request: submission.external_network_request,
      },
    };
  }

  return buildCurrentAppealPackageSnapshot(snapshot);
}

export function approveAppealPackage(
  snapshot: CaseWorkspaceSnapshot,
  packageVersion: string,
  confirmation: boolean,
  actor: WorkspaceActor,
  approvedAt: string,
  approvalId = `approval-${approvedAt}`,
): AppealApproval {
  if (actor !== "HUMAN") {
    throw new AppealApprovalError(
      "APPROVAL_ACTOR_NOT_ALLOWED",
      "Only Maya can approve an appeal package in the ASSERA interface.",
    );
  }

  if (!confirmation) {
    throw new AppealApprovalError(
      "APPROVAL_CONFIRMATION_REQUIRED",
      "Confirm that you reviewed this exact package before approving it.",
    );
  }

  let preview: AppealPackagePreview;
  try {
    preview = buildAppealPackagePreview(snapshot);
  } catch (error) {
    if (error instanceof AppealPackageError) {
      throw new AppealApprovalError(
        "APPROVAL_NOT_AVAILABLE",
        "Prepare and review a complete appeal package before approving it.",
      );
    }
    throw error;
  }

  if (packageVersion !== preview.package_version) {
    throw new AppealApprovalError(
      "PACKAGE_VERSION_MISMATCH",
      "This package changed before approval. Review the current version and try again.",
    );
  }

  return {
    id: approvalId,
    case_id: preview.case_id,
    package_id: preview.package_id,
    package_version: preview.package_version,
    draft_id: preview.draft_id,
    draft_version: preview.draft_version,
    status: "approved",
    approved_at: approvedAt,
    approved_by: {
      type: "patient",
      name: "Maya Thompson",
    },
    provided_via: "ASSERA_UI",
    scope: "SIMULATED_SUBMISSION",
    synthetic: true,
  };
}
