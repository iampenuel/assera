import { SUPPORTED_CASE_ID } from "../data/case-fixture";
import { getInitialCaseWorkspaceSnapshot } from "../domain/case-workspace";
import type {
  AppealEvidenceDocumentResult,
  AppealEvidenceResult,
  CaseWorkspaceSnapshot,
} from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const APPEAL_EVIDENCE_TOOL_NAME = "list_appeal_evidence";

export function listAppealEvidence(
  input: unknown,
  snapshot: CaseWorkspaceSnapshot = getInitialCaseWorkspaceSnapshot(
    SUPPORTED_CASE_ID,
  ),
): AppealEvidenceResult {
  requireKnownCase(input, snapshot.caseId);

  return {
    case_id: snapshot.caseId,
    synthetic: true,
    count: snapshot.effectiveEvidence.length,
    documents: snapshot.effectiveEvidence.map((document) => {
      const result: AppealEvidenceDocumentResult = {
        id: document.id,
        name: document.name,
        filename: document.filename,
        source: document.source,
        document_date: document.document_date,
        status: document.status,
        supports: document.supports,
      };

      return document.human_confirmation
        ? { ...result, human_confirmation: document.human_confirmation }
        : result;
    }),
  };
}
