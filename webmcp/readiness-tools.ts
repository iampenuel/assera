import { SUPPORTED_CASE_ID } from "../data/case-fixture";
import { getInitialCaseWorkspaceSnapshot } from "../domain/case-workspace";
import type { AppealReadiness, CaseWorkspaceSnapshot } from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const APPEAL_READINESS_TOOL_NAME = "check_appeal_readiness";

export function checkAppealReadiness(
  input: unknown,
  snapshot: CaseWorkspaceSnapshot = getInitialCaseWorkspaceSnapshot(
    SUPPORTED_CASE_ID,
  ),
): AppealReadiness {
  requireKnownCase(input, snapshot.caseId);
  return snapshot.readiness;
}
