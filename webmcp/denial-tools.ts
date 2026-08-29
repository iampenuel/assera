import { mayaCase } from "../data/case-fixture";
import type { DenialDetails } from "../types/case";
import { requireKnownCase } from "./case-tool-helpers";

export const DENIAL_DETAILS_TOOL_NAME = "get_denial_details";

export function getDenialDetails(input: unknown): DenialDetails {
  requireKnownCase(input);

  return {
    case_id: mayaCase.case_id,
    service: mayaCase.service,
    decision: mayaCase.decision,
    decision_date: mayaCase.decision_date,
    reason_code: mayaCase.reason_code,
    reason: mayaCase.reason,
    appeal_deadline: mayaCase.appeal_deadline,
    payer: mayaCase.payer,
  };
}
