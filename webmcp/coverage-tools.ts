import { mayaCoveragePolicy } from "../data/policy-fixture";
import type { CoverageRequirementsResult } from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const COVERAGE_REQUIREMENTS_TOOL_NAME = "get_coverage_requirements";

export function getCoverageRequirements(input: unknown): CoverageRequirementsResult {
  const caseData = requireKnownCase(input);

  return {
    case_id: caseData.case_id,
    payer: mayaCoveragePolicy.payer,
    policy_id: mayaCoveragePolicy.policy_id,
    policy_title: mayaCoveragePolicy.policy_title,
    effective_date: mayaCoveragePolicy.effective_date,
    synthetic: true,
    requirements: mayaCoveragePolicy.requirements.map(({ id, label }) => ({ id, label })),
  };
}
