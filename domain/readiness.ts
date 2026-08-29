import type {
  AppealReadiness,
  CoveragePolicy,
  EvidenceDocument,
  RequirementReadiness,
} from "../types/case";

export function evaluateAppealReadiness(
  caseId: string,
  policy: CoveragePolicy,
  evidence: readonly EvidenceDocument[],
): AppealReadiness {
  const requirements: RequirementReadiness[] = policy.requirements.map((requirement) => {
    const completeEvidence = evidence.filter((document) =>
      document.supports.includes(requirement.id),
    );

    if (completeEvidence.length > 0) {
      return {
        requirement_id: requirement.id,
        status: "complete",
        supported_by: completeEvidence.map((document) => document.id),
      };
    }

    const incompleteEvidence = evidence.flatMap((document) =>
      document.needs_confirmation
        .filter((gap) => gap.requirement_id === requirement.id)
        .map((gap) => ({ document, gap })),
    );

    if (incompleteEvidence.length > 0) {
      return {
        requirement_id: requirement.id,
        status: "incomplete",
        supported_by: incompleteEvidence.map(({ document }) => document.id),
        issue: incompleteEvidence[0].gap.issue,
      };
    }

    return {
      requirement_id: requirement.id,
      status: "unavailable",
      supported_by: [],
      issue: `No available evidence supports ${requirement.label.toLowerCase()}.`,
    };
  });

  const summary = requirements.reduce(
    (counts, requirement) => ({
      ...counts,
      [requirement.status]: counts[requirement.status] + 1,
    }),
    {
      total: requirements.length,
      complete: 0,
      incomplete: 0,
      unavailable: 0,
    },
  );

  const nextRequiredInformation = requirements.flatMap((requirement) => {
    if (requirement.status === "complete") return [];

    const confirmationGap = evidence
      .flatMap((document) => document.needs_confirmation)
      .find((gap) => gap.requirement_id === requirement.requirement_id);
    const policyRequirement = policy.requirements.find(
      (candidate) => candidate.id === requirement.requirement_id,
    );

    return [
      {
        field: requirement.requirement_id,
        description:
          confirmationGap?.next_required_information ??
          `Provide ${policyRequirement?.label.toLowerCase() ?? "the missing information"}.`,
      },
    ];
  });

  return {
    case_id: caseId,
    synthetic: true,
    summary,
    ready_to_prepare: summary.incomplete === 0 && summary.unavailable === 0,
    requirements,
    next_required_information: nextRequiredInformation,
  };
}
