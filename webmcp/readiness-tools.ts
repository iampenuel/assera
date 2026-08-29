import { mayaEvidence } from "../data/evidence-fixture";
import { mayaCoveragePolicy } from "../data/policy-fixture";
import { evaluateAppealReadiness } from "../domain/readiness";
import type { AppealReadiness } from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const APPEAL_READINESS_TOOL_NAME = "check_appeal_readiness";

export function checkAppealReadiness(input: unknown): AppealReadiness {
  const caseData = requireKnownCase(input);
  return evaluateAppealReadiness(caseData.case_id, mayaCoveragePolicy, mayaEvidence);
}
