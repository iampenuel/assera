import { SUPPORTED_CASE_ID } from "../data/case-fixture";
import { getInitialCaseWorkspaceSnapshot } from "../domain/case-workspace";
import type { CaseWorkspaceSnapshot, DenialDetails } from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const DENIAL_DETAILS_TOOL_NAME = "get_denial_details";

export function getDenialDetails(
  input: unknown,
  snapshot: CaseWorkspaceSnapshot = getInitialCaseWorkspaceSnapshot(
    SUPPORTED_CASE_ID,
  ),
): DenialDetails {
  requireKnownCase(input, snapshot.caseId);
  const caseData = snapshot.caseData;

  return {
    case_id: caseData.case_id,
    service: caseData.service,
    decision: caseData.decision,
    decision_date: caseData.decision_date,
    reason_code: caseData.reason_code,
    reason: caseData.reason,
    appeal_deadline: caseData.appeal_deadline,
    payer: caseData.payer,
  };
}
