import { mayaEvidence } from "../data/evidence-fixture";
import type { AppealEvidenceResult } from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const APPEAL_EVIDENCE_TOOL_NAME = "list_appeal_evidence";

export function listAppealEvidence(input: unknown): AppealEvidenceResult {
  const caseData = requireKnownCase(input);

  return {
    case_id: caseData.case_id,
    synthetic: true,
    count: mayaEvidence.length,
    documents: mayaEvidence.map(
      ({ id, name, filename, source, document_date, status, supports }) => ({
        id,
        name,
        filename,
        source,
        document_date,
        status,
        supports,
      }),
    ),
  };
}
