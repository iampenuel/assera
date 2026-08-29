import { SUPPORTED_CASE_ID } from "../data/case-fixture";
import { getInitialCaseWorkspaceSnapshot } from "../domain/case-workspace";
import type {
  CaseWorkspaceSnapshot,
  CoverageRequirementsResult,
} from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const COVERAGE_REQUIREMENTS_TOOL_NAME = "get_coverage_requirements";

export function getCoverageRequirements(
  input: unknown,
  snapshot: CaseWorkspaceSnapshot = getInitialCaseWorkspaceSnapshot(
    SUPPORTED_CASE_ID,
  ),
): CoverageRequirementsResult {
  requireKnownCase(input, snapshot.caseId);
  const policy = snapshot.policy;

  return {
    case_id: snapshot.caseId,
    payer: policy.payer,
    policy_id: policy.policy_id,
    policy_title: policy.policy_title,
    effective_date: policy.effective_date,
    synthetic: true,
    requirements: policy.requirements.map(({ id, label }) => ({ id, label })),
  };
}
