import { getCaseFixture } from "../data/case-fixture";
import { mayaEvidence } from "../data/evidence-fixture";
import { mayaCoveragePolicy } from "../data/policy-fixture";
import {
  approveAppealPackage,
  AppealApprovalError,
  AppealPackageError,
  buildAppealPackagePreview,
} from "./appeal-package";
import {
  createAppealDraft,
  DraftStatementError,
  PrepareBlockedError,
  validateDraftStatement,
} from "./appeal-draft";
import { evaluateAppealReadiness } from "./readiness";
import {
  createTreatmentDateConfirmation,
  deriveEffectiveEvidence,
  validateTreatmentDates,
} from "./treatment-dates";
import type {
  AppealApproval,
  AppealDraft,
  AppealPackagePreview,
  CaseWorkspaceSnapshot,
  CaseWorkspaceState,
  CaseWorkspaceToolAdapter,
  CaseWorkspaceUiActions,
  ConfirmTreatmentDatesResult,
  PrepareAppealResult,
  ReadWorkspaceActivity,
  TreatmentDateConfirmation,
  WorkspaceActivity,
  WorkspaceActivityInput,
  WorkspaceActor,
} from "../types/case";

export type CaseWorkspaceAction =
  | {
      readonly type: "activity_recorded";
      readonly activity: WorkspaceActivity;
    }
  | {
      readonly type: "treatment_dates_confirmed";
      readonly confirmation: TreatmentDateConfirmation;
      readonly appealDraft: AppealDraft | null;
      readonly appealApproval: AppealApproval | null;
      readonly activity: WorkspaceActivity;
    }
  | {
      readonly type: "appeal_draft_prepared";
      readonly appealDraft: AppealDraft;
      readonly appealApproval: AppealApproval | null;
      readonly activity: WorkspaceActivity;
    }
  | {
      readonly type: "appeal_draft_updated";
      readonly appealDraft: AppealDraft;
      readonly appealApproval: AppealApproval | null;
      readonly activity: WorkspaceActivity;
    }
  | {
      readonly type: "appeal_package_approved";
      readonly appealApproval: AppealApproval;
      readonly activity: WorkspaceActivity;
    }
  | {
      readonly type: "appeal_approval_revoked";
      readonly activity: WorkspaceActivity;
    };

export function createInitialCaseWorkspaceState(caseId: string): CaseWorkspaceState {
  if (!getCaseFixture(caseId)) {
    throw new Error(`Unsupported ASSERA case: ${caseId}`);
  }

  return {
    caseId,
    treatmentDateConfirmation: null,
    appealDraft: null,
    appealApproval: null,
    activities: [],
  };
}

export function caseWorkspaceReducer(
  state: CaseWorkspaceState,
  action: CaseWorkspaceAction,
): CaseWorkspaceState {
  switch (action.type) {
    case "activity_recorded":
      return {
        ...state,
        activities: [...state.activities, action.activity],
      };
    case "treatment_dates_confirmed":
      return {
        ...state,
        treatmentDateConfirmation: action.confirmation,
        appealDraft: action.appealDraft,
        appealApproval: action.appealApproval,
        activities: [...state.activities, action.activity],
      };
    case "appeal_draft_prepared":
    case "appeal_draft_updated":
      return {
        ...state,
        appealDraft: action.appealDraft,
        appealApproval: action.appealApproval,
        activities: [...state.activities, action.activity],
      };
    case "appeal_package_approved":
      return {
        ...state,
        appealApproval: action.appealApproval,
        activities: [...state.activities, action.activity],
      };
    case "appeal_approval_revoked":
      return {
        ...state,
        appealApproval: null,
        activities: [...state.activities, action.activity],
      };
    default:
      return state;
  }
}

export function selectCaseWorkspaceSnapshot(
  state: CaseWorkspaceState,
): CaseWorkspaceSnapshot {
  const caseData = getCaseFixture(state.caseId);
  if (!caseData || mayaCoveragePolicy.case_id !== state.caseId) {
    throw new Error(`Unsupported ASSERA case: ${state.caseId}`);
  }

  const effectiveEvidence = deriveEffectiveEvidence(
    mayaEvidence,
    state.treatmentDateConfirmation,
  );
  const readiness = evaluateAppealReadiness(
    state.caseId,
    mayaCoveragePolicy,
    effectiveEvidence,
  );

  return {
    caseId: state.caseId,
    caseData,
    policy: mayaCoveragePolicy,
    baseEvidence: mayaEvidence,
    effectiveEvidence,
    treatmentDateConfirmation: state.treatmentDateConfirmation,
    readiness,
    appealDraft: state.appealDraft,
    appealApproval: state.appealApproval,
    activities: state.activities,
  };
}

export function getInitialCaseWorkspaceSnapshot(
  caseId: string,
): CaseWorkspaceSnapshot {
  return selectCaseWorkspaceSnapshot(createInitialCaseWorkspaceState(caseId));
}

type ApplyWorkspaceAction = (action: CaseWorkspaceAction) => CaseWorkspaceState;

interface CreateCaseWorkspaceAdaptersOptions {
  readonly getState: () => CaseWorkspaceState;
  readonly applyAction: ApplyWorkspaceAction;
  readonly now?: () => string;
}

function confirmationsMatch(
  current: TreatmentDateConfirmation | null,
  next: Pick<TreatmentDateConfirmation, "start_date" | "end_date">,
): boolean {
  return (
    current?.start_date === next.start_date && current.end_date === next.end_date
  );
}

export function createCaseWorkspaceAdapters({
  getState,
  applyAction,
  now = () => new Date().toISOString(),
}: CreateCaseWorkspaceAdaptersOptions): {
  readonly toolAdapter: CaseWorkspaceToolAdapter;
  readonly uiActions: CaseWorkspaceUiActions;
} {
  const getSnapshot = () => selectCaseWorkspaceSnapshot(getState());

  const materializeActivity = (
    input: WorkspaceActivityInput,
    occurredAt: string,
  ): WorkspaceActivity => ({
    ...input,
    id: `${input.toolName ?? input.actor.toLowerCase()}-${occurredAt}-${getState().activities.length}`,
    occurredAt,
  }) as WorkspaceActivity;

  const recordActivity = (input: WorkspaceActivityInput): WorkspaceActivity => {
    const occurredAt = now();
    const activity = materializeActivity(input, occurredAt);
    applyAction({ type: "activity_recorded", activity });
    return activity;
  };

  const confirmTreatmentDates = (
    input: Parameters<CaseWorkspaceUiActions["confirmTreatmentDates"]>[0],
  ): ConfirmTreatmentDatesResult => {
    const snapshot = getSnapshot();
    const physicalTherapy = snapshot.baseEvidence.find(
      (document) => document.id === "evidence-physical-therapy",
    );
    if (!physicalTherapy) {
      throw new Error("The physical-therapy evidence record is unavailable.");
    }

    const validated = validateTreatmentDates(input, physicalTherapy.document_date);
    if (confirmationsMatch(snapshot.treatmentDateConfirmation, validated)) {
      return {
        action: "unchanged",
        confirmation: snapshot.treatmentDateConfirmation!,
        readiness: snapshot.readiness,
        draft_invalidated: false,
      };
    }

    const occurredAt = now();
    const confirmation = createTreatmentDateConfirmation(validated, occurredAt);
    const draftInvalidated = snapshot.appealDraft !== null;
    const approvalInvalidated = snapshot.appealApproval !== null;
    const isUpdate = snapshot.treatmentDateConfirmation !== null;
    const activity = materializeActivity(
      {
        title: draftInvalidated ? "Treatment dates updated" : "Treatment dates confirmed",
        category: "PREPARE",
        actor: "HUMAN",
        outcome: "completed",
        impact: draftInvalidated
          ? approvalInvalidated
            ? "Case workspace updated; the previous draft and package approval were cleared. Nothing submitted."
            : "Case workspace updated; the previous draft must be prepared again. Nothing submitted."
          : "Case workspace updated; nothing submitted",
      },
      occurredAt,
    );

    const nextState = applyAction({
      type: "treatment_dates_confirmed",
      confirmation,
      appealDraft: null,
      appealApproval: null,
      activity,
    });
    const nextSnapshot = selectCaseWorkspaceSnapshot(nextState);

    return {
      action: isUpdate ? "updated" : "confirmed",
      confirmation,
      readiness: nextSnapshot.readiness,
      draft_invalidated: draftInvalidated,
    };
  };

  const prepareAppeal = (actor: WorkspaceActor): PrepareAppealResult => {
    const snapshot = getSnapshot();

    try {
      if (
        snapshot.appealDraft &&
        confirmationsMatch(
          snapshot.treatmentDateConfirmation,
          snapshot.appealDraft.treatment_date_confirmation,
        )
      ) {
        recordActivity({
          title: "Existing appeal draft opened",
          category: "PREPARE",
          actor,
          outcome: "completed",
          impact: "No new draft created; nothing submitted",
          ...(actor === "AGENT" ? { toolName: "prepare_appeal" } : {}),
        });
        return {
          case_id: snapshot.caseId,
          action: "reused",
          draft: snapshot.appealDraft,
        };
      }

      if (!snapshot.readiness.ready_to_prepare || !snapshot.treatmentDateConfirmation) {
        throw new PrepareBlockedError(snapshot);
      }

      const occurredAt = now();
      const appealDraft = createAppealDraft(snapshot, occurredAt);
      const activity = materializeActivity(
        {
          title: "Appeal draft prepared",
          category: "PREPARE",
          actor,
          outcome: "completed",
          impact: "Draft created in ASSERA; nothing submitted",
          ...(actor === "AGENT" ? { toolName: "prepare_appeal" } : {}),
        },
        occurredAt,
      );
      applyAction({
        type: "appeal_draft_prepared",
        appealDraft,
        appealApproval: null,
        activity,
      });

      return {
        case_id: snapshot.caseId,
        action: "created",
        draft: appealDraft,
      };
    } catch (error) {
      if (error instanceof PrepareBlockedError) {
        recordActivity({
          title: "Appeal preparation blocked",
          category: "PREPARE",
          actor,
          outcome: "blocked",
          impact:
            "Treatment dates require confirmation; no draft created or submitted",
          ...(actor === "AGENT" ? { toolName: "prepare_appeal" } : {}),
        });
      }
      throw error;
    }
  };

  const updateDraftStatement = (statement: string): AppealDraft => {
    const snapshot = getSnapshot();
    if (!snapshot.appealDraft) {
      throw new DraftStatementError(
        "DRAFT_NOT_FOUND",
        "Prepare an appeal draft before saving changes.",
      );
    }

    const validatedStatement = validateDraftStatement(statement);
    if (validatedStatement === snapshot.appealDraft.statement) {
      return snapshot.appealDraft;
    }

    const occurredAt = now();
    const appealDraft = {
      ...snapshot.appealDraft,
      version: snapshot.appealDraft.version + 1,
      statement: validatedStatement,
      updated_at: occurredAt,
    };
    const approvalInvalidated = snapshot.appealApproval !== null;
    const activity = materializeActivity(
      {
        title: "Appeal draft updated",
        category: "PREPARE",
        actor: "HUMAN",
        outcome: "completed",
        impact: approvalInvalidated
          ? "Draft updated; previous package approval cleared. Nothing submitted."
          : "Draft updated in ASSERA; nothing submitted",
      },
      occurredAt,
    );
    applyAction({
      type: "appeal_draft_updated",
      appealDraft,
      appealApproval: null,
      activity,
    });
    return appealDraft;
  };

  const approveCurrentPackage = (
    packageVersion: string,
    confirmation: boolean,
  ): AppealApproval => {
    const snapshot = getSnapshot();
    if (
      snapshot.appealApproval?.package_version === packageVersion &&
      snapshot.appealDraft?.version === snapshot.appealApproval.draft_version
    ) {
      return snapshot.appealApproval;
    }

    const occurredAt = now();
    const appealApproval = approveAppealPackage(
      snapshot,
      packageVersion,
      confirmation,
      "HUMAN",
      occurredAt,
    );
    const activity = materializeActivity(
      {
        title: "Appeal package approved",
        category: "CONTROL",
        actor: "HUMAN",
        outcome: "completed",
        impact: "Approval recorded for this package version; nothing submitted",
      },
      occurredAt,
    );
    applyAction({ type: "appeal_package_approved", appealApproval, activity });
    return appealApproval;
  };

  const revokeAppealApproval = (): boolean => {
    if (!getSnapshot().appealApproval) return false;

    const occurredAt = now();
    const activity = materializeActivity(
      {
        title: "Package approval revoked",
        category: "CONTROL",
        actor: "HUMAN",
        outcome: "completed",
        impact: "Local approval removed; nothing submitted",
      },
      occurredAt,
    );
    applyAction({ type: "appeal_approval_revoked", activity });
    return true;
  };

  const toolAdapter: CaseWorkspaceToolAdapter = {
    getSnapshot,
    prepareAppeal: () => prepareAppeal("AGENT"),
    recordReadActivity: (
      input: Omit<ReadWorkspaceActivity, "id" | "occurredAt">,
    ) => recordActivity(input),
    previewAppeal: (): AppealPackagePreview => {
      try {
        const preview = buildAppealPackagePreview(getSnapshot());
        recordActivity({
          title: "Appeal package preview accessed",
          category: "READ",
          actor: "AGENT",
          outcome: "completed",
          impact: "No information changed",
          toolName: "preview_appeal",
        });
        return preview;
      } catch (error) {
        if (error instanceof AppealPackageError) {
          recordActivity({
            title: "Appeal package preview unavailable",
            category: "READ",
            actor: "AGENT",
            outcome: "blocked",
            impact: error.code === "PREVIEW_NOT_AVAILABLE"
              ? "Prepare an appeal draft first; no information changed"
              : "Recheck the current workspace; no information changed",
            toolName: "preview_appeal",
          });
        }
        throw error;
      }
    },
  };

  const uiActions: CaseWorkspaceUiActions = {
    confirmTreatmentDates,
    prepareAppeal: () => prepareAppeal("HUMAN"),
    updateDraftStatement,
    approveAppealPackage: approveCurrentPackage,
    revokeAppealApproval,
  };

  return { toolAdapter, uiActions };
}

export function createStandaloneCaseWorkspace(caseId: string): {
  readonly toolAdapter: CaseWorkspaceToolAdapter;
  readonly uiActions: CaseWorkspaceUiActions;
  readonly getState: () => CaseWorkspaceState;
} {
  let state = createInitialCaseWorkspaceState(caseId);
  const getState = () => state;
  const adapters = createCaseWorkspaceAdapters({
    getState,
    applyAction: (action) => {
      state = caseWorkspaceReducer(state, action);
      return state;
    },
  });
  return { ...adapters, getState };
}

export {
  AppealApprovalError,
  AppealPackageError,
  DraftStatementError,
  PrepareBlockedError,
};
