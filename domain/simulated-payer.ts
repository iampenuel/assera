import { AppealPackageError, buildAppealPackagePreview } from "./appeal-package";
import type {
  AppealApproval,
  AppealPackageSnapshot,
  AppealSubmission,
  CaseWorkspaceSnapshot,
  SubmitAppealInput,
  WorkspaceActor,
} from "../types/case";

export type SubmissionErrorCode =
  | "SUBMISSION_NOT_READY"
  | "SUBMISSION_NOT_APPROVED"
  | "PACKAGE_ID_MISMATCH"
  | "PACKAGE_VERSION_MISMATCH"
  | "APPROVAL_ID_MISMATCH"
  | "APPROVAL_STALE"
  | "SIMULATION_MODE_REQUIRED"
  | "SUBMISSION_FINALIZED";

export class SubmissionError extends Error {
  readonly code: SubmissionErrorCode;

  constructor(code: SubmissionErrorCode, message: string) {
    super(message);
    this.name = "SubmissionError";
    this.code = code;
  }
}

export interface ValidatedSimulatedSubmission {
  readonly packageSnapshot: AppealPackageSnapshot;
  readonly approval: AppealApproval;
  readonly existing: AppealSubmission | null;
}

export function assertSubmissionMutable(snapshot: CaseWorkspaceSnapshot): void {
  if (snapshot.appealSubmission) {
    throw new SubmissionError(
      "SUBMISSION_FINALIZED",
      "The simulated submission is final. Refresh the demo to begin a new workspace.",
    );
  }
}

export function validateSimulatedSubmission(
  snapshot: CaseWorkspaceSnapshot,
  input: SubmitAppealInput,
): ValidatedSimulatedSubmission {
  if (input.mode !== "simulation") {
    throw new SubmissionError(
      "SIMULATION_MODE_REQUIRED",
      "ASSERA supports simulated submission only.",
    );
  }

  const existing = snapshot.appealSubmission;
  if (existing) {
    if (
      existing.case_id === input.case_id &&
      existing.package_id === input.package_id &&
      existing.package_version === input.package_version &&
      existing.approval_id === input.approval_id
    ) {
      return {
        packageSnapshot: existing.package_snapshot,
        approval: snapshot.appealApproval!,
        existing,
      };
    }
    throw new SubmissionError(
      "SUBMISSION_FINALIZED",
      "A simulated receipt already finalizes this workspace and cannot be replaced.",
    );
  }

  const draft = snapshot.appealDraft;
  if (
    !draft ||
    !snapshot.treatmentDateConfirmation ||
    !snapshot.readiness.ready_to_prepare ||
    snapshot.readiness.summary.complete !== snapshot.readiness.summary.total
  ) {
    throw new SubmissionError(
      "SUBMISSION_NOT_READY",
      "Prepare a complete current appeal package before simulated submission.",
    );
  }

  const packageId = `${draft.id}-package`;
  const packageVersion = `${draft.id}:v${draft.version}`;
  if (input.package_id !== packageId) {
    throw new SubmissionError(
      "PACKAGE_ID_MISMATCH",
      "The requested package_id does not match the current appeal package.",
    );
  }
  if (input.package_version !== packageVersion) {
    throw new SubmissionError(
      "PACKAGE_VERSION_MISMATCH",
      "The requested package_version does not match the current appeal package.",
    );
  }

  const approval = snapshot.appealApproval;
  if (!approval) {
    throw new SubmissionError(
      "SUBMISSION_NOT_APPROVED",
      "Maya must approve this exact package in the ASSERA interface first.",
    );
  }
  if (input.approval_id !== approval.id) {
    throw new SubmissionError(
      "APPROVAL_ID_MISMATCH",
      "The requested approval_id does not match Maya's stored approval.",
    );
  }
  if (
    approval.case_id !== snapshot.caseId ||
    approval.package_id !== packageId ||
    approval.package_version !== packageVersion ||
    approval.draft_id !== draft.id ||
    approval.draft_version !== draft.version ||
    approval.scope !== "SIMULATED_SUBMISSION" ||
    approval.provided_via !== "ASSERA_UI"
  ) {
    throw new SubmissionError(
      "APPROVAL_STALE",
      "Maya's approval does not bind to the current package and draft versions.",
    );
  }

  try {
    const preview = buildAppealPackagePreview(snapshot);
    if (
      preview.status !== "review" ||
      preview.submission_status !== "not_submitted" ||
      preview.approval.status !== "approved"
    ) {
      throw new SubmissionError(
        "SUBMISSION_NOT_READY",
        "The current appeal package is not ready for simulated submission.",
      );
    }
    return {
      packageSnapshot: preview as AppealPackageSnapshot,
      approval,
      existing: null,
    };
  } catch (error) {
    if (error instanceof SubmissionError) throw error;
    if (error instanceof AppealPackageError) {
      throw new SubmissionError(
        "SUBMISSION_NOT_READY",
        "The current appeal package is not ready for simulated submission.",
      );
    }
    throw error;
  }
}

export function createSimulatedSubmission(
  validated: ValidatedSimulatedSubmission,
  actor: WorkspaceActor,
  submissionId: string,
  submittedAt: string,
): AppealSubmission {
  const packageSnapshot = validated.packageSnapshot;
  return {
    id: submissionId,
    case_id: packageSnapshot.case_id,
    status: "submitted_simulation",
    submitted_at: submittedAt,
    submitted_by: {
      type: actor === "AGENT" ? "agent" : "patient",
      name: actor === "AGENT" ? "ChatGPT agent" : "Maya Thompson",
      provided_via: actor === "AGENT" ? "WEBMCP" : "ASSERA_UI",
    },
    destination: {
      ...packageSnapshot.destination,
      real_insurer_contacted: false,
    },
    package_id: packageSnapshot.package_id,
    package_version: packageSnapshot.package_version,
    draft_id: packageSnapshot.draft_id,
    draft_version: packageSnapshot.draft_version,
    approval_id: validated.approval.id,
    receipt: {
      confirmation_number: `SIM-${packageSnapshot.case_id.split("-").at(-1)}-V${packageSnapshot.draft_version}-${submissionId.slice(-8).toUpperCase()}`,
      recorded_at: submittedAt,
      status: "recorded",
    },
    package_snapshot: packageSnapshot,
    synthetic: true,
    external_network_request: false,
  };
}
