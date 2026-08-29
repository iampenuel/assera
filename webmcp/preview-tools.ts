import type {
  AppealPackageToolResult,
  CaseWorkspaceToolAdapter,
} from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const PREVIEW_APPEAL_TOOL_NAME = "preview_appeal";

export function previewAppeal(
  input: unknown,
  adapter: CaseWorkspaceToolAdapter,
): AppealPackageToolResult {
  const snapshot = adapter.getSnapshot();
  requireKnownCase(input, snapshot.caseId);
  const preview = adapter.previewAppeal();

  return {
    case_id: preview.case_id,
    package_id: preview.package_id,
    package_version: preview.package_version,
    draft_id: preview.draft_id,
    draft_version: preview.draft_version,
    destination: preview.destination,
    statement: preview.statement,
    documents: preview.included_documents,
    shared_information: preview.shared_information.map(
      ({ field, label, source }) => ({ field, label, source }),
    ),
    human_confirmed_information: preview.human_confirmed_information,
    readiness_summary: preview.readiness_summary,
    unresolved_items: preview.unresolved_items,
    approval_status: preview.approval.status,
    ...(preview.approval.status === "approved"
      ? {
          approval: {
            approval_id: preview.approval.approval_id,
            approved_at: preview.approval.approved_at,
            approved_by: preview.approval.approved_by,
            package_version: preview.approval.package_version,
          },
        }
      : {}),
    submission_status: preview.submission_status,
    ...(preview.submission
      ? {
          submission: {
            submission_id: preview.submission.id,
            submitted_at: preview.submission.submitted_at,
            approval_id: preview.submission.approval_id,
            receipt: preview.submission.receipt,
            real_insurer_contacted:
              preview.submission.destination.real_insurer_contacted,
            external_network_request:
              preview.submission.external_network_request,
          },
        }
      : {}),
    external_submission: false,
    synthetic: true,
  };
}
